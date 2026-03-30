/**
 * Authorization Service
 * For multi-user support
 */

import { UnauthorizedError } from '../../shared/errors/AppError';
import { logDebug, logWarn } from '../../logger';

export class AuthorizationService {
  private allowedChatIds: Set<string>;

  constructor(chatIds: string[]) {
    this.allowedChatIds = new Set(chatIds);
  }

  isAuthorized(chatId: string | number): boolean {
    const id = String(chatId);
    return this.allowedChatIds.has(id);
  }

  authorize(chatId: string | number): void {
    const id = String(chatId);
    this.allowedChatIds.add(id);
    logDebug('Chat authorized', { chatId: id });
  }

  revoke(chatId: string | number): void {
    const id = String(chatId);
    this.allowedChatIds.delete(id);
    logDebug('Chat authorization revoked', { chatId: id });
  }

  assertAuthorized(chatId: string | number): void {
    if (!this.isAuthorized(chatId)) {
      logWarn('Unauthorized access attempt', { chatId });
      throw new UnauthorizedError(
        'You are not authorized to use this bot',
        String(chatId)
      );
    }
  }

  getAuthorizedCount(): number {
    return this.allowedChatIds.size;
  }

  getAuthorizedIds(): string[] {
    return Array.from(this.allowedChatIds);
  }
}
