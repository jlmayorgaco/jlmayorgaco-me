/**
 * Anti-Generic Filter
 * 
 * Blocks posts like:
 * - "X company launched Y" without real technical analysis
 * - Generic AI hype without substance
 * - Clickbait without insight
 *
 * @module application/services/AntiGenericFilter
 */

export interface GenericIndicator {
  pattern: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface FilterResult {
  passed: boolean;
  rejected: boolean;
  reasons: string[];
  score: number;
}

const GENERIC_PATTERNS: GenericIndicator[] = [
  { pattern: 'launched a new', reason: 'Company launch without analysis', severity: 'high' },
  { pattern: 'announces', reason: 'Announcement without insight', severity: 'medium' },
  { pattern: 'revolutionary', reason: 'Hyperbole without evidence', severity: 'high' },
  { pattern: 'game-changing', reason: 'Clickbait language', severity: 'high' },
  { pattern: 'best-in-class', reason: 'Marketing language', severity: 'medium' },
  { pattern: 'industry-leading', reason: 'Marketing language', severity: 'medium' },
  { pattern: 'AI just got', reason: 'AI hype without substance', severity: 'high' },
  { pattern: 'GPT-[0-9]', reason: 'Model announcement without analysis', severity: 'medium' },
  { pattern: 'breakthrough', reason: 'Overused term without evidence', severity: 'medium' },
  { pattern: 'disrupts', reason: 'Business buzzword', severity: 'medium' },
  { pattern: 'transformational', reason: 'Marketing speak', severity: 'low' },
  { pattern: 'unprecedented', reason: 'Hyperbole', severity: 'low' },
];

const REQUIRED_INDICATORS = [
  'how',
  'why',
  'implementation',
  'code',
  'benchmark',
  'metric',
  'results',
  'limitations',
  'comparison',
  'analysis',
];

const PROHIBITED_STARTS = [
  'Just announced',
  'Breaking:',
  'Huge news:',
  'Big announcement',
];

export class AntiGenericFilter {
  check(content: { title: string; body: string }): FilterResult {
    const text = `${content.title} ${content.body}`.toLowerCase();
    const reasons: string[] = [];
    let score = 100;

    for (const indicator of GENERIC_PATTERNS) {
      if (text.includes(indicator.pattern.toLowerCase())) {
        reasons.push(`Contains '${indicator.reason}'`);
        score -= indicator.severity === 'high' ? 30 : indicator.severity === 'medium' ? 15 : 5;
      }
    }

    for (const start of PROHIBITED_STARTS) {
      if (content.title.toLowerCase().startsWith(start.toLowerCase())) {
        reasons.push(`Prohibited title pattern: ${start}`);
        score -= 25;
      }
    }

    const hasTechnicalContent = REQUIRED_INDICATORS.some(
      indicator => text.includes(indicator)
    );

    if (!hasTechnicalContent) {
      reasons.push('Lacks technical depth indicators');
      score -= 20;
    }

    const wordCount = content.body.split(/\s+/).length;
    if (wordCount < 50) {
      reasons.push('Content too short for substantive analysis');
      score -= 15;
    }

    const codePatterns = /code|github|repository|implementation|algorithm/i;
    if (!codePatterns.test(text) && !content.body.includes('http')) {
      reasons.push('No links or code references');
      score -= 10;
    }

    return {
      passed: score >= 50 && reasons.length < 3,
      rejected: score < 30 || reasons.length >= 3,
      reasons,
      score: Math.max(0, score),
    };
  }

  formatResult(result: FilterResult): string {
    if (result.passed) {
      return `âœ… Content passed (score: ${result.score}/100)`;
    }

    let msg = `âŒ Content rejected (score: ${result.score}/100)\n\n`;
    msg += `*Reasons:*\n`;
    for (const reason of result.reasons) {
      msg += `â€¢ ${reason}\n`;
    }

    return msg;
  }
}

