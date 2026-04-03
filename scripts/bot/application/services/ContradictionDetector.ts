/**
 * Contradiction Detector
 * 
 * Detects papers/posts with conflicting claims.
 * TICKET-152 - Priority item
 *
 * @module application/services/ContradictionDetector
 */

export interface Claim {
  id: string;
  text: string;
  type: 'quantitative' | 'qualitative' | 'comparative';
  subject: string;
  assertion: string;
  confidence: number;
}

export interface Contradiction {
  claimA: Claim;
  claimB: Claim;
  type: 'direct' | 'implication' | 'context';
  severity: 'high' | 'medium' | 'low';
  explanation: string;
}

const CONTRADICTION_PATTERNS = [
  { pattern: /increases?.*decreases?/i, type: 'direct' },
  { pattern: /better.*worse/i, type: 'direct' },
  { pattern: /higher.*lower/i, type: 'direct' },
  { pattern: /faster.*slower/i, type: 'direct' },
  { pattern: /more.*less/i, type: 'direct' },
  { pattern: /always.*never/i, type: 'direct' },
  { pattern: /significant.*insignificant/i, type: 'direct' },
];

const METRIC_COMPARISONS = [
  { better: 'higher', worse: 'lower', metrics: ['accuracy', 'precision', 'recall', 'F1'] },
  { better: 'lower', worse: 'higher', metrics: ['latency', 'delay', 'error', 'loss', 'MSE', 'RMSE'] },
  { better: 'faster', worse: 'slower', metrics: ['time', 'speed', 'throughput'] },
  { better: 'higher', worse: 'lower', metrics: ['efficiency', 'performance'] },
];

export class ContradictionDetector {
  extractClaims(text: string): Claim[] {
    const claims: Claim[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

    let claimId = 0;

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      
      if (this.isQuantitativeClaim(trimmed)) {
        claims.push({
          id: `claim-${claimId++}`,
          text: trimmed,
          type: 'quantitative',
          subject: this.extractSubject(trimmed),
          assertion: trimmed,
          confidence: 0.8,
        });
      } else if (this.isComparativeClaim(trimmed)) {
        claims.push({
          id: `claim-${claimId++}`,
          text: trimmed,
          type: 'comparative',
          subject: this.extractSubject(trimmed),
          assertion: trimmed,
          confidence: 0.7,
        });
      } else if (this.isQualitativeClaim(trimmed)) {
        claims.push({
          id: `claim-${claimId++}`,
          text: trimmed,
          type: 'qualitative',
          subject: this.extractSubject(trimmed),
          assertion: trimmed,
          confidence: 0.5,
        });
      }
    }

    return claims;
  }

  private isQuantitativeClaim(sentence: string): boolean {
    return /[0-9]+(\.[0-9]+)?%?/.test(sentence) || /\b(improved|decreased|increased|reduced)\b/i.test(sentence);
  }

  private isComparativeClaim(sentence: string): boolean {
    return /\b(better|worse|higher|lower|more|less|faster|slower|superior|inferior)\b/i.test(sentence);
  }

  private isQualitativeClaim(sentence: string): boolean {
    const qualitativeTerms = ['effective', 'reliable', 'robust', 'accurate', 'stable', 'efficient'];
    return qualitativeTerms.some(t => sentence.toLowerCase().includes(t));
  }

  private extractSubject(sentence: string): string {
    const words = sentence.split(' ').slice(0, 5).join(' ');
    return words || 'Unknown';
  }

  findContradictions(claims: Claim[], otherClaims: Claim[] = []): Contradiction[] {
    const contradictions: Contradiction[] = [];
    const allClaims = [...claims, ...otherClaims];

    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < allClaims.length; j++) {
        const contradiction = this.checkContradiction(claims[i], allClaims[j]);
        if (contradiction) {
          contradictions.push(contradiction);
        }
      }
    }

    return contradictions;
  }

  private checkContradiction(a: Claim, b: Claim): Contradiction | null {
    if (a.subject !== b.subject && !a.subject.includes(b.subject) && !b.subject.includes(a.subject)) {
      return null;
    }

    const aLower = a.assertion.toLowerCase();
    const bLower = b.assertion.toLowerCase();

    for (const { pattern, type } of CONTRADICTION_PATTERNS) {
      if (pattern.test(aLower) && pattern.test(bLower)) {
        return {
          claimA: a,
          claimB: b,
          type,
          severity: 'high',
          explanation: `Direct contradiction: "${a.assertion}" vs "${b.assertion}"`,
        };
      }
    }

    for (const comp of METRIC_COMPARISONS) {
      for (const metric of comp.metrics) {
        if (aLower.includes(metric) && bLower.includes(metric)) {
          const aBetter = aLower.includes(comp.better);
          const bBetter = bLower.includes(comp.better);

          if (aBetter !== bBetter) {
            return {
              claimA: a,
              claimB: b,
              type: 'context',
              severity: 'medium',
              explanation: `Conflicting ${metric} results: one claims ${comp.better}, other claims ${comp.worse}`,
            };
          }
        }
      }
    }

    return null;
  }

  formatForTelegram(contradictions: Contradiction[]): string {
    if (contradictions.length === 0) {
      return '✅ No contradictions detected.';
    }

    let msg = '⚠️ *Contradictions Found*\n\n';

    const high = contradictions.filter(c => c.severity === 'high');
    const medium = contradictions.filter(c => c.severity === 'medium');

    if (high.length > 0) {
      msg += '*High Severity:*\n';
      for (const c of high.slice(0, 2)) {
        msg += `• ${c.explanation.substring(0, 80)}...\n`;
      }
    }

    if (medium.length > 0) {
      msg += '*Medium:*\n';
      for (const c of medium.slice(0, 2)) {
        msg += `• ${c.explanation.substring(0, 80)}...\n`;
      }
    }

    return msg;
  }
}