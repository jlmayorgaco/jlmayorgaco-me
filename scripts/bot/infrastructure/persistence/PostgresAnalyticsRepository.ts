/**
 * PostgreSQL Analytics Repository
 * Stores analytics events and provides statistics
 */

import { IAnalyticsRepository, AnalyticsStats, AnalyticsEvent, TimeRange, AnalyticsEventType } from '../../application/ports';
import { logError } from '../../infrastructure/logging/Logger';

export interface PostgresClient {
  query(text: string, params?: any[]): Promise<{ rows: any[] }>;
}

export class PostgresAnalyticsRepository implements IAnalyticsRepository {
  constructor(private db: PostgresClient) {}

  async recordEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO analytics_events (type, timestamp, payload)
         VALUES ($1, $2, $3)`,
        [event.type, event.timestamp, JSON.stringify(event.payload)]
      );
    } catch (error) {
      logError('Failed to record analytics event', error as Error);
      // Don't throw - analytics should not break main flow
    }
  }

  async getStats(timeRange: TimeRange): Promise<AnalyticsStats> {
    const { start, end } = timeRange;
    
    const [commandStats, paperStats, postStats, errorStats] = await Promise.all([
      this.getCommandStats(start, end),
      this.getPaperStats(start, end),
      this.getPostStats(start, end),
      this.getErrorStats(start, end),
    ]);

    return {
      totalCommands: commandStats.total,
      commandsByType: commandStats.byType,
      totalPapersScanned: paperStats.scanned,
      totalPapersClassified: paperStats.classified,
      totalPostsGenerated: postStats.generated,
      totalPostsPublished: postStats.published,
      totalErrors: errorStats.total,
      errorsByType: errorStats.byType,
      period: timeRange,
    };
  }

  async getRecentActivity(limit: number = 10): Promise<AnalyticsEvent[]> {
    const result = await this.db.query(
      `SELECT type, timestamp, payload
       FROM analytics_events
       ORDER BY timestamp DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => ({
      type: row.type,
      timestamp: new Date(row.timestamp),
      payload: JSON.parse(row.payload),
    }));
  }

  private async getCommandStats(start: Date, end: Date) {
    const result = await this.db.query(
      `SELECT 
        COUNT(*) as total,
        payload->>'command' as command,
        COUNT(*) FILTER (WHERE payload->>'command' IS NOT NULL) as with_command
       FROM analytics_events
       WHERE type = 'COMMAND_EXECUTED'
         AND timestamp BETWEEN $1 AND $2
       GROUP BY payload->>'command'`,
      [start, end]
    );

    const byType: Record<string, number> = {};
    let total = 0;

    for (const row of result.rows) {
      if (row.command) {
        byType[row.command] = parseInt(row.count);
      }
      total += parseInt(row.count);
    }

    return { total, byType };
  }

  private async getPaperStats(start: Date, end: Date) {
    const scanned = await this.db.query(
      `SELECT COUNT(*) as count
       FROM analytics_events
       WHERE type = 'PAPER_SCANNED'
         AND timestamp BETWEEN $1 AND $2`,
      [start, end]
    );

    const classified = await this.db.query(
      `SELECT COUNT(*) as count
       FROM analytics_events
       WHERE type = 'PAPER_CLASSIFIED'
         AND timestamp BETWEEN $1 AND $2`,
      [start, end]
    );

    return {
      scanned: parseInt(scanned.rows[0]?.count || '0'),
      classified: parseInt(classified.rows[0]?.count || '0'),
    };
  }

  private async getPostStats(start: Date, end: Date) {
    const generated = await this.db.query(
      `SELECT COUNT(*) as count
       FROM analytics_events
       WHERE type = 'POST_GENERATED'
         AND timestamp BETWEEN $1 AND $2`,
      [start, end]
    );

    const published = await this.db.query(
      `SELECT COUNT(*) as count
       FROM analytics_events
       WHERE type = 'POST_PUBLISHED'
         AND timestamp BETWEEN $1 AND $2`,
      [start, end]
    );

    return {
      generated: parseInt(generated.rows[0]?.count || '0'),
      published: parseInt(published.rows[0]?.count || '0'),
    };
  }

  private async getErrorStats(start: Date, end: Date) {
    const result = await this.db.query(
      `SELECT 
        COUNT(*) as total,
        payload->>'code' as code,
        COUNT(*) FILTER (WHERE payload->>'code' IS NOT NULL) as with_code
       FROM analytics_events
       WHERE type = 'ERROR_OCCURRED'
         AND timestamp BETWEEN $1 AND $2
       GROUP BY payload->>'code'`,
      [start, end]
    );

    const byType: Record<string, number> = {};
    let total = 0;

    for (const row of result.rows) {
      if (row.code) {
        byType[row.code] = parseInt(row.count);
      }
      total += parseInt(row.count);
    }

    return { total, byType };
  }

  // Migration helper
  async initializeTables(): Promise<void> {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(type);
      CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_analytics_type_timestamp ON analytics_events(type, timestamp);
    `);
  }
}

