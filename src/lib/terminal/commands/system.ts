import type { CommandDefinition } from '../commandRegistry';
import type { UIAction, TerminalData } from '../terminalTypes';
import { registerCommand } from '../commandRegistry';
import { VALID_THEMES, VALID_ACCENTS, VALID_LAYOUTS } from '../../config';
import { createDivider, createHeader, formatTimestamp, formatPermissions } from '../terminalUtils';

function dispatchUIAction(action: UIAction): void {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent('terminal:ui-action', { detail: action });
  window.dispatchEvent(event);
}

const themeCommand: CommandDefinition = {
  aliases: ['theme'],
  description: 'Change theme (lab, dark, blueprint, copper, matrix)',
  category: 'visual',
  execute: (args) => {
    const theme = args[0]?.toLowerCase();
    if (!theme || !VALID_THEMES.includes(theme)) {
      return { output: `Theme: ${VALID_THEMES.join(', ')}`, action: 'none' };
    }
    dispatchUIAction({ type: 'theme', name: theme });
    return { output: `${createHeader('Applying Theme')}\nTheme: ${theme}\n${createDivider()}\nTheme changed successfully.`, uiAction: { type: 'theme', name: theme } };
  },
};

const accentCommand: CommandDefinition = {
  aliases: ['accent', 'color'],
  description: 'Change accent color',
  category: 'visual',
  execute: (args) => {
    const accent = args[0]?.toLowerCase();
    if (!accent || !VALID_ACCENTS.includes(accent)) {
      return { output: `Accent: ${VALID_ACCENTS.join(', ')}`, action: 'none' };
    }
    dispatchUIAction({ type: 'accent', name: accent });
    return { output: `${createHeader('Applying Accent')}\nAccent: ${accent}\n${createDivider()}\nAccent changed successfully.`, uiAction: { type: 'accent', name: accent } };
  },
};

const layoutCommand: CommandDefinition = {
  aliases: ['layout'],
  description: 'Change layout (default, mosaic, grid, split, terminal)',
  category: 'visual',
  execute: (args) => {
    const layout = args[0]?.toLowerCase();
    if (!layout || !VALID_LAYOUTS.includes(layout)) {
      return { output: `Layout: ${VALID_LAYOUTS.join(', ')}`, action: 'none' };
    }
    dispatchUIAction({ type: 'layout', name: layout });
    return { output: `Applying layout: ${layout}\n${TERMINAL_DIVIDER}\nLayout changed.`, uiAction: { type: 'layout', name: layout } };
  },
};

const shuffleCommand: CommandDefinition = {
  aliases: ['shuffle', 'shuffle panels'],
  description: 'Shuffle panel positions',
  category: 'visual',
  execute: () => ({
    output: `Shuffling panels...\n${TERMINAL_DIVIDER}\nPanel order randomized.`,
    uiAction: { type: 'shuffle' },
  }),
};

const resetLayoutCommand: CommandDefinition = {
  aliases: ['reset', 'reset layout'],
  description: 'Reset layout to default',
  category: 'visual',
  execute: () => ({
    output: `Resetting layout...\n${TERMINAL_DIVIDER}\nLayout restored to default.`,
    uiAction: { type: 'reset' },
  }),
};

const focusCommand: CommandDefinition = {
  aliases: ['focus'],
  description: 'Focus a section',
  category: 'visual',
  execute: (args) => {
    const target = args[0]?.toLowerCase();
    const validFocus = ['terminal', 'projects', 'research', 'papers', 'contact'];
    if (!target || !validFocus.includes(target)) {
      return { output: `Focus: ${validFocus.join(', ')}`, action: 'none' };
    }
    dispatchUIAction({ type: 'focus', id: target });
    return { output: `Focusing: ${target}`, uiAction: { type: 'focus', id: target } };
  },
};

const chaosCommand: CommandDefinition = {
  aliases: ['chaos', 'panic'],
  description: 'Trigger chaos mode',
  category: 'visual',
  execute: () => ({
    output: `INITIATING CHAOS MODE...\n${TERMINAL_DIVIDER}\n[WARNING] Control parameters destabilizing...\n[CRITICAL] Feedback loop detected...\n[ERROR] Signal integrity compromised...\n\nJust kidding. System is stable.\nEverything is fine.`,
    uiAction: { type: 'chaos' },
  }),
};

const stabilizeCommand: CommandDefinition = {
  aliases: ['stabilize', 'stable'],
  description: 'Stabilize system',
  category: 'visual',
  execute: () => ({
    output: `STABILIZING SYSTEM...\n${TERMINAL_DIVIDER}\n[OK] Control loops rebalanced\n[OK] Feedback normalized\n[OK] Signal paths verified\n\nSystem: STABLE`,
    uiAction: { type: 'stabilize' },
  }),
};

const mapCommand: CommandDefinition = {
  aliases: ['map', 'site'],
  description: 'Show site structure',
  category: 'system',
  execute: () => ({
    output: `Site Map\n${TERMINAL_DIVIDER}\n/               - Homepage\n/projects       - Technical projects\n/papers         - Publications\n/research       - Research notes\n/tutorials      - Technical tutorials\n/about          - About me\n/contact        - Contact information\n/lab            - Lab interface`,
    action: 'none',
  }),
};

const runSystemCommand: CommandDefinition = {
  aliases: ['run system', 'run'],
  description: 'Run system diagnostics',
  category: 'system',
  execute: () => ({
    output: `Running system diagnostics...\n${TERMINAL_DIVIDER}\n[OK] All modules operational\n[OK] Signal paths stable\n[OK] Control systems online\n[OK] Drone swarm ready\n\nSystem: NOMINAL`,
    action: 'none',
  }),
};

const lsCommand: CommandDefinition = {
  aliases: ['ls', 'dir'],
  description: 'List available modules',
  category: 'system',
  execute: () => ({
    output: [
      `${formatPermissions(true)}  projects/`,
      `${formatPermissions(true)}  papers/`,
      `${formatPermissions(true)}  research/`,
      `${formatPermissions(true)}  tutorials/`,
      `${formatPermissions(true)}  portfolio/`,
      `${formatPermissions(false)}  profile.txt`,
      `${formatPermissions(false)}  status.txt`,
      `${formatPermissions(false)}  stack.toml`,
      `${formatPermissions(false)}  research.log`,
    ].join('\n'),
    action: 'none',
  }),
};

const pwdCommand: CommandDefinition = {
  aliases: ['pwd', 'path'],
  description: 'Print working directory',
  category: 'system',
  execute: () => ({ output: '/lab/home/jlmt', action: 'none' }),
};

const statusCommand: CommandDefinition = {
  aliases: ['status'],
  description: 'System status',
  category: 'system',
  execute: (_, data) => ({
    output: `${createHeader('System Status')}\n${formatTimestamp()}\n\nNode:      ACTIVE\nUptime:    99.9%\nProjects:  ${data.projects.length} (${data.projects.filter(p => p.status === 'published').length} published)\nPapers:    ${data.papers.length}\nResearch:  ${data.research.length}\nStack:     ${data.techStack.length} technologies`,
    action: 'none',
  }),
};

const dateCommand: CommandDefinition = {
  aliases: ['date', 'time'],
  description: 'Show current date/time',
  category: 'system',
  execute: () => {
    const now = new Date();
    return {
      output: `${createHeader('System Date')}\nUTC:   ${now.toUTCString()}\nLocal: ${now.toLocaleString()}`,
      action: 'none',
    };
  },
};

const uptimeCommand: CommandDefinition = {
  aliases: ['uptime'],
  description: 'Show system uptime',
  category: 'system',
  execute: () => ({
    output: `System uptime: 847 days, 12 hours, 34 minutes\nLoad average: 0.42, 0.38, 0.31`,
    action: 'none',
  }),
};

const echoCommand: CommandDefinition = {
  aliases: ['echo', 'print'],
  description: 'Print text',
  category: 'system',
  execute: (args) => ({
    output: args.join(' ') || '',
    action: 'none',
  }),
};

const catProfileCommand: CommandDefinition = {
  aliases: ['cat profile', 'cat profile.txt'],
  description: 'Show profile',
  category: 'system',
  execute: (_, data) => ({
    output: `# Profile\n\nName: ${data.profile.name}\nRole: ${data.profile.role}\nFocus: ${data.profile.focus}\nStatus: ${data.profile.status}\n\nEmail: ${data.contact.email}`,
    action: 'none',
  }),
};

const catStackCommand: CommandDefinition = {
  aliases: ['cat stack', 'cat stack.toml'],
  description: 'Show tech stack',
  category: 'system',
  execute: (_, data) => ({
    output: `${createHeader('Tech Stack (stack.toml)')}\n${data.techStack.map(s => `  - ${s}`).join('\n')}`,
    action: 'none',
  }),
};

const catResearchLogCommand: CommandDefinition = {
  aliases: ['cat research.log', 'research.log'],
  description: 'Show recent research',
  category: 'system',
  execute: (_, data) => {
    const recent = data.research.slice(0, 5);
    return {
      output: `# Research Log\n${TERMINAL_DIVIDER}\n${recent.map((r, i) => `[${i + 1}] ${r.title}\n    ${r.category} - ${r.date.toLocaleDateString()}`).join('\n\n')}`,
      action: 'none',
    };
  },
};

const robotHmiCommand: CommandDefinition = {
  aliases: ['open hmi', 'hmi', 'robot panel'],
  description: 'Open robot HMI panel',
  category: 'visual',
  execute: () => ({
    output: `INITIALIZING ROBOT HMI...\n${TERMINAL_DIVIDER}\n[OK] Connecting to robot controller\n[OK] Loading joint parameters\n[OK] Enabling manual mode\n\nROBOT HMI: ACTIVE`,
    uiAction: { type: 'open-hmi' },
  }),
};

const robotCloseCommand: CommandDefinition = {
  aliases: ['close hmi', 'exit hmi'],
  description: 'Close robot HMI panel',
  category: 'visual',
  execute: () => ({
    output: `Closing robot HMI...\n${TERMINAL_DIVIDER}\n[OK] Saving joint positions\n[OK] Returning to auto mode\n[OK] HMI closed`,
    uiAction: { type: 'close-hmi' },
  }),
};

const flipPanelCommand: CommandDefinition = {
  aliases: ['flip', 'flip panel', 'rotate'],
  description: 'Flip the info panel',
  category: 'visual',
  execute: () => ({
    output: `Flipping panel...\n${TERMINAL_DIVIDER}\n[INFO] Panel rotation initiated\n[INFO] 3D transform active\n\nPanel: FLIPPED`,
    uiAction: { type: 'flip-panel' },
  }),
};

export function registerVisualCommands() {
  registerCommand(themeCommand);
  registerCommand(accentCommand);
  registerCommand(layoutCommand);
  registerCommand(shuffleCommand);
  registerCommand(resetLayoutCommand);
  registerCommand(focusCommand);
  registerCommand(chaosCommand);
  registerCommand(stabilizeCommand);
  registerCommand(mapCommand);
  registerCommand(runSystemCommand);
  registerCommand(lsCommand);
  registerCommand(pwdCommand);
  registerCommand(statusCommand);
  registerCommand(dateCommand);
  registerCommand(uptimeCommand);
  registerCommand(echoCommand);
  registerCommand(catProfileCommand);
  registerCommand(catStackCommand);
  registerCommand(catResearchLogCommand);
  registerCommand(robotHmiCommand);
  registerCommand(robotCloseCommand);
  registerCommand(flipPanelCommand);
}
