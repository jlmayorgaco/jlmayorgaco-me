/**
 * Batch Review Command
 * Shows papers in batch for efficient review with emoji reactions
 */

import { logError, logInfo } from '../../infrastructure/logging/Logger';
import { MarkdownFormatter } from '../../infrastructure/formatting/MarkdownFormatter';
import { ReactionEmoji, ReactionLabels } from '../../domain/value-objects/BatchReview';

interface CommandContext {
  bot: any;
  config: any;
  sessionManager: any;
  chatId: number;
  paperHistory?: any;
  researchContext?: any;
  userId?: string;
}

export const batchCommand = {
  name: 'batch',
  description: 'Start batch review of scanned papers',
  aliases: ['b'],
  
  async execute(ctx: CommandContext): Promise<void> {
    const { bot, config, sessionManager, chatId } = ctx;
    
    const session = sessionManager.getSession(chatId);
    
    // Check if we have papers to review
    if (!session.papers || session.papers.length === 0) {
      await bot.sendMessage(
        'âŒ No papers to review. Run /daily first to scan papers.'
      );
      return;
    }
    
    // Get top 7 papers for batch review
    const papers = session.papers.slice(0, 7);
    
    // Create batch items
    const batchItems = papers.map((p: any, i: number) => ({
      index: i + 1,
      paperId: p.id || `paper-${i}`,
      title: p.title || 'Unknown',
      url: p.absUrl || p.url || '',
      summary: p.summary || '',
    }));
    
    // Build batch review message
    let msg = `*ðŸ“‹ Batch Review: ${batchItems.length} Papers*\n\n`;
    msg += `React with:\n`;
    msg += `â­ Must Read | ðŸ‘ Interesting | âœ“ Acknowledge\n`;
    msg += `ðŸ”– Save Later | â­ï¸ Skip\n\n`;
    msg += `Format: \`1â­ 2ðŸ‘ 3â­ï¸\`\n\n`;
    
    for (const item of batchItems) {
      const title = MarkdownFormatter.truncate(item.title, 70);
      msg += `${item.index}. ${MarkdownFormatter.escape(title)}\n`;
      msg += `   [ArXiv](${item.url})\n\n`;
    }
    
    // Store batch items in session
    session.batchReview = {
      items: batchItems,
      currentIndex: 0,
      reactions: new Map(),
      submitted: false,
    };
    session.state = 'batch_reviewing';
    sessionManager.updateSession(chatId, session);
    
    await bot.sendMessage(msg);
    
    logInfo('Batch review started', { 
      paperCount: batchItems.length 
    });
  }
};

export const batchStatusCommand = {
  name: 'batch-status',
  description: 'Check batch review progress',
  aliases: ['bs'],
  
  async execute(ctx: CommandContext): Promise<void> {
    const { bot, sessionManager, chatId } = ctx;
    
    const session = sessionManager.getSession(chatId);
    
    if (session.state !== 'batch_reviewing') {
      await bot.sendMessage('âŒ Not in batch review mode. Run /batch first.');
      return;
    }
    
    const batchItems = session.batchReview?.items || [];
    const reactions = session.reactions || {};
    const reviewed = Object.keys(reactions).length;
    
    await bot.sendMessage(
      `ðŸ“Š *Batch Review Progress*\n\n` +
      `Total papers: ${batchItems.length}\n` +
      `Reviewed: ${reviewed}\n` +
      `Remaining: ${batchItems.length - reviewed}\n\n` +
      `Continue reacting with: \`1â­ 2ðŸ‘ ...\``
    );
  }
};

