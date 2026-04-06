/**
 * Publish Post Use Case
 */

import { Result } from '../../shared/Result';
import { SessionState } from '../../domain/enums/SessionState';
import { ISessionRepository, IPublisher, IMessagePort } from '../ports';
import { saveBlogPost } from '../../infrastructure/formatting/BlogGenerator';
import { logDebug, logError, logInfo } from '../../infrastructure/logging/Logger';

export interface PublishPostInput {
  chatId: number;
}

export class PublishPostUseCase {
  constructor(
    private sessionRepo: ISessionRepository,
    private publisher: IPublisher,
    private messagePort: IMessagePort,
  ) {}

  async execute(input: PublishPostInput): Promise<Result<void, Error>> {
    try {
      logDebug('Executing PublishPostUseCase', { chatId: input.chatId });

      // Get session
      const session = await this.sessionRepo.get(input.chatId);

      // Validate state
      if (!session.canPublish()) {
        await this.messagePort.sendMessage('âŒ No post ready to publish.');
        return Result.err(new Error('No pending post'));
      }

      const post = session.pendingPost!;

      // Save blog post file
      await this.messagePort.sendMessage('_Saving blog post..._');
      const filePath = await saveBlogPost(post);

      // Publish to git
      await this.messagePort.sendMessage('_Publishing to repository..._');
      const publishResult = await this.publisher.publishPost(filePath, post.title);

      if (!publishResult.success) {
        throw new Error(publishResult.message);
      }

      // Update session
      session.confirmPublish();
      await this.sessionRepo.save(input.chatId, session);

      // Send success message
      await this.messagePort.sendMessage(
        `âœ… *Published!*\n${publishResult.message}\n\nVercel will auto-deploy.`
      );

      logInfo('Post published', { 
        chatId: input.chatId, 
        title: post.title,
        commitHash: publishResult.commitHash 
      });

      return Result.ok(undefined);
    } catch (error) {
      logError('PublishPostUseCase failed', error as Error);
      
      await this.messagePort.sendMessage(
        `âŒ Failed to publish: ${(error as Error).message}`
      );

      return Result.err(error as Error);
    }
  }
}

