/**
 * Enhanced Daily Command
 * Supports: Paper history deduplication, Batch review mode, Research context
 */

import { logError, logInfo } from '../../infrastructure/logging/Logger';
import { MarkdownFormatter } from '../../infrastructure/formatting/MarkdownFormatter';
import { runScanner } from '../../../../src/lib/pipeline/arxiv-scanner';

interface CommandContext {
  bot: any;
  config: any;
  sessionManager: any;
  chatId: number;
  paperHistory?: any;
  researchContext?: any;
  userId?: string;
}

export const dailyCommand = {
  name: 'daily',
  description: 'Scan ArXiv papers with deduplication',
  aliases: ['d'],
  
  async execute(ctx: CommandContext): Promise<void> {
    const { bot, config, sessionManager, chatId, paperHistory } = ctx;
    
    await bot.sendTyping();
    await bot.sendMessage('_Scanning ArXiv for papers..._');
    
    try {
      // Scan papers
      const papers = await runScanner();
      
      let selectedPapers = papers;
      let duplicates = 0;
      
      // Deduplicate against history if available
      if (paperHistory) {
        selectedPapers = await paperHistory.deduplicate(papers);
        duplicates = papers.length - selectedPapers.length;
        
        if (duplicates > 0) {
          await bot.sendMessage(`_Filtered ${duplicates} previously seen papers_`);
        }
      }
      
      if (selectedPapers.length === 0) {
        await bot.sendMessage('📭 No new papers found today.');
        return;
      }
      
      // Record papers in history
      if (paperHistory) {
        for (const paper of selectedPapers.slice(0, config.maxPapersToScan)) {
          await paperHistory.recordSeen({
            id: paper.id,
            title: paper.title,
            firstSeen: new Date(),
            lastSeen: new Date(),
            seenCount: 1,
            userActions: [],
          });
        }
      }
      
      // Send tiered results
      let msg = `*📊 Today's Papers (${selectedPapers.length} found)*\n\n`;
      
      const maxDisplay = Math.min(selectedPapers.length, 5);
      for (let i = 0; i < maxDisplay; i++) {
        const paper = selectedPapers[i];
        const title = MarkdownFormatter.truncate(paper.title || 'Unknown', 60);
        const url = paper.absUrl || paper.url || '';
        msg += `${i + 1}. ${MarkdownFormatter.escape(title)}\n   [ArXiv](${url})\n\n`;
      }
      
      if (selectedPapers.length > 5) {
        msg += `_...and ${selectedPapers.length - 5} more_`;
      }
      
      await bot.sendMessage(msg);
      
      // Store in session
      const session = sessionManager.getSession(chatId);
      session.papers = selectedPapers;
      session.selectedItems = selectedPapers.slice(0, config.maxPapersToScan).map((p: any) => p.title);
      session.state = 'collecting_comment';
      sessionManager.updateSession(chatId, session);
      
      // Prompt for commentary
      await bot.sendMessage(
        `📝 *Ready for your commentary!*\n\n` +
        `Selected ${selectedPapers.length} papers. ` +
        `Send text or voice message with your analysis.`
      );
      
      logInfo('Daily scan complete', { 
        total: papers.length,
        new: selectedPapers.length,
        duplicates 
      });
      
    } catch (e: any) {
      logError('Daily command failed', e);
      await bot.sendMessage(`❌ Scan error: ${e.message}`);
    }
  }
};
