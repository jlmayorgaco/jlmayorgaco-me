/**
 * News Scanner Service Adapter
 * Implements INewsScanner port using legacy news-scanner.ts
 */

import type { INewsScanner, NewsItem } from '../../application/ports';
import type { Result } from '../../shared/Result';
import { logDebug, logError, logInfo } from '../../infrastructure/logging/Logger';

// Import legacy function
import { scanNewsSources } from '../../infrastructure/connectors/RssConnector';

export class NewsScannerServiceAdapter implements INewsScanner {
  async scanSources(): Promise<Result<NewsItem[], Error>> {
    try {
      logDebug('Scanning news sources...');

      const results = await scanNewsSources();

      logInfo('News scan complete', { count: results.length });

      return { 
        success: true, 
        data: results 
      } as any;

    } catch (error) {
      logError('NewsScanner failed', error as Error);
      return { 
        success: false, 
        error: error as Error 
      } as any;
    }
  }
}

