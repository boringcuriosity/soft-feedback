import type { StorageAdapter } from '../internal/contracts';
import type { Context, DeviceType } from '../types';

/** Storage key for the persisted, non-anonymous anonymous id. */
const ANON_KEY = 'sf:v1:anon';

/**
 * Generate a reasonably-unique opaque id without external deps or crypto guarantees.
 *
 * Uses `crypto.randomUUID` when available, otherwise falls back to a timestamp + random
 * composite. This id is opaque and contains no PII.
 */
function generateId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to manual id */
  }
  return `sf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Resolve the anonymous identifier used for deterministic sampling and payload attribution.
 *
 * - `anonymous: true`  → an ephemeral per-session id that is NEVER written to storage. Each
 *   page load gets a fresh id (cached on the storage adapter only if that adapter is the
 *   in-memory one — but we deliberately do not persist, honoring cookieless mode). Sampling
 *   in this mode is therefore stable only within a session (a documented tradeoff).
 * - `anonymous: false` → a stable id persisted under `sf:v1:anon`, generated once and reused.
 *
 * Returns `undefined` only if we somehow cannot produce an id (never expected, but typed
 * permissively because `Context.anonId` is optional).
 */
export function getAnonId(storage: StorageAdapter, anonymous: boolean): string | undefined {
  if (anonymous) {
    // Ephemeral: do not touch persistent storage at all.
    return generateId();
  }

  const existing = storage.get(ANON_KEY);
  if (existing) return existing;

  const fresh = generateId();
  storage.set(ANON_KEY, fresh);
  return fresh;
}

/**
 * Best-effort device classification from user-agent + viewport width.
 *
 * Tablet detection is heuristic (iPad / Android-without-"mobile" / wide touch viewport).
 * Falls back to width-based bucketing, and finally to 'desktop' when nothing is detectable
 * (e.g. SSR with no window).
 */
function detectDevice(): DeviceType {
  const ua =
    typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string'
      ? navigator.userAgent
      : '';
  const width = typeof window !== 'undefined' ? window.innerWidth : 0;

  const isTabletUA = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua);
  const isMobileUA = /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua);

  if (isTabletUA) return 'tablet';
  if (isMobileUA) return 'mobile';

  // Width fallback (covers UA-less environments and modern UA-reduction).
  if (width > 0) {
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
  }
  return 'desktop';
}

/** Read the current page URL, guarding for non-browser environments. */
function detectUrl(): string {
  try {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.href;
    }
  } catch {
    /* ignore */
  }
  return '';
}

/**
 * Assemble the immutable {@link Context} the engine evaluates conditions against and stamps
 * onto outgoing payloads.
 */
export function buildContext(opts: {
  storage: StorageAdapter;
  anonymous: boolean;
  locale?: string;
  properties?: Record<string, unknown>;
}): Context {
  const locale =
    opts.locale ??
    (typeof navigator !== 'undefined' && navigator.language ? navigator.language : undefined);

  return {
    url: detectUrl(),
    device: detectDevice(),
    locale,
    properties: opts.properties ?? {},
    anonId: getAnonId(opts.storage, opts.anonymous),
  };
}
