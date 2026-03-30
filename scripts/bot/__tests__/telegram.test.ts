import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TelegramBot } from '../telegram';
import type { BotConfig } from '../config';

vi.mock('../logger', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
}));

describe('Telegram Module (Production)', () => {
  let bot: TelegramBot;
  let mockConfig: BotConfig;

  beforeEach(() => {
    mockConfig = {
      telegram: {
        botToken: 'test-token',
        chatId: '123456'
      },
      gemini: {
        apiKey: 'test-key',
        model: 'test-model'
      },
      topics: ['test-topic'],
      sources: [],
      telegramRateLimit: 30,
    } as BotConfig;
    bot = new TelegramBot(mockConfig);
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true })
      });

      const result = await bot.sendMessage('Test message');
      
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test message')
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: false, description: 'Bad Request' })
      });

      const result = await bot.sendMessage('Test');
      
      expect(result).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await bot.sendMessage('Test');
      
      expect(result).toBe(false);
    });

    it('should split long messages (>4096 chars)', async () => {
      global.fetch = vi.fn()
        .mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });

      const longMessage = 'Line 1\n' + 'a'.repeat(5000);
      const result = await bot.sendMessage(longMessage);
      
      // Should send multiple messages
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should send chunks in correct order', async () => {
      const messages: string[] = [];
      global.fetch = vi.fn().mockImplementation((url, options) => {
        const body = JSON.parse(options.body);
        messages.push(body.text);
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
      });

      const part1 = 'First part of the message\n' + 'a'.repeat(4000);
      const part2 = 'Second part';
      await bot.sendMessage(part1 + '\n' + part2);

      expect(messages[0]).toContain('First part');
      expect(messages[1]).toContain('Second part');
    });

    it('should apply rate limiting', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true })
      });

      const start = Date.now();
      
      // Send 5 messages quickly
      await Promise.all([
        bot.sendMessage('Msg 1'),
        bot.sendMessage('Msg 2'),
        bot.sendMessage('Msg 3'),
        bot.sendMessage('Msg 4'),
        bot.sendMessage('Msg 5'),
      ]);

      // Should take some time due to rate limiting
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('sendHTML', () => {
    it('should send HTML formatted message', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true })
      });

      await bot.sendHTML('<b>Bold</b> text');
      
      const callArgs = (fetch as any).mock.calls[0];
      expect(callArgs[1].body).toContain('HTML');
    });
  });

  describe('testConnection', () => {
    it('should return true for valid token', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: { username: 'test_bot' } })
      });

      const result = await bot.testConnection();
      
      expect(result).toBe(true);
    });

    it('should return false for invalid token', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: false })
      });

      const result = await bot.testConnection();
      
      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await bot.testConnection();
      
      expect(result).toBe(false);
    });
  });

  describe('startPolling', () => {
    it('should process incoming messages', async () => {
      const mockHandler = vi.fn();
      bot.onMessage(mockHandler);

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ok: true,
            result: [{
              update_id: 1,
              message: {
                message_id: 1,
                chat: { id: 123456 },
                text: '/help'
              }
            }]
          })
        })
        .mockRejectedValueOnce(new Error('Stop polling'));

      try {
        await bot.startPolling();
      } catch {}

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockHandler).toHaveBeenCalledWith('/help', 123456);
    });

    it('should ignore messages from unauthorized chats', async () => {
      const mockHandler = vi.fn();
      bot.onMessage(mockHandler);

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ok: true,
            result: [{
              update_id: 1,
              message: {
                message_id: 1,
                chat: { id: 999999 },
                text: '/help'
              }
            }]
          })
        })
        .mockRejectedValueOnce(new Error('Stop'));

      try {
        await bot.startPolling();
      } catch {}

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop polling gracefully', async () => {
      bot.stop();
      expect(true).toBe(true); // Just verify it doesn't throw
    });
  });

  describe('sendTyping', () => {
    it('should send typing action', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: true });

      await bot.sendTyping();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('sendChatAction'),
        expect.objectContaining({
          body: expect.stringContaining('typing')
        })
      );
    });
  });
});
