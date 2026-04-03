/**
 * Content Quota Balancer
 * 
 * Ensures weekly output maintains 50/50 balance:
 * - 50% software/systems
 * - 50% research/engineering
 *
 * @module application/services/ContentBalancer
 */

export type ContentCategory = 'software' | 'systems' | 'research' | 'engineering';
export type ContentType = 'software' | 'systems' | 'research' | 'engineering';

export interface QuotaConfig {
  targetRatio: { software: number; systems: number; research: number; engineering: number };
  tolerance: number;
}

export interface BalanceReport {
  current: Record<ContentType, number>;
  target: Record<ContentType, number>;
  balanced: boolean;
  deficit: ContentType[];
  excess: ContentType[];
}

const DEFAULT_CONFIG: QuotaConfig = {
  targetRatio: {
    software: 0.25,
    systems: 0.25,
    research: 0.25,
    engineering: 0.25,
  },
  tolerance: 0.1,
};

export class ContentBalancer {
  private config: QuotaConfig;
  private history: Array<{ category: ContentCategory; week: string; published: boolean }> = [];

  constructor(config: Partial<QuotaConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  addItem(category: ContentCategory, week: string = getWeekString()): void {
    this.history.push({ category, week, published: false });
  }

  getBalance(week?: string): BalanceReport {
    const w = week || getWeekString();
    const weekItems = this.history.filter(h => h.week === w);

    const current: Record<ContentType, number> = {
      software: weekItems.filter(h => h.category === 'software').length,
      systems: weekItems.filter(h => h.category === 'systems').length,
      research: weekItems.filter(h => h.category === 'research').length,
      engineering: weekItems.filter(h => h.category === 'engineering').length,
    };

    const total = Object.values(current).reduce((a, b) => a + b, 0);
    if (total === 0) {
      return {
        current,
        target: { software: 0, systems: 0, research: 0, engineering: 0 },
        balanced: true,
        deficit: [],
        excess: [],
      };
    }

    const target: Record<ContentType, number> = {
      software: Math.round(total * this.config.targetRatio.software),
      systems: Math.round(total * this.config.targetRatio.systems),
      research: Math.round(total * this.config.targetRatio.research),
      engineering: Math.round(total * this.config.targetRatio.engineering),
    };

    const deficit: ContentType[] = [];
    const excess: ContentType[] = [];

    for (const type of Object.keys(target) as ContentType[]) {
      const diff = target[type] - current[type];
      if (diff > 1) deficit.push(type);
      if (diff < -1) excess.push(type);
    }

    return {
      current,
      target,
      balanced: deficit.length === 0 && excess.length === 0,
      deficit,
      excess,
    };
  }

  getNextCategory(): ContentCategory {
    const balance = this.getBalance();
    
    if (balance.deficit.length > 0) {
      return balance.deficit[0] as ContentCategory;
    }

    const categories: ContentCategory[] = ['software', 'systems', 'research', 'engineering'];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  shouldPublish(category: ContentCategory): boolean {
    const balance = this.getBalance();
    const target = balance.target[category];
    const current = balance.current[category];

    return current <= target + 1;
  }

  formatForTelegram(): string {
    const balance = this.getBalance();
    
    let msg = balance.balanced ? '✅ ' : '⚠️ ';
    msg += `*Weekly Balance*\n\n`;

    const labels: Record<ContentType, string> = {
      software: '💻 Software',
      systems: '🔧 Systems',
      research: '🔬 Research',
      engineering: '⚙️ Engineering',
    };

    for (const [type, label] of Object.entries(labels)) {
      const curr = balance.current[type as ContentType];
      const tgt = balance.target[type as ContentType];
      msg += `${label}: ${curr}/${tgt}\n`;
    }

    if (balance.deficit.length > 0) {
      msg += `\n*Need:* ${balance.deficit.join(', ')}`;
    }

    return msg;
  }
}

function getWeekString(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}
