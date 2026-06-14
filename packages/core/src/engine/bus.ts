import type { EventBus } from '../internal/contracts';
import type { SoftEvent, SoftEventType } from '../types';

/**
 * Create a minimal synchronous event bus implementing the {@link EventBus} contract.
 *
 * Subscribers registered for a specific event type receive only that type; subscribers
 * registered for '*' receive every event. Handlers are isolated with try/catch so one
 * misbehaving subscriber cannot break delivery to the others or throw into the emitter.
 */
export function createBus(): EventBus {
  // Per-type handler sets plus a dedicated wildcard set. Sets give O(1) add/remove and
  // natural dedupe of the same handler reference.
  const typed = new Map<SoftEventType, Set<(event: SoftEvent) => void>>();
  const wildcard = new Set<(event: SoftEvent) => void>();

  return {
    emit(event) {
      const direct = typed.get(event.type);
      if (direct) {
        // Iterate over a snapshot so handlers that unsubscribe during dispatch don't
        // mutate the set mid-iteration.
        for (const handler of [...direct]) {
          try {
            handler(event);
          } catch {
            /* never let a subscriber throw into the emitter */
          }
        }
      }
      for (const handler of [...wildcard]) {
        try {
          handler(event);
        } catch {
          /* swallow — see above */
        }
      }
    },

    on(type, handler) {
      if (type === '*') {
        wildcard.add(handler);
        return () => wildcard.delete(handler);
      }

      let set = typed.get(type);
      if (!set) {
        set = new Set();
        typed.set(type, set);
      }
      set.add(handler);
      return () => {
        set.delete(handler);
      };
    },
  };
}
