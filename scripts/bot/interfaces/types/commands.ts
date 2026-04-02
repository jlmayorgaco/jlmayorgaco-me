/**
 * Type definitions for the bot command system
 */

import type { TelegramBot } from '../../telegram';
import type { BotConfig } from '../../config';
import type { SessionManager, UserSession } from '../../session-manager';

export interface CommandContext {
  bot: TelegramBot;
  config: BotConfig;
  sessionManager: SessionManager;
  chatId: number;
}

export interface CommandHandler {
  name: string;
  description: string;
  aliases?: string[];
  execute(context: CommandContext, args: string[]): Promise<void>;
}

export interface CommandRegistry {
  register(handler: CommandHandler): void;
  get(name: string): CommandHandler | undefined;
  getAll(): CommandHandler[];
  execute(command: string, context: CommandContext): Promise<void>;
}
