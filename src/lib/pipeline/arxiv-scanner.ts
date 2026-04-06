import { promises as fs } from 'fs';
import path from 'path';

interface ArxivPaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  updated: string;
  categories: string[];
  pdfUrl: string;
  absUrl: string;
}

interface SearchQuery {
  keywords: string[];
  categories: string[];
  maxResults?: number;
}

const ARXIV_API = 'http://export.arxiv.org/api/query';

async function searchArxiv(query: SearchQuery): Promise<ArxivPaper[]> {
  const searchTerms = query.keywords.join('+AND+');
  const categories = query.categories.join('+OR+');
  const maxResults = query.maxResults || 10;

  const searchQuery = `all:${searchTerms}+AND+(cat:${categories})`;
  const url = `${ARXIV_API}?search_query=${searchQuery}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;

  console.log(`Searching ArXiv: ${query.keywords.join(', ')}`);

  try {
    const response = await fetch(url);
    const xml = await response.text();
    return parseArxivXml(xml);
  } catch (error) {
    console.error('Error fetching from ArXiv:', error);
    return [];
  }
}

function parseArxivXml(xml: string): ArxivPaper[] {
  const papers: ArxivPaper[] = [];
  
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    
    const id = extractTag(entry, 'id')?.split('/').pop() || '';
    const title = extractTag(entry, 'title')?.replace(/\s+/g, ' ').trim() || '';
    const summary = extractTag(entry, 'summary')?.replace(/\s+/g, ' ').trim() || '';
    const published = extractTag(entry, 'published') || '';
    const updated = extractTag(entry, 'updated') || '';
    
    const authorMatches = entry.match(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g) || [];
    const authors = authorMatches.map(a => {
      const nameMatch = a.match(/<name>(.*?)<\/name>/);
      return nameMatch ? nameMatch[1] : '';
    }).filter(Boolean);

    const categoryMatches = entry.match(/<category[^>]*term="([^"]*)"[^>]*>/g) || [];
    const categories = categoryMatches.map(c => {
      const match = c.match(/term="([^"]*)"/);
      return match ? match[1] : '';
    }).filter(Boolean);

    const pdfUrl = entry.includes('<link title="pdf"') 
      ? entry.match(/<link[^>]*title="pdf"[^>]*href="([^"]*)"[^>]*>/)?.[1] || ''
      : `https://arxiv.org/pdf/${id}.pdf`;
    
    const absUrl = `https://arxiv.org/abs/${id}`;

    papers.push({
      id,
      title,
      summary,
      authors,
      published,
      updated,
      categories,
      pdfUrl,
      absUrl
    });
  }

  return papers;
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].trim() : null;
}

const DEFAULT_QUERIES: SearchQuery[] = [
  {
    keywords: ['frequency estimation', 'RoCoF', 'inverter-based resources'],
    categories: ['eess.SY', 'cs.SY'],
    maxResults: 5
  },
  {
    keywords: ['Kalman filter', 'state estimation', 'FPGA'],
    categories: ['cs.RO', 'eess.SY'],
    maxResults: 5
  },
  {
    keywords: ['distributed control', 'multi-agent', 'consensus'],
    categories: ['cs.SY', 'cs.RO'],
    maxResults: 5
  },
  {
    keywords: ['robotics', 'motion planning', 'collaborative'],
    categories: ['cs.RO'],
    maxResults: 5
  }
];

async function runScanner(queries: SearchQuery[] = DEFAULT_QUERIES): Promise<ArxivPaper[]> {
  const allPapers: ArxivPaper[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    const papers = await searchArxiv(query);
    
    for (const paper of papers) {
      if (!seen.has(paper.id)) {
        seen.add(paper.id);
        allPapers.push(paper);
      }
    }
  }

  // Sort by date
  allPapers.sort((a, b) => 
    new Date(b.published).getTime() - new Date(a.published).getTime()
  );

  return allPapers;
}

async function saveResults(papers: ArxivPaper[], outputPath: string) {
  const output = {
    lastUpdated: new Date().toISOString(),
    papers: papers.map(p => ({
      id: p.id,
      title: p.title,
      summary: p.summary.substring(0, 500) + (p.summary.length > 500 ? '...' : ''),
      authors: p.authors.slice(0, 5),
      published: p.published,
      categories: p.categories,
      url: p.absUrl
    }))
  };

  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
  console.log(`Saved ${papers.length} papers to ${outputPath}`);
}

async function main() {
  const outputPath = path.join(process.cwd(), 'data', 'arxiv-papers.json');
  
  // Ensure data directory exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  console.log('Starting ArXiv scanner...\n');
  const papers = await runScanner();
  
  if (papers.length > 0) {
    await saveResults(papers, outputPath);
    console.log('\nScan complete!');
  } else {
    console.log('No papers found.');
  }

  return papers;
}

export type { ArxivPaper, SearchQuery };
export { runScanner, main };

import { fileURLToPath } from 'url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
