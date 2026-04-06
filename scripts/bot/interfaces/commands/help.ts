/**
 * Help command - displays available commands
 */

import type { CommandHandler, CommandContext } from '../types/commands';
import { getCommandRegistry } from '../CommandRegistry';

export const helpCommand: CommandHandler = {
  name: 'help',
  description: 'Show available commands',
  aliases: ['h', '?'],
  
  async execute(context: CommandContext): Promise<void> {
    const registry = getCommandRegistry();
    const commands = registry.getAll();
    
    let helpText = `*JLMT Lab Bot Commands*\nâ”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”\n\n`;
    
    for (const cmd of commands) {
      const aliases = cmd.aliases ? ` (${cmd.aliases.join(', ')})` : '';
      helpText += `/${cmd.name}${aliases} \\- ${cmd.description}\n`;
    }
    
    helpText += `\n*Workflow:*\n1\\. Run /daily to scan papers and news\n2\\. Reply with your commentary\n3\\. Review generated post\n4\\. Reply "yes" to publish or use /edit\n\n/cancel \\- Reset current session`;
    
    await context.bot.sendMessage(helpText);
  },
};

