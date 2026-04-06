/**
 * Bot Commands - New Pipeline
 * 
 * - /digest: uses full pipeline
 * - /drafts: list generated drafts
 * - /approve: mark as ready
 * - /reject: mark as rejected
 * - inline buttons with callback
 *
 * @module interfaces/commands/DigestCommands
 */

import type { CommandHandler, CommandContext } from '../types/commands';
import { logError, logInfo, logWarn } from '../../infrastructure/logging/Logger';
import { SourcePoller } from '../../infrastructure/polling/SourcePoller';
import { CanonicalItemBuilder } from '../../domain/entities/CanonicalItem';
import { DedupEngine } from '../../domain/services/DedupEngine';
import { IntelligencePipeline } from '../../application/services/IntelligencePipeline';
import { HybridContentGenerator, QualityGate } from '../../application/services/ContentFormatters';
import type { BotConfig } from '../../config/index';

export interface Draft {
  id: string;
  intelligence: any;
  url: string;
  source: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  quality: { passed: boolean; score: number };
}

const draftsStore = new Map<string, Draft>();
const CALLBACK_PREFIX = 'draft_';

function createDraftKeyboard(draftId: string): any {
  return {
    inline_keyboard: [
      [
        { text: 'âœ… Approve', callback_data: `${CALLBACK_PREFIX}approve_${draftId}` },
        { text: 'âŒ Reject', callback_data: `${CALLBACK_PREFIX}reject_${draftId}` },
      ],
      [
        { text: 'ðŸ“ View Drafts', callback_data: `${CALLBACK_PREFIX}list` },
        { text: 'ðŸ“Š Trends', callback_data: `${CALLBACK_PREFIX}trends` },
      ],
    ],
  };
}

export function handleDraftCallback(callbackData: string, bot: any, chatId: number): void {
  const [action, draftId] = callbackData.replace(CALLBACK_PREFIX, '').split('_');
  
  const draft = draftsStore.get(draftId);
  if (!draft) {
    bot.sendMessage(chatId, 'âŒ Draft not found.');
    return;
  }

  if (action === 'approve') {
    draft.status = 'approved';
    bot.sendMessage(chatId, `âœ… Draft approved!\n\n${draft.intelligence.insight.mainInsight}`);
    logInfo('Draft approved via inline', { id: draft.id });
  } else if (action === 'reject') {
    draft.status = 'rejected';
    bot.sendMessage(chatId, 'âŒ Draft rejected.');
    logInfo('Draft rejected via inline', { id: draft.id });
  } else if (action === 'list') {
    listDraftsInline(bot, chatId);
  }
}

async function listDraftsInline(bot: any, chatId: number): Promise<void> {
  const drafts = Array.from(draftsStore.values()).filter(d => d.status === 'pending');

  if (drafts.length === 0) {
    await bot.sendMessage(chatId, 'ðŸ“ No pending drafts.');
    return;
  }

  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    await bot.sendMessage(
      chatId,
      `${i + 1}. ${d.intelligence.classification.primary}: ${d.intelligence.insight.mainInsight.substring(0, 60)}...\nQuality: ${d.quality.score}/100`,
      createDraftKeyboard(d.id)
    );
  }
}

export const digestCommand: CommandHandler = {
  name: 'digest',
  description: 'Run full intelligence pipeline',
  aliases: ['scan', 'pipeline', 'p'],

  async execute(context: CommandContext): Promise<void> {
    const { bot, config, chatId } = context;

    await bot.sendTyping();
    await bot.sendMessage('_Running intelligence pipeline..._');

    try {
      const poller = new SourcePoller(config);
      const result = await poller.poll();

      await bot.sendTyping();
      await bot.sendMessage(`_Found ${result.arxiv.length} papers, ${result.rss.length} news, ${result.hackernews.length} HN items_`);

      const items = [
        ...result.arxiv.map(p => CanonicalItemBuilder.fromArxiv(p)),
        ...result.rss.map(item => CanonicalItemBuilder.fromRss(item)),
        ...result.hackernews.map(item => CanonicalItemBuilder.fromHackerNews(item)),
      ];

      const dedup = new DedupEngine();
      const unique = dedup.check({ id: '', url: '', title: '' });

      const drafts: Draft[] = [];

      await bot.sendTyping();

      const pipeline = new IntelligencePipeline(config);

      for (const item of items.slice(0, 5)) {
        const input = {
          title: item.title,
          description: item.description,
          source: item.sourceName,
          categories: item.categories,
          metadata: item.metadata,
        };

        const intelligence = await pipeline.process(input);
        const quality = QualityGate.check(intelligence);

        if (quality.passed) {
          const draft: Draft = {
            id: item.id,
            intelligence,
            url: item.url,
            source: item.sourceName,
            status: 'pending',
            createdAt: new Date().toISOString(),
            quality,
          };

          draftsStore.set(draft.id, draft);
          drafts.push(draft);
        }
      }

      if (drafts.length === 0) {
        await bot.sendMessage('âŒ No quality content found. Try again later.');
        return;
      }

      const content = HybridContentGenerator.generate(
        drafts[0].intelligence,
        drafts[0].url
      );

      await bot.sendMessage(content.telegram.text, undefined, createDraftKeyboard(drafts[0].id));

      draftsStore.set('current_digest', {
        id: 'current_digest',
        intelligence: drafts[0].intelligence,
        url: drafts[0].url,
        source: drafts[0].source,
        status: 'pending',
        createdAt: new Date().toISOString(),
        quality: drafts[0].quality,
      });

      await bot.sendMessage(
        `_Generated ${drafts.length} drafts. Use /drafts to see all._`
      );

      logInfo('Digest complete', { drafts: drafts.length });

    } catch (error) {
      logError('Digest command failed', error as Error);
      await bot.sendMessage(`âŒ Pipeline error: ${(error as Error).message}`);
    }
  },
};

export const draftsCommand: CommandHandler = {
  name: 'drafts',
  description: 'List generated drafts',
  aliases: ['d'],

  async execute(context: CommandContext): Promise<void> {
    const { bot, chatId } = context;
    
    await listDraftsInline(bot, chatId);
  },
};

export const approveCommand: CommandHandler = {
  name: 'approve',
  description: 'Approve a draft',
  aliases: ['a'],

  async execute(context: CommandContext): Promise<void> {
    const { bot, args, chatId } = context;

    const num = parseInt(args[0] || '1', 10);
    const drafts = Array.from(draftsStore.values())
      .filter(d => d.status === 'pending');

    if (num < 1 || num > drafts.length) {
      await bot.sendMessage('âŒ Invalid draft number. Use /drafts to see available.');
      return;
    }

    const draft = drafts[num - 1];
    draft.status = 'approved';

    const content = HybridContentGenerator.generate(
      draft.intelligence,
      draft.url
    );

    await bot.sendMessage('âœ… *Draft approved!*\n\n');
    await bot.sendMessage(content.linkedin.hook + '\n\n' + content.linkedin.body);

    logInfo('Draft approved', { id: draft.id });
  },
};

export const rejectCommand: CommandHandler = {
  name: 'reject',
  description: 'Reject a draft',
  aliases: ['r'],

  async execute(context: CommandContext): Promise<void> {
    const { bot, args, chatId } = context;

    const num = parseInt(args[0] || '1', 10);
    const drafts = Array.from(draftsStore.values())
      .filter(d => d.status === 'pending');

    if (num < 1 || num > drafts.length) {
      await bot.sendMessage('âŒ Invalid draft number. Use /drafts to see available.');
      return;
    }

    const draft = drafts[num - 1];
    draft.status = 'rejected';

    await bot.sendMessage(`âŒ Draft ${num} rejected.`);

    logInfo('Draft rejected', { id: draft.id });
  },
};

