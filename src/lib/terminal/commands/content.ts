import type { TerminalData, UIAction } from '../terminalTypes';
import type { CommandDefinition } from '../commandRegistry';
import { registerCommand, TERMINAL_DIVIDER } from '../commandRegistry';

function formatProjects(projects: TerminalData['projects']): string {
  if (!projects.length) return 'No projects found.';
  return projects.map((p, i) => 
    `[${i + 1}] ${p.title} (${p.year})\n    ${p.summary.substring(0, 80)}...`
  ).join('\n\n');
}

function formatPapers(papers: TerminalData['papers']): string {
  if (!papers.length) return 'No papers found.';
  return papers.map((p, i) => 
    `[${i + 1}] ${p.title}\n    ${p.venue} · ${p.year}`
  ).join('\n\n');
}

function formatResearch(research: TerminalData['research']): string {
  if (!research.length) return 'No research items found.';
  return research.map((r, i) => 
    `[${i + 1}] ${r.title}\n    ${r.category} · ${r.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
  ).join('\n\n');
}

const projectsCommand: CommandDefinition = {
  aliases: ['projects', 'proj'],
  description: 'List all projects',
  category: 'content',
  execute: (_, data) => ({
    output: `Projects (${data.projects.length})\n${TERMINAL_DIVIDER}\n\n${formatProjects(data.projects)}`,
    uiAction: { type: 'scroll', id: 'projects' },
  }),
};

const papersCommand: CommandDefinition = {
  aliases: ['papers', 'pub', 'publications'],
  description: 'List all publications',
  category: 'content',
  execute: (_, data) => ({
    output: `Publications (${data.papers.length})\n${TERMINAL_DIVIDER}\n\n${formatPapers(data.papers)}`,
    uiAction: { type: 'scroll', id: 'papers' },
  }),
};

const researchCommand: CommandDefinition = {
  aliases: ['research', 'notes'],
  description: 'List recent research',
  category: 'content',
  execute: (_, data) => ({
    output: `Research (${data.research.length})\n${TERMINAL_DIVIDER}\n\n${formatResearch(data.research)}`,
    uiAction: { type: 'scroll', id: 'research' },
  }),
};

const contactCommand: CommandDefinition = {
  aliases: ['contact'],
  description: 'Contact information',
  category: 'content',
  execute: (_, data) => ({
    output: `Contact Information\n${TERMINAL_DIVIDER}\nEmail:    ${data.contact.email}\nGitHub:   ${data.contact.github}\nLinkedIn: ${data.contact.linkedin}\nTwitter:  ${data.contact.twitter}\n\nAvailable for research collaborations and consulting.`,
    uiAction: { type: 'scroll', id: 'contact' },
  }),
};

const stackCommand: CommandDefinition = {
  aliases: ['stack', 'skills', 'tech'],
  description: 'Show tech stack',
  category: 'content',
  execute: (_, data) => ({
    output: `Tech Stack\n${TERMINAL_DIVIDER}\n${data.techStack.map(s => `  ▸ ${s}`).join('\n')}`,
    action: 'none',
  }),
};

export function registerContentCommands() {
  registerCommand(projectsCommand);
  registerCommand(papersCommand);
  registerCommand(researchCommand);
  registerCommand(contactCommand);
  registerCommand(stackCommand);
}
