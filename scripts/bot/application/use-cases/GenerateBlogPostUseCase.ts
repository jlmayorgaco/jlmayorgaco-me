/**
 * Generate Blog Post Use Case
 * Application layer business logic
 */

import { Result } from '../../shared/Result';
import { SessionState } from '../../domain/enums/SessionState';
import { Session } from '../../domain/entities/Session';
import { 
  ISessionRepository, 
  IGeminiService, 
  IMessagePort,
  IImageGenerationService,
  GeneratedBlogPost,
} from '../ports';
import { logDebug, logError, logInfo } from '../../logger';
import { MarkdownFormatter } from '../../infrastructure/formatting/MarkdownFormatter';

export interface GenerateBlogPostInput {
  chatId: number;
  userComment: string;
}

export class GenerateBlogPostUseCase {
  constructor(
    private geminiService: IGeminiService,
    private sessionRepo: ISessionRepository,
    private messagePort: IMessagePort,
    private imageService?: IImageGenerationService,
  ) {}

  async execute(input: GenerateBlogPostInput): Promise<Result<void, Error>> {
    try {
      logDebug('Executing GenerateBlogPostUseCase', { chatId: input.chatId });

      // Get session
      const session = await this.sessionRepo.get(input.chatId);

      // Validate state
      if (session.state !== SessionState.COLLECTING_COMMENT) {
        await this.messagePort.sendMessage(
          '❌ Invalid state. Please start with /daily or /papers first.'
        );
        return Result.err(new Error('Invalid session state'));
      }

      // Update session with comment
      session.setComment(input.userComment);

      // Generate blog post
      await this.messagePort.sendMessage('_Generating blog post with AI..._');

      const postResult = await this.geminiService.generateBlogPost({
        title: 'auto',
        newsItems: session.selectedItems.slice(0, 5),
        userComment: input.userComment,
        context: this.buildContext(session),
      });

      if (!postResult.success) {
        throw postResult.error;
      }

      const postData = postResult.data;

      // Generate image if service available
      let imagePath: string | undefined;
      if (this.imageService) {
        await this.messagePort.sendMessage('_Generating cover image..._');
        const imageResult = await this.imageService.generateImage(postData.imageQuery);
        if (imageResult.success) {
          imagePath = imageResult.data;
        }
      }

      // Create blog post object
      const today = new Date().toISOString().split('T')[0];
      const blogPost = {
        title: postData.title,
        description: postData.description,
        category: postData.category,
        tags: postData.tags,
        date: today,
        content: postData.content,
        featured: false,
        imageQuery: postData.imageQuery,
        imagePath,
      };

      // Update session
      session.setPendingPost(blogPost, postData.imageQuery);
      await this.sessionRepo.save(input.chatId, session);

      // Send preview
      await this.sendPreview(input.chatId, blogPost, imagePath);

      logInfo('Blog post generated', { 
        chatId: input.chatId, 
        title: postData.title 
      });

      return Result.ok(undefined);
    } catch (error) {
      logError('GenerateBlogPostUseCase failed', error as Error);
      
      await this.messagePort.sendMessage(
        `❌ Failed to generate blog post: ${(error as Error).message}`
      );

      return Result.err(error as Error);
    }
  }

  private buildContext(session: Session): string {
    return `Topics: distributed control, robotics, FPGA, embedded systems
Lab focus: Technical research and development
Papers: ${session.papers.length} papers analyzed
News: ${session.news.length} news items`;
  }

  private async sendPreview(
    chatId: number, 
    post: GeneratedBlogPost & { imagePath?: string },
    imagePath?: string
  ): Promise<void> {
    let preview = `*Blog Post Preview*\n`;
    preview += `━━━━━━━━━━━━━━━━━━━\n\n`;
    preview += `*Title:* ${MarkdownFormatter.escape(post.title)}\n`;
    preview += `*Category:* ${post.category}\n`;
    preview += `*Tags:* ${post.tags.join(', ')}\n\n`;
    preview += `*Description:*\n${MarkdownFormatter.escape(post.description)}\n\n`;
    
    if (imagePath) {
      preview += `*Cover Image:* Generated ✓\n\n`;
    }
    
    preview += `Reply "yes" to publish, "no" to cancel, or /edit to make changes.`;

    await this.messagePort.sendMessage(preview);
  }
}
