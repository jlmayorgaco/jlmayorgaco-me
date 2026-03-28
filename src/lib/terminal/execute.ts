import type { TerminalData, TerminalProject, TerminalPaper, TerminalResearch, CommandResult } from './terminalTypes';
import { TERMINAL_DIVIDER } from './terminalTypes';

const CD_DIRS: Record<string, { path: string; action: CommandResult['action']; navigateTo?: string }> = {
  '~': { path: '/lab/home/jlmt', action: 'none' },
  home: { path: '/lab/home/jlmt', action: 'none' },
  '..': { path: '/lab/home/jlmt', action: 'none' },
  back: { path: '/lab/home/jlmt', action: 'none' },
  projects: { path: '/lab/home/jlmt/projects', action: 'scroll-projects' },
  proj: { path: '/lab/home/jlmt/projects', action: 'scroll-projects' },
  papers: { path: '/lab/home/jlmt/papers', action: 'scroll-papers' },
  pub: { path: '/lab/home/jlmt/papers', action: 'scroll-papers' },
  research: { path: '/lab/home/jlmt/research', action: 'scroll-research' },
  tutorials: { path: '/lab/home/jlmt/tutorials', action: 'navigate', navigateTo: '/tutorials' },
  portfolio: { path: '/lab/home/jlmt/portfolio', action: 'navigate', navigateTo: '/portfolio' },
  contact: { path: '/lab/home/jlmt/contact', action: 'scroll-contact' },
};

function matchQuery(item: { id: string; title: string; tags?: string[] }, q: string): boolean {
  return item.id.toLowerCase() === q ||
    item.title.toLowerCase().includes(q) ||
    (item.tags?.some(t => t.toLowerCase().includes(q)) ?? false);
}

const findProject = (data: TerminalData, q: string): TerminalProject | null =>
  data.projects.find(p => matchQuery(p, q)) ?? null;

const findPaper = (data: TerminalData, q: string): TerminalPaper | null =>
  data.papers.find(p => p.id.toLowerCase() === q || p.title.toLowerCase().includes(q)) ?? null;

const findResearch = (data: TerminalData, q: string): TerminalResearch | null =>
  data.research.find(r => matchQuery(r, q)) ?? null;

const searchAll = (data: TerminalData, term: string) => {
  const q = term.toLowerCase();
  return {
    projects: data.projects.filter(p => matchQuery(p, q)),
    papers: data.papers.filter(p => p.title.toLowerCase().includes(q)),
    research: data.research.filter(r => matchQuery(r, q)),
  };
};

const getAllTags = (data: TerminalData): string[] => {
  const tags = new Set<string>();
  data.projects.forEach(p => p.tags.forEach(t => tags.add(t)));
  data.research.forEach(r => r.tags.forEach(t => tags.add(t)));
  return Array.from(tags).sort();
};

const getItemsByTag = (data: TerminalData, tag: string) => {
  const q = tag.toLowerCase();
  return {
    projects: data.projects.filter(p => p.tags.some(t => t.toLowerCase() === q)),
    research: data.research.filter(r => r.tags.some(t => t.toLowerCase() === q)),
  };
};

const formatList = <T extends { title: string }>(
  items: T[],
  format: (item: T, index: number) => string
): string => items.length === 0 ? 'No items found.' : items.map(format).join('\n\n');

const formatProjects = (projects: TerminalData['projects']): string =>
  formatList(projects, (p, i) => `[${i + 1}] ${p.title} (${p.year})\n    ${p.summary.substring(0, 80)}...`);

const formatPapers = (papers: TerminalData['papers']): string =>
  formatList(papers, (p, i) => `[${i + 1}] ${p.title}\n    ${p.venue} · ${p.year}`);

const formatResearch = (research: TerminalData['research']): string =>
  formatList(research, (r, i) =>
    `[${i + 1}] ${r.title}\n    ${r.category} · ${r.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
  );

const formatSearchResults = (results: ReturnType<typeof searchAll>, term: string): string => {
  const lines: string[] = [`Search results for "${term}"`, TERMINAL_DIVIDER, ''];

  if (results.projects.length > 0) {
    lines.push(`Projects (${results.projects.length}):`, ...results.projects.map(p => `  ▸ ${p.title}`), '');
  }
  if (results.papers.length > 0) {
    lines.push(`Papers (${results.papers.length}):`, ...results.papers.map(p => `  ▸ ${p.title}`), '');
  }
  if (results.research.length > 0) {
    lines.push(`Research (${results.research.length}):`, ...results.research.map(r => `  ▸ ${r.title}`), '');
  }
  if (results.projects.length === 0 && results.papers.length === 0 && results.research.length === 0) {
    lines.push('No results found.');
  }
  return lines.join('\n');
};

const formatOpenItem = (title: string, summary: string, meta: Record<string, string | string[]>, path: string): string => [
  `Opening: ${title}`,
  TERMINAL_DIVIDER,
  summary,
  '',
  ...Object.entries(meta).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`),
  '',
  `→ ${path}`,
].join('\n');

export function executeCommand(cmd: string, args: string[], data: TerminalData): CommandResult {
  const argStr = args.join(' ');

  switch (cmd) {
    case 'help':
      return { output: `Available commands:
  
  Identity
    whoami      - Display identity information
    about       - Extended profile information
    cat profile - Alias for whoami
  
  Content
    projects    - List all projects
    papers      - List all publications
    research    - List recent research
    stack       - Show tech stack
  
  Navigation
    cd <dir>    - Navigate to section
    open <slug> - Open a project/paper/research item
    search <term> - Search across all content
    tags         - List all available tags
    tag <name>  - Filter by tag
  
  System
    ls          - List available modules
    pwd         - Print working directory
    status      - System status
    map         - Show site structure
    clear       - Clear terminal
  
  Meta
    help        - Show this message
  
Easter eggs: neofetch, top, sudo, compile, deploy swarm, engage control, drone run, drive`, action: 'none' };

    case 'whoami':
    case 'cat':
    case 'profile':
      return { output: `${data.profile.name}\n${data.profile.role}\nFocus: ${data.profile.focus}\n\n${data.profile.status}`, action: 'none' };

    case 'about':
      return { output: `${data.profile.name} - ${data.profile.role}

Research focus on robotics, distributed control systems, and FPGA-based
real-time estimation. Building tools for multi-agent coordination,
frequency estimation in low-inertia grids, and hardware-native control algorithms.

Currently exploring:
  ▸ Distributed consensus in robotic swarms
  ▸ Real-time frequency estimation on FPGA
  ▸ Benchmarking frameworks for control systems

${data.profile.status}`, action: 'none' };

    case 'projects':
      return { output: `Projects (${data.projects.length})\n${TERMINAL_DIVIDER}\n\n${formatProjects(data.projects)}`, action: 'scroll-projects' };

    case 'papers':
      return { output: `Publications (${data.papers.length})\n${TERMINAL_DIVIDER}\n\n${formatPapers(data.papers)}`, action: 'scroll-papers' };

    case 'research':
      return { output: `Research (${data.research.length})\n${TERMINAL_DIVIDER}\n\n${formatResearch(data.research)}`, action: 'scroll-research' };

    case 'contact':
      return { output: `Contact Information\n${TERMINAL_DIVIDER}\nEmail:    ${data.contact.email}\nGitHub:   ${data.contact.github}\nLinkedIn: ${data.contact.linkedin}\nTwitter:  ${data.contact.twitter}\n\nAvailable for research collaborations and consulting.`, action: 'scroll-contact' };

    case 'stack':
      return { output: `Tech Stack\n${TERMINAL_DIVIDER}\n${data.techStack.map(s => `  ▸ ${s}`).join('\n')}`, action: 'none' };

    case 'ls':
      return { output: `drwxr-xr-x  projects/\ndrwxr-xr-x  papers/\ndrwxr-xr-x  research/\ndrwxr-xr-x  tutorials/\n-rw-r--r--  profile.txt\n-rw-r--r--  status.txt\n-rw-r--r--  stack.toml`, action: 'none' };

    case 'pwd':
      return { output: '/lab/home/jlmt', action: 'none' };

    case 'status':
      return { output: `System Status\n${TERMINAL_DIVIDER}\nNode:     ACTIVE\nUptime:   99.9%\nProjects:  ${data.projects.length} (${data.projects.filter(p => p.status === 'published').length} published)\nPapers:    ${data.papers.length}\nResearch: ${data.research.length}\nStack:     ${data.techStack.length} technologies`, action: 'none' };

    case 'map':
      return { output: `Site Map\n${TERMINAL_DIVIDER}\n/               - Homepage\n/projects       - Technical projects\n/papers         - Publications\n/research       - Research notes\n/tutorials      - Technical tutorials\n/about          - About me\n/contact        - Contact information`, action: 'none' };

    case 'open': {
      if (!argStr) return { output: 'Usage: open <slug-or-name>\nExample: open fpga-kalman-estimation', action: 'none' };

      const project = findProject(data, argStr);
      if (project) {
        return {
          output: formatOpenItem(project.title, project.summary, { Year: project.year, Status: project.status, Stack: project.stack }, `/projects/${project.id}`),
          action: 'navigate',
          navigateTo: `/projects/${project.id}`,
        };
      }

      const paper = findPaper(data, argStr);
      if (paper) {
        return {
          output: formatOpenItem(paper.title, paper.abstract || '', { Venue: paper.venue, Year: paper.year, Authors: paper.authors }, `/papers/${paper.id}`),
          action: 'navigate',
          navigateTo: `/papers/${paper.id}`,
        };
      }

      const research = findResearch(data, argStr);
      if (research) {
        return {
          output: formatOpenItem(research.title, research.excerpt, { Category: research.category, Date: research.date.toLocaleDateString() }, `/research/${research.id}`),
          action: 'navigate',
          navigateTo: `/research/${research.id}`,
        };
      }

      return { output: `Not found: "${argStr}"\n\nTry: open <slug> or search <term>`, action: 'none' };
    }

    case 'search':
      if (!argStr) return { output: 'Usage: search <term>', action: 'none' };
      return { output: formatSearchResults(searchAll(data, argStr), argStr), action: 'none' };

    case 'tags':
      return { output: `Available tags (${getAllTags(data).length})\n${TERMINAL_DIVIDER}\n${getAllTags(data).join(', ')}`, action: 'none' };

    case 'tag': {
      if (!argStr) return { output: 'Usage: tag <tag-name>\nExample: tag FPGA', action: 'none' };
      const results = getItemsByTag(data, argStr);
      const lines = [`Items tagged "${argStr}"`, TERMINAL_DIVIDER, ''];
      if (results.projects.length > 0) lines.push('Projects:', ...results.projects.map(p => `  ▸ ${p.title}`), '');
      if (results.research.length > 0) lines.push('Research:', ...results.research.map(r => `  ▸ ${r.title}`), '');
      if (results.projects.length === 0 && results.research.length === 0) lines.push('No items found with this tag.');
      return { output: lines.join('\n'), action: 'none' };
    }

    case 'cd': {
      const target = argStr.toLowerCase();
      if (!target) return { output: `/lab/home/jlmt\n\nUse: cd projects | cd papers | cd research`, action: 'none' };

      const dir = CD_DIRS[target];
      if (!dir) return { output: `cd: ${target}: No such directory\n\nAvailable: projects, papers, research, tutorials, portfolio, contact`, action: 'none' };

      if (['~', 'home', '..', 'back'].includes(target)) {
        return { output: dir.path, action: 'none' };
      }

      if (target === 'projects') {
        return { output: `Changed directory to: ${dir.path}\n\n${formatProjects(data.projects.slice(0, 5))}\n\n... and ${data.projects.length - 5} more.`, action: dir.action };
      }
      if (target === 'papers') {
        return { output: `Changed directory to: ${dir.path}\n\n${formatPapers(data.papers.slice(0, 5))}\n\n... and ${data.papers.length - 5} more.`, action: dir.action };
      }
      if (target === 'research') {
        return { output: `Changed directory to: ${dir.path}\n\n${formatResearch(data.research.slice(0, 5))}\n\n... and ${data.research.length - 5} more.`, action: dir.action };
      }

      return { output: `Changed directory to: ${dir.path}\n\nUse 'open <slug>' to view items.`, action: dir.action, navigateTo: dir.navigateTo };
    }

    case 'clear':
      return { output: '__CLEAR__', action: 'none' };

    default:
      return { output: `Command not found: ${cmd}\nType 'help' for available commands.`, action: 'none' };
  }
}