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
    output: `Site Map\n${TERMINAL_DIVIDER}
          ___
         /   \\
        | JLMT |
        | LAB  |
         \\___/
    _________|_________
   |         |         |
projects   papers   research
   |         |         |
🔧 FPGA    📄 IEEE    📚 Control
🔧 ROS     📄 arXiv    📚 Swarm
🔧 Embedded📄 Springer 📚 FPGA
    _________|_________
   |         |         |
tutorials portfolio datalab
   |         |         |
⚡ DIY     🎨 Work     📊 Dash
⚡ Kalman  🎨 Photos   📈 Live
                       📡 Drone

Tip: cd <section> to navigate`,
    action: 'none',
  }),
};

const runSystemCommand: CommandDefinition = {
  aliases: ['run system', 'run'],
  description: 'Run system diagnostics',
  category: 'system',
  execute: (_, data) => ({
    output: `Running system diagnostics...\n${TERMINAL_DIVIDER}
[OK] FPGA Synthesis: READY (42% utilized)
[OK] Robot Arm: STANDBY (home position)
[OK] Drone Swarm: IDLE (6 agents online)
[OK] Signal Processing: ACTIVE
[OK] Research Stack: UPDATED
[OK] Coffee Machine: OFFLINE (sad)
[OK] Neural Interface: CONNECTED

System Modules:
  🔧 Projects:  ${data.projects.length} (${data.projects.filter(p => p.status === 'published').length} published)
  📄 Papers:    ${data.papers.length} (${data.papers.filter(p => p.status === 'published').length} published)
  📚 Research:  ${data.research.length} notes
  ⚡ Tutorials: ${data.projects.filter(p => p.tags?.includes('tutorial')).length} available

System: NOMINAL (like your thesis will be)`,
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
  execute: () => ({ 
    output: `/lab/home/jlmt
    │
    ├── projects/   (🔧 engineering work)
    ├── papers/     (📄 publications)
    ├── research/   (📚 lab notes)
    ├── tutorials/  (⚡ fix logs)
    ├── portfolio/  (🎨 creative)
    ├── datalab/    (📊 live data)
    └── secrets/    (🔒 jk, nothing here)

You are here: /lab/home/jlmt
Coffee level: LOW (prioritize)`,
    action: 'none' 
  }),
};

const statusCommand: CommandDefinition = {
  aliases: ['status'],
  description: 'System status',
  category: 'system',
  execute: (_, data) => {
    const hour = new Date().getHours();
    const mood = hour < 6 ? '🌙 Night owl mode' : 
                hour < 9 ? '☕ Coffee loading...' :
                hour < 12 ? '⚡ Productivity: OPTIMAL' :
                hour < 14 ? '🍕 Lunch detection' :
                hour < 17 ? '📈 Afternoon surge' :
                hour < 20 ? '🌆 Winding down' : '🌙 Research mode';
    
    return {
      output: `${createHeader('System Status')}
${formatTimestamp()}

${mood}

Node:      ACTIVE ✓
Uptime:    99.9% (you're doing great)
Projects:  ${data.projects.length} (${data.projects.filter(p => p.status === 'published').length} published)
Papers:    ${data.papers.length}
Research:  ${data.research.length} notes
Stack:     ${data.techStack.length} technologies

Current obsession: Check back later`,
      action: 'none',
    };
  },
};

const dateCommand: CommandDefinition = {
  aliases: ['date', 'time'],
  description: 'Show current date/time',
  category: 'system',
  execute: () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const isDeadline = now.getDay() === 5 && now.getHours() >= 17;
    
    return {
      output: `${createHeader('System Date')}
UTC:   ${now.toUTCString()}
Local: ${now.toLocaleString('en-US', options)}

${isDeadline ? '⚠️ FRIDAY 5PM DETECTED - Weekend incoming!' : 'Just another day in the lab...'}
${now.getHours() < 6 ? '🌙 Why are you awake? Go to sleep.' : ''}`,
      action: 'none',
    };
  },
};

const uptimeCommand: CommandDefinition = {
  aliases: ['uptime'],
  description: 'Show system uptime',
  category: 'system',
  execute: () => {
    const days = Math.floor(Math.random() * 500 + 300);
    const hours = Math.floor(Math.random() * 24);
    const mins = Math.floor(Math.random() * 60);
    return {
      output: `System uptime: ${days} days, ${hours} hours, ${mins} minutes
Load average: 0.42, 0.38, 0.31
Processes: 42 running (3 are actually useful)
Users: 1 (you, apparently)

Fun fact: This uptime is more stable than your thesis deadline.

System: NOMINAL (unlike your sleep schedule)`,
      action: 'none',
    };
  },
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
