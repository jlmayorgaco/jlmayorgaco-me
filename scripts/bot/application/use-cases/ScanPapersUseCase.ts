/**
 * Scan Papers Use Case
 */

import { Result } from '../../shared/Result';
import { Session } from '../../domain/entities/Session';
import { ISessionRepository, IGeminiService, IMessagePort } from '../ports';
import { logDebug, logError, logInfo } from '../../logger';
import { MarkdownFormatter } from '../../infrastructure/formatting/MarkdownFormatter';

// Import from existing scanner
import { runScanner } from '../../../src/lib/pipeline/arxiv-scanner.js';

export interface ScanPapersInput {
  chatId: number;
  maxPapers?: number;
}

export class ScanPapersUseCase {
  constructor(
    private geminiService: IGeminiService,
    private sessionRepo: ISessionRepository,
    private messagePort: IMessagePort,
  ) {}

  async execute(input: ScanPapersInput): Promise<Result<void, Error>> {
    try {
      logDebug('Executing ScanPapersUseCase', { chatId: input.chatId });

      await this.messagePort.sendMessage('_Scanning ArXiv for papers..._');

      // Scan papers
      const papers = await runScanner();
      const maxPapers = input.maxPapers || 10;
      const selectedPapers = papers.slice(0, maxPapers);

      // Classify papers
      await this.messagePort.sendMessage('_Classifying papers with AI..._');

      const classificationResult = await this.geminiService.classifyPapers(
        selectedPapers.map(p => ({
          id: p.id,
          title: p.title,
          summary: p.summary,
          categories: p.categories,
        }))
      );

      if (!classificationResult.success) {
        throw classificationResult.error;
      }

      const classified = classificationResult.data;

      // Merge classification with papers
      const enrichedPapers = selectedPapers.map(paper => {
        const classification = classified.find(c => c.paperId === paper.id);
        return {
          ...paper,
          relevance: classification?.relevance,
          summaryShort: classification?.summary,
          classification: classification?.classification,
        };
      });

      // Sort by relevance
      enrichedPapers.sort((a, b) => {
        const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return (order[a.relevance || 'low'] || 2) - (order[b.relevance || 'low'] || 2);
      });

      // Get top papers
      const topPapers = enrichedPapers
        .filter(p => p.relevance === 'high')
        .slice(0, 3);

      const displayPapers = topPapers.length > 0 ? topPapers : enrichedPapers.slice(0, 3);

      // Update session
      const session = await this.sessionRepo.get(input.chatId);
      session.setPapers(enrichedPapers);
      session.setSelectedItems(displayPapers.map(p => p.title));
      await this.sessionRepo.save(input.chatId, session);

      // Send results
      await this.sendResults(displayPapers);

      logInfo('Papers scanned and classified', { 
        chatId: input.chatId, 
        count: displayPapers.length 
      });

      return Result.ok(undefined);
    } catch (error) {
      logError('ScanPapersUseCase failed', error as Error);
      
      await this.messagePort.sendMessage(
        `❌ Failed to scan papers: ${(error as Error).message}`
      );

      return Result.err(error as Error);
    }
  }

  private async sendResults(papers: any[]): Promise<void> {
    let msg = `*Top ${papers.length} Papers*\n\n`;
    
    for (const p of papers) {
      const emoji = p.relevance === 'high' ? '🔴' : '🟡';
      const title = MarkdownFormatter.truncate(p.title || 'Untitled', 80);
      const summary = MarkdownFormatter.truncate(
        p.summaryShort || p.summary || '', 
        200
      );
      
      msg += `${emoji} *${MarkdownFormatter.escape(title)}*\n`;
      msg += `_${p.classification || 'other'}_ | Score: ${p.relevanceScore ?? '?'}\n`;
      msg += `${MarkdownFormatter.escape(summary)}\n`;
      msg += `[ArXiv](${p.absUrl || p.url})\n\n`;
    }

    await this.messagePort.sendMessage(msg);
  }
}
