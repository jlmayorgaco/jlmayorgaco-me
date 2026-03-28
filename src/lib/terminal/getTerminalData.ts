import { getCollection } from 'astro:content';
import type { TerminalData, TerminalProject, TerminalPaper, TerminalResearch, TerminalProfile, TerminalContact } from './terminalTypes';

export async function getTerminalData(): Promise<TerminalData> {
  const [projects, papers, research] = await Promise.all([
    getCollection('projects'),
    getCollection('papers'),
    getCollection('research'),
  ]);

  const terminalProjects: TerminalProject[] = projects
    .sort((a, b) => b.data.order - a.data.order)
    .map(p => ({
      id: p.id,
      title: p.data.title,
      summary: p.data.summary,
      year: p.data.year,
      status: p.data.status,
      tags: p.data.tags || [],
      stack: p.data.stack || [],
    }));

  const terminalPapers: TerminalPaper[] = papers.map(p => ({
    id: p.id,
    title: p.data.title,
    venue: p.data.venue,
    year: p.data.year,
    authors: p.data.authors || [],
    status: p.data.status,
  }));

  const terminalResearch: TerminalResearch[] = research
    .filter(r => !r.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map(r => ({
      id: r.id,
      title: r.data.title,
      excerpt: r.data.excerpt,
      date: r.data.date,
      tags: r.data.tags || [],
      category: r.data.category,
    }));

  const profile: TerminalProfile = {
    name: 'Jorge Luis Mayorga',
    role: 'Research Engineer',
    focus: 'Robotics, Distributed Control, FPGA',
    status: 'Available for collaborations',
  };

  const contact: TerminalContact = {
    email: 'hello@jlmayorga.co',
    github: 'github.com/jlmayorga',
    linkedin: 'linkedin.com/in/jlmayorga',
    twitter: 'twitter.com/jlmayorga',
  };

  const techStack = [
    'FPGA / Verilog',
    'Python',
    'C/C++',
    'ROS / Robotics',
    'Control Theory',
    'Embedded Systems',
    'Docker',
    'LaTeX',
  ];

  return {
    projects: terminalProjects,
    papers: terminalPapers,
    research: terminalResearch,
    profile,
    contact,
    techStack,
  };
}

export function findProject(data: TerminalData, query: string): TerminalProject | null {
  const q = query.toLowerCase();
  return data.projects.find(p => 
    p.id.toLowerCase() === q ||
    p.title.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q))
  ) || null;
}

export function findPaper(data: TerminalData, query: string): TerminalPaper | null {
  const q = query.toLowerCase();
  return data.papers.find(p => 
    p.id.toLowerCase() === q ||
    p.title.toLowerCase().includes(q)
  ) || null;
}

export function findResearch(data: TerminalData, query: string): TerminalResearch | null {
  const q = query.toLowerCase();
  return data.research.find(r => 
    r.id.toLowerCase() === q ||
    r.title.toLowerCase().includes(q) ||
    r.tags.some(t => t.toLowerCase().includes(q))
  ) || null;
}

export function searchAll(data: TerminalData, term: string): { projects: TerminalProject[]; papers: TerminalPaper[]; research: TerminalResearch[] } {
  const q = term.toLowerCase();
  return {
    projects: data.projects.filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    ),
    papers: data.papers.filter(p => 
      p.title.toLowerCase().includes(q)
    ),
    research: data.research.filter(r => 
      r.title.toLowerCase().includes(q) ||
      r.excerpt.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    ),
  };
}

export function getAllTags(data: TerminalData): string[] {
  const tags = new Set<string>();
  data.projects.forEach(p => p.tags.forEach(t => tags.add(t)));
  data.papers.forEach(p => p.tags?.forEach(t => tags.add(t)));
  data.research.forEach(r => r.tags.forEach(t => tags.add(t)));
  return Array.from(tags).sort();
}

export function getItemsByTag(data: TerminalData, tag: string): { projects: TerminalProject[]; papers: TerminalPaper[]; research: TerminalResearch[] } {
  const q = tag.toLowerCase();
  return {
    projects: data.projects.filter(p => p.tags.some(t => t.toLowerCase() === q)),
    papers: [],
    research: data.research.filter(r => r.tags.some(t => t.toLowerCase() === q)),
  };
}