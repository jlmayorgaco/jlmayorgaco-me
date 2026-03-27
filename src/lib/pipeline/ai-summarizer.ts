import { promises as fs } from 'fs';
import path from 'path';

interface Paper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  categories: string[];
  url: string;
}

interface SummarizedPaper extends Paper {
  summaryShort: string;
  relevanceScore: number;
  keywords: string[];
  relevance: 'high' | 'medium' | 'low';
}

const RELEVANT_KEYWORDS = [
  'frequency estimation', 'RoCoF', 'inverter-based', 'grid',
  'Kalman filter', 'state estimation', 'FPGA', 'hardware',
  'distributed control', 'multi-agent', 'consensus', 'graph',
  'robotics', 'motion planning', 'control', 'embedded',
  'power systems', 'grid stability', 'synchronization'
];

const CATEGORY_WEIGHTS: Record<string, number> = {
  'eess.SY': 2.0,
  'cs.SY': 1.8,
  'cs.RO': 1.5,
  'cs.LG': 1.3,
  'math.OC': 1.2,
  'physics': 1.0
};

function calculateRelevance(paper: Paper): { score: number; keywords: string[] } {
  const text = `${paper.title} ${paper.summary} ${paper.categories.join(' ')}`.toLowerCase();
  const foundKeywords: string[] = [];
  let score = 0;

  for (const keyword of RELEVANT_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
      score += keyword.split(' ').length * 0.5;
    }
  }

  // Category boost
  for (const cat of paper.categories) {
    const weight = CATEGORY_WEIGHTS[cat] || 0.5;
    score += weight;
  }

  // Recent papers get a small boost
  const monthsOld = (Date.now() - new Date(paper.published).getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsOld < 3) score += 0.5;
  else if (monthsOld < 6) score += 0.3;
  else if (monthsOld > 24) score *= 0.8;

  return { score: Math.round(score * 10) / 10, keywords: foundKeywords.slice(0, 5) };
}

function shortSummary(summary: string, maxLength: number = 200): string {
  // Clean and truncate
  let cleaned = summary
    .replace(/\s+/g, ' ')
    .replace(/^We /, '')
    .replace(/^This paper /, '')
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  
  // Try to end at a sentence
  const truncated = cleaned.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  
  if (lastPeriod > maxLength * 0.7) {
    return truncated.substring(0, lastPeriod + 1);
  }
  
  return truncated + '...';
}

function summarizePaper(paper: Paper): SummarizedPaper {
  const { score, keywords } = calculateRelevance(paper);
  
  let relevance: 'high' | 'medium' | 'low';
  if (score >= 5) relevance = 'high';
  else if (score >= 2) relevance = 'medium';
  else relevance = 'low';

  return {
    ...paper,
    summaryShort: shortSummary(paper.summary),
    relevanceScore: score,
    keywords,
    relevance
  };
}

async function summarizePapers(inputPath: string, outputPath: string): Promise<SummarizedPaper[]> {
  const data = await fs.readFile(inputPath, 'utf-8');
  const { papers } = JSON.parse(data);

  const summarized = papers.map(summarizePaper);
  
  // Sort by relevance
  summarized.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Filter to high/medium relevance
  const filtered = summarized.filter(p => p.relevance !== 'low');

  const output = {
    lastUpdated: new Date().toISOString(),
    papers: filtered,
    stats: {
      total: papers.length,
      high: filtered.filter(p => p.relevance === 'high').length,
      medium: filtered.filter(p => p.relevance === 'medium').length,
      low: papers.length - filtered.length
    }
  };

  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
  console.log(`Summarized ${filtered.length} relevant papers (from ${papers.length} total)`);

  return filtered;
}

async function main() {
  const inputPath = path.join(process.cwd(), 'data', 'arxiv-papers.json');
  const outputPath = path.join(process.cwd(), 'data', 'relevant-papers.json');

  await summarizePapers(inputPath, outputPath);
}

export { 
  Paper, 
  SummarizedPaper, 
  summarizePaper, 
  summarizePapers, 
  main 
};

if (require.main === module) {
  main().catch(console.error);
}
