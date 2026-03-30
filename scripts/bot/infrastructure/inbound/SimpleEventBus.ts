/**
 * Simple Event Bus Implementation
 * For decoupled communication between components
 */

import { IEventBus, DomainEvent, EventHandler } from '../../application/ports';
import { logError, logDebug } from '../../logger';

export class SimpleEventBus implements IEventBus {
  private handlers = new Map<string, Set<EventHandler<DomainEvent>>>();

  async emit(event: DomainEvent): Promise<void> {
    logDebug('Event emitted', { type: event.type });
    
    const handlers = this.handlers.get(event.type);
    if (!handlers || handlers.size === 0) {
      return;
    }

    // Execute all handlers concurrently
    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        logError('Event handler failed', error as Error, { 
          eventType: event.type 
        });
      }
    });

    await Promise.all(promises);
  }

  on<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    
    this.handlers.get(eventType)!.add(handler as EventHandler<DomainEvent>);
  }

  off(eventType: string, handler: EventHandler<DomainEvent>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
