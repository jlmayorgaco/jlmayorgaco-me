/**
 * RSS/Atom Connector - Fully Configurable
 * 
 * Features:
 * - Multiple feeds (configurable)
 * - Support RSS 2.0 and Atom
 * - Normalize GUID/URL
 * - Fallback if feed fails
 * - Health per feed
 *
 * @module infrastructure/connectors/RssConnector
 */

import { logError, logInfo, logWarn } from '../logging/Logger';
import { withRetry, withTimeout } from '../../shared/utils';
import { safeValidate, NewsItemSchema } from '../../shared/validation';
import { validateUrl } from '../../shared/security';
import type { BotConfig } from '../../config/index';

export interface FeedConfig {
  name: string;
  url: string;
  type: 'rss' | 'atom';
  keywords?: string[];
  enabled?: boolean;
}

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  description: string;
  categories: string[];
  guid?: string;
  rawXml?: string;
}

export interface FeedHealth {
  name: string;
  url: string;
  status: 'healthy' | 'degraded' | 'failed';
  lastCheck: string;
  lastItemCount: number;
  error?: string;
  responseTimeMs?: number;
}

export interface RssCheckpoint {
  lastGuid?: string;
  lastDate?: string;
  lastRun: string;
  feedCheckpoints: Record<string, RssCheckpoint>;
}

export class RssConnector {
  private feeds: FeedConfig[];
  private feedHealth: Map<string, FeedHealth> = new Map();

  constructor(feeds: FeedConfig[]) {
    this.feeds = feeds.filter(f => f.enabled !== false);
  }

  static fromConfig(config: BotConfig): RssConnector {
    const feeds: FeedConfig[] = (config.sources || []).map(s => ({
      name: s.name,
      url: s.url,
      type: s.type as 'rss' | 'atom',
      enabled: true,
    }));

    return new RssConnector(feeds);
  }

  async fetchAll(checkpoints?: Record<string, RssCheckpoint>): Promise<NewsItem[]> {
    const allItems: NewsItem[] = [];
    const results = await Promise.allSettled(
      this.feeds.map(feed => this.fetchFeed(feed, checkpoints?.[feed.name]))
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const feed = this.feeds[i];

      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
        this.updateHealth(feed.name, 'healthy', result.value.length);
      } else {
        logError(`Feed ${feed.name} failed`, result.reason);
        this.updateHealth(feed.name, 'failed', 0, result.reason.message);
      }
    }

    return allItems;
  }

  async fetchFeed(feed: FeedConfig, checkpoint?: RssCheckpoint): Promise<NewsItem[]> {
    const startTime = Date.now();

    try {
      const xml = await this.fetchWithRetry(feed.url);
      const items = this.parseFeed(xml, feed.name, feed.type);

      const responseTime = Date.now() - startTime;
      this.updateHealth(feed.name, items.length > 0 ? 'healthy' : 'degraded', items.length, undefined, responseTime);

      return items;
    } catch (error) {
      this.updateHealth(feed.name, 'failed', 0, (error as Error).message);
      throw error;
    }
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
            'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const text = await res.text();

        if (!text.includes('<')) {
          throw new Error('Invalid response: not XML');
        }

        return text;
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (error, attempt) => {
          logWarn(`Retrying feed (attempt ${attempt})`, { error: error.message });
        },
      }
    );
  }

  private parseFeed(xml: string, sourceName: string, feedType: string): NewsItem[] {
    const items: NewsItem[] = [];
    const seenLinks = new Set<string>();
    
    const isAtom = feedType === 'atom' || xml.includes('<feed');
    const itemTag = isAtom ? 'entry' : 'item';
    const itemRegex = new RegExp(`<${itemTag}>([\\s\\S]*?)</${itemTag}>`, 'g');
    
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      try {
        const entry = match[1];
        const item = this.parseEntry(entry, sourceName, isAtom, match[0]);
        if (item && !seenLinks.has(item.link)) {
          seenLinks.add(item.link);
          items.push(item);
        }
      } catch (error) {
        logWarn('Failed to parse feed entry', { error: (error as Error).message });
      }
    }

    return items;
  }

  private parseEntry(entry: string, sourceName: string, isAtom: boolean, rawXml?: string): NewsItem | null {
    const title = this.extractTag(entry, 'title')?.replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    if (!title) return null;

    const link = this.extractLink(entry, isAtom);
    const pubDate = this.extractTag(entry, isAtom ? 'published' : 'pubDate') 
      || this.extractTag(entry, isAtom ? 'updated' : 'dc:date') 
      || new Date().toISOString();
    
    const description = this.extractTag(entry, isAtom ? 'summary' : 'description') 
      || this.extractTag(entry, isAtom ? 'content' : 'content:encoded')
      || '';
    
    const cleanDesc = description
      .replace(/<[^>]*>/g, '')
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .substring(0, 500)
      .trim();

    const categories = this.extractCategories(entry);

    const guid = this.extractGuid(entry, link, isAtom);

    const validation = safeValidate(NewsItemSchema, {
      title,
      link,
      source: sourceName,
      pubDate,
      description: cleanDesc,
      categories,
    });

    if (!validation.success) {
      logWarn('Invalid news item', { errors: validation.errors });
      return null;
    }

    return {
      ...validation.data!,
      pubDate: validation.data!.pubDate || pubDate, // Ensure it's not undefined
      description: validation.data!.description || '',
      guid,
      rawXml,
    } as NewsItem;
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

  private extractLink(entry: string, isAtom: boolean): string {
    if (isAtom) {
      const patterns = [
        /<link[^>]*rel="alternate"[^>]*href="([^"]*)"[^>]*>/,
        /<link[^>]*href="([^"]*)"[^>]*>/,
        /<link>([^<]+)<\/link>/,
      ];
      for (const pattern of patterns) {
        const match = entry.match(pattern);
        if (match) return match[1].trim();
      }
    } else {
      const match = entry.match(/<link>([^<]+)<\/link>/);
      if (match) return match[1].trim();
    }
    return '';
  }

  private extractGuid(entry: string, link: string, isAtom: boolean): string {
    if (isAtom) {
      const id = this.extractTag(entry, 'id');
      if (id) return id;
    } else {
      const guid = this.extractTag(entry, 'guid');
      if (guid) return guid;
    }
    return link;
  }

  private extractCategories(entry: string): string[] {
    const categories: string[] = [];
    const patterns = [
      /<category[^>]*>([^<]*)<\/category>/g,
      /<category[^>]*term="([^"]*)"[^>]*>/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(entry)) !== null) {
        const cat = match[1].trim();
        if (cat) categories.push(cat);
      }
    }

    return [...new Set(categories)];
  }

  private updateHealth(
    name: string,
    status: 'healthy' | 'degraded' | 'failed',
    itemCount: number,
    error?: string,
    responseTimeMs?: number
  ): void {
    this.feedHealth.set(name, {
      name,
      url: this.feeds.find(f => f.name === name)?.url || '',
      status,
      lastCheck: new Date().toISOString(),
      lastItemCount: itemCount,
      error,
      responseTimeMs,
    });
  }

  getFeedHealth(): FeedHealth[] {
    return Array.from(this.feedHealth.values());
  }

  addFeed(feed: FeedConfig): void {
    this.feeds.push(feed);
  }

  removeFeed(name: string): void {
    this.feeds = this.feeds.filter(f => f.name !== name);
    this.feedHealth.delete(name);
  }

  getFeeds(): FeedConfig[] {
    return [...this.feeds];
  }
}

export async function scanAllFeeds(
  config: BotConfig,
  checkpoints?: Record<string, RssCheckpoint>
): Promise<NewsItem[]> {
  const connector = RssConnector.fromConfig(config);
  return connector.fetchAll(checkpoints);
}

export async function scanNewsSources(config: BotConfig): Promise<NewsItem[]> {
  const connector = RssConnector.fromConfig(config);
  const items = await connector.fetchAll();

  // Filter by topics if topics exist in config
  if (config.topics && config.topics.length > 0) {
    const keywords = config.topics.map((t: string) => t.toLowerCase());
    const filtered = items.filter((item: NewsItem) => {
      const text = `${item.title} ${item.description || ''} ${item.categories.join(' ')}`.toLowerCase();
      return keywords.some(kw => text.includes(kw));
    });
    return filtered.slice(0, config.maxNewsItems);
  }

  return items.slice(0, config.maxNewsItems);
}

export function formatNewsForTelegram(items: NewsItem[], limit: number = 10): string {
  if (items.length === 0) {
    return '*No relevant news found*';
  }

  let msg = `*Recent Tech News*\n_Found ${items.length} relevant items_\n\n`;

  for (const item of items.slice(0, limit)) {
    msg += `*${escapeMarkdown(item.source)}*\\: ${escapeMarkdown(item.title)}\n`;
    if (item.description) {
      msg += `_${escapeMarkdown(item.description.substring(0, 120))}..._\n`;
    }
    msg += `[Read more](${item.link})\n\n`;
  }

  return msg;
}

function escapeMarkdown(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

