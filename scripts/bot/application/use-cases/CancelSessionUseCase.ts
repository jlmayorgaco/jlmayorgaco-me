/**
 * Cancel Session Use Case
 * Cancels current operation and resets session
 */

import type { ISessionRepository, IMessagePort } from '../ports';
import type { CancelSessionInput, CancelSessionOutput } from '../dto';
import { Result } from '../../shared/Result';
import { logDebug, logInfo } from '../../logger';
import { getSessionStateLabel } from '../../domain/enums/SessionState';
import { SessionState } from '../../domain/enums/SessionState';

export class CancelSessionUseCase {
  constructor(
    private sessionRepo: ISessionRepository,
    private messagePort: IMessagePort
  ) {}

  async execute(input: CancelSessionInput): Promise<Result<CancelSessionOutput, Error>> {
    try {
      logDebug('Executing CancelSessionUseCase', { chatId: input.chatId });

      const session = await this.sessionRepo.get(input.chatId);
      const previousState = getSessionStateLabel(session.state);

      // Cancel the session
      session.cancel();
      await this.sessionRepo.save(input.chatId, session);

      await this.messagePort.sendMessage(
        `✅ Cancelled. Previous state: ${previousState}\nUse /daily to start again.`
      );

      logInfo('Session cancelled', { 
        chatId: input.chatId, 
        previousState 
      });

      return Result.ok({
        success: true,
        previousState,
      });

    } catch (error) {
      logError('CancelSessionUseCase failed', error as Error);
      
      await this.messagePort.sendMessage(
        `❌ Failed to cancel: ${(error as Error).message}`
      );

      return Result.err(error as Error);
    }
  }
}
