/**
 * Top N Selection Per Day
 * 
 * - Select best N items per day
 * - Avoid noise
 * - Prioritize by score + recency
 *
 * @module application/services/TopNSelector
 */

export interface ScoredItem<T> {
  item: T;
  score: number;
  date: string;
}

export interface SelectionConfig {
  maxPerDay: number;
  minScore: number;
  scoreField?: string;
}

export class TopNSelector<T extends { timestamp?: string; publishedDate?: string }> {
  private config: SelectionConfig;

  constructor(config: SelectionConfig) {
    this.config = config;
  }

  select(items: T[]): ScoredItem<T>[] {
    const byDate = new Map<string, T[]>();

    for (const item of items) {
      const date = this.extractDate(item);
      const existing = byDate.get(date) || [];
      existing.push(item);
      byDate.set(date, existing);
    }

    const selected: ScoredItem<T>[] = [];

    for (const [date, dayItems] of byDate.entries()) {
      const scored = dayItems.map(item => ({
        item,
        score: this.calculateScore(item),
        date,
      }));

      scored.sort((a, b) => b.score - a.score);

      const top = scored
        .filter(s => s.score >= this.config.minScore)
        .slice(0, this.config.maxPerDay);

      selected.push(...top);
    }

    selected.sort((a, b) => b.score - a.score);

    return selected;
  }

  private extractDate(item: T): string {
    const ts = item.timestamp || item.publishedDate || '';
    if (!ts) return getDateString(new Date());
    
    try {
      return getDateString(new Date(ts));
    } catch {
      return getDateString(new Date());
    }
  }

  private calculateScore(item: T): number {
    let score = 50;

    const recency = this.getRecencyScore(item);
    score += recency;

    if (this.config.scoreField) {
      const fieldScore = (item as any)[this.config.scoreField];
      if (typeof fieldScore === 'number') {
        score += Math.min(fieldScore, 50);
      }
    }

    if (item.publishedDate || item.timestamp) {
      score += 10;
    }

    return score;
  }

  private getRecencyScore(item: T): number {
    const date = new Date(item.publishedDate || item.timestamp || Date.now());
    const now = new Date();
    const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 24) return 30;
    if (hoursDiff < 48) return 20;
    if (hoursDiff < 72) return 10;
    if (hoursDiff < 168) return 5;
    return 0;
  }

  static createDefault<T>(): TopNSelector<T> {
    return new TopNSelector<T>({
      maxPerDay: 5,
      minScore: 40,
    });
  }
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function selectTopPerDay<T extends { timestamp?: string }>(
  items: T[],
  options: { maxPerDay?: number; minScore?: number } = {}
): T[] {
  const selector = new TopNSelector<T>({
    maxPerDay: options.maxPerDay || 5,
    minScore: options.minScore || 40,
  });

  return selector.select(items).map(s => s.item);
}
