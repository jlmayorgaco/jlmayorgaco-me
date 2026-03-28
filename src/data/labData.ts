// Lab Redesign - Centralized Data
// All content for the lab interface

export interface ModuleData {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  status: 'active' | 'stable' | 'online' | 'idle' | 'offline';
  variant: 'fpga' | 'robotics' | 'power' | 'theory';
  panelId: string;
}

export interface ResearchItem {
  title: string;
  category: string;
  year: string;
}

export interface CommandData {
  output: string;
  action?: string;
}

export interface WireConnection {
  id: string;
  from: string;
  to: string;
  animated: boolean;
}

export interface NavItem {
  label: string;
  href: string;
}

// Core Identity
export const coreIdentity = {
  initials: 'JLMT',
  label: 'LAB',
  role: 'Research Engineer',
  focus: 'Robotics · Distributed Control · FPGA',
  nodeStatus: 'ACTIVE',
  uptime: '99.9%',
};

// Navigation
export const navItems: NavItem[] = [
  { label: 'Terminal', href: '#terminal' },
  { label: 'Projects', href: '/projects' },
  { label: 'Papers', href: '/papers' },
  { label: 'Research', href: '/research' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

// Modules
export const modules: ModuleData[] = [
  {
    id: 'MODULE-001',
    title: 'FPGA Control Unit',
    subtitle: 'Real-time estimation and embedded control',
    tags: ['Verilog', 'Control', 'Embedded'],
    status: 'stable',
    variant: 'fpga',
    panelId: 'projects',
  },
  {
    id: 'MODULE-002',
    title: 'Swarm Robotics',
    subtitle: 'Multi-agent coordination and formation logic',
    tags: ['MAS', 'Consensus', 'Robotics'],
    status: 'online',
    variant: 'robotics',
    panelId: '',
  },
  {
    id: 'MODULE-003',
    title: 'Low-Inertia Grid Estimation',
    subtitle: 'Frequency, RoCoF and latency-robust analysis',
    tags: ['Power Systems', 'DSP', 'Estimation'],
    status: 'active',
    variant: 'power',
    panelId: '',
  },
];

// Research Output
export const researchOutputs: ResearchItem[] = [
  { title: 'OpenFreqBench', category: 'Benchmarking', year: '2025' },
  { title: 'Distributed Control Through Graph Theory', category: 'Control Theory', year: '2025' },
  { title: 'FPGA-based Real-time Frequency Estimation', category: 'Hardware', year: '2024' },
];

// PhD Track
export const phdTrack = {
  focus: 'Robotics, MAS, Control',
  areas: [
    'Distributed LQR',
    'Spectral Control',
    'Graph Dynamics',
    'FPGA Estimation',
  ],
};

// Tech Stack
export const techStack = [
  { label: 'FPGA', type: 'hardware' },
  { label: 'Python', type: 'software' },
  { label: 'C/C++', type: 'software' },
  { label: 'Control', type: 'domain' },
  { label: 'Robotics', type: 'domain' },
  { label: 'Docker', type: 'infra' },
];

// Terminal Commands
export const terminalCommands: Record<string, CommandData> = {
  help: {
    output: `Available commands:
  whoami    - Display identity information
  projects  - View technical projects
  papers    - View publications
  research  - View research focus areas
  contact   - Get in touch
  clear     - Clear terminal output`,
  },
  whoami: {
    output: `Jorge Luis Mayorga
Research Engineer
Focus: Robotics, Distributed Control, FPGA`,
  },
  projects: {
    output: `[1] FPGA Control Unit - Real-time estimation and embedded control
[2] Swarm Robotics - Multi-agent coordination and formation logic
[3] Low-Inertia Grid Estimation - Frequency, RoCoF analysis`,
    action: 'scroll-projects',
  },
  papers: {
    output: `[1] OpenFreqBench - Benchmarking Framework (2025)
[2] Distributed Control Through Graph Theory (2025)
[3] FPGA-based Real-time Frequency Estimation (2024)`,
    action: 'scroll-papers',
  },
  research: {
    output: `Research Focus: Robotics, MAS, Control
  ▸ Distributed LQR
  ▸ Spectral Control
  ▸ Graph Dynamics
  ▸ FPGA Estimation`,
    action: 'scroll-research',
  },
  contact: {
    output: `Email: hello@jlmayorga.co
Available for collaborations
GitHub: github.com/jlmayorga
LinkedIn: linkedin.com/in/jlmayorga`,
    action: 'scroll-contact',
  },
};

// Quick Commands (shown as chips)
export const quickCommands = ['whoami', 'projects', 'papers', 'research'];

// Social Links
export const socialLinks = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/jlmayorga', icon: 'in' },
  { label: 'GitHub', href: 'https://github.com/jlmayorga', icon: 'gh' },
  { label: 'X', href: 'https://twitter.com/jlmayorga', icon: 'x' },
  { label: 'Email', href: 'mailto:hello@jlmayorga.co', icon: 'ml' },
];

// Wire Connections
export const wireConnections: WireConnection[] = [
  { id: 'core-terminal', from: 'core-identity', to: 'terminal-panel', animated: true },
  { id: 'core-fpga', from: 'core-identity', to: 'module-fpga', animated: false },
  { id: 'core-robotics', from: 'core-identity', to: 'module-robotics', animated: true },
  { id: 'core-power', from: 'core-identity', to: 'module-power', animated: false },
  { id: 'terminal-research', from: 'terminal-panel', to: 'research-output', animated: true },
  { id: 'techrack-fpga', from: 'tech-rack', to: 'module-fpga', animated: false },
  { id: 'research-phd', from: 'research-output', to: 'phd-track', animated: false },
  { id: 'core-connect', from: 'core-identity', to: 'connect-panel', animated: false },
];

// Wire Relations Map (for hover highlighting)
export const wireRelations: Record<string, string[]> = {
  'core-identity': ['core-terminal', 'core-fpga', 'core-robotics', 'core-power', 'core-connect'],
  'terminal-panel': ['core-terminal', 'terminal-research'],
  'module-fpga': ['core-fpga', 'techrack-fpga'],
  'module-robotics': ['core-robotics'],
  'module-power': ['core-power'],
  'research-output': ['terminal-research', 'research-phd'],
  'phd-track': ['research-phd'],
  'tech-rack': ['techrack-fpga'],
  'connect-panel': ['core-connect'],
};

// Terminal initial boot sequence
export const terminalBootSequence = [
  { type: 'output' as const, content: '// SYSTEM BOOT' },
  { type: 'output' as const, content: '$ whoami' },
  { type: 'output' as const, content: 'Jorge Luis Mayorga' },
  { type: 'output' as const, content: 'Research Engineer - Robotics & Control Systems' },
  { type: 'output' as const, content: '' },
  { type: 'output' as const, content: '$ cat status.txt' },
  { type: 'output' as const, content: '→ Available for collaborations' },
  { type: 'output' as const, content: '' },
  { type: 'output' as const, content: 'Type "help" for available commands...' },
];
