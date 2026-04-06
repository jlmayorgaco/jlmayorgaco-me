/**
 * Scan News Use Case
 * Scans RSS feeds for relevant news items
 */

import type { 
  INewsScanner, 
  IMessagePort, 
  ISessionRepository 
} from '../ports';
import type { 
  ScanNewsInput, 
  ScanNewsOutput, 
  NewsSummary 
} from '../dto';
import { Result } from '../../shared/Result';
import { logDebug, logError, logInfo } from '../../infrastructure/logging/Logger';
import { MarkdownFormatter } from '../../infrastructure/formatting/MarkdownFormatter';

export class ScanNewsUseCase {
  constructor(
    private newsScanner: INewsScanner,
    private sessionRepo: ISessionRepository,
    private messagePort: IMessagePort
  ) {}

  async execute(input: ScanNewsInput): Promise<Result<ScanNewsOutput, Error>> {
    try {
      logDebug('Executing ScanNewsUseCase', { chatId: input.chatId });

      await this.messagePort.sendMessage('_Scanning news sources..._');

      // Scan news
      const scanResult = await this.newsScanner.scanSources();
      
      if (!scanResult.success) {
        throw scanResult.error;
      }

      const allNews = scanResult.data;
      const maxItems = input.maxItems || 20;
      const selectedNews = allNews.slice(0, maxItems);

      // Filter by sources if provided
      let filtered = selectedNews;
      if (input.sources && input.sources.length > 0) {
        filtered = selectedNews.filter(n => 
          input.sources!.some(s => 
            n.source.toLowerCase().includes(s.toLowerCase())
          )
        );
      }

      // Update session
      const session = await this.sessionRepo.get(input.chatId);
      session.setNews(filtered);
      await this.sessionRepo.save(input.chatId, session);

      // Format output
      const newsSummaries: NewsSummary[] = filtered.map(n => ({
        title: n.title,
        source: n.source,
        link: n.link,
        pubDate: n.pubDate,
        summary: n.description?.slice(0, 100),
      }));

      // Send results
      await this.sendResults(filtered);

      logInfo('News scan complete', { 
        total: allNews.length, 
        selected: filtered.length 
      });

      return Result.ok({
        success: true,
        newsScanned: allNews.length,
        selectedNews: newsSummaries,
      });

    } catch (error) {
      logError('ScanNewsUseCase failed', error as Error);
      
      await this.messagePort.sendMessage(
        `âŒ Failed to scan news: ${(error as Error).message}`
      );

      return Result.err(error as Error);
    }
  }

  private async sendResults(news: any[]): Promise<void> {
    let msg = `*ðŸ“° News (${news.length} items)*\n\n`;

    for (const item of news.slice(0, 5)) {
      const title = MarkdownFormatter.truncate(item.title, 60);
      const source = item.source || 'Unknown';
      msg += `â€¢ ${MarkdownFormatter.escape(title)}\n`;
      msg += `  _${source}_ | [Link](${item.link})\n\n`;
    }

    if (news.length > 5) {
      msg += `_...and ${news.length - 5} more_`;
    }

    await this.messagePort.sendMessage(msg);
  }
}

