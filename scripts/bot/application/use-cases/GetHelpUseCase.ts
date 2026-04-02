/**
 * Get Help Use Case
 * Returns list of available commands
 */

import type { IMessagePort } from '../ports';
import type { GetHelpInput, GetHelpOutput, CommandDTO } from '../dto';
import { Result } from '../../shared/Result';
import { logDebug } from '../../logger';

export class GetHelpUseCase {
  constructor(private messagePort: IMessagePort) {}

  async execute(input: GetHelpInput = {}): Promise<Result<GetHelpOutput, Error>> {
    try {
      logDebug('Executing GetHelpUseCase');

      const commands = this.getCommandList(input.includeAdvanced);
      const helpMsg = this.formatHelpMessage(commands);

      await this.messagePort.sendMessage(helpMsg);

      return Result.ok({ commands });

    } catch (error) {
      await this.messagePort.sendMessage(
        `❌ Failed to get help: ${(error as Error).message}`
      );

      return Result.err(error as Error);
    }
  }

  private getCommandList(includeAdvanced?: boolean): CommandDTO[] {
    const commands: CommandDTO[] = [
      {
        name: 'start',
        description: 'Start the bot and show welcome message',
      },
      {
        name: 'daily',
        description: 'Scan ArXiv for new papers',
        usage: '/daily',
        aliases: ['d'],
      },
      {
        name: 'papers',
        description: 'Scan and classify papers',
        usage: '/papers',
        aliases: ['p'],
      },
      {
        name: 'news',
        description: 'Scan RSS news sources',
        usage: '/news',
        aliases: ['n'],
      },
      {
        name: 'status',
        description: 'Show bot status and metrics',
        usage: '/status',
        aliases: ['s'],
      },
      {
        name: 'cancel',
        description: 'Cancel current operation',
        usage: '/cancel',
      },
      {
        name: 'help',
        description: 'Show this help message',
        usage: '/help',
        aliases: ['h'],
      },
    ];

    if (includeAdvanced) {
      commands.push(
        {
          name: 'batch',
          description: 'Start batch review of papers',
          usage: '/batch',
        },
        {
          name: 'context',
          description: 'View research context',
          usage: '/context',
        },
        {
          name: 'history',
          description: 'View paper history',
          usage: '/history',
        }
      );
    }

    return commands;
  }

  private formatHelpMessage(commands: CommandDTO[]): string {
    let msg = `*🤖 JLMT Lab Bot Commands*\n\n`;

    for (const cmd of commands) {
      msg += `/${cmd.name}`;
      if (cmd.aliases) {
        msg += ` (${cmd.aliases.join(', ')})`;
      }
      msg += `\n  _${cmd.description}_\n\n`;
    }

    msg += `*Tips:*\n`;
    msg += `• Send text or voice for commentary\n`;
    msg += `• Reply "yes" to publish, "no" to cancel\n`;
    msg += `• Use /edit to modify pending post\n`;

    return msg;
  }
}
