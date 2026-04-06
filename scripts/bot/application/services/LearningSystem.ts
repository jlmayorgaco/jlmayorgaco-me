/**
 * Learning from Approvals/Rejections
 * 
 * Uses your decisions to adjust ranking and generation.
 * TICKET-169 - Priority item
 *
 * @module application/services/LearningSystem
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface LearningPattern {
  feature: string;
  approvalCount: number;
  rejectionCount: number;
  netScore: number;
}

export interface LearningFeedback {
  itemId: string;
  decision: 'approved' | 'rejected';
  features: string[];
  timestamp: string;
}

export interface ModelAdjustment {
  category: string;
  weight: number;
  direction: number;
}

export class LearningSystem {
  private dataDir: string;
  private feedbackHistory: LearningFeedback[] = [];
  private patterns: Map<string, LearningPattern> = new Map();

  constructor(dataDir = './data') {
    this.dataDir = dataDir;
  }

  async load(): Promise<void> {
    const filePath = path.join(this.dataDir, 'learning-data.json');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      this.feedbackHistory = data.feedback || [];
      
      for (const p of data.patterns || []) {
        this.patterns.set(p.feature, p);
      }
    } catch {}
  }

  async save(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    const filePath = path.join(this.dataDir, 'learning-data.json');
    await fs.writeFile(filePath, JSON.stringify({
      feedback: this.feedbackHistory,
      patterns: Array.from(this.patterns.values())
    }, null, 2));
  }

  recordDecision(
    itemId: string,
    decision: 'approved' | 'rejected',
    features: string[]
  ): void {
    const feedback: LearningFeedback = {
      itemId,
      decision,
      features,
      timestamp: new Date().toISOString(),
    };

    this.feedbackHistory.push(feedback);

    for (const feature of features) {
      const existing = this.patterns.get(feature) || {
        feature,
        approvalCount: 0,
        rejectionCount: 0,
        netScore: 0,
      };

      if (decision === 'approved') {
        existing.approvalCount++;
        existing.netScore += 1;
      } else {
        existing.rejectionCount++;
        existing.netScore -= 1;
      }

      this.patterns.set(feature, existing);
    }

    this.save();
  }

  getPatternAdjustments(): ModelAdjustment[] {
    const adjustments: ModelAdjustment[] = [];

    for (const [feature, pattern] of this.patterns.entries()) {
      const total = pattern.approvalCount + pattern.rejectionCount;
      if (total < 3) continue;

      const approvalRate = pattern.approvalCount / total;
      
      let weight = 0.1;
      if (approvalRate > 0.8) weight = 0.3;
      else if (approvalRate > 0.6) weight = 0.2;
      else if (approvalRate < 0.2) weight = -0.3;
      else if (approvalRate < 0.4) weight = -0.2;

      adjustments.push({
        category: feature,
        weight,
        direction: pattern.netScore > 0 ? 1 : -1,
      });
    }

    return adjustments.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  }

  shouldPromote(features: string[]): boolean {
    const positiveScore = features.reduce((sum, f) => {
      const pattern = this.patterns.get(f);
      return sum + (pattern?.netScore || 0);
    }, 0);

    return positiveScore > 0;
  }

  shouldDemote(features: string[]): boolean {
    const negativeScore = features.reduce((sum, f) => {
      const pattern = this.patterns.get(f);
      return sum + (pattern?.netScore || 0);
    }, 0);

    return negativeScore < -2;
  }

  getTopApprovedFeatures(limit = 10): LearningPattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.netScore > 0)
      .sort((a, b) => b.netScore - a.netScore)
      .slice(0, limit);
  }

  getTopRejectedFeatures(limit = 10): LearningPattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.netScore < 0)
      .sort((a, b) => a.netScore - b.netScore)
      .slice(0, limit);
  }

  formatForTelegram(): string {
    const approved = this.getTopApprovedFeatures(5);
    const rejected = this.getTopRejectedFeatures(5);

    let msg = 'ðŸ§  *Learning Patterns*\n\n';

    if (approved.length > 0) {
      msg += '*âœ… Top Approved Features:*\n';
      for (const p of approved) {
        msg += `â€¢ ${p.feature} (+${p.netScore})\n`;
      }
      msg += '\n';
    }

    if (rejected.length > 0) {
      msg += '*âŒ Top Rejected Features:*\n';
      for (const p of rejected) {
        msg += `â€¢ ${p.feature} (${p.netScore})\n`;
      }
    }

    if (approved.length === 0 && rejected.length === 0) {
      msg += '_No learning data yet. Make decisions to train the model._';
    }

    return msg;
  }

  reset(): void {
    this.feedbackHistory = [];
    this.patterns.clear();
    this.save();
  }
}
