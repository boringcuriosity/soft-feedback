/**
 * Built-in, tree-shakeable data sinks. A sink receives every lifecycle event and must never
 * throw into the host app. Heavier integrations (Supabase, PostHog, Google Sheets) live in
 * the optional `@soft-feedback/adapters` package.
 */

import type { Sink } from '../internal/contracts';
import type { SoftEvent } from '../types';

export interface WebhookOptions {
  headers?: Record<string, string>;
  /** Transform the event before sending (default: the event as-is). */
  transform?: (event: SoftEvent) => unknown;
  /** Only forward these event types (default: all). */
  events?: Array<SoftEvent['type']>;
}

function canBeacon(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function';
}

/**
 * POST each event as JSON to a URL. Uses `navigator.sendBeacon` when available (reliable on
 * page unload, e.g. exit-intent), falling back to `fetch` with keepalive.
 */
export function webhook(url: string, options: WebhookOptions = {}): Sink {
  const { headers, transform, events } = options;
  return (event) => {
    if (events && !events.includes(event.type)) return;
    const body = JSON.stringify(transform ? transform(event) : event);

    if (!headers && canBeacon()) {
      try {
        const blob = new Blob([body], { type: 'application/json' });
        if (navigator.sendBeacon(url, blob)) return;
      } catch {
        /* fall through to fetch */
      }
    }

    if (typeof fetch === 'function') {
      void fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  };
}

/** Generic fetch sink — full control over the request. */
export function http(url: string, init?: RequestInit): Sink {
  return (event) => {
    if (typeof fetch !== 'function') return;
    void fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true,
      ...init,
    }).catch(() => {});
  };
}

/** Log every event to the console — handy in development. */
export function consoleSink(prefix = '[soft-feedback]'): Sink {
  return (event) => {
    try {
      // eslint-disable-next-line no-console
      console.log(prefix, event.type, event);
    } catch {
      /* ignore */
    }
  };
}
