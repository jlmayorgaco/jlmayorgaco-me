/**
 * Post Series Engine
 * 
 * Creates recurring series:
 * - "Paper to Production"
 * - "Reviewer 2 Notes"
 * - "System Design from Research"
 *
 * @module application/services/PostSeries
 */

export interface SeriesDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  templates: SeriesTemplate[];
  currentEpisode: number;
}

export interface SeriesTemplate {
  episode: number;
  title: string;
  prompt: string;
  expectedCategory: 'software' | 'systems' | 'research' | 'engineering';
}

export interface ActiveSeries {
  seriesId: string;
  episode: number;
  lastItem?: string;
  status: 'active' | 'paused' | 'completed';
}

const SERIES_DEFINITIONS: SeriesDefinition[] = [
  {
    id: 'paper-to-production',
    name: 'Paper to Production',
    description: 'Translating academic research into real systems',
    color: '🔬',
    templates: [
      { episode: 1, title: 'The Paper', prompt: 'Summarize the key contribution', expectedCategory: 'research' },
      { episode: 2, title: 'The Gap', prompt: 'What problem does this solve in production?', expectedCategory: 'engineering' },
      { episode: 3, title: 'The Implementation', prompt: 'How would you build this?', expectedCategory: 'software' },
      { episode: 4, title: 'The Risks', prompt: 'What could go wrong?', expectedCategory: 'systems' },
    ],
    currentEpisode: 0,
  },
  {
    id: 'reviewer2-notes',
    name: 'Reviewer 2 Notes',
    description: 'Critical analysis of recent papers',
    color: '📝',
    templates: [
      { episode: 1, title: 'The Claim', prompt: 'What is the main claim?', expectedCategory: 'research' },
      { episode: 2, title: 'The Problems', prompt: 'What are the limitations?', expectedCategory: 'engineering' },
      { episode: 3, title: 'The Verdict', prompt: 'Is this值得? For whom?', expectedCategory: 'systems' },
    ],
    currentEpisode: 0,
  },
  {
    id: 'system-design',
    name: 'System Design from Research',
    description: 'Designing systems inspired by papers',
    color: '🏗️',
    templates: [
      { episode: 1, title: 'The Concept', prompt: 'What is the core idea?', expectedCategory: 'research' },
      { episode: 2, title: 'Architecture', prompt: 'How does this map to system components?', expectedCategory: 'software' },
      { episode: 3, title: 'Tradeoffs', prompt: 'What are the design decisions?', expectedCategory: 'systems' },
      { episode: 4, title: 'Production Readiness', prompt: 'Is this ready for prod?', expectedCategory: 'engineering' },
    ],
    currentEpisode: 0,
  },
];

export class PostSeriesEngine {
  private activeSeries: Map<string, ActiveSeries> = new Map();

  startSeries(seriesId: string): ActiveSeries | null {
    const def = SERIES_DEFINITIONS.find(s => s.id === seriesId);
    if (!def) return null;

    const active: ActiveSeries = {
      seriesId,
      episode: 1,
      status: 'active',
    };

    this.activeSeries.set(seriesId, active);
    return active;
  }

  getNextEpisode(seriesId: string): SeriesTemplate | null {
    const def = SERIES_DEFINITIONS.find(s => s.id === seriesId);
    const active = this.activeSeries.get(seriesId);

    if (!def || !active) return null;

    const template = def.templates.find(t => t.episode === active.episode);
    if (!template) {
      active.status = 'completed';
      return null;
    }

    return template;
  }

  advanceEpisode(seriesId: string, itemId: string): boolean {
    const active = this.activeSeries.get(seriesId);
    if (!active || active.status !== 'active') return false;

    active.lastItem = itemId;
    active.episode++;

    const def = SERIES_DEFINITIONS.find(s => s.id === seriesId);
    if (!def || active.episode > def.templates.length) {
      active.status = 'completed';
    }

    return true;
  }

  getActiveSeries(): ActiveSeries[] {
    return Array.from(this.activeSeries.values()).filter(s => s.status === 'active');
  }

  getSeriesDefinition(seriesId: string): SeriesDefinition | null {
    return SERIES_DEFINITIONS.find(s => s.id === seriesId) || null;
  }

  formatForTelegram(): string {
    const active = this.getActiveSeries();
    
    if (active.length === 0) {
      return '*Active Series*\n\nNo active series. Use /start-series to begin.';
    }

    let msg = '*Active Series*\n\n';

    for (const a of active) {
      const def = this.getSeriesDefinition(a.seriesId);
      if (def) {
        msg += `${def.color} *${def.name}*\n`;
        msg += `Episode ${a.episode}/${def.templates.length}\n`;
        msg += `_${def.description}_\n\n`;
      }
    }

    return msg;
  }
}
