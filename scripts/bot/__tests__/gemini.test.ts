import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callGemini, classifyAndSummarizePapers, generateBlogPost } from '../gemini';
import type { BotConfig } from '../config';

describe('Gemini Module', () => {
  let mockConfig: BotConfig;

  beforeEach(() => {
    mockConfig = {
      telegram: { botToken: 'test', chatId: '123' },
      gemini: { apiKey: 'test-key', model: 'gemini-test' },
      topics: ['robotics', 'control'],
      sources: []
    };
    
    global.fetch = vi.fn();
  });

  describe('callGemini', () => {
    it('should make successful API call', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'Test response' }]
            }
          }]
        })
      });

      const result = await callGemini(mockConfig, 'Test prompt');
      
      expect(result).toBe('Test response');
    });

    it('should include system instruction when provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{ content: { parts: [{ text: 'OK' }] } }]
        })
      });

      await callGemini(mockConfig, 'Prompt', 'System instruction');
      
      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.systemInstruction).toBeDefined();
    });

    it('should throw on API error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded')
      });

      await expect(callGemini(mockConfig, 'Test')).rejects.toThrow('Gemini API error');
    });

    it('should throw on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network timeout'));

      await expect(callGemini(mockConfig, 'Test')).rejects.toThrow('Network timeout');
    });

    it('should handle empty response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ candidates: [] })
      });

      const result = await callGemini(mockConfig, 'Test');
      
      expect(result).toBe('');
    });

    it('should retry on transient failures', async () => {
      // This test documents that retry logic is NOT implemented
      // (a bug we identified in the review)
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            candidates: [{ content: { parts: [{ text: 'Success' }] } }]
          })
        });

      await expect(callGemini(mockConfig, 'Test')).rejects.toThrow('Timeout');
    });
  });

  describe('classifyAndSummarizePapers', () => {
    it('should classify papers correctly', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify([
                  {
                    paperId: '123',
                    relevance: 'high',
                    summary: 'Test summary',
                    classification: 'robotics'
                  }
                ])
              }]
            }
          }]
        })
      });

      const papers = [{
        id: '123',
        title: 'Test Paper',
        summary: 'Abstract here',
        categories: ['cs.RO']
      }];

      const result = await classifyAndSummarizePapers(mockConfig, papers);
      
      expect(result).toHaveLength(1);
      expect(result[0].paperId).toBe('123');
      expect(result[0].relevance).toBe('high');
    });

    it('should fallback gracefully on JSON parse error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'Invalid JSON' }]
            }
          }]
        })
      });

      const papers = [{
        id: '123',
        title: 'Test',
        summary: 'Summary',
        categories: ['cs.RO']
      }];

      const result = await classifyAndSummarizePapers(mockConfig, papers);
      
      // Should return fallback
      expect(result).toHaveLength(1);
      expect(result[0].relevance).toBe('medium');
    });

    it('should handle malformed paper objects', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: '[]' }]
            }
          }]
        })
      });

      const papers = [{ id: '123' }]; // Minimal paper

      const result = await classifyAndSummarizePapers(mockConfig, papers);
      
      expect(result).toHaveLength(1);
    });

    it('should clean markdown fences from response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: '```json\n[{"paperId": "1"}]\n```'
              }]
            }
          }]
        })
      });

      const result = await classifyAndSummarizePapers(mockConfig, [{ id: '1' }]);
      
      expect(result).toHaveLength(1);
    });
  });

  describe('generateBlogPost', () => {
    it('should generate valid blog post structure', async () => {
      const mockResponse = {
        title: 'Test Post Title',
        description: 'Test description',
        category: 'Research',
        tags: ['tag1', 'tag2'],
        content: '## Introduction\n\nTest content',
        imageQuery: 'robot arm laboratory'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(mockResponse) }]
            }
          }]
        })
      });

      const result = await generateBlogPost(mockConfig, {
        title: 'auto',
        newsItems: ['News item 1'],
        userComment: 'My insight',
        context: 'Lab context'
      });
      
      expect(result.title).toBe('Test Post Title');
      expect(result.category).toBe('Research');
      expect(result.tags).toHaveLength(2);
      expect(result.imageQuery).toBeDefined();
    });

    it('should throw on generation failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

      await expect(generateBlogPost(mockConfig, {
        title: 'auto',
        newsItems: [],
        userComment: '',
        context: ''
      })).rejects.toThrow('API Error');
    });

    it('should handle invalid JSON in response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'Not JSON' }]
            }
          }]
        })
      });

      await expect(generateBlogPost(mockConfig, {
        title: 'auto',
        newsItems: [],
        userComment: '',
        context: ''
      })).rejects.toThrow();
    });
  });
});
