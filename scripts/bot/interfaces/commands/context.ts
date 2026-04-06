/**
 * Context Command
 * Manages personal research context and interests
 */

import { logError, logInfo } from '../../infrastructure/logging/Logger';
import { MarkdownFormatter } from '../../infrastructure/formatting/MarkdownFormatter';

interface CommandContext {
  bot: any;
  config: any;
  sessionManager: any;
  chatId: number;
  paperHistory?: any;
  researchContext?: any;
  userId?: string;
}

export const contextCommand = {
  name: 'context',
  description: 'View or update your research interests',
  aliases: ['ctx'],
  
  async execute(ctx: CommandContext): Promise<void> {
    const { bot, researchContext, userId } = ctx;
    
    if (!researchContext || !userId) {
      await bot.sendMessage('âŒ Research context not configured.');
      return;
    }
    
    try {
      const context = await researchContext.getContext(userId);
      const interests = await researchContext.getInterests(userId);
      const stats = researchContext.getLearningStats(userId);
      
      let msg = `*ðŸ§  Your Research Context*\n\n`;
      
      // Research areas
      msg += `*Research Areas:*\n`;
      for (const area of context.researchAreas.slice(0, 5)) {
        msg += `â€¢ ${area}\n`;
      }
      msg += '\n';
      
      // Top interests (weighted)
      if (interests.length > 0) {
        msg += `*Top Interests (learned):*\n`;
        for (const interest of interests.slice(0, 5)) {
          const percentage = Math.round(interest.weight * 100);
          msg += `â€¢ ${interest.term}: ${percentage}%\n`;
        }
        msg += '\n';
      }
      
      // Learning stats
      msg += `*Learning Stats:*\n`;
      msg += `â€¢ Interactions: ${stats.interactions}\n`;
      
      if (stats.topInterests.length > 0) {
        msg += `â€¢ Top learned: ${stats.topInterests.slice(0, 3).join(', ')}\n`;
      }
      
      await bot.sendMessage(msg);
      
      logInfo('Context displayed', { userId });
      
    } catch (e: any) {
      logError('Context command failed', e);
      await bot.sendMessage(`âŒ Error: ${e.message}`);
    }
  }
};

export const historyCommand = {
  name: 'history',
  description: 'View your paper reading history',
  aliases: ['hist'],
  
  async execute(ctx: CommandContext): Promise<void> {
    const { bot, paperHistory } = ctx;
    
    if (!paperHistory) {
      await bot.sendMessage('âŒ Paper history not configured.');
      return;
    }
    
    try {
      const stats = paperHistory.getStats();
      
      let msg = `*ðŸ“š Paper History*\n\n`;
      msg += `Total papers seen: ${stats.total}\n`;
      msg += `Papers with actions: ${stats.withActions}\n`;
      
      await bot.sendMessage(msg);
      
    } catch (e: any) {
      logError('History command failed', e);
      await bot.sendMessage(`âŒ Error: ${e.message}`);
    }
  }
};

