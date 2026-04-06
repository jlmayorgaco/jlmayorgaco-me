import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, validateEnvironment, type BotConfig } from '../config/index';

describe('Config Module (Production)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear relevant env vars before each test
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.GEMINI_API_KEY;
    delete process.env.TELEGRAM_CHAT_ID;
    delete process.env.GEMINI_MODEL;
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  it('should load config from environment variables', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token-12345';
    process.env.GEMINI_API_KEY = 'test-api-key';
    process.env.TELEGRAM_CHAT_ID = '123456789';
    process.env.GEMINI_MODEL = 'gemini-test';

    const config = await loadConfig();
    
    expect(config.telegram.botToken).toBe('test-token-12345');
    expect(config.gemini.apiKey).toBe('test-api-key');
    expect(config.telegram.chatId).toBe('123456789');
    expect(config.gemini.model).toBe('gemini-test');
  });

  it('should use default values for optional settings', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.TELEGRAM_CHAT_ID = '123';

    const config = await loadConfig();
    
    expect(config.gemini.model).toBe('gemini-2.0-flash');
    expect(config.sessionTtlMinutes).toBe(30);
    expect(config.maxPapersToScan).toBe(10);
    expect(config.telegramRateLimit).toBe(30);
    expect(config.retryAttempts).toBe(3);
  });

  it('should parse integer environment variables', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.TELEGRAM_CHAT_ID = '123';
    process.env.SESSION_TTL_MINUTES = '60';
    process.env.MAX_PAPERS_SCAN = '20';
    process.env.TELEGRAM_RATE_LIMIT = '50';

    const config = await loadConfig();
    
    expect(config.sessionTtlMinutes).toBe(60);
    expect(config.maxPapersToScan).toBe(20);
    expect(config.telegramRateLimit).toBe(50);
  });

  it('should parse topics from comma-separated string', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.TELEGRAM_CHAT_ID = '123';
    process.env.BOT_TOPICS = 'robotics, control systems, FPGA';

    const config = await loadConfig();
    
    expect(config.topics).toEqual(['robotics', 'control systems', 'FPGA']);
  });

  it('should throw error for missing required env vars', async () => {
    await expect(loadConfig()).rejects.toThrow('Configuration validation failed');
  });

  it('should throw error for empty required values', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '';
    process.env.GEMINI_API_KEY = 'valid';
    process.env.TELEGRAM_CHAT_ID = 'valid';

    await expect(loadConfig()).rejects.toThrow('TELEGRAM_BOT_TOKEN');
  });
});

describe('validateEnvironment', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.GEMINI_API_KEY;
    delete process.env.TELEGRAM_CHAT_ID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should return valid when all required vars are set', () => {
    process.env.TELEGRAM_BOT_TOKEN = 'token';
    process.env.GEMINI_API_KEY = 'key';
    process.env.TELEGRAM_CHAT_ID = 'chat';

    const result = validateEnvironment();
    
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('should return invalid when vars are missing', () => {
    process.env.TELEGRAM_BOT_TOKEN = 'token';
    // Missing GEMINI_API_KEY and TELEGRAM_CHAT_ID

    const result = validateEnvironment();
    
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('GEMINI_API_KEY');
    expect(result.missing).toContain('TELEGRAM_CHAT_ID');
  });

  it('should return invalid when vars are empty strings', () => {
    process.env.TELEGRAM_BOT_TOKEN = 'token';
    process.env.GEMINI_API_KEY = '';
    process.env.TELEGRAM_CHAT_ID = 'chat';

    const result = validateEnvironment();
    
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('GEMINI_API_KEY');
  });
});

