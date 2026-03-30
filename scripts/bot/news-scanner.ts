/**
 * RSS News scanner with proper validation and error handling
 * Fixed: Markdown escaping for URLs, input validation
 */

import { logError, logInfo, logWarn } from './logger';
import { withTimeout, withRetry } from './utils';
import { safeValidate, NewsItemSchema } from './validation';
import type { BotConfig } from './config';

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  description: string;
  categories: string[];
}

function parseRSS(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];
  
  // Handle both <item> (RSS 2.0) and <entry> (Atom)
  const itemRegex = /<(item|entry)>([\s\S]*?)<\/\1>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const entry = match[2];

    const title = extractXML(entry, 'title')?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || '';
    const link = extractLink(entry);
    const pubDate = extractXML(entry, 'pubDate') || extractXML(entry, 'published') || extractXML(entry, 'updated') || '';
    const description = extractXML(entry, 'description') || extractXML(entry, 'summary') || extractXML(entry, 'content') || '';
    
    const cleanDescription = description
      .replace(/<[^>]*>/g, '')
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .substring(0, 300)
      .trim();

    const catMatches = entry.match(/<(category|subject)[^>]*>(.*?)<\/\1>/g) || [];
    const categories = catMatches.map(c =>
      c.replace(/<[^>]*>/g, '').trim()
    ).filter(Boolean);

    if (title && link) {
      const validation = safeValidate(NewsItemSchema, {
        title,
        link,
        source: sourceName,
        pubDate,
        description: cleanDescription,
        categories,
      });

      if (validation.success) {
        items.push(validation.data!);
      }
    }
  }

  return items;
}

function extractXML(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].trim() : null;
}

function extractLink(entry: string): string {
  // Try different link formats
  const patterns = [
    /<link>([^<]+)<\/link>/,
    /<link[^>]+href="([^"]+)"/,
    /<link[^>]+rel="alternate"[^>]+href="([^"]+)"/,
  ];

  for (const pattern of patterns) {
    const match = entry.match(pattern);
    if (match) return match[1].trim();
  }

  return '';
}

export async function scanNewsSources(config: BotConfig): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];
  const seen = new Set<string>();

  for (const source of config.sources) {
    if (source.type !== 'rss') continue;

    try {
      logInfo(`Scanning ${source.name}...`);

      const items = await withRetry(
        () => fetchAndParseSource(source),
        {
          maxRetries: 2,
          baseDelay: 1000,
          onRetry: (error, attempt) => {
            logWarn(`Retrying ${source.name} (attempt ${attempt})`, { error: error.message });
          },
        }
      );

      for (const item of items) {
        if (!seen.has(item.link)) {
          seen.add(item.link);
          allItems.push(item);
        }
      }

      logInfo(`Found ${items.length} items from ${source.name}`);
    } catch (error) {
      logError(`Error scanning ${source.name}`, error as Error);
    }
  }

  // Filter by topics relevance
  const topicKeywords = config.topics.flatMap(t => t.toLowerCase().split(/\s+/));

  const scored = allItems.map(item => {
    const text = `${item.title} ${item.description} ${item.categories.join(' ')}`.toLowerCase();
    const matches = topicKeywords.filter(kw => text.includes(kw)).length;
    return { item, score: matches };
  });

  scored.sort((a, b) => b.score - a.score);

  // Return top relevant items
  return scored
    .filter(s => s.score > 0)
    .slice(0, config.maxNewsItems || 20)
    .map(s => s.item);
}

async function fetchAndParseSource(source: { name: string; url: string }): Promise<NewsItem[]> {
  return withTimeout(
    async () => {
      const res = await fetch(source.url, {
        headers: { 
          'User-Agent': 'JLMT-Bot/1.0 (Research Assistant)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const xml = await res.text();
      
      if (!xml.includes('<') || !xml.includes('>')) {
        throw new Error('Invalid XML response');
      }

      return parseRSS(xml, source.name);
    },
    15000, // 15 second timeout
    `Timeout scanning ${source.name}`
  );
}

/**
 * Format news items for Telegram
 * Fixed: Proper markdown escaping that doesn't break URLs
 */
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

/**
 * Escape markdown characters for Telegram
 * Fixed: Only escapes text, not URLs
 */
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
