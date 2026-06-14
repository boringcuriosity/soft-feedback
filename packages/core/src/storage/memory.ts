import type { StorageAdapter } from '../internal/contracts';

/**
 * In-memory storage adapter.
 *
 * Holds state only for the lifetime of the page/JS context. This is the privacy-preserving
 * fallback: nothing is persisted to disk, so no durable identifier is ever written. It is
 * also used automatically whenever `localStorage` is unavailable (SSR, private-mode quota
 * errors, sandboxed iframes, etc.).
 */
export function createMemoryStorageAdapter(): StorageAdapter {
  const store = new Map<string, string>();

  return {
    get(key) {
      // Map.get returns undefined for missing keys; the contract requires `string | null`.
      const value = store.get(key);
      return value === undefined ? null : value;
    },
    set(key, value) {
      store.set(key, value);
    },
    remove(key) {
      store.delete(key);
    },
  };
}
