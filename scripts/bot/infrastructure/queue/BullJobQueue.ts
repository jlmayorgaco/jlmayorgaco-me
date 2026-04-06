/**
 * Bull Job Queue Implementation
 * For background processing
 */

import { IJobQueue, Job, JobOptions, JobProcessor, JobStatus } from '../../application/ports';
import { logDebug, logError, logInfo } from '../../infrastructure/logging/Logger';

// Bull Queue interface (replace with actual Bull imports)
export interface BullQueue {
  add(name: string, data: unknown, opts?: unknown): Promise<{ id: string | number }>;
  process(name: string, processor: (job: BullJob) => Promise<unknown>): void;
  getJob(id: string): Promise<BullJob | null>;
}

export interface BullJob {
  id: string | number;
  name: string;
  data: unknown;
  getState(): Promise<string>;
}

export class BullJobQueue implements IJobQueue {
  private processors = new Map<string, JobProcessor<unknown, unknown>>();

  constructor(private queues: Map<string, BullQueue>) {}

  async add<T>(jobName: string, data: T, options?: JobOptions): Promise<Job> {
    const queue = this.queues.get(jobName);
    if (!queue) {
      throw new Error(`No queue registered for job: ${jobName}`);
    }

    const bullOpts = {
      delay: options?.delay,
      priority: options?.priority,
      attempts: options?.attempts,
    };

    const bullJob = await queue.add(jobName, data, bullOpts);
    const id = typeof bullJob.id === 'number' ? String(bullJob.id) : bullJob.id;

    logDebug('Job added to queue', { jobName, jobId: id });

    return {
      id,
      name: jobName,
      data,
      status: 'waiting',
    };
  }

  process<T, R>(jobName: string, processor: JobProcessor<T, R>): void {
    const queue = this.queues.get(jobName);
    if (!queue) {
      throw new Error(`No queue registered for job: ${jobName}`);
    }

    this.processors.set(jobName, processor);

    queue.process(jobName, async (bullJob: BullJob) => {
      const job: { data: T } = { data: bullJob.data as T };
      
      logInfo('Processing job', { jobName, jobId: bullJob.id });
      
      try {
        const result = await processor(job);
        logInfo('Job completed', { jobName, jobId: bullJob.id });
        return result;
      } catch (error) {
        logError('Job failed', error as Error, { jobName, jobId: bullJob.id });
        throw error;
      }
    });
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    // Find the job in any queue
    for (const [jobName, queue] of this.queues.entries()) {
      const bullJob = await queue.getJob(jobId);
      if (bullJob) {
        const state = await bullJob.getState();
        return this.mapBullStateToStatus(state);
      }
    }

    return 'failed';
  }

  private mapBullStateToStatus(state: string): JobStatus {
    switch (state) {
      case 'waiting':
      case 'delayed':
        return 'waiting';
      case 'active':
        return 'active';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      default:
        return 'waiting';
    }
  }
}

