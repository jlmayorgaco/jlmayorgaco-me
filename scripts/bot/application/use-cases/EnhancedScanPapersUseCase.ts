/**
 * Enhanced Scan Papers Use Case
 * Supports: paper history, tiered classification, batch review mode
 */

import { Result } from '../../shared/Result';
import { Session } from '../../domain/entities/Session';
import { 
  ISessionRepository, 
  IGeminiService, 
  IMessagePort,
  IPaperHistoryRepository,
  TieredClassification,
  RelevanceTier,
  TierEmojis,
} from '../ports';
import { IResearchContextRepository } from '../ports/ResearchContextPort';
import { logDebug, logError, logInfo } from '../../infrastructure/logging/Logger';
import { MarkdownFormatter } from '../../infrastructure/formatting/MarkdownFormatter';
import { BatchReviewItem } from '../../domain/value-objects/BatchReview';

// Import from existing scanner
import { runScanner } from '../../../src/lib/pipeline/arxiv-scanner.js';

export interface ScanPapersInput {
  chatId: number;
  userId: string;
  maxPapers?: number;
  useBatchMode?: boolean;
  excludeSeen?: boolean;
}

export class EnhancedScanPapersUseCase {
  constructor(
    private geminiService: IGeminiService,
    private sessionRepo: ISessionRepository,
    private messagePort: IMessagePort,
    private historyRepo: IPaperHistoryRepository,
    private contextRepo: IResearchContextRepository,
  ) {}

  async execute(input: ScanPapersInput): Promise<Result<void, Error>> {
    try {
      logDebug('Executing EnhancedScanPapersUseCase', { 
        chatId: input.chatId,
        useBatchMode: input.useBatchMode 
      });

      await this.messagePort.sendMessage('<i>Scanning ArXiv for papers...</i>');

      // Scan papers
      const papers = await runScanner();
      
      // Deduplicate against history
      let uniquePapers = papers;
      if (input.excludeSeen !== false) {
        uniquePapers = await this.historyRepo.deduplicate(papers);
        const duplicates = papers.length - uniquePapers.length;
        if (duplicates > 0) {
          await this.messagePort.sendMessage(`<i>Filtered ${duplicates} previously seen papers</i>`);
        }
      }

      if (uniquePapers.length === 0) {
        await this.messagePort.sendMessage('ðŸ“­ No new papers found today.');
        return Result.ok(undefined);
      }

      const maxPapers = input.maxPapers || 10;
      const selectedPapers = uniquePapers.slice(0, maxPapers);

      // Set personalized context for classification
      const contextPrompt = await this.contextRepo.getClassificationPrompt(input.userId);
      this.geminiService.setContextPrompt(contextPrompt);

      // Classify papers with tiered system
      await this.messagePort.sendMessage('<i>Classifying papers with AI...</i>');

      const classificationResult = await this.geminiService.classifyPapers(
        selectedPapers.map(p => ({
          id: p.id,
          title: p.title,
          summary: p.summary,
          categories: p.categories,
          authors: p.authors,
          published: p.published,
        }))
      );

      if (!classificationResult.success) {
        throw classificationResult.error;
      }

      const classified = classificationResult.data;

      // Record papers in history
      for (const paper of selectedPapers) {
        await this.historyRepo.recordSeen({
          id: paper.id,
          title: paper.title,
          firstSeen: new Date(),
          lastSeen: new Date(),
          seenCount: 1,
          userActions: [],
        });
      }

      // Record context learning
      for (const c of classified) {
        if (c.tier === RelevanceTier.MUST_READ || c.tier === RelevanceTier.WORTH_SCANNING) {
          await this.contextRepo.recordInteraction(input.userId, {
            paperId: c.paperId,
            action: 'opened',
            timestamp: new Date(),
            notes: `${c.tier}: ${c.reasoning}`,
          });
        }
      }

      // Get session and determine mode
      const session = await this.sessionRepo.get(input.chatId);
      
      if (input.useBatchMode) {
        await this.sendBatchReview(session, classified, selectedPapers);
      } else {
        await this.sendTieredResults(classified, selectedPapers);
      }

      // Save session
      await this.sessionRepo.save(input.chatId, session);

      logInfo('Papers scanned and classified with tiers', { 
        chatId: input.chatId, 
        count: selectedPapers.length,
        mustRead: classified.filter(c => c.tier === RelevanceTier.MUST_READ).length,
        worthScanning: classified.filter(c => c.tier === RelevanceTier.WORTH_SCANNING).length,
      });

      return Result.ok(undefined);
    } catch (error) {
      logError('EnhancedScanPapersUseCase failed', error as Error);
      
      await this.messagePort.sendMessage(
        `âŒ Failed to scan papers: ${(error as Error).message}`
      );

      return Result.err(error as Error);
    }
  }

  private async sendBatchReview(
    session: Session,
    classified: TieredClassification[],
    papers: any[]
  ): Promise<void> {
    // Create batch review items (top 5-7 papers)
    const batchItems: BatchReviewItem[] = classified
      .filter(c => c.tier !== RelevanceTier.SKIP)
      .slice(0, 7)
      .map(c => {
        const paper = papers.find(p => p.id === c.paperId);
        return {
          paperId: c.paperId,
          title: paper?.title || 'Unknown',
          summary: c.summary,
          tier: c.tier,
          relevanceScore: c.relevanceScore,
          url: paper?.absUrl || paper?.url || '',
        };
      });

    if (batchItems.length === 0) {
      await this.messagePort.sendMessage('ðŸ“­ No relevant papers found for review.');
      return;
    }

    // Start batch review session
    session.startBatchReview({
      items: batchItems,
      currentIndex: 0,
      reactions: new Map(),
      submitted: false,
    });

    // Send batch review message
    let msg = `<b>📚 Batch Review: ${batchItems.length} Papers</b>\n\n`;
    msg += 'React to each paper:\n';
    msg += 'â­ Must Read | ðŸ‘ Interesting | âœ“ Ack | ðŸ”– Save | â­ï¸ Skip\n\n';

    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      const emoji = TierEmojis[item.tier];
      msg += `${i + 1}. ${emoji} <b>${MarkdownFormatter.escape(item.title, 'html')}</b>\n`;
      msg += `   Score: ${item.relevanceScore}/100 | ${item.tier.replace('_', ' ')}\n`;
      msg += `   ${MarkdownFormatter.escape(item.summary, 'html')}\n\n`;
    }

    msg += 'Reply with numbers (e.g., "1â­ 2ðŸ‘ 3â­ï¸") or react individually.';

    await this.messagePort.sendMessage(msg);
  }

  private async sendTieredResults(
    classified: TieredClassification[],
    papers: any[]
  ): Promise<void> {
    // Group by tier
    const byTier: Record<RelevanceTier, TieredClassification[]> = {
      [RelevanceTier.MUST_READ]: [],
      [RelevanceTier.WORTH_SCANNING]: [],
      [RelevanceTier.BACKGROUND]: [],
      [RelevanceTier.SKIP]: [],
    };

    for (const c of classified) {
      byTier[c.tier].push(c);
    }

    let msg = '<b>📊 Today\'s Papers by Relevance</b>\n\n';

    // Must Read
    if (byTier[RelevanceTier.MUST_READ].length > 0) {
      msg += `<b>🔴 Must Read (${byTier[RelevanceTier.MUST_READ].length})</b>\n`;
      for (const c of byTier[RelevanceTier.MUST_READ].slice(0, 3)) {
        const paper = papers.find(p => p.id === c.paperId);
        msg += this.formatPaperLine(c, paper);
      }
      msg += '\n';
    }

    // Worth Scanning
    if (byTier[RelevanceTier.WORTH_SCANNING].length > 0) {
      msg += `<b>🟡 Worth Scanning (${byTier[RelevanceTier.WORTH_SCANNING].length})</b>\n`;
      for (const c of byTier[RelevanceTier.WORTH_SCANNING].slice(0, 3)) {
        const paper = papers.find(p => p.id === c.paperId);
        msg += this.formatPaperLine(c, paper);
      }
      msg += '\n';
    }

    // Background
    if (byTier[RelevanceTier.BACKGROUND].length > 0) {
      msg += `<b>🟢 Background (${byTier[RelevanceTier.BACKGROUND].length})</b>\n`;
      for (const c of byTier[RelevanceTier.BACKGROUND].slice(0, 2)) {
        const paper = papers.find(p => p.id === c.paperId);
        msg += this.formatPaperLine(c, paper);
      }
    }

    await this.messagePort.sendMessage(msg);
  }

  private formatPaperLine(classification: TieredClassification, paper: any): string {
    const title = MarkdownFormatter.escape(paper?.title || 'Unknown', 'html');
    const action = MarkdownFormatter.escape(classification.suggestedAction, 'html');
    const url = paper?.absUrl || paper?.url || '';
    return `• <b>${title}</b>\n  <i>${action}</i>\n  <a href="${url}">ArXiv</a>\n\n`;
  }
}

