export interface TerminalProject {
  id: string;
  title: string;
  summary: string;
  year: number;
  status: string;
  tags: string[];
  stack: string[];
}

export interface TerminalPaper {
  id: string;
  title: string;
  venue: string;
  year: number;
  authors: string[];
  status: string;
}

export interface TerminalResearch {
  id: string;
  title: string;
  excerpt: string;
  date: Date;
  tags: string[];
  category: string;
}

export interface TerminalContact {
  email: string;
  github: string;
  linkedin: string;
  twitter: string;
}

export interface TerminalProfile {
  name: string;
  role: string;
  focus: string;
  status: string;
}

export interface TerminalData {
  projects: TerminalProject[];
  papers: TerminalPaper[];
  research: TerminalResearch[];
  profile: TerminalProfile;
  contact: TerminalContact;
  techStack: string[];
}

export type HistoryEntryType = 'input' | 'output' | 'error' | 'success';

export interface HistoryEntry {
  type: HistoryEntryType;
  content: string;
}

export type ScrollAction = 'scroll-projects' | 'scroll-papers' | 'scroll-research' | 'scroll-contact';
export type TerminalAction = ScrollAction | 'navigate' | 'none';

export interface CommandResult {
  output: string;
  action?: TerminalAction;
  navigateTo?: string;
}

export const TERMINAL_DIVIDER = '═'.repeat(40);
export const QUICK_COMMANDS = ['whoami', 'projects', 'papers', 'research', 'help'] as const;
export type QuickCommand = typeof QUICK_COMMANDS[number];
