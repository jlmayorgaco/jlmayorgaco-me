/**
 * Command registry implementation
 * Implements the command pattern for extensible bot commands
 */

import { logError, logWarn } from '../infrastructure/logging/Logger';
import type { CommandHandler, CommandContext, CommandRegistry } from '../types/commands';

export class BotCommandRegistry implements CommandRegistry {
  private commands = new Map<string, CommandHandler>();

  register(handler: CommandHandler): void {
    // Register primary name
    this.commands.set(handler.name.toLowerCase(), handler);
    
    // Register aliases
    if (handler.aliases) {
      for (const alias of handler.aliases) {
        this.commands.set(alias.toLowerCase(), handler);
      }
    }

    console.log(`Registered command: ${handler.name}`);
  }

  get(name: string): CommandHandler | undefined {
    return this.commands.get(name.toLowerCase());
  }

  getAll(): CommandHandler[] {
    // Return unique handlers (not aliases)
    const seen = new Set<string>();
    const handlers: CommandHandler[] = [];
    
    for (const handler of this.commands.values()) {
      if (!seen.has(handler.name)) {
        seen.add(handler.name);
        handlers.push(handler);
      }
    }
    
    return handlers;
  }

  async execute(commandName: string, context: CommandContext): Promise<void> {
    const handler = this.get(commandName);
    
    if (!handler) {
      logWarn('Unknown command', { command: commandName, chatId: context.chatId });
      await context.bot.sendMessage(
        'â“ Unknown command. Type /help to see available commands.'
      );
      return;
    }

    try {
      logError(`Executing command: ${handler.name}`, undefined, { 
        chatId: context.chatId 
      });
      
      const args = commandName.split(' ').slice(1);
      await handler.execute(context, args);
    } catch (error) {
      logError(`Command ${handler.name} failed`, error as Error, {
        chatId: context.chatId,
      });
      
      await context.bot.sendMessage(
        'âŒ An error occurred while processing your command. Please try again.'
      );
    }
  }
}

// Singleton instance
let registryInstance: BotCommandRegistry | null = null;

export function getCommandRegistry(): BotCommandRegistry {
  if (!registryInstance) {
    registryInstance = new BotCommandRegistry();
  }
  return registryInstance;
}

