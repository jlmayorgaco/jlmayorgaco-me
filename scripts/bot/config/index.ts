/**
 * Configuration management with environment variables and validation
 * @module config
 *
 * Centralizes all bot configuration:
 * - Telegram credentials
 * - Gemini/LLM credentials
 * - Source feeds
 * - Operational settings
 *
 * Environment variables are validated with Zod.
 * Falls back to .env.json for legacy support (deprecated).
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

// Load .env file if it exists (for local development)
dotenv.config();

// --- Zod schemas ---

const TelegramConfigSchema = z.object({
  botToken: z.string().min(1, 'Telegram bot token is required'),
  chatId: z.string().min(1, 'Telegram chat ID is required'),
});

const GeminiConfigSchema = z.object({
  apiKey: z.string().min(1, 'Gemini API key is required'),
  model: z.string().default('gemini-2.0-flash'),
});

const NewsSourceSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  type: z.enum(['rss', 'api']),
});

const BotConfigSchema = z.object({
  telegram: TelegramConfigSchema,
  gemini: GeminiConfigSchema,
  topics: z.array(z.string()).default([
    'distributed control systems',
    'multi-agent robotics',
    'FPGA real-time control',
    'frequency estimation power systems',
    'Kalman filter state estimation',
    'embedded systems ESP32',
    'collaborative robotics',
    'graph theory control',
  ]),
  sources: z.array(NewsSourceSchema).default([
    { name: 'Hacker News', url: 'https://hnrss.org/newest?q=robotics+OR+control+OR+FPGA', type: 'rss' },
    { name: 'IEEE Spectrum', url: 'https://spectrum.ieee.org/feeds/feed.rss', type: 'rss' },
    { name: 'Robotics Today', url: 'https://robohub.org/feed/', type: 'rss' },
  ]),
  // Operational settings
  sessionTtlMinutes: z.number().default(30),
  maxPapersToScan: z.number().default(10),
  topPapersToShow: z.number().default(3),
  maxNewsItems: z.number().default(20),
  telegramRateLimit: z.number().default(30),
  geminiTimeoutMs: z.number().default(30000),
  retryAttempts: z.number().default(3),
  retryBaseDelayMs: z.number().default(1000),
});

export type BotConfig = z.infer<typeof BotConfigSchema>;
export type TelegramConfig = z.infer<typeof TelegramConfigSchema>;
export type GeminiConfig = z.infer<typeof GeminiConfigSchema>;

// --- Config loaders ---

export async function loadConfig(): Promise<BotConfig> {
  const envConfig = loadFromEnvironment();

  if (envConfig.telegram.botToken && envConfig.gemini.apiKey) {
    return validateConfig(envConfig);
  }

  const fileConfig = await loadFromFile();

  const mergedConfig = {
    telegram: {
      botToken: envConfig.telegram.botToken || fileConfig.telegram?.botToken,
      chatId: envConfig.telegram.chatId || fileConfig.telegram?.chatId,
    },
    gemini: {
      apiKey: envConfig.gemini.apiKey || fileConfig.gemini?.apiKey,
      model: envConfig.gemini.model || fileConfig.gemini?.model || 'gemini-2.0-flash',
    },
    topics: envConfig.topics || fileConfig.topics,
    sources: envConfig.sources || fileConfig.sources,
    sessionTtlMinutes: envConfig.sessionTtlMinutes || fileConfig.sessionTtlMinutes,
    maxPapersToScan: envConfig.maxPapersToScan || fileConfig.maxPapersToScan,
    topPapersToShow: envConfig.topPapersToShow || fileConfig.topPapersToShow,
    maxNewsItems: envConfig.maxNewsItems || fileConfig.maxNewsItems,
    telegramRateLimit: envConfig.telegramRateLimit || fileConfig.telegramRateLimit,
    geminiTimeoutMs: envConfig.geminiTimeoutMs || fileConfig.geminiTimeoutMs,
    retryAttempts: envConfig.retryAttempts || fileConfig.retryAttempts,
    retryBaseDelayMs: envConfig.retryBaseDelayMs || fileConfig.retryBaseDelayMs,
  };

  return validateConfig(mergedConfig);
}

function loadFromEnvironment(): Partial<BotConfig> {
  return {
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: process.env.TELEGRAM_CHAT_ID || '',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    },
    topics: process.env.BOT_TOPICS?.split(',').map(t => t.trim()),
    sessionTtlMinutes: process.env.SESSION_TTL_MINUTES ? parseInt(process.env.SESSION_TTL_MINUTES, 10) : undefined,
    maxPapersToScan: process.env.MAX_PAPERS_SCAN ? parseInt(process.env.MAX_PAPERS_SCAN, 10) : undefined,
    topPapersToShow: process.env.TOP_PAPERS_SHOW ? parseInt(process.env.TOP_PAPERS_SHOW, 10) : undefined,
    maxNewsItems: process.env.MAX_NEWS_ITEMS ? parseInt(process.env.MAX_NEWS_ITEMS, 10) : undefined,
    telegramRateLimit: process.env.TELEGRAM_RATE_LIMIT ? parseInt(process.env.TELEGRAM_RATE_LIMIT, 10) : undefined,
    geminiTimeoutMs: process.env.GEMINI_TIMEOUT_MS ? parseInt(process.env.GEMINI_TIMEOUT_MS, 10) : undefined,
    retryAttempts: process.env.RETRY_ATTEMPTS ? parseInt(process.env.RETRY_ATTEMPTS, 10) : undefined,
    retryBaseDelayMs: process.env.RETRY_BASE_DELAY_MS ? parseInt(process.env.RETRY_BASE_DELAY_MS, 10) : undefined,
  };
}

/** @deprecated Use environment variables instead. */
async function loadFromFile(): Promise<Partial<BotConfig>> {
  const configPath = path.join(process.cwd(), '.env.json');

  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    const parsed = JSON.parse(raw);

    console.warn('⚠️  DEPRECATED: Using .env.json. Migrate to environment variables.');
    console.warn('   Set TELEGRAM_BOT_TOKEN, GEMINI_API_KEY, TELEGRAM_CHAT_ID as env vars.');

    return parsed;
  } catch {
    return {};
  }
}

function validateConfig(config: Partial<BotConfig>): BotConfig {
  try {
    return BotConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
      throw new Error(
        `Configuration validation failed:\n${issues}\n\n` +
          'Required environment variables:\n' +
          '- TELEGRAM_BOT_TOKEN\n' +
          '- GEMINI_API_KEY\n' +
          '- TELEGRAM_CHAT_ID\n\n' +
          'Optional:\n' +
          '- GEMINI_MODEL (default: gemini-2.0-flash)\n' +
          '- BOT_TOPICS (comma-separated)\n' +
          '- SESSION_TTL_MINUTES (default: 30)\n' +
          '- MAX_PAPERS_SCAN (default: 10)\n' +
          '- TELEGRAM_RATE_LIMIT (default: 30)',
      );
    }
    throw error;
  }
}

export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const required = ['TELEGRAM_BOT_TOKEN', 'GEMINI_API_KEY', 'TELEGRAM_CHAT_ID'];
  const missing = required.filter(key => !process.env[key]);
  return { valid: missing.length === 0, missing };
}

export function getSafeConfig(config: BotConfig): Omit<BotConfig, 'telegram' | 'gemini'> & {
  telegram: { chatId: string; tokenConfigured: boolean };
  gemini: { model: string; keyConfigured: boolean };
} {
  return {
    ...config,
    telegram: {
      chatId: config.telegram.chatId,
      tokenConfigured: !!config.telegram.botToken,
    },
    gemini: {
      model: config.gemini.model,
      keyConfigured: !!config.gemini.apiKey,
    },
  };
}
