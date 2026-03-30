/**
 * Enhanced Generate Blog Post Use Case
 * Supports: voice transcription, personal context integration
 */

import { Result } from '../../shared/Result';
import { SessionState } from '../../domain/enums/SessionState';
import { Session } from '../../domain/entities/Session';
import { 
  ISessionRepository, 
  IGeminiService, 
  IMessagePort,
  GeneratedBlogPost,
} from '../ports';
import { 
  IVoiceTranscriptionService,
  ICommentaryFormatter,
} from '../ports/VoiceTranscriptionPort';
import { IResearchContextRepository } from '../ports/ResearchContextPort';
import { logDebug, logError, logInfo } from '../../logger';
import { MarkdownFormatter } from '../../infrastructure/formatting/MarkdownFormatter';

export interface GenerateBlogPostInput {
  chatId: number;
  userId: string;
  userComment?: string;
  voiceBuffer?: Buffer;
  voiceMimeType?: string;
}

export class EnhancedGenerateBlogPostUseCase {
  constructor(
    private geminiService: IGeminiService,
    private sessionRepo: ISessionRepository,
    private messagePort: IMessagePort,
    private transcriptionService?: IVoiceTranscriptionService,
    private commentaryFormatter?: ICommentaryFormatter,
    private contextRepo?: IResearchContextRepository,
  ) {}

  async execute(input: GenerateBlogPostInput): Promise<Result<void, Error>> {
    try {
      logDebug('Executing EnhancedGenerateBlogPostUseCase', { 
        chatId: input.chatId,
        hasVoice: !!input.voiceBuffer,
        hasText: !!input.userComment,
      });

      // Get session
      const session = await this.sessionRepo.get(input.chatId);

      // Validate state
      if (session.state !== SessionState.COLLECTING_COMMENT) {
        await this.messagePort.sendMessage(
          '❌ Invalid state. Please start with /daily or /papers first.'
        );
        return Result.err(new Error('Invalid session state'));
      }

      let finalComment = input.userComment || '';

      // Process voice commentary if provided
      if (input.voiceBuffer && this.transcriptionService?.isAvailable()) {
        await this.messagePort.sendMessage('_Transcribing voice message..._');
        
        const transcriptionResult = await this.transcriptionService.transcribe(
          input.voiceBuffer,
          input.voiceMimeType || 'audio/ogg'
        );

        if (!transcriptionResult.success) {
          await this.messagePort.sendMessage(
            '⚠️ Voice transcription failed, using text only.'
          );
        } else {
          const transcription = transcriptionResult.data;
          
          // Format the transcription
          if (this.commentaryFormatter) {
            const formatted = await this.commentaryFormatter.format(transcription);
            finalComment = formatted.formattedText;
            
            await this.messagePort.sendMessage(
              `_Transcribed (${Math.round(transcription.duration)}s):_\n` +
              `"${MarkdownFormatter.truncate(transcription.text, 100)}..."`
            );
          } else {
            finalComment = transcription.text;
          }
        }
      }

      if (!finalComment.trim()) {
        await this.messagePort.sendMessage(
          '❌ No commentary provided. Please send text or voice message.'
        );
        return Result.err(new Error('No commentary provided'));
      }

      // Update session with comment
      session.setComment(finalComment);

      // Get personal research context for enhanced generation
      let context = '';
      if (this.contextRepo) {
        const researchContext = await this.contextRepo.getContext(input.userId);
        const interests = await this.contextRepo.getInterests(input.userId);
        
        context = `Research Context:
Areas: ${researchContext.researchAreas.join(', ')}
Interests: ${interests.slice(0, 5).map(i => i.term).join(', ')}
Preferred Topics: ${researchContext.preferredTopics.slice(0, 5).join(', ')}`;
      }

      // Generate blog post
      await this.messagePort.sendMessage('_Generating blog post with AI..._');

      const postResult = await this.geminiService.generateBlogPost({
        title: 'auto',
        newsItems: session.selectedItems.slice(0, 5),
        userComment: finalComment,
        context: this.buildContext(session, context),
      });

      if (!postResult.success) {
        throw postResult.error;
      }

      const postData = postResult.data;

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
        imagePath: undefined as string | undefined,
      };

      // Update session
      session.setPendingPost(blogPost, postData.imageQuery);
      await this.sessionRepo.save(input.chatId, session);

      // Send preview
      await this.sendPreview(input.chatId, blogPost);

      logInfo('Blog post generated', { 
        chatId: input.chatId, 
        title: postData.title,
        fromVoice: !!input.voiceBuffer,
      });

      return Result.ok(undefined);
    } catch (error) {
      logError('EnhancedGenerateBlogPostUseCase failed', error as Error);
      
      await this.messagePort.sendMessage(
        `❌ Failed to generate blog post: ${(error as Error).message}`
      );

      return Result.err(error as Error);
    }
  }

  private buildContext(session: Session, personalContext: string): string {
    return `${personalContext}

Topics: distributed control, robotics, FPGA, embedded systems
Lab focus: Technical research and development
Papers: ${session.selectedItems.length} papers selected
Session state: ${session.state}`;
  }

  private async sendPreview(
    chatId: number, 
    post: GeneratedBlogPost & { imagePath?: string }
  ): Promise<void> {
    let preview = `*Blog Post Preview*\n`;
    preview += `━━━━━━━━━━━━━━━━━━━\n\n`;
    preview += `*Title:* ${MarkdownFormatter.escape(post.title)}\n`;
    preview += `*Category:* ${post.category}\n`;
    preview += `*Tags:* ${post.tags.join(', ')}\n\n`;
    preview += `*Description:*\n${MarkdownFormatter.escape(post.description)}\n\n`;
    
    if (post.imagePath) {
      preview += `*Cover Image:* Generated ✓\n\n`;
    }
    
    preview += `Reply "yes" to publish, "no" to cancel, or /edit to make changes.`;

    await this.messagePort.sendMessage(preview);
  }
}
