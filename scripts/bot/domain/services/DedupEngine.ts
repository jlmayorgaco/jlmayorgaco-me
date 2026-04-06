/**
 * Dedup Engine - Multi-layer deduplication
 * 
 * Layer 1: Exact match (DOI, arXiv ID, URL exact)
 * Layer 2: Normalized (URL canonical, title hash)
 * Layer 3: Fuzzy (title similarity)
 *
 * @module domain/services/DedupEngine
 */

import { canonicalizeUrl, extractArxivId, extractDoi, generateTitleHash, normalizeTitle } from '../shared/canonicalization';

export interface DedupResult {
  isDuplicate: boolean;
  layer: 1 | 2 | 3 | null;
  matchedWith: string;
}

export class DedupEngine {
  private seenLayer1 = new Set<string>();
  private seenLayer2 = new Set<string>();
  private seenLayer3 = new Map<string, string>();

  constructor(existingItems: Array<{ id: string; url?: string; title?: string }> = []) {
    for (const item of existingItems) {
      this.register(item.id, item.url, item.title);
    }
  }

  register(id: string, url?: string, title?: string): void {
    if (id) {
      this.seenLayer1.add(id);
    }

    if (url) {
      const canonical = canonicalizeUrl(url);
      if (canonical) {
        this.seenLayer2.add(canonical);
      }
    }

    if (title) {
      const hash = generateTitleHash(title);
      this.seenLayer3.set(hash, id);
    }
  }

  check(item: { id?: string; url?: string; title?: string }): DedupResult {
    if (item.id) {
      const exactMatch = this.exactMatch(item.id);
      if (exactMatch) {
        return { isDuplicate: true, layer: 1, matchedWith: exactMatch };
      }
    }

    if (item.url) {
      const normalizedMatch = this.normalizedMatch(item.url);
      if (normalizedMatch) {
        return { isDuplicate: true, layer: 2, matchedWith: normalizedMatch };
      }
    }

    if (item.title) {
      const fuzzyMatch = this.fuzzyMatch(item.title);
      if (fuzzyMatch) {
        return { isDuplicate: true, layer: 3, matchedWith: fuzzyMatch };
      }
    }

    return { isDuplicate: false, layer: null, matchedWith: '' };
  }

  private exactMatch(id: string): string | null {
    if (this.seenLayer1.has(id)) {
      return id;
    }

    const arxivId = extractArxivId(id);
    if (arxivId && this.seenLayer1.has(`arxiv:${arxivId}`)) {
      return `arxiv:${arxivId}`;
    }

    const doi = extractDoi(id);
    if (doi && this.seenLayer1.has(`doi:${doi}`)) {
      return `doi:${doi}`;
    }

    if (id.startsWith('arxiv:') || id.startsWith('doi:') || id.startsWith('hn:') || id.startsWith('rss:')) {
      if (this.seenLayer1.has(id)) {
        return id;
      }
    }

    return null;
  }

  private normalizedMatch(url: string): string | null {
    const canonical = canonicalizeUrl(url);
    if (!canonical) return null;

    if (this.seenLayer2.has(canonical)) {
      return canonical;
    }

    const withoutWww = canonical.replace('://www.', '://');
    if (this.seenLayer2.has(withoutWww)) {
      return withoutWww;
    }

    return null;
  }

  private fuzzyMatch(title: string): string | null {
    const hash = generateTitleHash(title);
    
    if (this.seenLayer3.has(hash)) {
      return this.seenLayer3.get(hash) || hash;
    }

    const variations = this.generateTitleVariations(title);
    for (const variant of variations) {
      const variantHash = generateTitleHash(variant);
      if (this.seenLayer3.has(variantHash)) {
        return this.seenLayer3.get(variantHash) || variantHash;
      }
    }

    return null;
  }

  private generateTitleVariations(title: string): string[] {
    const normalized = normalizeTitle(title);
    const words = normalized.split(' ');

    const variations: string[] = [];

    if (words.length > 3) {
      variations.push(words.slice(0, 5).join(' '));
      variations.push(words.slice(0, 3).join(' '));
    }

    variations.push(normalized.replace(/[-â€“â€”]/g, ' '));

    variations.push(normalized.replace(/\s+(v|version|rev)\s*\d+/gi, ''));

    return variations;
  }

  clear(): void {
    this.seenLayer1.clear();
    this.seenLayer2.clear();
    this.seenLayer3.clear();
  }

  getStats() {
    return {
      layer1: this.seenLayer1.size,
      layer2: this.seenLayer2.size,
      layer3: this.seenLayer3.size,
    };
  }
}

export function deduplicate<T extends { id?: string; url?: string; title?: string }>(
  items: T[],
  existingItems: Array<{ id: string; url?: string; title?: string }> = [],
  options: { maxLayer?: 1 | 2 | 3 } = {}
): T[] {
  const engine = new DedupEngine(existingItems);
  const maxLayer = options.maxLayer || 3;

  const unique: T[] = [];

  for (const item of items) {
    const result = engine.check(item);

    if (!result.isDuplicate || result.layer && result.layer > maxLayer) {
      unique.push(item);
      engine.register(item.id || '', item.url, item.title);
    }
  }

  return unique;
}

