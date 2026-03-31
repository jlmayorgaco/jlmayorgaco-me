import type { TerminalData, CommandResult } from './terminalTypes';
import { 
  COMMANDS, 
  getCommand, 
  findSimilarCommand,
  registerCommand,
  TERMINAL_DIVIDER,
  type CommandDefinition
} from './commandRegistry';

import { registerCoreCommands } from './commands/core';
import { registerContentCommands } from './commands/content';
import { registerNavigationCommands, setNavigationData } from './commands/navigation';
import { registerVisualCommands } from './commands/system';
import { registerAsciiCommands } from './commands/ascii';
import { registerResearchCommands } from './commands/research';
import { registerEasterCommands } from './commands/easterEggs';
import { registerRobotCommands } from './commands/robot';
import { registerDataLabCommands } from './commands/datalab';
import { registerEditorCommands } from './commands/editor';
import { registerLinuxEasterCommands } from './commands/linux-easters';
import { registerCoffeeCommands, handleCoffeeCommand, isCoffeeGameActive, exitCoffeeGame } from './commands/coffeeGame';

let initialized = false;

function initializeCommands() {
  if (initialized) return;
  
  registerCoreCommands();
  registerContentCommands();
  registerNavigationCommands();
  registerVisualCommands();
  registerAsciiCommands();
  registerResearchCommands();
  registerEasterCommands();
  registerRobotCommands();
  registerDataLabCommands();
  registerEditorCommands();
  registerLinuxEasterCommands();
  registerCoffeeCommands();
  
  initialized = true;
}

function findBestCommandMatch(input: string): { cmd: CommandDefinition; args: string[] } | null {
  const lower = input.toLowerCase();
  const parts = lower.split(/\s+/);
  
  for (let len = parts.length; len >= 1; len--) {
    const candidate = parts.slice(0, len).join(' ');
    const command = getCommand(candidate);
    if (command) {
      return {
        cmd: command,
        args: parts.slice(len),
      };
    }
  }
  
  return null;
}

export function executeCommand(input: string, _args: string[], data: TerminalData): CommandResult {
  initializeCommands();
  
  setNavigationData(data);
  
  if (isCoffeeGameActive() && input.trim() !== 'exit' && input.trim() !== '0') {
    const output = handleCoffeeCommand(input);
    return { output, action: 'none' };
  }
  
  if (isCoffeeGameActive() && (input.trim() === 'exit' || input.trim() === '0')) {
    exitCoffeeGame();
    return { output: `\n  👋 Coffee game exited.\n  Type 'coffee' to start a new order.\n`, action: 'none' };
  }
  
  const bestMatch = findBestCommandMatch(input);
  
  if (bestMatch) {
    return bestMatch.cmd.execute(bestMatch.args, data);
  }
  
  const suggestions = findSimilarCommand(input);
  let output = `Command not found: ${input}\nType 'help' for available commands.`;
  
  if (suggestions.length > 0) {
    output += `\n\nDid you mean: ${suggestions.join(', ')}?`;
  }
  
  return { output, action: 'none' };
}

export function getHelpText(): string {
  initializeCommands();
  
  const categories = [
    { name: 'Identity & CV', cmds: ['whoami', 'about', 'cv skills', 'cv projects', 'cv contact', 'cv timeline', 'cv'] },
    { name: 'Content', cmds: ['projects', 'papers', 'research', 'contact', 'stack'] },
    { name: 'Navigation', cmds: ['cd', 'open', 'search', 'tags', 'tag', 'history'] },
    { name: 'System', cmds: ['ls', 'pwd', 'status', 'map', 'run system', 'clear', 'help'] },
    { name: 'Visual', cmds: ['theme', 'accent', 'layout', 'shuffle', 'reset', 'focus', 'chaos', 'stabilize', 'flip'] },
    { name: 'ASCII', cmds: ['drone', 'fpga', 'ml', 'drone fly', 'fpga boot'] },
    { name: 'Research', cmds: ['rocof', 'consensus', 'swarm', 'low-inertia', 'openfreqbench'] },
    { name: 'Editor', cmds: ['nano', 'vim', 'emacs', 'edit', 'editors'] },
    { name: 'Linux Tools', cmds: ['sudo', 'apt', 'ssh', 'ping', 'ps', 'git', 'docker', 'man', 'history'] },
    { name: 'Easter Eggs', cmds: ['neofetch', 'cowsay', 'sl', 'cmatrix', 'fortune', 'tree', 'hackerman', 'coffee'] },
  ];
  
  let help = `Available commands:\n${'═'.repeat(40)}\n`;
  
  for (const cat of categories) {
    const cmds = cat.cmds.map(c => {
      const def = getCommand(c);
      return def ? `  ${c.padEnd(16)} - ${def.description}` : `  ${c}`;
    }).join('\n');
    help += `\n${cat.name}\n${cmds}\n`;
  }
  
  return help;
}

export { COMMANDS, getCommand, TERMINAL_DIVIDER };
