/**
 * HackerNews Connector
 * 
 * Features:
 * - Use HN API (not just RSS)
 * - Filter by technical keywords
 * - Save score + comments
 * - Detect posts without URL
 *
 * @module infrastructure/connectors/HackerNewsConnector
 */

import { logError, logInfo, logWarn } from '../logging/Logger';
import { withRetry, withTimeout } from '../../shared/utils';
import { validateUrl } from '../../shared/security';

export interface HackerNewsItem {
  id: number;
  title: string;
  url?: string;
  text?: string;
  by: string;
  score: number;
  descendants: number;
  time: number;
  type: 'story' | 'job' | 'poll';
  kids?: number[];
  poll?: number;
  hasUrl: boolean;
}

export interface HackerNewsQuery {
  keywords: string[];
  maxResults?: number;
  minScore?: number;
}

export interface HnCheckpoint {
  lastId?: number;
  lastRun: string;
}

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';
const RATE_LIMIT_MS = 1000;
const TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;

const TECH_KEYWORDS = [
  'robotics', 'control', 'FPGA', 'embedded', 'distributed', 'consensus',
  'machine learning', 'neural', 'reinforcement', 'AI', 'LLM', 'transformer',
  'systems', 'kernel', 'database', 'distributed systems', 'microservices',
  'kubernetes', 'docker', 'devops', 'infrastructure', 'cloud', 'aws',
  'firmware', 'real-time', 'RTOS', 'arduino', 'ESP32', 'raspberry pi',
  'network', 'protocol', 'MQTT', 'OPC-UA', 'CAN', 'I2C', 'SPI',
  'power electronics', 'inverter', 'converter', 'motor', 'drive',
  'signal processing', 'DSP', 'filter', 'estimation', 'Kalman', 'SVD',
  'optimization', 'control theory', 'Lyapunov', 'MPC', 'PID',
  'wireless', '5G', 'LoRa', 'mesh', 'sensor', 'fusion',
];

export class HackerNewsConnector {
  private lastRequestTime = 0;
  private keywordFilters: string[];

  constructor(keywords: string[] = TECH_KEYWORDS) {
    this.keywordFilters = keywords.map(k => k.toLowerCase());
  }

  async fetchTopStories(limit = 30): Promise<number[]> {
    return withTimeout(
      () => this.fetchWithRetry(`${HN_API_BASE}/topstories.json`),
      TIMEOUT_MS,
      'HN fetch timeout'
    ).then(text => JSON.parse(text));
  }

  async fetchItem(id: number): Promise<HackerNewsItem | null> {
    return withTimeout(
      () => this.fetchWithRetry(`${HN_API_BASE}/item/${id}.json`),
      TIMEOUT_MS,
      'HN item fetch timeout'
    ).then(text => {
      if (!text || text === 'null') return null;
      const item = JSON.parse(text);
      return this.enrichItem(item);
    });
  }

  async fetchNewStories(limit = 30): Promise<number[]> {
    return withTimeout(
      () => this.fetchWithRetry(`${HN_API_BASE}/newstories.json`),
      TIMEOUT_MS,
      'HN fetch timeout'
    ).then(text => JSON.parse(text));
  }

  private enrichItem(item: any): HackerNewsItem {
    const hasUrl = !!(item.url && item.url.length > 0);
    
    return {
      id: item.id,
      title: item.title || 'Untitled',
      url: item.url,
      text: item.text,
      by: item.by,
      score: item.score || 0,
      descendants: item.descendants || 0,
      time: item.time,
      type: item.type || 'story',
      kids: item.kids,
      poll: item.poll,
      hasUrl,
    };
  }

  async fetchAndFilter(
    query: HackerNewsQuery,
    checkpoint?: HnCheckpoint
  ): Promise<HackerNewsItem[]> {
    const maxResults = query.maxResults || 30;
    const minScore = query.minScore || 1;

    await this.applyRateLimit();
    
    logInfo('Fetching HN stories', { maxResults, minScore });

    const storyIds = await this.fetchTopStories(maxResults * 2);
    
    const items: HackerNewsItem[] = [];
    
    for (const id of storyIds.slice(0, maxResults * 2)) {
      if (checkpoint?.lastId && id <= checkpoint.lastId) {
        continue;
      }

      await this.applyRateLimit();

      const item = await this.fetchItem(id);
      
      if (!item || item.type !== 'story') continue;
      if (item.score < minScore) continue;
      if (!item.hasUrl && !item.text) continue;

      const filtered = this.filterByKeywords(item, query.keywords);
      if (filtered) {
        items.push(filtered);
      }

      if (items.length >= maxResults) break;
    }

    logInfo('HN filter results', { total: items.length, minScore });
    return items;
  }

  private filterByKeywords(item: HackerNewsItem, extraKeywords: string[] = []): HackerNewsItem | null {
    const allKeywords = [...this.keywordFilters, ...extraKeywords.map(k => k.toLowerCase())];
    
    const textToSearch = `${item.title} ${item.text || ''} ${item.url || ''}`.toLowerCase();
    
    const matches = allKeywords.filter(kw => textToSearch.includes(kw));
    
    if (matches.length === 0 && item.score < 10) {
      return null;
    }

    return item;
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
          },
        });

        if (!res.ok) {
          throw new Error(`HN API error: ${res.status}`);
        }

        return res.text();
      },
      {
        maxRetries: MAX_RETRIES,
        baseDelay: 500,
        onRetry: (error, attempt) => {
          logWarn(`Retrying HN request (attempt ${attempt})`, { error: error.message });
        },
      }
    )();
  }

  static formatForTelegram(items: HackerNewsItem[], limit = 10): string {
    if (items.length === 0) {
      return '*No relevant HackerNews items*';
    }

    let msg = `*HackerNews Tech Stories*\n_Found ${items.length} relevant items_\n\n`;

    for (const item of items.slice(0, limit)) {
      const scoreEmoji = item.score > 100 ? 'ðŸ”¥' : item.score > 50 ? 'â¬†ï¸' : 'ðŸ“ˆ';
      msg += `${scoreEmoji} *${escapeMarkdown(item.title)}*\n`;
      msg += `â¬†ï¸ ${item.score} points | ðŸ’¬ ${item.descendants} comments\n`;
      
      if (item.url) {
        msg += `[${new URL(item.url).hostname}](${item.url})\n`;
      } else if (item.text) {
        const cleanText = item.text.replace(/<[^>]*>/g, '').substring(0, 100);
        msg += `_${cleanText}..._\n`;
        msg += `[HN Discussion](https://news.ycombinator.com/item?id=${item.id})\n`;
      }
      
      msg += '\n';
    }

    return msg;
  }
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

