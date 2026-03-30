/**
 * Main bot orchestrator with command registry and graceful shutdown
 * Production-ready: proper lifecycle management, health checks, error recovery
 */

import { loadConfig, validateEnvironment } from './config';
import { TelegramBot } from './telegram';
import { initializeSessionManager, destroySessionManager } from './session-manager';
import { getCommandRegistry } from './command-registry';
import { logError, logInfo } from './logger';
import { safeValidate, UserCommentSchema, EditInstructionSchema } from './validation';
import { generateBlogPost } from './gemini';
import { saveBlogPost, previewBlogPost } from './blog-generator';
import { publishPost, validateGitSetup } from './publisher';

// Import commands
import { helpCommand } from './commands/help';
import { papersCommand } from './commands/papers';
import { newsCommand } from './commands/news';
import { dailyCommand } from './commands/daily';
import { statusCommand } from './commands/status';
import { cancelCommand } from './commands/cancel';

let bot: TelegramBot | null = null;
let shuttingDown = false;

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

  // Validate git setup
  const gitStatus = await validateGitSetup();
  if (!gitStatus.valid) {
    console.warn('⚠️  Git setup issues:');
    gitStatus.errors.forEach(e => console.warn(`  - ${e}`));
  }

  // Initialize session manager
  const sessionManager = initializeSessionManager({
    ttlMs: config.sessionTtlMinutes * 60 * 1000,
    cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
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

    // Command routing
    if (cmd.startsWith('/')) {
      const commandName = cmd.slice(1).split(' ')[0];
      await registry.execute(commandName, {
        bot,
        config,
        sessionManager,
        chatId,
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
    const postData = await generateBlogPost(config, {
      title: 'auto',
      newsItems: session.selectedItems.slice(0, 5),
      userComment: session.userComment,
      context: `Topics: ${config.topics.join(', ')}\nLab focus: robotics, distributed control, FPGA, embedded systems`,
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

  // Validate edit instruction
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
      // Stop accepting new messages
      bot.stop();

      // Cleanup
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

  // Handle uncaught errors
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
