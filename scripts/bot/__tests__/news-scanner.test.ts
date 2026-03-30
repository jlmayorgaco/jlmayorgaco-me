import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanNewsSources, formatNewsForTelegram, type NewsItem } from '../news-scanner';
import type { BotConfig } from '../config';

describe('News Scanner Module', () => {
  let mockConfig: BotConfig;

  beforeEach(() => {
    mockConfig = {
      telegram: { botToken: 'test', chatId: '123' },
      gemini: { apiKey: 'test', model: 'test' },
      topics: ['robotics', 'distributed control', 'FPGA'],
      sources: [
        { name: 'Test Source', url: 'https://example.com/feed', type: 'rss' }
      ]
    };

    global.fetch = vi.fn();
  });

  describe('parseRSS', () => {
    it('should parse valid RSS feed', async () => {
      const rssXml = `<?xml version="1.0"?>
        <rss>
          <channel>
            <item>
              <title>Robotics Article</title>
              <link>https://example.com/article</link>
              <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
              <description>Test description about robotics research</description>
            </item>
          </channel>
        </rss>`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(rssXml)
      });

      const result = await scanNewsSources(mockConfig);
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Robotics Article');
    });

    it('should parse CDATA content', async () => {
      const rssXml = `<?xml version="1.0"?>
        <rss>
          <channel>
            <item>
              <title><![CDATA[Robotics Control System Update]]></title>
              <link>https://example.com</link>
              <description><![CDATA[<p>HTML content</p>]]></description>
            </item>
          </channel>
        </rss>`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(rssXml)
      });

      const result = await scanNewsSources(mockConfig);
      
      expect(result[0].title).toBe('Robotics Control System Update');
      expect(result[0].description).not.toContain('<p>');
    });

    it('should filter items by topic relevance', async () => {
      const rssXml = `<?xml version="1.0"?>
        <rss>
          <channel>
            <item>
              <title>Robotics Article</title>
              <link>https://example.com/1</link>
              <description>About robotics</description>
            </item>
            <item>
              <title>Cooking Recipe</title>
              <link>https://example.com/2</link>
              <description>How to cook pasta</description>
            </item>
          </channel>
        </rss>`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(rssXml)
      });

      const result = await scanNewsSources(mockConfig);
      
      // Should only return robotics article
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(r => r.title.includes('Robotics'))).toBe(true);
      expect(result.some(r => r.title.includes('Cooking'))).toBe(false);
    });

    it('should deduplicate items by link', async () => {
      const rssXml = `<?xml version="1.0"?>
        <rss>
          <channel>
            <item>
              <title>Robotics Duplicate Topic</title>
              <link>https://example.com/same</link>
            </item>
            <item>
              <title>Robotics Duplicate Topic</title>
              <link>https://example.com/same</link>
            </item>
          </channel>
        </rss>`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(rssXml)
      });

      const result = await scanNewsSources(mockConfig);
      
      expect(result).toHaveLength(1);
    });

    it('should handle HTTP errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await scanNewsSources(mockConfig);
      
      expect(result).toEqual([]);
    });

    it('should handle network timeouts', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Timeout'));

      const result = await scanNewsSources(mockConfig);
      
      expect(result).toEqual([]);
    });

    it('should handle malformed XML gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('not valid xml')
      });

      const result = await scanNewsSources(mockConfig);
      
      expect(result).toEqual([]);
    });

    it('should limit to top 20 relevant items', async () => {
      let items = '';
      for (let i = 0; i < 30; i++) {
        items += `
          <item>
            <title>Robotics Article ${i}</title>
            <link>https://example.com/${i}</link>
            <description>About robotics</description>
          </item>`;
      }

      const rssXml = `<?xml version="1.0"?>
        <rss>
          <channel>${items}</channel>
        </rss>`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(rssXml)
      });

      const result = await scanNewsSources(mockConfig);
      
      expect(result.length).toBeLessThanOrEqual(20);
    });
  });

  describe('formatNewsForTelegram', () => {
    it('should format news items for Telegram', () => {
      const items: NewsItem[] = [
        {
          title: 'Test Article',
          link: 'https://example.com',
          source: 'Test Source',
          pubDate: '',
          description: 'Test description',
          categories: []
        }
      ];

      const formatted = formatNewsForTelegram(items);
      
      expect(formatted).toContain('Test Article');
      expect(formatted).toContain('Test Source');
    });

    it('should limit to specified number of items', () => {
      const items: NewsItem[] = Array.from({ length: 15 }, (_, i) => ({
        title: `Article ${i}`,
        link: `https://example.com/${i}`,
        source: 'Source',
        pubDate: '',
        description: '',
        categories: []
      }));

      const formatted = formatNewsForTelegram(items, 5);
      
      expect(formatted.match(/Article/g)?.length).toBeLessThanOrEqual(5);
    });

    it('should escape markdown characters', () => {
      const items: NewsItem[] = [{
        title: 'Title with *special* chars',
        link: 'https://example.com',
        source: 'Source',
        pubDate: '',
        description: '',
        categories: []
      }];

      const formatted = formatNewsForTelegram(items);
      
      // Should escape asterisks
      expect(formatted).toContain('\\*');
    });

    it('should handle empty items array', () => {
      const formatted = formatNewsForTelegram([]);
      
      expect(formatted).toContain('No relevant news found');
    });

    it('should truncate long descriptions', () => {
      const items: NewsItem[] = [{
        title: 'Title',
        link: 'https://example.com',
        source: 'Source',
        pubDate: '',
        description: 'a'.repeat(500),
        categories: []
      }];

      const formatted = formatNewsForTelegram(items);
      
      expect(formatted.length).toBeLessThan(500);
    });
  });
});
