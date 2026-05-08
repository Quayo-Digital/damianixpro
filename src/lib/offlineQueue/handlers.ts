import type { OfflineHandlerName, OfflineQueueHandler } from './types';

const handlers = new Map<OfflineHandlerName, OfflineQueueHandler<unknown>>();

export function registerOfflineHandler<P>(handler: OfflineQueueHandler<P>): void {
  handlers.set(handler.name, handler as OfflineQueueHandler<unknown>);
}

export function getOfflineHandler<P>(name: OfflineHandlerName): OfflineQueueHandler<P> | null {
  return (handlers.get(name) as OfflineQueueHandler<P> | undefined) ?? null;
}

export function listRegisteredHandlerNames(): OfflineHandlerName[] {
  return Array.from(handlers.keys());
}
