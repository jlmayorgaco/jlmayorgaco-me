/**
 * Batch Review Use Case
 * Manages batch review of papers with reactions
 */

import type { 
  ISessionRepository, 
  IMessagePort,
  IPaperHistoryRepository 
} from '../ports';
import type { 
  StartBatchReviewInput,
  StartBatchReviewOutput,
  SubmitReactionInput,
  SubmitReactionOutput,
  BatchReviewPaperDTO 
} from '../dto';
import { Result } from '../../shared/Result';
import { logDebug, logError, logInfo } from '../../logger';
import { MarkdownFormatter } from '../../infrastructure/formatting/MarkdownFormatter';
import { ReactionEmoji } from '../../domain/value-objects/BatchReview';

export class BatchReviewUseCase {
  constructor(
    private sessionRepo: ISessionRepository,
    private messagePort: IMessagePort,
    private paperHistory?: IPaperHistoryRepository
  ) {}

  async start(input: StartBatchReviewInput): Promise<Result<StartBatchReviewOutput, Error>> {
    try {
      logDebug('Starting batch review', { chatId: input.chatId });

      const session = await this.sessionRepo.get(input.chatId);

      // Create batch review items
      const batchItems = input.papers.map((p, i) => ({
        paperId: p.paperId,
        title: p.title,
        summary: p.summary,
        tier: 'background' as any,
        relevanceScore: p.relevanceScore,
        url: p.url,
      }));

      // Start batch review session
      session.startBatchReview({
        items: batchItems,
        currentIndex: 0,
        reactions: new Map(),
        submitted: false,
      });

      await this.sessionRepo.save(input.chatId, session);

      // Send batch review message
      await this.sendBatchReviewMessage(batchItems);

      logInfo('Batch review started', { 
        chatId: input.chatId,
        itemCount: batchItems.length 
      });

      return Result.ok({
        success: true,
        batchItemsCount: batchItems.length,
      });

    } catch (error) {
      logError('BatchReviewUseCase.start failed', error as Error);
      return Result.err(error as Error);
    }
  }

  async submitReaction(
    input: SubmitReactionInput
  ): Promise<Result<SubmitReactionOutput, Error>> {
    try {
      logDebug('Submitting batch reaction', { 
        chatId: input.chatId,
        paperId: input.paperId,
        reaction: input.reaction 
      });

      const session = await this.sessionRepo.get(input.chatId);
      const batchReview = session.getBatchReview();

      if (!batchReview) {
        return Result.err(new Error('No active batch review'));
      }

      // Map reaction string to emoji
      const reactionMap: Record<string, ReactionEmoji> = {
        'star': ReactionEmoji.STAR,
        'thumbs_up': ReactionEmoji.THUMBS_UP,
        'check': ReactionEmoji.CHECK,
        'bookmark': ReactionEmoji.BOOKMARK,
        'skip': ReactionEmoji.SKIP,
      };

      const emoji = reactionMap[input.reaction];
      if (!emoji) {
        return Result.err(new Error(`Invalid reaction: ${input.reaction}`));
      }

      // Record reaction
      session.addReaction(input.paperId, emoji);
      await this.sessionRepo.save(input.chatId, session);

      // Record in history if available
      if (this.paperHistory) {
        const actionMap: Record<string, string> = {
          'star': 'saved',
          'thumbs_up': 'saved',
          'check': 'read',
          'bookmark': 'saved',
          'skip': 'skipped',
        };
        await this.paperHistory.recordAction(
          input.paperId, 
          actionMap[input.reaction] as any
        );
      }

      const totalReviewed = session.getBatchReview()?.reactions.size || 0;
      const totalItems = session.getBatchReview()?.items.length || 0;
      const completed = totalReviewed >= totalItems;

      logInfo('Reaction recorded', { 
        chatId: input.chatId,
        paperId: input.paperId,
        reaction: input.reaction,
        progress: `${totalReviewed}/${totalItems}` 
      });

      return Result.ok({
        success: true,
        reactionRecorded: true,
        totalReviewed,
        totalItems,
        completed,
      });

    } catch (error) {
      logError('BatchReviewUseCase.submitReaction failed', error as Error);
      return Result.err(error as Error);
    }
  }

  private async sendBatchReviewMessage(items: any[]): Promise<void> {
    let msg = `*📋 Batch Review: ${items.length} Papers*\n\n`;
    msg += `React with:\n`;
    msg += `⭐ Must Read | 👍 Interesting | ✓ Acknowledge\n`;
    msg += `🔖 Save Later | ⏭️ Skip\n\n`;
    msg += `Format: \`1⭐ 2👍 3⏭️\`\n\n`;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const title = MarkdownFormatter.truncate(item.title, 70);
      msg += `${i + 1}. ${MarkdownFormatter.escape(title)}\n`;
      msg += `   [ArXiv](${item.url})\n\n`;
    }

    await this.messagePort.sendMessage(msg);
  }
}
