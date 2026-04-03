/**
 * Basic Memory & Content Clustering
 * 
 * - Store content embeddings (simple hash-based for now)
 * - Cluster similar content
 *
 * @module application/services/ContentMemory
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface MemoryItem {
  id: string;
  title: string;
  url: string;
  source: string;
  categories: string[];
  timestamp: string;
  clusterId?: string;
  keywords: string[];
}

export interface Cluster {
  id: string;
  name: string;
  items: string[];
  keywords: string[];
  lastUpdated: string;
}

export interface MemoryStats {
  totalItems: number;
  totalClusters: number;
  clustersBySize: Record<string, number>;
}

export class ContentMemory {
  private dataDir: string;
  private items: Map<string, MemoryItem> = new Map();
  private clusters: Map<string, Cluster> = new Map();

  constructor(dataDir = './data') {
    this.dataDir = dataDir;
  }

  async load(): Promise<void> {
    const itemsPath = path.join(this.dataDir, 'memory-items.json');
    const clustersPath = path.join(this.dataDir, 'memory-clusters.json');

    try {
      const itemsContent = await fs.readFile(itemsPath, 'utf-8');
      const itemsData = JSON.parse(itemsContent);
      for (const item of itemsData.items || []) {
        this.items.set(item.id, item);
      }
    } catch {}

    try {
      const clustersContent = await fs.readFile(clustersPath, 'utf-8');
      const clustersData = JSON.parse(clustersContent);
      for (const cluster of clustersData.clusters || []) {
        this.clusters.set(cluster.id, cluster);
      }
    } catch {}
  }

  async save(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });

    const itemsPath = path.join(this.dataDir, 'memory-items.json');
    await fs.writeFile(itemsPath, JSON.stringify({
      items: Array.from(this.items.values())
    }, null, 2));

    const clustersPath = path.join(this.dataDir, 'memory-clusters.json');
    await fs.writeFile(clustersPath, JSON.stringify({
      clusters: Array.from(this.clusters.values())
    }, null, 2));
  }

  addItem(item: Omit<MemoryItem, 'clusterId'>): void {
    const keywords = this.extractKeywords(item.title);
    
    const memoryItem: MemoryItem = {
      ...item,
      keywords,
    };

    this.items.set(item.id, memoryItem);

    const clusterId = this.findBestCluster(keywords);
    if (clusterId) {
      memoryItem.clusterId = clusterId;
      const cluster = this.clusters.get(clusterId);
      if (cluster) {
        cluster.items.push(item.id);
        cluster.lastUpdated = new Date().toISOString();
      }
    } else {
      this.createNewCluster(keywords, item.id);
    }
  }

  private extractKeywords(title: string): string[] {
    const words = title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    const stopWords = new Set([
      'with', 'from', 'that', 'this', 'using', 'based', 'using', 'approach',
      'method', 'system', 'paper', 'research', 'analysis', 'learning',
      'proposed', 'novel', 'efficient', 'new', 'using', 'approach',
    ]);

    return [...new Set(words.filter(w => !stopWords.has(w)))];
  }

  private findBestCluster(keywords: string[]): string | null {
    let bestCluster: string | null = null;
    let bestScore = 0;

    for (const [id, cluster] of this.clusters.entries()) {
      let score = 0;
      for (const kw of keywords) {
        if (cluster.keywords.includes(kw)) {
          score++;
        }
      }
      if (score > bestScore && score >= 2) {
        bestScore = score;
        bestCluster = id;
      }
    }

    return bestCluster;
  }

  private createNewCluster(keywords: string[], itemId: string): void {
    const clusterId = `cluster-${Date.now()}`;
    const name = keywords.slice(0, 3).join(', ');

    const cluster: Cluster = {
      id: clusterId,
      name: name || 'General',
      items: [itemId],
      keywords: keywords.slice(0, 10),
      lastUpdated: new Date().toISOString(),
    };

    this.clusters.set(clusterId, cluster);

    const item = this.items.get(itemId);
    if (item) {
      item.clusterId = clusterId;
    }
  }

  getClusterItems(clusterId: string): MemoryItem[] {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return [];

    return cluster.items
      .map(id => this.items.get(id))
      .filter((item): item is MemoryItem => item !== undefined);
  }

  getRelatedItems(itemId: string, limit = 5): MemoryItem[] {
    const item = this.items.get(itemId);
    if (!item) return [];

    const related: Array<{ item: MemoryItem; score: number }> = [];

    for (const [id, other] of this.items.entries()) {
      if (id === itemId) continue;

      let score = 0;
      for (const kw of item.keywords) {
        if (other.keywords.includes(kw)) score++;
      }

      if (score > 0) {
        related.push({ item: other, score });
      }
    }

    related.sort((a, b) => b.score - a.score);
    return related.slice(0, limit).map(r => r.item);
  }

  getStats(): MemoryStats {
    const clustersBySize: Record<string, number> = {
      small: 0,
      medium: 0,
      large: 0,
    };

    for (const cluster of this.clusters.values()) {
      if (cluster.items.length < 3) clustersBySize.small++;
      else if (cluster.items.length < 10) clustersBySize.medium++;
      else clustersBySize.large++;
    }

    return {
      totalItems: this.items.size,
      totalClusters: this.clusters.size,
      clustersBySize,
    };
  }

  formatForTelegram(): string {
    const stats = this.getStats();

    let msg = `🧠 *Content Memory*\n\n`;
    msg += `Items: ${stats.totalItems}\n`;
    msg += `Clusters: ${stats.totalClusters}\n`;
    msg += `  Small: ${stats.clustersBySize.small}\n`;
    msg += `  Medium: ${stats.clustersBySize.medium}\n`;
    msg += `  Large: ${stats.clustersBySize.large}\n\n`;

    const topClusters = Array.from(this.clusters.values())
      .sort((a, b) => b.items.length - a.items.length)
      .slice(0, 5);

    if (topClusters.length > 0) {
      msg += `*Top Clusters:*\n`;
      for (const cluster of topClusters) {
        msg += `• ${cluster.name}: ${cluster.items.length} items\n`;
      }
    }

    return msg;
  }

  clear(): void {
    this.items.clear();
    this.clusters.clear();
  }
}
