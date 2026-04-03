/**
 * Reporting and DataLab
 * 
 * - Daily report artifact
 * - Weekly trends report
 * - Source health dashboard data
 * - Ranking explainability
 * - Export layer for website/DataLab
 *
 * @module application/services/ReportingEngine
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { FeedHealth } from '../../infrastructure/connectors/RssConnector';
import type { ScoreResult } from '../../domain/services/RankingSystem';

export interface DailyReport {
  date: string;
  topItems: Array<{ title: string; score: number; source: string; url: string }>;
  draftsCreated: number;
  draftsApproved: number;
  draftsRejected: number;
  rejectedNoise: number;
  totalItemsScanned: number;
  sources: Record<string, number>;
}

export interface WeeklyTrendsReport {
  week: string;
  topTopics: Array<{ topic: string; count: number; trend: 'up' | 'down' | 'stable' }>;
  topSources: Array<{ source: string; count: number }>;
  contentTypes: Record<string, number>;
  avgScore: number;
  totalPublished: number;
}

export interface SourceHealthData {
  sources: Record<string, {
    status: 'healthy' | 'degraded' | 'failed';
    itemsFetched: number;
    errors: number;
    avgResponseTime: number;
    lastCheck: string;
  }>;
}

export interface RankingExplanation {
  itemTitle: string;
  finalScore: number;
  breakdown: {
    research: number;
    engineering: number;
    credibility: number;
    freshness: number;
  };
  why: string[];
}

export interface ExportData {
  version: string;
  generatedAt: string;
  posts: any[];
  stats: {
    total: number;
    byFormat: Record<string, number>;
    byTopic: Record<string, number>;
  };
}

export class ReportingEngine {
  private dataDir: string;
  private reports: Map<string, DailyReport> = new Map();

  constructor(dataDir = './data') {
    this.dataDir = dataDir;
  }

  async load(): Promise<void> {
    const filePath = path.join(this.dataDir, 'daily-reports.json');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      for (const report of data.reports || []) {
        this.reports.set(report.date, report);
      }
    } catch {}
  }

  async save(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    const filePath = path.join(this.dataDir, 'daily-reports.json');
    await fs.writeFile(filePath, JSON.stringify({
      reports: Array.from(this.reports.values())
    }, null, 2));
  }

  generateDaily(
    items: Array<{ title: string; score: number; source: string; url: string }>,
    stats: {
      draftsCreated: number;
      draftsApproved: number;
      draftsRejected: number;
      rejectedNoise: number;
      totalItemsScanned: number;
    },
    sources: Record<string, number>
  ): DailyReport {
    const today = new Date().toISOString().split('T')[0];
    
    const report: DailyReport = {
      date: today,
      topItems: items.slice(0, 10).map(i => ({
        title: i.title,
        score: i.score,
        source: i.source,
        url: i.url,
      })),
      ...stats,
      sources,
    };

    this.reports.set(today, report);
    return report;
  }

  generateWeekly(
    dailyReports: DailyReport[]
  ): WeeklyTrendsReport {
    const week = getWeekString(new Date());

    const topicCounts = new Map<string, number>();
    const sourceCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();
    let totalScore = 0;
    let totalPublished = 0;

    for (const report of dailyReports) {
      for (const topic of report.topTopics || []) {
        topicCounts.set(topic.topic, (topicCounts.get(topic.topic) || 0) + topic.count);
      }

      for (const [source, count] of Object.entries(report.sources || {})) {
        sourceCounts.set(source, (sourceCounts.get(source) || 0) + count);
      }

      totalPublished += report.draftsApproved;
    }

    const topTopics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({
        topic,
        count,
        trend: 'stable' as const,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topSources = Array.from(sourceCounts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      week,
      topTopics,
      topSources,
      contentTypes: Object.fromEntries(typeCounts),
      avgScore: totalScore / Math.max(1, dailyReports.length),
      totalPublished,
    };
  }

  getSourceHealth(feedHealth: FeedHealth[]): SourceHealthData {
    const sources: SourceHealthData['sources'] = {};

    for (const health of feedHealth) {
      sources[health.name] = {
        status: health.status === 'healthy' ? 'healthy' : health.status === 'degraded' ? 'degraded' : 'failed',
        itemsFetched: health.lastItemCount,
        errors: health.status === 'failed' ? 1 : 0,
        avgResponseTime: health.responseTimeMs || 0,
        lastCheck: health.lastCheck,
      };
    }

    return { sources };
  }

  explainRanking(item: { title: string; scores: ScoreResult }, freshness: number = 50): RankingExplanation {
    const why: string[] = [];

    if (item.scores.breakdown.novelty > 0.6) {
      why.push('High novelty score - unique contribution');
    }
    if (item.scores.breakdown.topicRelevance > 0.7) {
      why.push('Strong topic alignment with your interests');
    }
    if (item.scores.breakdown.implementation > 0.5) {
      why.push('Includes practical implementation details');
    }
    if (item.scores.credibility > 0.7) {
      why.push('High credibility source');
    }
    if (freshness > 70) {
      why.push('Recent publication');
    }

    return {
      itemTitle: item.title,
      finalScore: item.scores.composite,
      breakdown: {
        research: item.scores.research,
        engineering: item.scores.engineering,
        credibility: item.scores.credibility,
        freshness,
      },
      why,
    };
  }

  exportForWebsite(posts: any[]): ExportData {
    const byFormat: Record<string, number> = {};
    const byTopic: Record<string, number> = {};

    for (const post of posts) {
      byFormat[post.format || 'unknown'] = (byFormat[post.format || 'unknown'] || 0) + 1;
      for (const topic of post.topics || []) {
        byTopic[topic] = (byTopic[topic] || 0) + 1;
      }
    }

    return {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      posts: posts.map(p => ({
        title: p.title,
        url: p.url,
        format: p.format,
        topics: p.topics,
        publishedAt: p.publishedAt,
      })),
      stats: {
        total: posts.length,
        byFormat,
        byTopic,
      },
    };
  }

  async saveExport(data: ExportData): Promise<string> {
    const filePath = path.join(this.dataDir, 'export-website.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return filePath;
  }

  formatDailyForTelegram(report: DailyReport): string {
    let msg = `📊 *Daily Report* — ${report.date}\n\n`;
    msg += `Items scanned: ${report.totalItemsScanned}\n`;
    msg += `Drafts: ${report.draftsCreated} created, ${report.draftsApproved} approved, ${report.draftsRejected} rejected\n`;
    msg += `Noise rejected: ${report.rejectedNoise}\n\n`;

    if (report.topItems.length > 0) {
      msg += '*Top Items:*\n';
      for (const item of report.topItems.slice(0, 5)) {
        msg += `• ${item.title.substring(0, 50)}... (${item.score.toFixed(0)})\n`;
      }
    }

    return msg;
  }

  formatWeeklyForTelegram(report: WeeklyTrendsReport): string {
    let msg = `📈 *Weekly Trends* — Week ${report.week}\n\n`;
    msg += `Published: ${report.totalPublished}\n`;
    msg += `Avg Score: ${report.avgScore.toFixed(1)}\n\n`;

    if (report.topTopics.length > 0) {
      msg += '*Top Topics:*\n';
      for (const t of report.topTopics.slice(0, 5)) {
        msg += `• ${t.topic}: ${t.count}\n`;
      }
    }

    return msg;
  }
}

function getWeekString(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}