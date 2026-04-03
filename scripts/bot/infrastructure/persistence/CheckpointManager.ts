/**
 * Infrastructure & Robustness Utilities
 * 
 * - Checkpoint persistence
 * - Delivery history
 * - Idempotency
 * - Retry + backoff
 * - Structured logging
 *
 * @module infrastructure/persistence/CheckpointManager
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface CheckpointData {
  sources: Record<string, {
    lastId?: string;
    lastDate?: string;
    lastRun: string;
  }>;
  global: {
    lastFullRun: string;
  };
}

export interface DeliveryRecord {
  id: string;
  deliveredAt: string;
  channel: string;
}

export interface DeliveryHistory {
  records: Record<string, DeliveryRecord[]>;
}

export class CheckpointManager {
  private dataDir: string;
  private checkpoint: CheckpointData | null = null;

  constructor(dataDir = './data') {
    this.dataDir = dataDir;
  }

  async load(): Promise<CheckpointData> {
    const filePath = path.join(this.dataDir, 'checkpoints.json');
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      this.checkpoint = JSON.parse(content);
    } catch {
      this.checkpoint = {
        sources: {},
        global: { lastFullRun: new Date(0).toISOString() },
      };
    }

    return this.checkpoint!;
  }

  async save(): Promise<void> {
    if (!this.checkpoint) return;
    
    await fs.mkdir(this.dataDir, { recursive: true });
    const filePath = path.join(this.dataDir, 'checkpoints.json');
    await fs.writeFile(filePath, JSON.stringify(this.checkpoint, null, 2));
  }

  getCheckpoint(source: string) {
    return this.checkpoint?.sources[source];
  }

  setCheckpoint(source: string, data: { lastId?: string; lastDate?: string }): void {
    if (!this.checkpoint) {
      this.checkpoint = { sources: {}, global: { lastFullRun: new Date(0).toISOString() } };
    }
    
    this.checkpoint.sources[source] = {
      ...this.checkpoint.sources[source],
      ...data,
      lastRun: new Date().toISOString(),
    };
  }

  markFullRun(): void {
    if (!this.checkpoint) return;
    this.checkpoint.global.lastFullRun = new Date().toISOString();
  }
}

export class DeliveryManager {
  private history: DeliveryHistory = { records: {} };
  private filePath: string;

  constructor(dataDir = './data') {
    this.filePath = path.join(dataDir, 'delivery.json');
  }

  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      this.history = JSON.parse(content);
    } catch {
      this.history = { records: {} };
    }
  }

  async save(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.history, null, 2));
  }

  isDelivered(id: string, channel: string): boolean {
    const records = this.history.records[id] || [];
    return records.some(r => r.channel === channel);
  }

  async markDelivered(id: string, channel: string): Promise<void> {
    if (!this.history.records[id]) {
      this.history.records[id] = [];
    }
    
    this.history.records[id].push({
      id,
      deliveredAt: new Date().toISOString(),
      channel,
    });

    await this.save();
  }

  getDeliveryCount(id: string): number {
    return (this.history.records[id] || []).length;
  }
}

export async function withBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        const delay = Math.min(
          baseDelay * Math.pow(backoffMultiplier, attempt),
          maxDelay
        );

        if (onRetry) {
          onRetry(lastError, attempt + 1);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export interface PipelineLog {
  stage: 'ingest' | 'process' | 'generate' | 'publish';
  timestamp: string;
  source: string;
  status: 'start' | 'complete' | 'error';
  details?: Record<string, unknown>;
}

export class PipelineLogger {
  private logs: PipelineLog[] = [];

  log(stage: PipelineLog['stage'], source: string, status: PipelineLog['status'], details?: Record<string, unknown>): void {
    this.logs.push({
      stage,
      timestamp: new Date().toISOString(),
      source,
      status,
      details,
    });
  }

  getLogs(): PipelineLog[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }

  getStageSummary(stage: PipelineLog['stage']): { total: number; success: number; error: number } {
    const stageLogs = this.logs.filter(l => l.stage === stage);
    return {
      total: stageLogs.length,
      success: stageLogs.filter(l => l.status === 'complete').length,
      error: stageLogs.filter(l => l.status === 'error').length,
    };
  }
}
