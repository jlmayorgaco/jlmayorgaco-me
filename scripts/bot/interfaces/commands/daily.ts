/**
 * Daily command - full digest with papers and news
 */

import type { CommandHandler, CommandContext } from '../types/commands';
import { runScanner } from '../../../../src/lib/pipeline/arxiv-scanner.js';
import { classifyAndSummarizePapers } from '../../infrastructure/external/GeminiService';
import { scanNewsSources } from '../../infrastructure/connectors/RssConnector';
import { logError } from '../../infrastructure/logging/Logger';

export const dailyCommand: CommandHandler = {
  name: 'daily',
  description: 'Full daily digest (papers + news)',
  aliases: ['digest', 'd'],
  
  async execute(context: CommandContext): Promise<void> {
    const { bot, config, sessionManager, chatId } = context;
    
    await bot.sendTyping();
    await bot.sendMessage('_Running full daily digest..._');
    
    try {
      // Scan papers
      const papers = await runScanner();
      const session = sessionManager.getSession(chatId);
      
      session.papers = papers.slice(0, config.maxPapersToScan);
      
      await bot.sendTyping();
      const classified = await classifyAndSummarizePapers(config, session.papers);
      
      const topPapers = classified
        .filter(c => c.relevance === 'high')
        .slice(0, config.topPapersToShow);
      
      // Scan news
      await bot.sendTyping();
      const news = await scanNewsSources(config);
      session.news = news.slice(0, 10);
      
      // Build digest
      const today = new Date().toISOString().split('T')[0];
      let msg = `*Daily Digest \\- ${today}*\n\n`;
      
      msg += `*TOP PAPERS:*\n\n`;
      for (const p of topPapers) {
        msg += `ðŸ“„ *${p.summary?.substring(0, 80) || p.paperId}*\n`;
        msg += `   ${p.summary?.substring(0, 150) || 'No summary'}...\n\n`;
      }
      
      msg += `*TOP NEWS:*\n\n`;
      for (const n of session.news.slice(0, 3)) {
        msg += `ðŸ“° *${n.source}*: ${n.title.substring(0, 60)}\n`;
        msg += `   ${n.description.substring(0, 100) || 'No description'}...\n\n`;
      }
      
      msg += `_Reply with your commentary to generate a blog post_`;
      
      await bot.sendMessage(msg);
      
      // Update session
      session.selectedItems = [
        ...topPapers.map(p => p.summary || p.paperId),
        ...session.news.slice(0, 3).map(n => n.title),
      ];
      session.state = 'collecting_comment';
      sessionManager.updateSession(chatId, session);
      
    } catch (e: any) {
      logError('Daily command failed', e);
      await bot.sendMessage(`âŒ Digest error: ${e.message}`);
    }
  },
};

