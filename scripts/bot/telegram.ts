/**
 * Telegram Bot client with rate limiting and retry logic
 * Production-ready: prevents rate limit violations, connection pooling
 */

import { logError, logInfo, logWarn } from './logger';
import { TokenBucket } from './utils';
import { sanitizeForTelegram } from './validation';
import type { BotConfig } from './config';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
    from?: { first_name: string; id: number };
    voice?: {
      file_id: string;
      file_unique_id: string;
      duration: number;
      mime_type?: string;
      file_size?: number;
    };
    audio?: {
      file_id: string;
      file_unique_id: string;
      duration: number;
      mime_type?: string;
      file_size?: number;
    };
    video_note?: {
      file_id: string;
      file_unique_id: string;
      duration: number;
      file_size?: number;
    };
  };
}

interface TelegramApiResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
  error_code?: number;
}

const TELEGRAM_API = 'https://api.telegram.org/bot';
const MAX_MESSAGE_LENGTH = 4096;

export class TelegramBot {
  private token: string;
  private chatId: string;
  private offset: number = 0;
  private running: boolean = false;
  private messageHandler: ((text: string, chatId: number) => Promise<void>) | null = null;
  private voiceHandler: ((fileId: string, chatId: number) => Promise<void>) | null = null;
  private rateLimiter: TokenBucket;
  private abortController: AbortController | null = null;

  constructor(config: BotConfig) {
    this.token = config.telegram.botToken;
    this.chatId = config.telegram.chatId;
    // Telegram rate limit: 30 messages per second
    this.rateLimiter = new TokenBucket(
      config.telegramRateLimit || 30,
      config.telegramRateLimit || 30,
      1000
    );
  }

  private url(method: string): string {
    return `${TELEGRAM_API}${this.token}/${method}`;
  }

  /**
   * Send a message with rate limiting and chunking for long messages
   */
  async sendMessage(text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<boolean> {
    try {
      // Wait for rate limit token
      await this.rateLimiter.consume();

      // Split long messages
      if (text.length > MAX_MESSAGE_LENGTH) {
        return this.sendChunkedMessage(text, parseMode);
      }

      const res = await fetch(this.url('sendMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: false,
        }),
      });

      const data: TelegramApiResponse = await res.json();

      if (!data.ok) {
        logWarn('Telegram API error', { 
          error: data.description, 
          code: data.error_code 
        });
        return false;
      }

      return true;
    } catch (e) {
      logError('Send message failed', e as Error);
      return false;
    }
  }

  /**
   * Send HTML formatted message
   */
  async sendHTML(text: string): Promise<boolean> {
    return this.sendMessage(text, 'HTML');
  }

  /**
   * Send long message in chunks
   */
  private async sendChunkedMessage(text: string, parseMode: 'Markdown' | 'HTML'): Promise<boolean> {
    const chunks: string[] = [];
    let currentChunk = '';

    // Split by newlines to keep logical breaks
    const lines = text.split('\n');

    for (const line of lines) {
      if (currentChunk.length + line.length + 1 > MAX_MESSAGE_LENGTH) {
        chunks.push(currentChunk.trim());
        currentChunk = line;
      } else {
        currentChunk += '\n' + line;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    // Send chunks sequentially
    for (let i = 0; i < chunks.length; i++) {
      const success = await this.sendSingleMessage(
        chunks[i],
        parseMode,
        i === chunks.length - 1
      );
      
      if (!success) {
        logError('Failed to send message chunk', undefined, { chunk: i });
        return false;
      }

      // Small delay between chunks to avoid rate limits
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return true;
  }

  private async sendSingleMessage(
    text: string,
    parseMode: 'Markdown' | 'HTML',
    isLast: boolean
  ): Promise<boolean> {
    await this.rateLimiter.consume();

    try {
      const res = await fetch(this.url('sendMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: !isLast, // Only show preview on last chunk
        }),
      });

      const data: TelegramApiResponse = await res.json();
      return data.ok;
    } catch (e) {
      return false;
    }
  }

  onMessage(handler: (text: string, chatId: number) => Promise<void>): void {
    this.messageHandler = handler;
  }

  onVoice(handler: (fileId: string, chatId: number) => Promise<void>): void {
    this.voiceHandler = handler;
  }

  /**
   * Start polling for updates
   */
  async startPolling(): Promise<void> {
    this.running = true;
    this.abortController = new AbortController();
    
    logInfo('Telegram bot polling started');

    while (this.running) {
      try {
        const res = await fetch(
          `${this.url('getUpdates')}?offset=${this.offset}&timeout=30`,
          { 
            signal: this.abortController.signal 
          }
        );

        if (!res.ok) {
          logWarn('Poll failed', { status: res.status });
          await this.sleep(5000);
          continue;
        }

        const data = await res.json();

        if (data.ok && data.result) {
          for (const update of data.result as TelegramUpdate[]) {
            this.offset = update.update_id + 1;

            if (update.message) {
              const chatId = update.message.chat.id;
              if (chatId.toString() === this.chatId) {
                try {
                  // Handle voice messages
                  const voiceFileId = 
                    update.message.voice?.file_id ||
                    update.message.audio?.file_id ||
                    update.message.video_note?.file_id;
                  
                  if (voiceFileId && this.voiceHandler) {
                    await this.voiceHandler(voiceFileId, chatId);
                  } else if (update.message.text && this.messageHandler) {
                    await this.messageHandler(update.message.text, chatId);
                  }
                } catch (error) {
                  logError('Message handler error', error as Error);
                }
              }
            }
          }
        }
      } catch (e: any) {
        if (e.name === 'AbortError') {
          logInfo('Polling aborted');
          break;
        }
        logError('Poll error', e);
        await this.sleep(3000);
      }
    }

    logInfo('Telegram bot polling stopped');
  }

  /**
   * Stop polling gracefully
   */
  stop(): void {
    this.running = false;
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Test connection to Telegram API
   */
  async testConnection(): Promise<boolean> {
    try {
      const res = await fetch(this.url('getMe'));
      const data: TelegramApiResponse = await res.json();
      
      if (data.ok) {
        logInfo('Telegram connection successful', { 
          bot: (data.result as any)?.username 
        });
      }
      
      return data.ok;
    } catch (error) {
      logError('Telegram connection test failed', error as Error);
      return false;
    }
  }

  /**
   * Send typing indicator
   */
  async sendTyping(): Promise<void> {
    try {
      await fetch(this.url('sendChatAction'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          action: 'typing',
        }),
      });
    } catch {
      // Ignore typing errors
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
