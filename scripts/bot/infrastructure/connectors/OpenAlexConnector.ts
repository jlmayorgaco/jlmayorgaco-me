/**
 * OpenAlex Connector - Metadata Enrichment Only
 * 
 * Features (metadata enrichment only):
 * - Citations
 * - Authors
 * - Topics
 * 
 * NOT for full ingestion - only for enrichment.
 *
 * @module infrastructure/connectors/OpenAlexConnector
 */

import { logError, logInfo, logWarn } from '../logging/Logger';
import { withRetry, withTimeout } from '../../shared/utils';
import { validateUrl } from '../../shared/security';

export interface OpenAlexWork {
  id: string;
  doi?: string;
  title: string;
  publicationYear: number;
  citationCount: number;
  citedByCount: number;
  authors: OpenAlexAuthor[];
  topics: OpenAlexTopic[];
  concepts: OpenAlexConcept[];
  isOpenAccess: boolean;
  hostVenue?: string;
  rawJson?: string;
}

export interface OpenAlexAuthor {
  id: string;
  displayName: string;
  orcid?: string;
  worksCount: number;
  citedByCount: number;
}

export interface OpenAlexTopic {
  id: string;
  displayName: string;
  score: number;
  level: number;
}

export interface OpenAlexConcept {
  id: string;
  displayName: string;
  score: number;
  level: number;
  domain?: string;
  field?: string;
}

export interface OpenAlexQuery {
  doi?: string;
  arxivId?: string;
  title?: string;
}

const OPENALEX_API = 'https://api.openalex.org';
const RATE_LIMIT_MS = 1000;
const TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;

export class OpenAlexConnector {
  private lastRequestTime = 0;

  async enrichByDOI(doi: string): Promise<OpenAlexWork | null> {
    const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//, '').replace(/^doi:/, '');
    const url = `${OPENALEX_API}/works/https://doi.org/${encodeURIComponent(cleanDoi)}`;
    
    return this.fetchWork(url, { doi: cleanDoi });
  }

  async enrichByArxiv(arxivId: string): Promise<OpenAlexWork | null> {
    const cleanId = arxivId.replace(/^arxiv:/, '').trim();
    const url = `${OPENALEX_API}/works/https://arxiv.org/abs/${encodeURIComponent(cleanId)}`;
    
    return this.fetchWork(url, { arxivId: cleanId });
  }

  async enrichByTitle(title: string, exact = false): Promise<OpenAlexWork | null> {
    const searchUrl = exact 
      ? `${OPENALEX_API}/works?filter=title.search:${encodeURIComponent(title)}`
      : `${OPENALEX_API}/works?search=${encodeURIComponent(title)}`;
    
    return withTimeout(
      () => this.fetchWithRetry(searchUrl),
      TIMEOUT_MS,
      'OpenAlex search timeout'
    ).then(text => {
      const data = JSON.parse(text);
      if (data.results && data.results.length > 0) {
        return this.parseWork(data.results[0]);
      }
      return null;
    });
  }

  async enrichWorks(queries: OpenAlexQuery[]): Promise<OpenAlexWork[]> {
    const works: OpenAlexWork[] = [];

    for (const query of queries) {
      await this.applyRateLimit();

      let work: OpenAlexWork | null = null;

      if (query.doi) {
        work = await this.enrichByDOI(query.doi);
      } else if (query.arxivId) {
        work = await this.enrichByArxiv(query.arxivId);
      } else if (query.title) {
        work = await this.enrichByTitle(query.title, true);
      }

      if (work) {
        works.push(work);
      }
    }

    return works;
  }

  private async fetchWork(url: string, context: OpenAlexQuery): Promise<OpenAlexWork | null> {
    try {
      const text = await withTimeout(
        () => this.fetchWithRetry(url),
        TIMEOUT_MS,
        'OpenAlex fetch timeout'
      );

      const data = JSON.parse(text);
      return this.parseWork(data);
    } catch (error) {
      logWarn('OpenAlex fetch failed', { 
        context, 
        error: (error as Error).message 
      });
      return null;
    }
  }

  private parseWork(data: any): OpenAlexWork | null {
    if (!data || !data.id) return null;

    const authors: OpenAlexAuthor[] = (data.authorships || []).map((a: any) => ({
      id: a.author?.id || '',
      displayName: a.author?.display_name || 'Unknown',
      orcid: a.author?.orcid,
      worksCount: a.author?.works_count || 0,
      citedByCount: a.author?.cited_by_count || 0,
    }));

    const topics: OpenAlexTopic[] = (data.topics || []).map((t: any) => ({
      id: t.id || '',
      displayName: t.display_name || t.id?.split('/').pop() || 'Unknown',
      score: t.score || 0,
      level: t.level || 0,
    }));

    const concepts: OpenAlexConcept[] = (data.concepts || []).map((c: any) => ({
      id: c.id || '',
      displayName: c.display_name || c.id?.split('/').pop() || 'Unknown',
      score: c.score || 0,
      level: c.level || 0,
      domain: c.domain,
      field: c.field,
    }));

    return {
      id: data.id,
      doi: data.doi,
      title: data.title || 'Untitled',
      publicationYear: data.publication_year,
      citationCount: data.citation_count || 0,
      citedByCount: data.cited_by_count || 0,
      authors,
      topics,
      concepts,
      isOpenAccess: data.open_access?.is_oa || false,
      hostVenue: data.host_venue?.display_name,
      rawJson: JSON.stringify(data),
    };
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
    const urlValidation = validateUrl(url);
    if (!urlValidation.valid) {
      throw new Error(`Invalid URL: ${urlValidation.error}`);
    }

    return withRetry(
      async () => {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'JLMT-Bot/1.0 (Research Assistant)',
            'Accept': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(`OpenAlex API error: ${res.status}`);
        }

        return res.text();
      },
      {
        maxRetries: MAX_RETRIES,
        baseDelay: 1000,
        onRetry: (error, attempt) => {
          logWarn(`Retrying OpenAlex request (attempt ${attempt})`, { error: error.message });
        },
      }
    )();
  }

  static getTopConcepts(work: OpenAlexWork, limit = 5): OpenAlexConcept[] {
    return work.concepts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  static getPrimaryAuthor(work: OpenAlexWork): OpenAlexAuthor | null {
    return work.authors[0] || null;
  }
}

export function createEnrichmentContext(work: OpenAlexWork): string {
  const concepts = OpenAlexConnector.getTopConcepts(work, 3);
  const primaryAuthor = OpenAlexConnector.getPrimaryAuthor(work);
  
  let context = `Paper: ${work.title}\n`;
  context += `Published: ${work.publicationYear}\n`;
  context += `Citations: ${work.citationCount}\n`;
  
  if (primaryAuthor) {
    context += `Lead Author: ${primaryAuthor.displayName}\n`;
  }
  
  if (concepts.length > 0) {
    context += `Topics: ${concepts.map(c => c.displayName).join(', ')}\n`;
  }
  
  return context;
}
