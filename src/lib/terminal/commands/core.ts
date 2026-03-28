import type { TerminalData, CommandResult } from '../terminalTypes';
import { CommandDefinition, registerCommand, TERMINAL_DIVIDER } from '../commandRegistry';

const whoamiCommand: CommandDefinition = {
  aliases: ['whoami', 'cat profile', 'profile'],
  description: 'Display identity information',
  category: 'identity',
  execute: (_, data) => ({
    output: `${data.profile.name}\n${data.profile.role}\nFocus: ${data.profile.focus}\n\n${data.profile.status}`,
    action: 'none',
  }),
};

const aboutCommand: CommandDefinition = {
  aliases: ['about'],
  description: 'Extended profile information',
  category: 'identity',
  execute: (_, data) => ({
    output: `${data.profile.name} - ${data.profile.role}

Research focus on robotics, distributed control systems, and FPGA-based
real-time estimation. Building tools for multi-agent coordination,
frequency estimation in low-inertia grids, and hardware-native control algorithms.

Currently exploring:
  ▸ Distributed consensus in robotic swarms
  ▸ Real-time frequency estimation on FPGA
  ▸ Benchmarking frameworks for control systems

${data.profile.status}`,
    action: 'none',
  }),
};

const clearCommand: CommandDefinition = {
  aliases: ['clear', 'cls'],
  description: 'Clear terminal output',
  category: 'system',
  execute: () => ({ output: '__CLEAR__', action: 'none' }),
};

export function registerCoreCommands() {
  registerCommand(whoamiCommand);
  registerCommand(aboutCommand);
  registerCommand(clearCommand);
}
