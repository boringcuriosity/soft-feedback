import type { StorageAdapter } from '../internal/contracts';
import { createMemoryStorageAdapter } from './memory';

/**
 * Probe whether a usable `localStorage` exists in the current environment.
 *
 * Merely checking for `window.localStorage` is not enough: it can throw on access (Safari
 * private mode historically threw on `setItem`, some sandboxed iframes throw on read). We do
 * a real round-trip write/remove inside try/catch to be certain.
 */
function isLocalStorageUsable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const probe = '__sf_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * `localStorage`-backed storage adapter.
 *
 * Falls back to an in-memory adapter when `localStorage` is missing or unusable (SSR, quota
 * exceeded, privacy settings). Every operation is wrapped in try/catch so a storage failure
 * mid-session degrades gracefully rather than throwing into the host application.
 */
export function createLocalStorageAdapter(): StorageAdapter {
  if (!isLocalStorageUsable()) {
    return createMemoryStorageAdapter();
  }

  return {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Swallow: a full/blocked store must never break the host page.
      }
    },
    remove(key) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Swallow — see above.
      }
    },
  };
}
