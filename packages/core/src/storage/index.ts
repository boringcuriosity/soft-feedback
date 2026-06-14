import type { StorageAdapter } from '../internal/contracts';
import { createLocalStorageAdapter } from './local-storage';

export { createMemoryStorageAdapter } from './memory';
export { createLocalStorageAdapter } from './local-storage';

/**
 * The library's default storage: durable `localStorage` when available, otherwise an
 * in-memory adapter. `createLocalStorageAdapter` already encapsulates the fallback, so this
 * is simply the canonical entry point consumers reach for when they don't bring their own.
 */
export function defaultStorage(): StorageAdapter {
  return createLocalStorageAdapter();
}
