import type { TerminalData, CommandResult, HistoryEntry, UIAction } from './terminalTypes';

export type CommandCategory = 
  | 'identity' 
  | 'content' 
  | 'navigation' 
  | 'system' 
  | 'visual' 
  | 'ascii' 
  | 'research'
  | 'easter';

export interface CommandDefinition {
  aliases: string[];
  description: string;
  category: CommandCategory;
  execute: (args: string[], data: TerminalData) => CommandResult;
}

export { UIAction };

export const COMMANDS = new Map<string, CommandDefinition>();

export function registerCommand(cmd: CommandDefinition): void {
  cmd.aliases.forEach(alias => COMMANDS.set(alias, cmd));
}

export function getCommand(name: string): CommandDefinition | undefined {
  return COMMANDS.get(name.toLowerCase());
}

export function getCommandsByCategory(category: CommandCategory): CommandDefinition[] {
  return Array.from(COMMANDS.values()).filter(cmd => cmd.category === category);
}

export function findSimilarCommand(name: string): string[] {
  const lower = name.toLowerCase();
  const suggestions: string[] = [];
  
  for (const alias of COMMANDS.keys()) {
    if (alias.startsWith(lower) || lower.startsWith(alias.slice(0, 3))) {
      suggestions.push(alias);
    }
  }
  
  return suggestions.slice(0, 3);
}

export const TERMINAL_DIVIDER = '═'.repeat(40);
export const PROMPT_SYMBOL = '$';
