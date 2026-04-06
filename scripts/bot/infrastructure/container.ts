/**
 * Dependency Injection Container
 * Manages object lifecycle and dependencies
 * Replaces singleton anti-patterns
 */

import type { IMessagePort, ISessionRepository, IGeminiService, INewsScanner, IPublisher, IImageGenerationService, IJobQueue, IEventBus } from '../application/ports';

export type Constructor<T> = new (...args: any[]) => T;
export type Factory<T> = (container: Container) => T;

export interface Registration<T> {
  factory: Factory<T>;
  singleton?: boolean;
  instance?: T;
}

export class Container {
  private registrations = new Map<symbol, Registration<unknown>>();
  private parent?: Container;
  private creationLocks = new Map<symbol, Promise<unknown>>();

  constructor(parent?: Container) {
    this.parent = parent;
  }

  register<T>(token: symbol, factory: Factory<T>, singleton = false): void {
    this.registrations.set(token, { factory, singleton });
  }

  registerInstance<T>(token: symbol, instance: T): void {
    this.registrations.set(token, { 
      factory: () => instance, 
      singleton: true, 
      instance 
    });
  }

  async resolve<T>(token: symbol): Promise<T> {
    // Check current container
    const registration = this.registrations.get(token);
    
    if (registration) {
      // Return existing singleton instance
      if (registration.singleton && registration.instance) {
        return registration.instance as T;
      }
      
      // For singletons, use locking to prevent race conditions
      if (registration.singleton) {
        const existingLock = this.creationLocks.get(token);
        if (existingLock) {
          return existingLock as Promise<T>;
        }
        
        // Create lock
        const creationPromise = this.createInstance<T>(registration).then(instance => {
          registration.instance = instance;
          this.creationLocks.delete(token);
          return instance;
        }).catch(error => {
          this.creationLocks.delete(token);
          throw error;
        });
        
        this.creationLocks.set(token, creationPromise);
        return creationPromise;
      }
      
      // Non-singleton: create new instance
      return this.createInstance<T>(registration);
    }
    
    // Check parent container
    if (this.parent) {
      return this.parent.resolve<T>(token);
    }
    
    throw new Error(`No registration found for token: ${token.toString()}`);
  }
  
  private async createInstance<T>(registration: Registration<unknown>): Promise<T> {
    return registration.factory(this) as T;
  }

  has(token: symbol): boolean {
    return this.registrations.has(token) || (this.parent?.has(token) ?? false);
  }

  createScope(): Container {
    return new Container(this);
  }

  clear(): void {
    this.registrations.clear();
  }
}

// Injection Tokens
export const TOKENS = {
  // Services
  MessagePort: Symbol('MessagePort'),
  SessionRepository: Symbol('SessionRepository'),
  GeminiService: Symbol('GeminiService'),
  NewsScanner: Symbol('NewsScanner'),
  Publisher: Symbol('Publisher'),
  ImageGenerationService: Symbol('ImageGenerationService'),
  JobQueue: Symbol('JobQueue'),
  EventBus: Symbol('EventBus'),
  
  // Enhanced Services (Personal Use)
  PaperHistoryRepository: Symbol('PaperHistoryRepository'),
  VoiceTranscriptionService: Symbol('VoiceTranscriptionService'),
  CommentaryFormatter: Symbol('CommentaryFormatter'),
  ResearchContextRepository: Symbol('ResearchContextRepository'),
  
  // Config
  BotConfig: Symbol('BotConfig'),
  
  // Use Cases
  GenerateBlogPostUseCase: Symbol('GenerateBlogPostUseCase'),
  ScanPapersUseCase: Symbol('ScanPapersUseCase'),
  ScanNewsUseCase: Symbol('ScanNewsUseCase'),
  PublishPostUseCase: Symbol('PublishPostUseCase'),
  
  // Enhanced Use Cases
  EnhancedScanPapersUseCase: Symbol('EnhancedScanPapersUseCase'),
  EnhancedGenerateBlogPostUseCase: Symbol('EnhancedGenerateBlogPostUseCase'),
} as const;

// Global container instance
let globalContainer: Container | null = null;

export function createContainer(): Container {
  if (globalContainer) {
    throw new Error('Container already created. Use getContainer() or createScopedContainer()');
  }
  globalContainer = new Container();
  return globalContainer;
}

export function getContainer(): Container {
  if (!globalContainer) {
    throw new Error('Container not created. Call createContainer() first.');
  }
  return globalContainer;
}

export function createScopedContainer(): Container {
  if (!globalContainer) {
    throw new Error('Container not created. Call createContainer() first.');
  }
  return globalContainer.createScope();
}

export function resetContainer(): void {
  if (globalContainer) {
    globalContainer.clear();
    globalContainer = null;
  }
}

