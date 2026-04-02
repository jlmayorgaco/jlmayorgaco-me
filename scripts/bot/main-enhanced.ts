/**
 * @deprecated This file is deprecated.
 * Use main.ts for the active bot entry point.
 * Enhanced features (voice, batch review, paper history) are not yet integrated
 * into the main entry point and should be implemented via the new architecture
 * (see REFACTOR_NOTES.md).
 *
 * DO NOT USE THIS FILE FOR PRODUCTION.
 */

import { loadConfig, validateEnvironment } from './config';
import { TelegramBot } from './telegram';
import { initializeSessionManager, destroySessionManager } from './session-manager';
import { getCommandRegistry } from './command-registry';
import { logError, logInfo, logWarn } from './logger';
import { safeValidate, UserCommentSchema, EditInstructionSchema } from './validation';
import { generateBlogPost } from './gemini';
import { saveBlogPost, previewBlogPost } from './blog-generator';
import { publishPost, validateGitSetup } from './publisher';

// Import new Clean Architecture components
import { InMemoryPaperHistoryRepository } from './infrastructure/persistence/InMemoryPaperHistoryRepository';
import { InMemoryResearchContextRepository } from './infrastructure/persistence/InMemoryResearchContextRepository';
import { RelevanceTier, TierEmojis } from './domain/enums/RelevanceTier';
import { ReactionEmoji } from './domain/value-objects/BatchReview';
import { runScanner } from '../../src/lib/pipeline/arxiv-scanner';

// Import commands
import { helpCommand } from './commands/help';
import { papersCommand } from './commands/papers';
import { newsCommand } from './commands/news';
import { dailyCommand } from './commands/daily';
import { statusCommand } from './commands/status';
import { cancelCommand } from './commands/cancel';

let bot: TelegramBot | null = null;
let shuttingDown = false;

// Enhanced repositories for personal use
const paperHistory = new InMemoryPaperHistoryRepository();
const researchContext = new InMemoryResearchContextRepository();

// User context (for personal bot)
const DEFAULT_USER_ID = 'jlmt-owner';

async function main() {
  // Validate environment before starting
  const envCheck = validateEnvironment();
  if (!envCheck.valid) {
    console.error('❌ Missing required environment variables:');
    envCheck.missing.forEach(v => console.error(`  - ${v}`));
    process.exit(1);
  }

  // Load configuration
  const config = await loadConfig();
  logInfo('Configuration loaded', { 
    model: config.gemini.model,
    maxPapers: config.maxPapersToScan,
    maxNews: config.maxNewsItems,
  });

  // Initialize research context with defaults
  await researchContext.updateContext(DEFAULT_USER_ID, {
    researchAreas: config.topics,
    addTopics: ['distributed control', 'robotics', 'FPGA', 'embedded systems'],
  });

  logInfo('Research context initialized');

  // Validate git setup
  const gitStatus = await validateGitSetup();
  if (!gitStatus.valid) {
    console.warn('⚠️  Git setup issues:');
    gitStatus.errors.forEach(e => console.warn(`  - ${e}`));
  }

  // Initialize session manager
  const sessionManager = initializeSessionManager({
    ttlMs: config.sessionTtlMinutes * 60 * 1000,
    cleanupIntervalMs: 5 * 60 * 1000,
    maxSessions: 1000,
  });

  // Initialize bot
  bot = new TelegramBot(config);
  
  // Test connection
  const connected = await bot.testConnection();
  if (!connected) {
    logError('Cannot connect to Telegram');
    process.exit(1);
  }

  logInfo('Connected to Telegram');
  
  // Send startup message
  await bot.sendMessage('*JLMT Lab Bot Online* ✅\nType /help to see commands');

  // Register commands
  const registry = getCommandRegistry();
  registry.register(helpCommand);
  registry.register(papersCommand);
  registry.register(newsCommand);
  registry.register(dailyCommand);
  registry.register(statusCommand);
  registry.register(cancelCommand);

  // Handle messages
  bot.onMessage(async (text: string, chatId: number) => {
    if (shuttingDown) return;

    const session = sessionManager.getSession(chatId);
    const cmd = text.trim().toLowerCase();

    // State machine for multi-step flows
    if (session.state === 'collecting_comment' && !cmd.startsWith('/')) {
      await handleUserComment(text, chatId, config, sessionManager, bot);
      return;
    }

    if (session.state === 'confirming_publish') {
      await handleConfirmation(cmd, text, chatId, config, sessionManager, bot);
      return;
    }

    // Handle batch review mode
    if (session.state === 'batch_reviewing') {
      await handleBatchReaction(text, chatId, sessionManager, bot);
      return;
    }

    // Command routing
    if (cmd.startsWith('/')) {
      const commandName = cmd.slice(1).split(' ')[0];
      await registry.execute(commandName, {
        bot,
        config,
        sessionManager,
        chatId,
        paperHistory,
        researchContext,
        userId: DEFAULT_USER_ID,
      });
    } else {
      // Unknown text
      await bot.sendMessage(
        'I didn\'t understand that. Use /help to see available commands.'
      );
    }
  });

  // Setup graceful shutdown
  setupShutdownHandlers(bot, sessionManager);

  // Start polling
  await bot.startPolling();
}

/**
 * Handle user commentary (text or voice)
 */
async function handleUserComment(
  text: string,
  chatId: number,
  config: any,
  sessionManager: any,
  bot: TelegramBot
): Promise<void> {
  const session = sessionManager.getSession(chatId);
  
  // Validate user comment
  const validation = safeValidate(UserCommentSchema, text);
  if (!validation.success) {
    await bot.sendMessage(`❌ ${validation.errors?.[0]}`);
    return;
  }

  session.userComment = text;
  
  await bot.sendTyping();
  await bot.sendMessage('_Generating blog post with Gemini..._');

  try {
    // Get personalized context for generation
    const context = await researchContext.getContext(DEFAULT_USER_ID);
    const contextPrompt = `Research Context: ${context.researchAreas.join(', ')}`;

    const postData = await generateBlogPost(config, {
      title: 'auto',
      newsItems: session.selectedItems.slice(0, 5),
      userComment: session.userComment,
      context: contextPrompt,
    });

    const today = new Date().toISOString().split('T')[0];
    const post = {
      title: postData.title,
      description: postData.description,
      category: postData.category,
      tags: postData.tags,
      date: today,
      content: postData.content,
      featured: false,
    };

    session.pendingPost = post;
    session.imageQuery = postData.imageQuery;
    session.state = 'confirming_publish';
    sessionManager.updateSession(chatId, session);

    const preview = await previewBlogPost(post);
    await bot.sendMessage(preview);
    await bot.sendMessage(
      `_Image query:_ ${postData.imageQuery}\n\n` +
      `Reply "yes" to publish, "no" to cancel, or /edit to make changes.`
    );

  } catch (e: any) {
    logError('Post generation failed', e);
    await bot.sendMessage(`❌ Generation error: ${e.message}`);
    session.state = 'idle';
    sessionManager.updateSession(chatId, session);
  }
}

/**
 * Handle batch review reactions
 */
async function handleBatchReaction(
  text: string,
  chatId: number,
  sessionManager: any,
  bot: TelegramBot
): Promise<void> {
  const session = sessionManager.getSession(chatId);
  
  // Parse reactions like "1⭐ 2👍 3⏭️"
  const reactions = text.split(/\s+/);
  const batchItems = session.batchReview?.items || [];
  
  let processed = 0;
  
  for (const reactionStr of reactions) {
    const match = reactionStr.match(/^(\d+)([⭐👍✓🔖⏭️])/);
    if (!match) continue;
    
    const index = parseInt(match[1]) - 1;
    const emoji = match[2] as ReactionEmoji;
    
    if (index >= 0 && index < batchItems.length) {
      const item = batchItems[index];
      session.reactions = session.reactions || {};
      session.reactions[item.paperId] = {
        reaction: emoji,
        timestamp: new Date(),
      };
      
      // Record action in history
      const actionMap: Record<ReactionEmoji, string> = {
        [ReactionEmoji.STAR]: 'saved',
        [ReactionEmoji.THUMBS_UP]: 'saved',
        [ReactionEmoji.CHECK]: 'read',
        [ReactionEmoji.BOOKMARK]: 'saved',
        [ReactionEmoji.SKIP]: 'skipped',
      };
      
      await paperHistory.recordAction(item.paperId, actionMap[emoji] as any);
      processed++;
    }
  }
  
  if (processed > 0) {
    sessionManager.updateSession(chatId, session);
    
    const totalReactions = Object.keys(session.reactions || {}).length;
    const totalItems = batchItems.length;
    
    if (totalReactions >= totalItems) {
      // All papers reviewed
      const selectedPapers = batchItems
        .filter((item: any) => {
          const reaction = session.reactions?.[item.paperId];
          return reaction && reaction.reaction !== ReactionEmoji.SKIP;
        })
        .map((item: any) => item.title);
      
      session.selectedItems = selectedPapers;
      session.state = 'collecting_comment';
      session.batchReview = null;
      sessionManager.updateSession(chatId, session);
      
      await bot.sendMessage(
        `✅ Batch review complete! ${selectedPapers.length} papers selected.\n\n` +
        `Now send your commentary (text or voice message).`
      );
    } else {
      await bot.sendMessage(`✓ Reaction recorded (${totalReactions}/${totalItems})`);
    }
  } else {
    await bot.sendMessage(
      '❌ Invalid reaction format. Use: 1⭐ 2👍 3⏭️'
    );
  }
}

/**
 * Enhanced daily command with paper history deduplication
 */
async function enhancedDailyScan(
  chatId: number,
  config: any,
  bot: TelegramBot
): Promise<void> {
  await bot.sendTyping();
  await bot.sendMessage('_Scanning ArXiv for papers..._');
  
  try {
    // Scan papers
    const papers = await runScanner();
    
    // Deduplicate against history
    const uniquePapers = await paperHistory.deduplicate(papers);
    const duplicates = papers.length - uniquePapers.length;
    
    if (duplicates > 0) {
      await bot.sendMessage(`_Filtered ${duplicates} previously seen papers_`);
    }
    
    if (uniquePapers.length === 0) {
      await bot.sendMessage('📭 No new papers found today.');
      return;
    }
    
    const selectedPapers = uniquePapers.slice(0, config.maxPapersToScan);
    
    // Record papers in history
    for (const paper of selectedPapers) {
      await paperHistory.recordSeen({
        id: paper.id,
        title: paper.title,
        firstSeen: new Date(),
        lastSeen: new Date(),
        seenCount: 1,
        userActions: [],
      });
    }
    
    // Send tiered results
    let msg = '*📊 Today\'s Papers*\n\n';
    
    for (const paper of selectedPapers.slice(0, 5)) {
      const title = paper.title?.slice(0, 60) || 'Unknown';
      const url = paper.absUrl || paper.url || '';
      msg += `• ${title}\n  [ArXiv](${url})\n\n`;
    }
    
    await bot.sendMessage(msg);
    
    // Store in session
    const session = await getSession(chatId);
    session.papers = selectedPapers;
    session.selectedItems = selectedPapers.map(p => p.title);
    await updateSession(chatId, session);
    
  } catch (e: any) {
    logError('Daily scan failed', e);
    await bot.sendMessage(`❌ Scan error: ${e.message}`);
  }
}

// Helper functions for session management
async function getSession(chatId: number): Promise<any> {
  // Simplified session management
  return { papers: [], selectedItems: [], news: [] };
}

async function updateSession(chatId: number, session: any): Promise<void> {
  // Simplified session management
}

async function handleConfirmation(
  cmd: string,
  text: string,
  chatId: number,
  config: any,
  sessionManager: any,
  bot: TelegramBot
): Promise<void> {
  const session = sessionManager.getSession(chatId);

  if (cmd === 'yes' || cmd === 'si' || cmd === 'confirm') {
    if (!session.pendingPost) {
      await bot.sendMessage('❌ No post to publish.');
      return;
    }

    await bot.sendTyping();
    await bot.sendMessage('_Saving and publishing..._');

    try {
      const filePath = await saveBlogPost(session.pendingPost);
      await bot.sendMessage(`💾 Saved to: \`${filePath}\``);

      const result = await publishPost(filePath, session.pendingPost.title);

      if (result.success) {
        await bot.sendMessage(
          `✅ *Published!*\n${result.message}\n\nVercel will auto-deploy.`
        );
        
        // Record in research context
        await researchContext.recordInteraction(DEFAULT_USER_ID, {
          paperId: 'post-' + Date.now(),
          action: 'cited',
          timestamp: new Date(),
          notes: session.pendingPost.title,
        });
      } else {
        await bot.sendMessage(`❌ Publish failed: ${result.message}`);
      }

      session.state = 'idle';
      session.pendingPost = null;
      sessionManager.updateSession(chatId, session);

    } catch (e: any) {
      logError('Publish failed', e);
      await bot.sendMessage(`❌ Publish error: ${e.message}`);
    }

  } else if (cmd === 'no' || cmd === 'cancel') {
    session.state = 'idle';
    session.pendingPost = null;
    sessionManager.updateSession(chatId, session);
    await bot.sendMessage('✅ Cancelled. Use /daily to start again.');

  } else if (cmd.startsWith('/edit') || cmd.startsWith('/cambio')) {
    await handleEditCommand(text, chatId, config, sessionManager, bot);

  } else {
    await bot.sendMessage(
      'Please reply "yes" to publish, "no" to cancel, or use /edit to make changes.'
    );
  }
}

async function handleEditCommand(
  text: string,
  chatId: number,
  config: any,
  sessionManager: any,
  bot: TelegramBot
): Promise<void> {
  const session = sessionManager.getSession(chatId);
  
  if (!session.pendingPost) {
    await bot.sendMessage('❌ No post to edit.');
    return;
  }

  const instruction = text.replace(/^\/(edit|cambio)\s*/i, '');
  const validation = safeValidate(EditInstructionSchema, instruction);
  
  if (!validation.success) {
    await bot.sendMessage(`❌ ${validation.errors?.[0]}`);
    return;
  }

  await bot.sendTyping();
  await bot.sendMessage(`_Applying changes..._`);

  try {
    const newPost = await generateBlogPost(config, {
      title: 'auto',
      newsItems: session.selectedItems.slice(0, 5),
      userComment: `${session.userComment}\n\nRevision instruction: ${instruction}`,
      context: `Topics: ${config.topics.join(', ')}\nPrevious title: ${session.pendingPost.title}`,
    });

    const post = {
      ...session.pendingPost,
      title: newPost.title,
      description: newPost.description,
      content: newPost.content,
      tags: newPost.tags,
      category: newPost.category,
    };

    session.pendingPost = post;
    session.imageQuery = newPost.imageQuery;
    sessionManager.updateSession(chatId, session);

    const preview = await previewBlogPost(post);
    await bot.sendMessage(preview);
    await bot.sendMessage(
      `Reply "yes" to publish or describe more changes with /edit.`
    );

  } catch (e: any) {
    logError('Edit failed', e);
    await bot.sendMessage(`❌ Edit error: ${e.message}`);
  }
}

function setupShutdownHandlers(
  bot: TelegramBot,
  sessionManager: any
): void {
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logInfo(`Received ${signal}, shutting down gracefully...`);

    try {
      bot.stop();
      destroySessionManager();
      logInfo('Shutdown complete');
      process.exit(0);
    } catch (error) {
      logError('Error during shutdown', error as Error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (error) => {
    logError('Uncaught exception', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logError('Unhandled rejection', reason as Error);
  });
}

main().catch((error) => {
  logError('Fatal error starting bot', error);
  process.exit(1);
});
