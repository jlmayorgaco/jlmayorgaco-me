/**
 * Content Formatters
 * 
 * - TelegramFormatter: short clean messages
 * - LinkedInFormatter: hook, body, CTA, hashtags
 * - BlogFormatter: structured markdown, technical
 * - HybridContentGenerator: scientific insight + engineering implication
 * - QualityGate: reject generic content
 *
 * @module application/services/ContentFormatters
 */

import type { IntelligenceOutput } from './IntelligencePipeline';

export interface TelegramMessage {
  text: string;
  parseMode: 'Markdown' | 'HTML';
}

export interface LinkedInPost {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
}

export interface BlogPost {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
}

export interface ContentQuality {
  passed: boolean;
  reasons: string[];
  score: number;
}

export class TelegramFormatter {
  static format(intelligence: IntelligenceOutput, url: string): TelegramMessage {
    const { classification, summary, insight } = intelligence;

    let text = `📄 *${classification.primary.toUpperCase()}*\n\n`;
    text += `*${this.escapeMd(insight.mainInsight)}*\n\n`;
    text += `_${this.escapeMd(summary.summary)}_\n\n`;
    text += `[Read more](${url})`;

    return { text, parseMode: 'Markdown' };
  }

  static formatMultiple(items: Array<{ intelligence: IntelligenceOutput; url: string }>): TelegramMessage {
    if (items.length === 0) {
      return { text: 'No content to display', parseMode: 'Markdown' };
    }

    let text = `📚 *Daily Digest*\n_${items.length} items_\n\n`;

    for (const item of items.slice(0, 5)) {
      const { classification, insight } = item.intelligence;
      text += `• *${this.escapeMd(insight.mainInsight.substring(0, 80))}...*\n`;
      text += `[${classification.primary}](${item.url})\n\n`;
    }

    return { text, parseMode: 'Markdown' };
  }

  private static escapeMd(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/_/g, '\\_')
      .replace(/\*/g, '\\*')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/`/g, '\\`');
  }
}

export class LinkedInFormatter {
  static format(intelligence: IntelligenceOutput, url: string): LinkedInPost {
    const { classification, insight, summary, engineering } = intelligence;

    const hook = this.generateHook(insight, classification);
    const body = this.generateBody(summary, engineering);
    const cta = '🔗 Read the full paper: ' + url;
    const hashtags = this.generateHashtags(classification);

    return { hook, body, cta, hashtags };
  }

  private static generateHook(insight: IntelligenceOutput['insight'], classification: IntelligenceOutput['classification']): string {
    const hooks = [
      `What if ${insight.mainInsight}`,
      `This breakthrough in ${classification.primary} changes everything`,
      `The future of ${classification.primary} is here`,
      `Why ${insight.targetAudience} should care about this`,
    ];
    return hooks[Math.floor(Math.random() * hooks.length)];
  }

  private static generateBody(summary: IntelligenceOutput['summary'], engineering: IntelligenceOutput['engineering']): string {
    let body = `${summary.summary}\n\n`;
    
    if (engineering.implementation && engineering.implementation !== 'Implementation details not available') {
      body += `🔧 Implementation: ${engineering.implementation.substring(0, 150)}\n\n`;
    }

    if (engineering.productionIssues.length > 0) {
      body += `⚠️ Challenges: ${engineering.productionIssues[0].substring(0, 100)}\n\n`;
    }

    return body;
  }

  private static generateHashtags(classification: IntelligenceOutput['classification']): string[] {
    const baseTags = ['Research', 'Technology', 'Innovation'];
    const categoryTag = classification.primary.replace(/-/g, '');
    return [...baseTags, categoryTag, 'Science', 'Engineering'];
  }
}

export class BlogFormatter {
  static format(intelligence: IntelligenceOutput, url: string): BlogPost {
    const { classification, summary, insight, critique, engineering } = intelligence;

    const title = this.generateTitle(insight, classification);
    const excerpt = summary.summary.substring(0, 160);
    const content = this.generateContent(intelligence, url);
    const tags = this.generateTags(classification);

    return { title, excerpt, content, tags };
  }

  private static generateTitle(insight: IntelligenceOutput['insight'], classification: IntelligenceOutput['classification']): string {
    return `${insight.mainInsight} [${classification.primary}]`;
  }

  private static generateContent(intelligence: IntelligenceOutput, url: string): string {
    const { summary, insight, critique, engineering, classification } = intelligence;

    let content = `## Overview\n\n${summary.summary}\n\n`;
    content += `## Why It Matters\n\n${insight.whyItMatters}\n\n`;

    if (summary.keyPoints.length > 0) {
      content += `## Key Findings\n\n`;
      for (const point of summary.keyPoints) {
        content += `- ${point}\n`;
      }
      content += '\n';
    }

    if (engineering.implementation && engineering.implementation !== 'Implementation details not available') {
      content += `## Implementation\n\n${engineering.implementation}\n\n`;
    }

    if (engineering.technologies.length > 0) {
      content += `## Technologies\n\n${engineering.technologies.join(', ')}\n\n`;
    }

    if (critique.limitations.length > 0) {
      content += `## Limitations\n\n`;
      for (const lim of critique.limitations) {
        content += `- ${lim}\n`;
      }
      content += '\n';
    }

    content += `## Source\n\n[Read on ArXiv](${url})`;

    return content;
  }

  private static generateTags(classification: IntelligenceOutput['classification']): string[] {
    return [
      classification.primary,
      'research',
      'technology',
      ...classification.categories.slice(0, 2),
    ];
  }
}

export class HybridContentGenerator {
  static generate(intelligence: IntelligenceOutput, url: string): {
    telegram: TelegramMessage;
    linkedin: LinkedInPost;
    blog: BlogPost;
  } {
    return {
      telegram: TelegramFormatter.format(intelligence, url),
      linkedin: LinkedInFormatter.format(intelligence, url),
      blog: BlogFormatter.format(intelligence, url),
    };
  }
}

export class QualityGate {
  static check(intelligence: IntelligenceOutput): ContentQuality {
    const reasons: string[] = [];
    let score = 100;

    if (!intelligence.summary.summary || intelligence.summary.summary.length < 20) {
      reasons.push('Summary too short or empty');
      score -= 30;
    }

    if (!intelligence.insight.mainInsight || intelligence.insight.mainInsight.length < 10) {
      reasons.push('No main insight generated');
      score -= 25;
    }

    const genericPhrases = [
      'this paper proposes',
      'in this paper',
      'the authors present',
      'results show',
    ];
    
    const summaryLower = intelligence.summary.summary.toLowerCase();
    for (const phrase of genericPhrases) {
      if (summaryLower.includes(phrase)) {
        reasons.push('Contains generic language');
        score -= 15;
        break;
      }
    }

    if (intelligence.classification.categories.length === 0) {
      reasons.push('No classification categories');
      score -= 20;
    }

    if (intelligence.critique.limitations.length === 0) {
      reasons.push('No critique provided');
      score -= 10;
    }

    return {
      passed: score >= 50 && reasons.length < 3,
      reasons,
      score,
    };
  }
}
