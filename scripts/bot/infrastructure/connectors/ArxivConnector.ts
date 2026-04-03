/**
 * ArXiv Connector - Production-ready
 * 
 * Features:
 * - Incremental fetch (date or last ID)
 * - Rate limit (3s/request)
 * - Retry + timeout
 * - Robust XML parsing
 * - Store raw item
 *
 * @module infrastructure/connectors/ArxivConnector
 */

import { logError, logInfo, logWarn } from '../../infrastructure/logging/Logger';
import { withRetry, withTimeout } from '../../shared/utils';
import { validateUrl } from '../../shared/security';
import type { BotConfig } from '../../config/index';

export interface ArxivPaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  updated: string;
  categories: string[];
  pdfUrl: string;
  absUrl: string;
  rawXml?: string;
}

export interface ArxivQuery {
  keywords: string[];
  categories: string[];
  maxResults?: number;
}

export interface ArxivCheckpoint {
  lastId?: string;
  lastDate?: string;
  lastRun: string;
}

const ARXIV_API = 'http://export.arxiv.org/api/query';
const RATE_LIMIT_MS = 3000;
const TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;

export class ArxivConnector {
  private lastRequestTime = 0;
  private readonly config: BotConfig;

  constructor(config: BotConfig) {
    this.config = config;
  }

  async fetchPapers(
    query: ArxivQuery,
    checkpoint?: ArxivCheckpoint
  ): Promise<ArxivPaper[]> {
    const searchTerms = query.keywords.join('+AND+');
    const categories = query.categories.join('+OR+');
    const maxResults = query.maxResults || 10;

    let searchQuery = `all:${searchTerms}+AND+(cat:${categories})`;
    
    if (checkpoint?.lastId) {
      searchQuery += `+AND+id_list:${checkpoint.lastId}`;
    } else if (checkpoint?.lastDate) {
      searchQuery += `+AND+submittedDate:[${checkpoint.lastDate}+TO+*]`;
    }

    const url = `${ARXIV_API}?search_query=${searchQuery}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;

    logInfo('Fetching from ArXiv', { keywords: query.keywords, checkpoint: !!checkpoint });

    try {
      await this.applyRateLimit();
      
      const paper = await withTimeout(
        () => this.fetchWithRetry(url),
        TIMEOUT_MS,
        'ArXiv fetch timed out'
      );

      return this.parseArxivXml(paper, true);
    } catch (error) {
      logError('ArXiv fetch failed', error as Error);
      return [];
    }
  }

  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < RATE_LIMIT_MS) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
  }

  private async fetchWithRetry(url: string): Promise<string> {
    return withRetry(
      async () => {
        const urlValidation = validateUrl(url);
        if (!urlValidation.valid) {
          throw new Error(`Invalid URL: ${urlValidation.error}`);
        }

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'JLMT-Bot/1.0 (Research Assistant; Research Paper Aggregator)',
            'Accept': 'application/atom+xml, application/xml, text/xml',
          },
        });

        if (!res.ok) {
          throw new Error(`ArXiv API error: ${res.status} ${res.statusText}`);
        }

        const text = await res.text();
        
        if (!text.includes('<feed') && !text.includes('<entry')) {
          throw new Error('Invalid ArXiv response: not an Atom feed');
        }

        return text;
      },
      {
        maxRetries: MAX_RETRIES,
        baseDelay: 1000,
        onRetry: (error, attempt) => {
          logWarn(`Retrying ArXiv request (attempt ${attempt})`, { error: error.message });
        },
      }
    )();
  }

  private parseArxivXml(xml: string, storeRaw = false): ArxivPaper[] {
    const papers: ArxivPaper[] = [];
    
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
      try {
        const entry = match[1];
        const paper = this.parseEntry(entry, storeRaw ? match[0] : undefined);
        if (paper) {
          papers.push(paper);
        }
      } catch (error) {
        logWarn('Failed to parse entry', { error: (error as Error).message });
      }
    }

    return papers;
  }

  private parseEntry(entry: string, rawXml?: string): ArxivPaper | null {
    const id = this.extractTag(entry, 'id')?.split('/').pop();
    if (!id) return null;

    const title = this.extractTag(entry, 'title')?.replace(/\s+/g, ' ').trim() || 'Untitled';
    const summary = this.extractTag(entry, 'summary')?.replace(/\s+/g, ' ').trim() || '';
    const published = this.extractTag(entry, 'published') || '';
    const updated = this.extractTag(entry, 'updated') || published;

    const authors = this.extractAuthors(entry);
    const categories = this.extractCategories(entry);

    const pdfUrl = this.extractPdfLink(entry, id);
    const absUrl = `https://arxiv.org/abs/${id}`;

    return {
      id,
      title,
      summary,
      authors,
      published,
      updated,
      categories,
      pdfUrl,
      absUrl,
      rawXml,
    };
  }

  private extractTag(xml: string, tag: string): string | null {
    const patterns = [
      new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`),
      new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`),
    ];

    for (const pattern of patterns) {
      const match = xml.match(pattern);
      if (match) {
        return match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
      }
    }

    return null;
  }

  private extractAuthors(entry: string): string[] {
    const authors: string[] = [];
    const authorRegex = /<author>([\s\S]*?)<\/author>/g;
    let match;

    while ((match = authorRegex.exec(entry)) !== null) {
      const nameMatch = match[1].match(/<name>(.*?)<\/name>/);
      if (nameMatch) {
        authors.push(nameMatch[1].trim());
      }
    }

    return authors;
  }

  private extractCategories(entry: string): string[] {
    const categories: string[] = [];
    const catRegex = /<category[^>]*term="([^"]*)"[^>]*>/g;
    let match;

    while ((match = catRegex.exec(entry)) !== null) {
      categories.push(match[1]);
    }

    return categories;
  }

  private extractPdfLink(entry: string, id: string): string {
    const pdfMatch = entry.match(/<link[^>]*title="pdf"[^>]*href="([^"]*)"[^>]*>/);
    if (pdfMatch) {
      return pdfMatch[1];
    }

    const hrefMatch = entry.match(/<link[^>]*href="([^"]*)"[^>]*type="application\/pdf"[^>]*>/);
    if (hrefMatch) {
      return hrefMatch[1];
    }

    return `https://arxiv.org/pdf/${id}.pdf`;
  }

  static getDefaultQueries(): ArxivQuery[] {
    return [
      {
        keywords: ['frequency estimation', 'RoCoF', 'inverter-based resources'],
        categories: ['eess.SY', 'cs.SY'],
        maxResults: 5,
      },
      {
        keywords: ['Kalman filter', 'state estimation', 'FPGA'],
        categories: ['cs.RO', 'eess.SY'],
        maxResults: 5,
      },
      {
        keywords: ['distributed control', 'multi-agent', 'consensus'],
        categories: ['cs.SY', 'cs.RO'],
        maxResults: 5,
      },
      {
        keywords: ['robotics', 'motion planning', 'collaborative'],
        categories: ['cs.RO'],
        maxResults: 5,
      },
    ];
  }
}

export async function runArxivScanner(
  config: BotConfig,
  checkpoint?: ArxivCheckpoint
): Promise<ArxivPaper[]> {
  const connector = new ArxivConnector(config);
  const queries = ArxivConnector.getDefaultQueries();
  
  const allPapers: ArxivPaper[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    const papers = await connector.fetchPapers(query, checkpoint);
    
    for (const paper of papers) {
      if (!seen.has(paper.id)) {
        seen.add(paper.id);
        allPapers.push(paper);
      }
    }
  }

  allPapers.sort((a, b) => 
    new Date(b.published).getTime() - new Date(a.published).getTime()
  );

  return allPapers;
}
