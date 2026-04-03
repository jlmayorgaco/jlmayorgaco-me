/**
 * Relation Extraction
 * 
 * Extracts relations like:
 * - method → fails_under → condition
 * - paper → uses → metric
 * - repo → implements → method
 *
 * @module application/services/RelationExtractor
 */

export interface Relation {
  subject: string;
  predicate: string;
  object: string;
  source: string;
  confidence: number;
}

export type PredicateType = 
  | 'uses'
  | 'implements'
  | 'fails_under'
  | 'solves'
  | 'compared_to'
  | 'based_on'
  | 'requires'
  | 'achieves';

const PREDICATE_PATTERNS: Array<{
  predicate: PredicateType;
  pattern: RegExp;
  confidence: number;
}> = [
  {
    predicate: 'uses',
    pattern: /(?:uses?|employs?|applies?|utilizes?)\s+([A-Z][a-zA-Z\s]+?)(?:\s+for|\s+to|\s+in)/gi,
    confidence: 0.8,
  },
  {
    predicate: 'implements',
    pattern: /(?:implements?|realizes?|embodies?|demonstrates?)\s+([A-Z][a-zA-Z\s]+?)(?:\s+algorithm|\s+method)/gi,
    confidence: 0.85,
  },
  {
    predicate: 'fails_under',
    pattern: /(?:fails?|breaks?|does not work|poor performance)\s+(?:under|in|when)\s+([a-zA-Z\s]+?)(?:\s+conditions?|\s+scenarios?|\s+when)/gi,
    confidence: 0.7,
  },
  {
    predicate: 'solves',
    pattern: /(?:solves?|addresses?|tackles?|handles?)\s+([a-zA-Z\s]+?)(?:\s+problem|\s+issue|\s+challenge)/gi,
    confidence: 0.75,
  },
  {
    predicate: 'compared_to',
    pattern: /(?:compared (?:to|with)|versus|vs\.?)\s+([A-Z][a-zA-Z\s]+?)(?:\s+in|\s+on|\s+with)/gi,
    confidence: 0.8,
  },
  {
    predicate: 'based_on',
    pattern: /(?:based on|based upon|built on|derived from)\s+([A-Z][a-zA-Z\s]+?)(?:\s+method|\s+approach|\s+framework)/gi,
    confidence: 0.85,
  },
  {
    predicate: 'requires',
    pattern: /(?:requires?|needs?|demands?)\s+([a-zA-Z\s]+?)(?:\s+to|\s+for|\s+in|\s+data)/gi,
    confidence: 0.7,
  },
  {
    predicate: 'achieves',
    pattern: /(?:achieves?|attains?|reaches?|obtains?)\s+([0-9.]+%?\s+[a-zA-Z]+?)(?:\s+accuracy|\s+performance|\s+in)/gi,
    confidence: 0.9,
  },
];

export class RelationExtractor {
  extract(text: string, source: string = 'unknown'): Relation[] {
    const relations: Relation[] = [];

    for (const { predicate, pattern, confidence } of PREDICATE_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;

      while ((match = regex.exec(text)) !== null) {
        const subject = this.extractSubject(text, match.index);
        const object = match[1].trim();

        if (subject && object && object.length > 2) {
          relations.push({
            subject,
            predicate,
            object: object.substring(0, 50),
            source,
            confidence,
          });
        }
      }
    }

    return this.deduplicate(relations);
  }

  private extractSubject(text: string, endIndex: number): string {
    const start = Math.max(0, endIndex - 60);
    const snippet = text.substring(start, endIndex);

    const words = snippet.split(/\s+/);
    const subject = words.slice(-3).join(' ');

    return subject.trim();
  }

  private deduplicate(relations: Relation[]): Relation[] {
    const seen = new Set<string>();
    const unique: Relation[] = [];

    for (const r of relations) {
      const key = `${r.subject}:${r.predicate}:${r.object}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
      }
    }

    return unique;
  }

  findByPredicate(relations: Relation[], predicate: PredicateType): Relation[] {
    return relations.filter(r => r.predicate === predicate);
  }

  findBySubject(relations: Relation[], subject: string): Relation[] {
    return relations.filter(r => 
      r.subject.toLowerCase().includes(subject.toLowerCase())
    );
  }

  formatForTelegram(relations: Relation[]): string {
    if (relations.length === 0) {
      return 'No relations extracted.';
    }

    let msg = '*Extracted Relations*\n\n';

    const byPredicate = new Map<string, Relation[]>();
    for (const r of relations) {
      const list = byPredicate.get(r.predicate) || [];
      list.push(r);
      byPredicate.set(r.predicate, list);
    }

    for (const [pred, list] of byPredicate.entries()) {
      msg += `*${pred.replace('_', ' ')}:*\n`;
      for (const r of list.slice(0, 3)) {
        msg += `  ${r.subject} → ${r.object}\n`;
      }
      msg += '\n';
    }

    return msg;
  }
}
