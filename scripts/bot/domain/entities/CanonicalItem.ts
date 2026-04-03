/**
 * Canonical Item Builder
 * 
 * Maps any source to unified format:
 * - title
 * - url
 * - source
 * - timestamp
 *
 * @module domain/entities/CanonicalItem
 */

import { canonicalizeUrl, extractDomain, extractArxivId, extractDoi } from '../shared/canonicalization';

export type ItemSource = 'arxiv' | 'rss' | 'hackernews' | 'openalex' | 'unknown';

export interface CanonicalItem {
  id: string;
  title: string;
  url: string;
  canonicalUrl: string;
  source: ItemSource;
  sourceName: string;
  timestamp: string;
  publishedDate?: string;
  description?: string;
  authors?: string[];
  categories?: string[];
  metadata: Record<string, unknown>;
  rawItem: unknown;
}

export interface ItemBuilderOptions {
  preferTimestamp?: boolean;
  extractIds?: boolean;
}

export class CanonicalItemBuilder {
  static fromArxiv(
    paper: {
      id: string;
      title: string;
      summary?: string;
      authors?: string[];
      published?: string;
      categories?: string[];
      pdfUrl?: string;
      absUrl?: string;
    },
    options: ItemBuilderOptions = {}
  ): CanonicalItem {
    const url = paper.absUrl || paper.pdfUrl || '';
    
    return {
      id: `arxiv:${paper.id}`,
      title: paper.title,
      url,
      canonicalUrl: canonicalizeUrl(url),
      source: 'arxiv',
      sourceName: 'ArXiv',
      timestamp: paper.published ? new Date(paper.published).toISOString() : new Date().toISOString(),
      publishedDate: paper.published,
      description: paper.summary?.substring(0, 500),
      authors: paper.authors,
      categories: paper.categories,
      metadata: {
        arxivId: paper.id,
        pdfUrl: paper.pdfUrl,
        hasFullText: !!paper.summary,
      },
      rawItem: paper,
    };
  }

  static fromRss(
    item: {
      title: string;
      link: string;
      source: string;
      pubDate?: string;
      description?: string;
      categories?: string[];
      guid?: string;
    },
    options: ItemBuilderOptions = {}
  ): CanonicalItem {
    const url = item.link;
    const timestamp = item.pubDate 
      ? new Date(item.pubDate).toISOString() 
      : new Date().toISOString();

    return {
      id: item.guid ? `rss:${item.guid}` : `rss:${canonicalizeUrl(url)}`,
      title: item.title,
      url,
      canonicalUrl: canonicalizeUrl(url),
      source: 'rss',
      sourceName: item.source,
      timestamp,
      publishedDate: item.pubDate,
      description: item.description?.substring(0, 500),
      categories: item.categories,
      metadata: {
        domain: extractDomain(url),
        guid: item.guid,
      },
      rawItem: item,
    };
  }

  static fromHackerNews(
    item: {
      id: number;
      title: string;
      url?: string;
      text?: string;
      by?: string;
      score?: number;
      descendants?: number;
      time?: number;
      hasUrl: boolean;
    },
    options: ItemBuilderOptions = {}
  ): CanonicalItem {
    const url = item.url || `https://news.ycombinator.com/item?id=${item.id}`;
    const timestamp = item.time 
      ? new Date(item.time * 1000).toISOString() 
      : new Date().toISOString();

    return {
      id: `hn:${item.id}`,
      title: item.title,
      url,
      canonicalUrl: canonicalizeUrl(url),
      source: 'hackernews',
      sourceName: 'HackerNews',
      timestamp,
      publishedDate: timestamp,
      description: item.text?.replace(/<[^>]*>/g, '').substring(0, 500),
      metadata: {
        hnId: item.id,
        score: item.score,
        comments: item.descendants,
        author: item.by,
        hasUrl: item.hasUrl,
        domain: item.url ? extractDomain(item.url) : 'news.ycombinator.com',
      },
      rawItem: item,
    };
  }

  static fromOpenAlex(
    work: {
      id: string;
      doi?: string;
      title: string;
      publicationYear?: number;
      citationCount?: number;
      authors?: Array<{ displayName: string; orcid?: string }>;
      topics?: Array<{ displayName: string; score: number }>;
    },
    options: ItemBuilderOptions = {}
  ): CanonicalItem {
    const doiUrl = work.doi ? `https://doi.org/${work.doi}` : '';
    
    return {
      id: work.doi ? `openalex:${work.doi}` : `openalex:${work.id}`,
      title: work.title,
      url: doiUrl,
      canonicalUrl: canonicalizeUrl(doiUrl),
      source: 'openalex',
      sourceName: 'OpenAlex',
      timestamp: work.publicationYear 
        ? new Date(work.publicationYear, 0, 1).toISOString() 
        : new Date().toISOString(),
      publishedDate: work.publicationYear?.toString(),
      description: undefined,
      authors: work.authors?.map(a => a.displayName),
      categories: work.topics?.slice(0, 5).map(t => t.displayName),
      metadata: {
        openalexId: work.id,
        doi: work.doi,
        citations: work.citationCount,
      },
      rawItem: work,
    };
  }

  static merge(items: CanonicalItem[]): CanonicalItem[] {
    const seen = new Map<string, CanonicalItem>();
    
    for (const item of items) {
      const key = item.canonicalUrl || item.id;
      if (!seen.has(key)) {
        seen.set(key, item);
      }
    }
    
    return Array.from(seen.values());
  }
}
