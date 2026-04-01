import type { TerminalData, UIAction } from '../terminalTypes';
import type { CommandDefinition } from '../commandRegistry';
import { registerCommand, TERMINAL_DIVIDER } from '../commandRegistry';

let terminalDataRef: TerminalData;

export function setNavigationData(d: TerminalData) { terminalDataRef = d; }

const CD_DIRS: Record<string, { path: string; uiAction: UIAction }> = {
  '~': { path: '/lab/home/jlmt', uiAction: { type: 'none' } },
  home: { path: '/lab/home/jlmt', uiAction: { type: 'none' } },
  '..': { path: '/lab/home/jlmt', uiAction: { type: 'none' } },
  back: { path: '/lab/home/jlmt', uiAction: { type: 'none' } },
  projects: { path: '/lab/home/jlmt/projects', uiAction: { type: 'scroll', id: 'projects' } },
  proj: { path: '/lab/home/jlmt/projects', uiAction: { type: 'scroll', id: 'projects' } },
  papers: { path: '/lab/home/jlmt/papers', uiAction: { type: 'scroll', id: 'papers' } },
  pub: { path: '/lab/home/jlmt/papers', uiAction: { type: 'scroll', id: 'papers' } },
  research: { path: '/lab/home/jlmt/research', uiAction: { type: 'scroll', id: 'research' } },
  tutorials: { path: '/lab/home/jlmt/tutorials', uiAction: { type: 'navigate', path: '/tutorials' } },
  portfolio: { path: '/lab/home/jlmt/portfolio', uiAction: { type: 'navigate', path: '/portfolio' } },
  contact: { path: '/lab/home/jlmt/contact', uiAction: { type: 'scroll', id: 'contact' } },
};

function matchQuery(item: { id: string; title: string; tags?: string[] }, q: string): boolean {
  return item.id.toLowerCase() === q ||
    item.title.toLowerCase().includes(q) ||
    (item.tags?.some(t => t.toLowerCase().includes(q)) ?? false);
}

const searchCommand: CommandDefinition = {
  aliases: ['search', 'grep', 'find'],
  description: 'Search across all content',
  category: 'navigation',
  execute: (args) => {
    const term = args.join(' ').toLowerCase();
    if (!term) return { output: 'Usage: search <term>\nExample: search FPGA', action: 'none' };
    
    const results: { type: string; id: string; title: string; path: string }[] = [];
    
    terminalDataRef.projects.forEach(p => {
      if (p.title.toLowerCase().includes(term) || 
          p.summary?.toLowerCase().includes(term) ||
          p.tags?.some(t => t.toLowerCase().includes(term))) {
        results.push({ type: 'Project', id: p.id, title: p.title, path: `/projects/${p.id}` });
      }
    });
    
    terminalDataRef.papers.forEach(p => {
      if (p.title.toLowerCase().includes(term) || 
          p.abstract?.toLowerCase().includes(term)) {
        results.push({ type: 'Paper', id: p.id, title: p.title, path: `/papers/${p.id}` });
      }
    });
    
    terminalDataRef.research.forEach(r => {
      if (r.title.toLowerCase().includes(term) || 
          r.excerpt?.toLowerCase().includes(term) ||
          r.tags?.some(t => t.toLowerCase().includes(term))) {
        results.push({ type: 'Research', id: r.id, title: r.title, path: `/research/${r.id}` });
      }
    });
    
    if (results.length === 0) {
      return { output: `Search: "${term}" - No results found\n\nMaybe try: robots, FPGA, control, distributed`, action: 'none' };
    }
    
    const formatted = results.map((r, i) => 
      `[${i + 1}] ${r.type}: ${r.title}\n     → ${r.path}`
    ).join('\n\n');
    
    return { 
      output: `Search: "${term}" - Found ${results.length} result(s)\n${TERMINAL_DIVIDER}\n\n${formatted}\n\nUse: open <slug> to navigate`, 
      action: 'none' 
    };
  },
};

const tagsCommand: CommandDefinition = {
  aliases: ['tags'],
  description: 'List all available tags',
  category: 'navigation',
  execute: () => {
    const tags = new Set<string>();
    terminalDataRef.projects.forEach(p => p.tags.forEach(t => tags.add(t)));
    terminalDataRef.research.forEach(r => r.tags.forEach(t => tags.add(t)));
    const sorted = Array.from(tags).sort();
    return { 
      output: `Available tags (${sorted.length})\n${TERMINAL_DIVIDER}\n${sorted.join(', ')}\n\nTip: use 'tag <name>' to filter`, 
      action: 'none' 
    };
  },
};

const tagCommand: CommandDefinition = {
  aliases: ['tag'],
  description: 'Filter by tag',
  category: 'navigation',
  execute: (args) => {
    const tagName = args.join(' ').toLowerCase();
    if (!tagName) return { output: 'Usage: tag <tag-name>\nExample: tag FPGA', action: 'none' };
    
    const results: { type: string; id: string; title: string; path: string }[] = [];
    
    terminalDataRef.projects.forEach(p => {
      const match = p.tags?.find(t => t.toLowerCase().includes(tagName));
      if (match) {
        results.push({ type: 'Project', id: p.id, title: p.title, path: `/projects/${p.id}` });
      }
    });
    
    terminalDataRef.research.forEach(r => {
      const match = r.tags?.find(t => t.toLowerCase().includes(tagName));
      if (match) {
        results.push({ type: 'Research', id: r.id, title: r.title, path: `/research/${r.id}` });
      }
    });
    
    if (results.length === 0) {
      return { output: `Tag: "${tagName}" - No results\n\nTry: robotics, fpga, control, distributed`, action: 'none' };
    }
    
    const formatted = results.map((r, i) => 
      `[${i + 1}] ${r.type}: ${r.title}`
    ).join('\n');
    
    return { 
      output: `Tag: "${tagName}" - ${results.length} result(s)\n${TERMINAL_DIVIDER}\n\n${formatted}\n\nUse: open <slug> to navigate`, 
      action: 'none' 
    };
  },
};

const cdCommand: CommandDefinition = {
  aliases: ['cd'],
  description: 'Navigate to section',
  category: 'navigation',
  execute: (args) => {
    const target = args.join(' ').toLowerCase();
    if (!target) return { output: `/lab/home/jlmt\n\nUse: cd projects | cd papers | cd research`, action: 'none' };
    
    const dir = CD_DIRS[target];
    if (!dir) {
      return { output: `cd: ${target}: No such directory\n\nAvailable: projects, papers, research, tutorials, portfolio, contact`, action: 'none' };
    }
    
    const emoji = target === 'projects' ? '🔧' : 
                  target === 'papers' ? '📄' : 
                  target === 'research' ? '📚' : 
                  target === 'tutorials' ? '⚡' : 
                  target === 'portfolio' ? '🎨' : 
                  target === 'contact' ? '📧' : '→';
    
    return { 
      output: `${emoji} Navigating to: ${dir.path}\n${TERMINAL_DIVIDER}\n[INFO] Scroll initiated...\n[OK] Panel focus set`, 
      uiAction: dir.uiAction 
    };
  },
};

const historyCommand: CommandDefinition = {
  aliases: ['history', 'hist'],
  description: 'Show command history',
  category: 'system',
  execute: () => ({
    output: `Command history - use ArrowUp/ArrowDown in terminal\n\nRecent: whoami, projects, papers, research, help`,
    action: 'none',
  }),
};

const openCommand: CommandDefinition = {
  aliases: ['open', 'goto', 'view'],
  description: 'Open a project/paper/research item',
  execute: (args) => {
    const query = args.join(' ');
    if (!query) {
      return { output: 'Usage: open <slug-or-name>\nExample: open fpga-kalman-estimation', action: 'none' };
    }
    
    const q = query.toLowerCase();
    
    const project = q.length < 50 
      ? terminalDataRef.projects.find(p => matchQuery(p, q)) 
      : null;
    if (project) {
      return {
        output: `Opening: ${project.title}\n${TERMINAL_DIVIDER}\n${project.summary}\n\nYear: ${project.year}\nStatus: ${project.status}\nStack: ${project.stack.join(', ')}\n\n→ /projects/${project.id}`,
        uiAction: { type: 'navigate', path: `/projects/${project.id}` },
      };
    }
    
    const paper = terminalDataRef.papers.find(p => p.id.toLowerCase() === q || p.title.toLowerCase().includes(q));
    if (paper) {
      return {
        output: `Opening: ${paper.title}\n${TERMINAL_DIVIDER}\nVenue: ${paper.venue}\nYear: ${paper.year}\n\n→ /papers/${paper.id}`,
        uiAction: { type: 'navigate', path: `/papers/${paper.id}` },
      };
    }
    
    const research = terminalDataRef.research.find(r => matchQuery(r, q));
    if (research) {
      return {
        output: `Opening: ${research.title}\n${TERMINAL_DIVIDER}\n${research.excerpt}\n\nCategory: ${research.category}\nDate: ${research.date.toLocaleDateString()}\n\n→ /research/${research.id}`,
        uiAction: { type: 'navigate', path: `/research/${research.id}` },
      };
    }
    
    return { output: `Not found: "${query}"\n\nTry: open <slug> or search <term>`, action: 'none' };
  },
};

export function registerNavigationCommands() {
  registerCommand(searchCommand);
  registerCommand(tagsCommand);
  registerCommand(tagCommand);
  registerCommand(cdCommand);
  registerCommand(historyCommand);
  registerCommand(openCommand);
}
