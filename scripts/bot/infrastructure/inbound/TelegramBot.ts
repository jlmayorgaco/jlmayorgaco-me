/**
 * Telegram Bot client with rate limiting and retry logic
 *
 * @module infrastructure/inbound/TelegramBot
 */

import { logError, logInfo, logWarn } from '../logging/Logger';
import { TokenBucket } from '../../shared/utils';
import type { BotConfig } from '../../config/index';

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
    this.rateLimiter = new TokenBucket(
      config.telegramRateLimit || 30,
      config.telegramRateLimit || 30,
      1000
    );
  }

  private url(method: string): string {
    return `${TELEGRAM_API}${this.token}/${method}`;
  }

  async sendMessage(text: string, parseMode: 'Markdown' | 'MarkdownV2' | 'HTML' = 'HTML'): Promise<boolean> {
    try {
      await this.rateLimiter.consume();

      if (text.length > MAX_MESSAGE_LENGTH) {
        return this.sendChunkedMessage(text, parseMode);
      }

      const res = await fetch(this.url('sendMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: text,
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

  async sendHTML(text: string): Promise<boolean> {
    return this.sendMessage(text, 'HTML');
  }

  private async sendChunkedMessage(text: string, parseMode: 'Markdown' | 'MarkdownV2' | 'HTML'): Promise<boolean> {
    const chunks: string[] = [];
    let currentChunk = '';

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

      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return true;
  }

  private async sendSingleMessage(
    text: string,
    parseMode: 'Markdown' | 'MarkdownV2' | 'HTML',
    isLast: boolean
  ): Promise<boolean> {
    await this.rateLimiter.consume();

    try {
      const res = await fetch(this.url('sendMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: text,
          parse_mode: parseMode,
          disable_web_page_preview: !isLast,
        }),
      });

      const data: TelegramApiResponse = await res.json();
      return data.ok;
    } catch (e) {
      return false;
    }
  }

  async sendPhoto(photoUrl: string, caption?: string): Promise<boolean> {
    try {
      await this.rateLimiter.consume();

      const res = await fetch(this.url('sendPhoto'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          photo: photoUrl,
          caption: caption,
          parse_mode: 'HTML',
        }),
      });

      const data: TelegramApiResponse = await res.json();
      return data.ok;
    } catch (error) {
      logError('Failed to send photo', error as Error);
      return false;
    }
  }

  async editMessage(messageId: number, text: string, keyboard?: unknown): Promise<boolean> {
    try {
      await this.rateLimiter.consume();

      const res = await fetch(this.url('editMessageText'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          message_id: messageId,
          text: text,
          parse_mode: 'HTML',
          reply_markup: keyboard,
        }),
      });

      const data: TelegramApiResponse = await res.json();
      return data.ok;
    } catch (error) {
      logError('Failed to edit message', error as Error);
      return false;
    }
  }

  async deleteMessage(messageId: number): Promise<boolean> {
    try {
      await this.rateLimiter.consume();

      const res = await fetch(this.url('deleteMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          message_id: messageId,
        }),
      });

      const data: TelegramApiResponse = await res.json();
      return data.ok;
    } catch (error) {
      logError('Failed to delete message', error as Error);
      return false;
    }
  }

  async getFile(fileId: string): Promise<string | null> {
    try {
      const res = await fetch(this.url('getFile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId }),
      });

      const data = await res.json() as TelegramApiResponse & { result?: { file_path: string } };
      if (!data.ok || !data.result) {
        return null;
      }

      return `https://api.telegram.org/file/bot${this.token}/${data.result.file_path}`;
    } catch (error) {
      logError('Failed to get file', error as Error);
      return null;
    }
  }

  onMessage(handler: (text: string, chatId: number) => Promise<void>): void {
    this.messageHandler = handler;
  }

  onVoice(handler: (fileId: string, chatId: number) => Promise<void>): void {
    this.voiceHandler = handler;
  }

  async startPolling(): Promise<void> {
    this.running = true;
    this.abortController = new AbortController();
    
    logInfo('Telegram bot polling started');

    while (this.running) {
      try {
        const res = await fetch(
          `${this.url('getUpdates')}?offset=${this.offset}&timeout=30`,
          { signal: this.abortController.signal }
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

  stop(): void {
    this.running = false;
    if (this.abortController) {
      this.abortController.abort();
    }
  }

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

