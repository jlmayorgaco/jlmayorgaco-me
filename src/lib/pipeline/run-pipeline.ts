#!/usr/bin/env node

import { ArxivPaper, runScanner } from './arxiv-scanner.js';
import { summarizePapers } from './ai-summarizer.js';
import { notifyNewPapers } from './telegram-bot.js';
import path from 'path';
import { promises as fs } from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');

// Type for stored paper data (subset of ArxivPaper)
interface StoredPaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  categories: string[];
  url: string;
}

// Type for JSON file structure
interface PapersJsonData {
  lastUpdated?: string;
  papers: StoredPaper[];
}

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function loadPreviousPapers(): Promise<string[]> {
  const prevPath = path.join(DATA_DIR, 'relevant-papers.json');
  try {
    const data = await fs.readFile(prevPath, 'utf-8');
    const { papers } = JSON.parse(data) as PapersJsonData;
    return papers.map((p: StoredPaper) => p.id);
  } catch {
    return [];
  }
}

async function findNewPapers(current: ArxivPaper[], previous: string[]): Promise<ArxivPaper[]> {
  return current.filter(p => !previous.includes(p.id));
}

async function runPipeline(options: {
  scan?: boolean;
  summarize?: boolean;
  notify?: boolean;
} = {}) {
  const { scan = true, summarize = true, notify = true } = options;

  console.log('🧪 JLMT Lab Research Pipeline\n');
  console.log('='.repeat(40));

  await ensureDataDir();

  let papers: ArxivPaper[] = [];

  // Step 1: Scan ArXiv
  if (scan) {
    console.log('\n📡 Step 1: Scanning ArXiv...');
    papers = await runScanner();
    console.log(`   Found ${papers.length} papers`);
  }

  // Step 2: Summarize and filter
  if (summarize) {
    console.log('\n🤖 Step 2: AI Summarization & Filtering...');
    
    // Save raw papers
    const rawPath = path.join(DATA_DIR, 'arxiv-papers.json');
    await fs.writeFile(rawPath, JSON.stringify({
      lastUpdated: new Date().toISOString(),
      papers: papers.map(p => ({
        id: p.id,
        title: p.title,
        summary: p.summary,
        authors: p.authors,
        published: p.published,
        categories: p.categories,
        url: p.absUrl
      }))
    }, null, 2));

    await summarizePapers(rawPath, path.join(DATA_DIR, 'relevant-papers.json'));
  }

  // Step 3: Notify via Telegram
  if (notify) {
    console.log('\n📱 Step 3: Telegram Notification...');
    
    const relevantPath = path.join(DATA_DIR, 'relevant-papers.json');
    const previousPath = path.join(DATA_DIR, 'previous-papers.json');
    
    // Load previous papers
    let previousIds: string[] = [];
    try {
      const prevData = await fs.readFile(previousPath, 'utf-8');
      previousIds = JSON.parse(prevData);
    } catch {
      previousIds = [];
    }
    
    // Get current papers
    const data = await fs.readFile(relevantPath, 'utf-8');
    const { papers: relevantPapers } = JSON.parse(data) as PapersJsonData;
    
    // Find new papers
    const newPapers = relevantPapers.filter(
      (p: StoredPaper) => !previousIds.includes(p.id)
    );
    
    if (newPapers.length > 0) {
      console.log(`   Found ${newPapers.length} new papers`);
      await notifyNewPapers(newPapers);
    } else {
      console.log('   No new papers since last scan');
    }
    
    // Save current as previous
    await fs.writeFile(previousPath, JSON.stringify(relevantPapers.map((p: StoredPaper) => p.id)));
  }

  console.log('\n' + '='.repeat(40));
  console.log('✅ Pipeline complete!\n');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'run';

  switch (command) {
    case 'run':
      await runPipeline({ scan: true, summarize: true, notify: true });
      break;
    case 'scan':
      await runPipeline({ scan: true, summarize: false, notify: false });
      break;
    case 'summarize':
      await runPipeline({ scan: false, summarize: true, notify: false });
      break;
    case 'notify':
      await runPipeline({ scan: false, summarize: false, notify: true });
      break;
    default:
      console.log('Usage: pipeline <run|scan|summarize|notify>');
  }
}

main().catch(console.error);
