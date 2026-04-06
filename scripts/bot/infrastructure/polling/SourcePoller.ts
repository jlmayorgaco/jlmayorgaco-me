/**
 * Source Poller - Orchestrates all connectors
 * 
 * Features:
 * - Runs all connectors
 * - Concurrency controlled
 * - Isolated errors
 * - Saves checkpoints
 *
 * @module infrastructure/polling/SourcePoller
 */

import { logError, logInfo, logWarn } from '../logging/Logger';
import { ArxivConnector, type ArxivPaper, type ArxivCheckpoint } from '../connectors/ArxivConnector';
import { RssConnector, type NewsItem, type RssCheckpoint, type FeedHealth } from '../connectors/RssConnector';
import { HackerNewsConnector, type HackerNewsItem, type HnCheckpoint } from '../connectors/HackerNewsConnector';
import { OpenAlexConnector, type OpenAlexWork } from '../connectors/OpenAlexConnector';
import type { BotConfig } from '../../config/index';

export interface PollerCheckpoint {
  arxiv?: ArxivCheckpoint;
  rss: Record<string, RssCheckpoint>;
  hackernews?: HnCheckpoint;
  lastRun: string;
}

export interface PollerResult {
  arxiv: ArxivPaper[];
  rss: NewsItem[];
  hackernews: HackerNewsItem[];
  enriched: OpenAlexWork[];
  feedHealth: FeedHealth[];
  errors: string[];
}

export interface PollerOptions {
  maxConcurrency?: number;
  enableArxiv?: boolean;
  enableRss?: boolean;
  enableHackerNews?: boolean;
  enableOpenAlex?: boolean;
}

const DEFAULT_OPTIONS: Required<PollerOptions> = {
  maxConcurrency: 3,
  enableArxiv: true,
  enableRss: true,
  enableHackerNews: true,
  enableOpenAlex: true,
};

export class SourcePoller {
  private config: BotConfig;
  private options: Required<PollerOptions>;
  private arxivConnector: ArxivConnector;
  private rssConnector: RssConnector;
  private hnConnector: HackerNewsConnector;
  private openAlexConnector: OpenAlexConnector;

  constructor(config: BotConfig, options: PollerOptions = {}) {
    this.config = config;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    this.arxivConnector = new ArxivConnector(config);
    this.rssConnector = RssConnector.fromConfig(config);
    this.hnConnector = new HackerNewsConnector(config.topics);
    this.openAlexConnector = new OpenAlexConnector();
  }

  async poll(checkpoint?: PollerCheckpoint): Promise<PollerResult> {
    const result: PollerResult = {
      arxiv: [],
      rss: [],
      hackernews: [],
      enriched: [],
      feedHealth: [],
      errors: [],
    };

    logInfo('Starting source poll', { 
      enableArxiv: this.options.enableArxiv,
      enableRss: this.options.enableRss,
      enableHackerNews: this.options.enableHackerNews,
    });

    const tasks: Array<{ name: string; fn: () => Promise<any> }> = [];

    if (this.options.enableArxiv) {
      tasks.push({
        name: 'arxiv',
        fn: async () => {
          const papers = await this.arxivConnector.fetchPapers(
            { keywords: this.config.topics, categories: [], maxResults: this.config.maxPapersToScan },
            checkpoint?.arxiv
          );
          result.arxiv = papers;
          return papers;
        },
      });
    }

    if (this.options.enableRss) {
      tasks.push({
        name: 'rss',
        fn: async () => {
          const items = await this.rssConnector.fetchAll(checkpoint?.rss);
          result.rss = items;
          result.feedHealth = this.rssConnector.getFeedHealth();
          return items;
        },
      });
    }

    if (this.options.enableHackerNews) {
      tasks.push({
        name: 'hackernews',
        fn: async () => {
          const items = await this.hnConnector.fetchAndFilter(
            {
              keywords: this.config.topics,
              maxResults: this.config.maxNewsItems,
              minScore: 1,
            },
            checkpoint?.hackernews
          );
          result.hackernews = items;
          return items;
        },
      });
    }

    const results = await this.runWithConcurrency(tasks);

    if (this.options.enableOpenAlex && result.arxiv.length > 0) {
      try {
        const queries = result.arxiv
          .slice(0, 5)
          .map(p => ({ arxivId: p.id }));

        result.enriched = await this.openAlexConnector.enrichWorks(queries);
        logInfo('OpenAlex enrichment complete', { count: result.enriched.length });
      } catch (error) {
        logError('OpenAlex enrichment failed', error as Error);
        result.errors.push(`OpenAlex: ${(error as Error).message}`);
      }
    }

    logInfo('Source poll complete', {
      arxiv: result.arxiv.length,
      rss: result.rss.length,
      hackernews: result.hackernews.length,
      enriched: result.enriched.length,
      errors: result.errors.length,
    });

    return result;
  }

  private async runWithConcurrency(
    tasks: Array<{ name: string; fn: () => Promise<any> }>
  ): Promise<any[]> {
    const results: any[] = [];
    const executing: Promise<void>[] = [];

    for (const task of tasks) {
      const promise = this.executeTask(task).then(results.push.bind(results));
      executing.push(promise);

      if (executing.length >= this.options.maxConcurrency) {
        await Promise.race(executing);
        const finished = executing.findIndex(p => {
          const r = Promise.race([p, Promise.resolve(true)]);
          return r === p;
        });
        if (finished > -1) {
          executing.splice(finished, 1);
        }
      }
    }

    await Promise.all(executing);
    return results;
  }

  private async executeTask(task: { name: string; fn: () => Promise<any> }): Promise<any> {
    try {
      return await task.fn();
    } catch (error) {
      const errorMsg = `${task.name}: ${(error as Error).message}`;
      logError(`Task ${task.name} failed`, error as Error);
      return { error: errorMsg };
    }
  }

  getFeedHealth(): FeedHealth[] {
    return this.rssConnector.getFeedHealth();
  }

  addRssFeed(feed: { name: string; url: string; type: 'rss' | 'atom' }): void {
    this.rssConnector.addFeed(feed);
  }

  removeRssFeed(name: string): void {
    this.rssConnector.removeFeed(name);
  }

  static createDefault(config: BotConfig): SourcePoller {
    return new SourcePoller(config);
  }
}

