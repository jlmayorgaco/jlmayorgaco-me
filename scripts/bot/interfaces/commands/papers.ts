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
      
      if (top.length === 0) {
        await bot.sendMessage('No papers found.');
        return;
      }
      
      let msg = `*Top ${top.length} Papers*\n${'─'.repeat(18)}\n\n`;
      
      for (let i = 0; i < top.length; i++) {
        const p = top[i] as any;
        const num = i + 1;
        const title = (p.title || 'Untitled').substring(0, 70);
        
        msg += `${num}. *${title}*\n`;
        msg += `   _${p.classification || 'other'}_ | ${p.relevance?.toUpperCase()}\n`;
        
        const summary = p.summaryShort || p.summary?.substring(0, 250) || 'No summary';
        msg += `   ${summary}\n`;
        
        if (p.methods) {
          msg += `   *Method:* ${p.methods.substring(0, 150)}\n`;
        }
        if (p.pros) {
          msg += `   *Pros:* ${p.pros.substring(0, 150)}\n`;
        }
        if (p.cons || p.limitations) {
          msg += `   *Limits:* ${(p.cons || p.limitations || '').substring(0, 150)}\n`;
        }
        if (p.importance) {
          msg += `   *Why:* ${p.importance.substring(0, 150)}\n`;
        }
        
        const url = p.absUrl || p.url || '';
        if (url) {
          msg += `   [ArXiv](${url})\n`;
        }
        msg += '\n';
      }
      
      await bot.sendMessage(msg);
      
      session.selectedItems = top.map((p: any) => p.title || p.paperId);
      sessionManager.updateSession(chatId, session);
    }, bot);
  },
};
