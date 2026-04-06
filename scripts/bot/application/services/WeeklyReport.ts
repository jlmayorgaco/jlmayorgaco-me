/**
 * Weekly Report Generator
 * 
 * - Aggregated insights
 * - Top content
 * - Statistics
 *
 * @module application/services/WeeklyReport
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { TrendTracker } from './TrendTracker';
import type { ContentMemory } from './ContentMemory';

export interface WeeklyReportData {
  week: string;
  period: { start: string; end: string };
  stats: {
    papersProcessed: number;
    newsItems: number;
    draftsGenerated: number;
    approved: number;
  };
  topTopics: Array<{ topic: string; count: number; trend: string }>;
  topClusters: Array<{ name: string; itemCount: number }>;
  insights: string[];
  generatedAt: string;
}

export class WeeklyReport {
  private dataDir: string;
  private reports: Map<string, WeeklyReportData> = new Map();

  constructor(dataDir = './data') {
    this.dataDir = dataDir;
  }

  async load(): Promise<void> {
    const filePath = path.join(this.dataDir, 'weekly-reports.json');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      for (const report of data.reports || []) {
        this.reports.set(report.week, report);
      }
    } catch {}
  }

  async save(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    const filePath = path.join(this.dataDir, 'weekly-reports.json');
    await fs.writeFile(filePath, JSON.stringify({
      reports: Array.from(this.reports.values())
    }, null, 2));
  }

  async generate(
    trendTracker: TrendTracker,
    contentMemory: ContentMemory,
    stats: WeeklyReportData['stats']
  ): Promise<WeeklyReportData> {
    const now = new Date();
    const weekStart = getWeekStart(now);
    const weekEnd = now.toISOString();

    const trends = trendTracker.getWeeklyTrends();
    const memoryStats = contentMemory.getStats();

    const topClusters = Array.from(
      (contentMemory as any).clusters?.values() || []
    )
      .sort((a: any, b: any) => b.items.length - a.items.length)
      .slice(0, 5)
      .map((c: any) => ({ name: c.name, itemCount: c.items.length }));

    const insights = this.generateInsights(stats, trends, memoryStats);

    const report: WeeklyReportData = {
      week: getWeekString(now),
      period: { start: weekStart, end: weekEnd },
      stats,
      topTopics: trends.topics.slice(0, 10).map(t => ({
        topic: t.topic,
        count: t.count,
        trend: t.trend,
      })),
      topClusters,
      insights,
      generatedAt: new Date().toISOString(),
    };

    this.reports.set(report.week, report);
    await this.save();

    return report;
  }

  private generateInsights(
    stats: WeeklyReportData['stats'],
    trends: { topics: Array<{ topic: string; count: number; trend: string }> },
    memoryStats: { totalItems: number; totalClusters: number }
  ): string[] {
    const insights: string[] = [];

    if (stats.papersProcessed > 20) {
      insights.push(`Processed ${stats.papersProcessing} research papers this week - active scanning`);
    }

    if (stats.approved > stats.draftsGenerated * 0.5) {
      insights.push(`High approval rate: ${stats.approved}/${stats.draftsGenerated} drafts approved`);
    }

    const topTopic = trends.topics[0];
    if (topTopic) {
      insights.push(`Hot topic: ${topTopic.topic} with ${topTopic.count} mentions`);
    }

    if (trends.topics.some(t => t.trend === 'up')) {
      const rising = trends.topics.find(t => t.trend === 'up');
      insights.push(`Rising: ${rising?.topic} is gaining traction`);
    }

    if (memoryStats.totalClusters > 5) {
      insights.push(`Content clustered into ${memoryStats.totalClusters} topic areas`);
    }

    return insights;
  }

  getLatestReport(): WeeklyReportData | null {
    const weeks = Array.from(this.reports.keys()).sort().reverse();
    if (weeks.length === 0) return null;
    return this.reports.get(weeks[0]) || null;
  }

  formatForTelegram(report?: WeeklyReportData): string {
    const r = report || this.getLatestReport();

    if (!r) {
      return '*No weekly report available yet.*';
    }

    let msg = `ðŸ“… *Weekly Report*\n`;
    msg += `_Week of ${r.period.start}_\n\n`;

    msg += `*Stats:*\n`;
    msg += `  Papers: ${r.stats.papersProcessed}\n`;
    msg += `  News: ${r.stats.newsItems}\n`;
    msg += `  Drafts: ${r.stats.draftsGenerated}\n`;
    msg += `  Approved: ${r.stats.approved}\n\n`;

    if (r.insights.length > 0) {
      msg += `*Key Insights:*\n`;
      for (const insight of r.insights) {
        msg += `â€¢ ${insight}\n`;
      }
      msg += `\n`;
    }

    if (r.topTopics.length > 0) {
      msg += `*Top Topics:*\n`;
      for (const topic of r.topTopics.slice(0, 5)) {
        msg += `  ${topic.topic}: ${topic.count}\n`;
      }
    }

    return msg;
  }
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

function getWeekString(date: Date): string {
  return getWeekStart(date);
}

