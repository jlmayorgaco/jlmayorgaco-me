/**
 * Get Status Use Case
 * Returns current bot status and metrics
 */

import type { 
  ISessionRepository, 
  IGeminiService,
  IMessagePort 
} from '../ports';
import type { 
  GetStatusInput, 
  GetStatusOutput 
} from '../dto';
import { Result } from '../../shared/Result';
import { logDebug, logInfo } from '../../infrastructure/logging/Logger';
import { getSessionStateLabel } from '../../domain/enums/SessionState';

export class GetStatusUseCase {
  constructor(
    private sessionRepo: ISessionRepository,
    private geminiService: IGeminiService,
    private messagePort: IMessagePort
  ) {}

  async execute(input: GetStatusInput): Promise<Result<GetStatusOutput, Error>> {
    try {
      logDebug('Executing GetStatusUseCase', { chatId: input.chatId });

      const session = await this.sessionRepo.get(input.chatId);
      const metrics = await this.sessionRepo.getMetrics();
      const circuitStatus = this.geminiService.getCircuitStatus();

      const output: GetStatusOutput = {
        state: getSessionStateLabel(session.state),
        papersCount: session.papers.length,
        newsCount: session.news.length,
        hasPendingPost: session.canPublish(),
        sessionAge: session.age,
        lastActivity: session.lastActivity,
      };

      // Format status message
      const statusMsg = this.formatStatusMessage(output, metrics, circuitStatus);

      await this.messagePort.sendMessage(statusMsg);

      logInfo('Status retrieved', { chatId: input.chatId });

      return Result.ok(output);

    } catch (error) {
      logError('GetStatusUseCase failed', error as Error);
      
      await this.messagePort.sendMessage(
        `âŒ Failed to get status: ${(error as Error).message}`
      );

      return Result.err(error as Error);
    }
  }

  private formatStatusMessage(
    status: GetStatusOutput,
    metrics: any,
    circuitStatus: any
  ): string {
    let msg = `*ðŸ“Š Bot Status*\n\n`;
    msg += `*Session:* ${status.state}\n`;
    msg += `*Papers:* ${status.papersCount}\n`;
    msg += `*News:* ${status.newsCount}\n`;
    msg += `*Pending Post:* ${status.hasPendingPost ? 'Yes' : 'No'}\n`;
    msg += `*Session Age:* ${Math.round(status.sessionAge / 1000 / 60)} min\n\n`;
    
    msg += `*System:*\n`;
    msg += `â€¢ Total Sessions: ${metrics.totalSessions}\n`;
    msg += `â€¢ Active: ${metrics.activeSessions}\n`;
    msg += `â€¢ Expired: ${metrics.expiredSessions}\n`;
    msg += `â€¢ Gemini API: ${circuitStatus.state}\n`;

    return msg;
  }
}

