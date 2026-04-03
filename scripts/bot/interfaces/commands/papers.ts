/**
 * Papers command - scan ArXiv for relevant papers
 */

import type { CommandHandler, CommandContext } from '../types/commands';
import { runScanner } from '../../../../src/lib/pipeline/arxiv-scanner.js';
import { classifyAndSummarizePapers } from '../../infrastructure/external/GeminiService';
import { logError } from '../../infrastructure/logging/Logger';
import { withCommandError } from './CommandWrapper';

export const papersCommand: CommandHandler = {
  name: 'papers',
  description: 'Scan ArXiv for new papers',
  aliases: ['scan', 'arxiv', 'p'],
  
  async execute(context: CommandContext): Promise<void> {
    const { bot, config, sessionManager, chatId } = context;
    
    await bot.sendTyping();
    await bot.sendMessage('_Scanning ArXiv..._');
    
    await withCommandError('papers', async () => {
      const papers = await runScanner();
      const session = sessionManager.getSession(chatId);
      
      session.papers = papers.slice(0, config.maxPapersToScan);
      
      await bot.sendTyping();
      await bot.sendMessage('_Classifying papers with Gemini..._');
      
      const classified = await classifyAndSummarizePapers(config, session.papers);
      
      const enriched = classified.map(c => {
        const original = session.papers.find(p => p.id === c.paperId);
        return { ...original, ...c };
      });
      
      enriched.sort((a: any, b: any) => {
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return (order[a.relevance] ?? 2) - (order[b.relevance] ?? 2);
      });
      
      const topCount = config.topPapersToShow;
      const topPapers = enriched.filter((p: any) => p.relevance === 'high').slice(0, topCount);
      const top = topPapers.length > 0 ? topPapers : enriched.slice(0, topCount);
      
      let msg = `*Top ${top.length} Papers*\n\n`;
      for (const p of top) {
        const emoji = p.relevance === 'high' ? '🔴' : '🟡';
        msg += `${emoji} *${(p.title || 'Untitled').substring(0, 80)}*\n`;
        msg += `_${p.classification || 'other'}_ \\| Score: ${p.relevanceScore ?? '?'}\n`;
        msg += `${p.summaryShort || p.summary?.substring(0, 200) || 'No summary'}\n`;
        msg += `[ArXiv](${p.absUrl || p.url})\n\n`;
      }
      
      await bot.sendMessage(msg);
      
      session.selectedItems = top.map((p: any) => p.title || p.paperId);
      sessionManager.updateSession(chatId, session);
    }, bot);
  },
};
