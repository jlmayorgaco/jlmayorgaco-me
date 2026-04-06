/**
 * Trend Tracking
 * 
 * - Top topics of the week
 * - Frequency analysis
 *
 * @module application/services/TrendTracker
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface TrendEntry {
  topic: string;
  count: number;
  lastSeen: string;
  trend: 'up' | 'stable' | 'down';
}

export interface WeeklyTrends {
  week: string;
  topics: TrendEntry[];
  generatedAt: string;
}

export class TrendTracker {
  private dataDir: string;
  private topicCounts: Map<string, { count: number; lastSeen: string; history: number[] }> = new Map();

  constructor(dataDir = './data') {
    this.dataDir = dataDir;
  }

  async load(): Promise<void> {
    const filePath = path.join(this.dataDir, 'trends.json');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      for (const [topic, info] of Object.entries(data.topics || {})) {
        const typed = info as any;
        this.topicCounts.set(topic, {
          count: typed.count,
          lastSeen: typed.lastSeen,
          history: typed.history || [],
        });
      }
    } catch {
      // Start fresh
    }
  }

  async save(): Promise<void> {
    const topics: Record<string, any> = {};
    for (const [topic, info] of this.topicCounts.entries()) {
      topics[topic] = info;
    }
    
    await fs.mkdir(this.dataDir, { recursive: true });
    const filePath = path.join(this.dataDir, 'trends.json');
    await fs.writeFile(filePath, JSON.stringify({ topics }, null, 2));
  }

  trackTopics(categories: string[]): void {
    const now = new Date().toISOString();
    
    for (const category of categories) {
      const normalized = category.toLowerCase().trim();
      const existing = this.topicCounts.get(normalized);
      
      if (existing) {
        existing.count++;
        existing.lastSeen = now;
        existing.history.push(1);
        if (existing.history.length > 7) {
          existing.history.shift();
        }
      } else {
        this.topicCounts.set(normalized, {
          count: 1,
          lastSeen: now,
          history: [1],
        });
      }
    }
  }

  trackCategory(category: string): void {
    this.trackTopics([category]);
  }

  getWeeklyTrends(): WeeklyTrends {
    const week = getWeekString(new Date());
    const topics: TrendEntry[] = [];

    for (const [topic, info] of this.topicCounts.entries()) {
      const recentCount = info.history.slice(-7).reduce((a, b) => a + b, 0);
      
      let trend: 'up' | 'stable' | 'down' = 'stable';
      if (info.history.length >= 7) {
        const lastWeek = info.history.slice(-14, -7).reduce((a, b) => a + b, 0);
        const thisWeek = recentCount;
        
        if (thisWeek > lastWeek * 1.2) trend = 'up';
        else if (thisWeek < lastWeek * 0.8) trend = 'down';
      }

      topics.push({
        topic: topic,
        count: recentCount,
        lastSeen: info.lastSeen,
        trend,
      });
    }

    topics.sort((a, b) => b.count - a.count);

    return {
      week,
      topics: topics.slice(0, 20),
      generatedAt: new Date().toISOString(),
    };
  }

  getTopTopics(limit = 10): TrendEntry[] {
    const trends = this.getWeeklyTrends();
    return trends.topics.slice(0, limit);
  }

  formatForTelegram(): string {
    const trends = this.getTopTopics(10);
    
    if (trends.length === 0) {
      return '*No trends yet. Run /digest to start tracking.*';
    }

    let msg = `ðŸ“Š *Weekly Trends*\n\n`;

    for (const trend of trends) {
      const emoji = trend.trend === 'up' ? 'ðŸ“ˆ' : trend.trend === 'down' ? 'ðŸ“‰' : 'âž¡ï¸';
      msg += `${emoji} *${trend.topic}* (${trend.count} mentions)\n`;
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

