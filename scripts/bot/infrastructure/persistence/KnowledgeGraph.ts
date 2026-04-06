/**
 * Lightweight Knowledge Graph Store
 * 
 * Simple relational storage for entities and relations.
 * Not a full graph DB - uses simple JSON storage.
 *
 * @module infrastructure/persistence/KnowledgeGraph
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface KGNode {
  id: string;
  type: 'entity' | 'paper' | 'repo' | 'concept';
  name: string;
  properties: Record<string, unknown>;
  createdAt: string;
}

export interface KGEdge {
  id: string;
  from: string;
  to: string;
  relation: string;
  properties: Record<string, unknown>;
  createdAt: string;
}

export interface KGQuery {
  findNodes: (type?: string, nameContains?: string) => KGNode[];
  findEdges: (from?: string, to?: string, relation?: string) => KGEdge[];
}

export class KnowledgeGraph {
  private dataDir: string;
  private nodes: Map<string, KGNode> = new Map();
  private edges: Map<string, KGEdge> = new Map();

  constructor(dataDir = './data') {
    this.dataDir = dataDir;
  }

  async load(): Promise<void> {
    const nodesPath = path.join(this.dataDir, 'kg-nodes.json');
    const edgesPath = path.join(this.dataDir, 'kg-edges.json');

    try {
      const nodesContent = await fs.readFile(nodesPath, 'utf-8');
      const nodesData = JSON.parse(nodesContent);
      for (const node of nodesData.nodes || []) {
        this.nodes.set(node.id, node);
      }
    } catch {}

    try {
      const edgesContent = await fs.readFile(edgesPath, 'utf-8');
      const edgesData = JSON.parse(edgesContent);
      for (const edge of edgesData.edges || []) {
        this.edges.set(edge.id, edge);
      }
    } catch {}
  }

  async save(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });

    const nodesPath = path.join(this.dataDir, 'kg-nodes.json');
    await fs.writeFile(nodesPath, JSON.stringify({
      nodes: Array.from(this.nodes.values())
    }, null, 2));

    const edgesPath = path.join(this.dataDir, 'kg-edges.json');
    await fs.writeFile(edgesPath, JSON.stringify({
      edges: Array.from(this.edges.values())
    }, null, 2));
  }

  addNode(node: Omit<KGNode, 'id' | 'createdAt'>): KGNode {
    const id = `${node.type}:${node.name.toLowerCase().replace(/\s+/g, '-')}`;
    
    const fullNode: KGNode = {
      ...node,
      id,
      createdAt: new Date().toISOString(),
    };

    this.nodes.set(id, fullNode);
    return fullNode;
  }

  addEdge(edge: Omit<KGEdge, 'id' | 'createdAt'>): KGEdge {
    const id = `${edge.from}:${edge.relation}:${edge.to}`;
    
    const fullEdge: KGEdge = {
      ...edge,
      id,
      createdAt: new Date().toISOString(),
    };

    this.edges.set(id, fullEdge);
    return fullEdge;
  }

  findNodes(query: { type?: string; nameContains?: string }): KGNode[] {
    return Array.from(this.nodes.values()).filter(node => {
      if (query.type && node.type !== query.type) return false;
      if (query.nameContains && !node.name.toLowerCase().includes(query.nameContains.toLowerCase())) {
        return false;
      }
      return true;
    });
  }

  findEdges(query: { from?: string; to?: string; relation?: string }): KGEdge[] {
    return Array.from(this.edges.values()).filter(edge => {
      if (query.from && !edge.from.includes(query.from)) return false;
      if (query.to && !edge.to.includes(query.to)) return false;
      if (query.relation && edge.relation !== query.relation) return false;
      return true;
    });
  }

  getRelatedNodes(nodeId: string, relation?: string): KGNode[] {
    const edges = this.findEdges({ 
      from: relation ? undefined : nodeId, 
      to: relation ? undefined : nodeId, 
      relation 
    });

    const relatedIds = new Set<string>();
    for (const edge of edges) {
      if (edge.from === nodeId) relatedIds.add(edge.to);
      if (edge.to === nodeId) relatedIds.add(edge.from);
    }

    return Array.from(relatedIds)
      .map(id => this.nodes.get(id))
      .filter((n): n is KGNode => n !== undefined);
  }

  query(query: KGQuery): KGQuery {
    return {
      findNodes: (type?: string, nameContains?: string) => this.findNodes({ type, nameContains }),
      findEdges: (from?: string, to?: string, relation?: string) => this.findEdges({ from, to, relation }),
    };
  }

  getStats(): { nodes: number; edges: number; types: Record<string, number> } {
    const types: Record<string, number> = {};
    
    for (const node of this.nodes.values()) {
      types[node.type] = (types[node.type] || 0) + 1;
    }

    return {
      nodes: this.nodes.size,
      edges: this.edges.size,
      types,
    };
  }

  formatForTelegram(): string {
    const stats = this.getStats();
    
    let msg = `ðŸ•¸ï¸ *Knowledge Graph*\n\n`;
    msg += `Nodes: ${stats.nodes}\n`;
    msg += `Edges: ${stats.edges}\n\n`;
    msg += `*Types:*\n`;
    
    for (const [type, count] of Object.entries(stats.types)) {
      msg += `  ${type}: ${count}\n`;
    }

    return msg;
  }
}

