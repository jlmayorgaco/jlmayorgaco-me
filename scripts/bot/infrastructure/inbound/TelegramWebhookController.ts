/**
 * Webhook Controller for Telegram
 * Alternative to polling for serverless deployments
 */

import type { Request, Response } from 'express';
import type { IEventBus, DomainEvent, ISessionRepository } from '../../application/ports';
import type { BotConfig } from '../../config/index';
import { logDebug, logError, logInfo } from '../../infrastructure/logging/Logger';
import { SessionState } from '../../domain/enums/SessionState';

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
    from?: { id: number; username?: string };
  };
  callback_query?: {
    id: string;
    from: { id: number };
    data: string;
  };
}

export class TelegramWebhookController {
  private webhookSecret?: string;

  constructor(
    private eventBus: IEventBus,
    private sessionRepo: ISessionRepository,
    private config: BotConfig,
    webhookSecret?: string
  ) {
    this.webhookSecret = webhookSecret;
  }

  async handleUpdate(req: Request, res: Response): Promise<void> {
    try {
      // Security: Validate secret token if configured
      if (this.webhookSecret) {
        const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
        if (secretHeader !== this.webhookSecret) {
          logError('Invalid webhook secret token', new Error('Unauthorized'), {
            ip: req.ip,
            headers: req.headers,
          });
          res.status(401).send('Unauthorized');
          return;
        }
      }

      const update: TelegramUpdate = req.body;
      
      logDebug('Received webhook update', { updateId: update.update_id });

      // Acknowledge receipt immediately
      res.status(200).send('OK');

      // Process update asynchronously
      if (update.message?.text) {
        await this.processMessage(update.message);
      }

      if (update.callback_query) {
        await this.processCallback(update.callback_query);
      }
    } catch (error) {
      logError('Failed to process webhook', error as Error);
      // Don't fail the webhook response, just log
      if (!res.headersSent) {
        res.status(200).send('OK');
      }
    }
  }

  private async processMessage(message: TelegramUpdate['message']): Promise<void> {
    if (!message?.text) return;

    const chatId = message.chat.id;
    const text = message.text;

    // Get or create session
    const session = await this.sessionRepo.get(chatId);

    // Handle state machine
    if (session.state === SessionState.COLLECTING_COMMENT && !text.startsWith('/')) {
      // Emit event for comment handling
      await this.eventBus.emit({
        type: 'USER_COMMENT_RECEIVED',
        timestamp: new Date(),
        payload: { chatId, comment: text },
      });
      return;
    }

    if (session.state === SessionState.CONFIRMING_PUBLISH) {
      const cmd = text.toLowerCase().trim();
      if (cmd === 'yes' || cmd === 'si') {
        await this.eventBus.emit({
          type: 'PUBLISH_CONFIRMED',
          timestamp: new Date(),
          payload: { chatId },
        });
        return;
      }
    }

    // Handle commands
    if (text.startsWith('/')) {
      const commandName = text.slice(1).split(' ')[0];
      await this.eventBus.emit({
        type: 'COMMAND_RECEIVED',
        timestamp: new Date(),
        payload: { chatId, command: commandName, args: text },
      });
    }
  }

  private async processCallback(callback: TelegramUpdate['callback_query']): Promise<void> {
    // Handle inline keyboard callbacks
    logDebug('Received callback query', { callbackId: callback.id, data: callback.data });
  }

  async setWebhook(url: string, secretToken?: string): Promise<void> {
    const telegramApi = `https://api.telegram.org/bot${this.config.telegram.botToken}`;
    
    try {
      const response = await fetch(`${telegramApi}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          secret_token: secretToken,
          allowed_updates: ['message', 'callback_query'],
        }),
      });

      const data = await response.json();
      
      if (data.ok) {
        logInfo('Webhook set successfully', { url });
      } else {
        logError('Failed to set webhook', new Error(data.description));
      }
    } catch (error) {
      logError('Failed to set webhook', error as Error);
      throw error;
    }
  }

  async deleteWebhook(): Promise<void> {
    const telegramApi = `https://api.telegram.org/bot${this.config.telegram.botToken}`;
    
    try {
      await fetch(`${telegramApi}/deleteWebhook`, {
        method: 'POST',
      });
      
      logInfo('Webhook deleted');
    } catch (error) {
      logError('Failed to delete webhook', error as Error);
    }
  }
}

