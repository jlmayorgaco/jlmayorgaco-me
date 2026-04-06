/**
 * Analytics API Controller
 * Provides endpoints for dashboard
 */

import type { Request, Response } from 'express';
import { IAnalyticsRepository, TimeRange } from '../../application/ports';

export class AnalyticsController {
  constructor(private analyticsRepo: IAnalyticsRepository) {}

  async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const timeRange = this.parseTimeRange(req.query);
      const stats = await this.analyticsRepo.getStats(timeRange);
      const recentActivity = await this.analyticsRepo.getRecentActivity(20);

      res.json({
        success: true,
        data: {
          stats,
          recentActivity,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const timeRange = this.parseTimeRange(req.query);
      const stats = await this.analyticsRepo.getStats(timeRange);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }

  async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await this.analyticsRepo.getRecentActivity(limit);

      res.json({
        success: true,
        data: activity,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }

  private parseTimeRange(query: Request['query']): TimeRange {
    const period = (query.period as string) || '24h';
    const now = new Date();
    let start: Date;

    switch (period) {
      case '1h':
        start = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        // Custom range
        start = query.start 
          ? new Date(query.start as string)
          : new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const end = query.end ? new Date(query.end as string) : now;

    return { start, end, period };
  }
}

