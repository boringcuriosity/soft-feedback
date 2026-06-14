import type { Context, Trigger } from '../types';

/** No-op cleanup used for triggers handled outside the DOM watcher (manual/event). */
const NOOP = (): void => {};

/** Are we in a browser with a window to attach listeners to? */
function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Run `onFire` once, guarding against multiple invocations from racing listeners
 * (e.g. scroll + exit-intent + idle could all fire). The wrapper also tears down on first
 * fire by flipping a guard flag the cleanup closure reads.
 */
function once(onFire: () => void): { fire: () => void; fired: () => boolean } {
  let done = false;
  return {
    fire() {
      if (done) return;
      done = true;
      onFire();
    },
    fired: () => done,
  };
}

/**
 * Attach the appropriate DOM/timer listeners for a single behavioral trigger and return a
 * cleanup function that removes them. `manual` and `event` triggers are handled by the engine
 * itself (not here) and yield a no-op cleanup.
 *
 * Every proactive trigger fires AT MOST ONCE; after firing, its listeners self-detach. The
 * engine re-gates (conditions + frequency) before anything is actually shown, so firing here
 * only means "consider showing".
 */
export function watchDomTrigger(
  trigger: Trigger,
  ctx: Context,
  onFire: () => void,
): () => void {
  if (!hasWindow()) return NOOP;

  const guard = once(onFire);

  switch (trigger.type) {
    case 'manual':
    case 'event':
      // Handled by the engine; nothing to watch here.
      return NOOP;

    case 'timeOnPage': {
      const id = window.setTimeout(guard.fire, Math.max(0, trigger.ms));
      return () => window.clearTimeout(id);
    }

    case 'scrollDepth': {
      const target = clampPercent(trigger.percent);
      let ticking = false;

      const evaluate = (): void => {
        ticking = false;
        if (scrollDepthPercent() >= target) {
          cleanup();
          guard.fire();
        }
      };

      // Throttle with rAF; the scroll listener itself is passive for jank-free scrolling.
      const onScroll = (): void => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(evaluate);
      };

      const cleanup = (): void => {
        window.removeEventListener('scroll', onScroll);
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      // Evaluate once in case the page is already scrolled past the threshold.
      onScroll();
      return cleanup;
    }

    case 'exitIntent': {
      // Desktop: pointer leaves toward the top of the viewport (heading for the tab bar /
      // close button). Mobile: a back navigation (popstate) is the closest analogue.
      const onMouseOut = (e: MouseEvent): void => {
        // relatedTarget null + cursor near the top edge => leaving the window upward.
        if (!e.relatedTarget && e.clientY <= 0) {
          cleanup();
          guard.fire();
        }
      };
      const onPopState = (): void => {
        cleanup();
        guard.fire();
      };

      const cleanup = (): void => {
        document.removeEventListener('mouseout', onMouseOut);
        window.removeEventListener('popstate', onPopState);
      };

      if (typeof document !== 'undefined') {
        document.addEventListener('mouseout', onMouseOut);
      }
      window.addEventListener('popstate', onPopState);
      return cleanup;
    }

    case 'idle': {
      // Fire after `ms` of no user activity; any activity resets the timer.
      const ms = Math.max(0, trigger.ms);
      let timer = 0;
      const activityEvents: Array<keyof WindowEventMap> = [
        'mousemove',
        'mousedown',
        'keydown',
        'touchstart',
        'scroll',
        'wheel',
      ];

      const arm = (): void => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          cleanup();
          guard.fire();
        }, ms);
      };

      const onActivity = (): void => arm();

      const cleanup = (): void => {
        window.clearTimeout(timer);
        for (const evt of activityEvents) {
          window.removeEventListener(evt, onActivity);
        }
      };

      for (const evt of activityEvents) {
        window.addEventListener(evt, onActivity, { passive: true });
      }
      arm();
      return cleanup;
    }

    case 'elementVisible': {
      if (typeof document === 'undefined') return NOOP;

      const fireNow = (): void => {
        cleanup();
        if (trigger.delayMs && trigger.delayMs > 0) {
          window.setTimeout(guard.fire, trigger.delayMs);
        } else {
          guard.fire();
        }
      };

      // Prefer IntersectionObserver; poll as a fallback for very old environments.
      let observer: IntersectionObserver | undefined;
      let pollId = 0;

      const checkOnce = (): boolean => {
        const el = document.querySelector(trigger.selector);
        if (el && isInViewport(el)) {
          fireNow();
          return true;
        }
        return false;
      };

      const cleanup = (): void => {
        if (observer) observer.disconnect();
        if (pollId) window.clearInterval(pollId);
      };

      if (typeof IntersectionObserver !== 'undefined') {
        const el = document.querySelector(trigger.selector);
        if (el) {
          observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                fireNow();
                break;
              }
            }
          });
          observer.observe(el);
        } else {
          // Element not in the DOM yet — poll until it appears, then re-check.
          pollId = window.setInterval(() => {
            if (checkOnce()) return;
          }, 500);
        }
      } else {
        pollId = window.setInterval(() => {
          if (checkOnce()) return;
        }, 500);
      }
      return cleanup;
    }

    case 'routeChange': {
      // SPA navigation via History API or hashchange. We monkey-patch pushState/replaceState
      // to emit a synthetic event, restoring the originals on cleanup.
      const match = trigger.match;

      const handle = (): void => {
        if (match) {
          try {
            if (!new RegExp(match).test(window.location.href)) return;
          } catch {
            // Treat an invalid match as a substring test.
            if (!window.location.href.includes(match)) return;
          }
        }
        cleanup();
        guard.fire();
      };

      const origPush = history.pushState;
      const origReplace = history.replaceState;

      const patched = function (this: History, ...args: Parameters<History['pushState']>) {
        const ret = origPush.apply(this, args);
        handle();
        return ret;
      };
      const patchedReplace = function (
        this: History,
        ...args: Parameters<History['replaceState']>
      ) {
        const ret = origReplace.apply(this, args);
        handle();
        return ret;
      };

      const cleanup = (): void => {
        history.pushState = origPush;
        history.replaceState = origReplace;
        window.removeEventListener('popstate', handle);
        window.removeEventListener('hashchange', handle);
      };

      history.pushState = patched;
      history.replaceState = patchedReplace;
      window.addEventListener('popstate', handle);
      window.addEventListener('hashchange', handle);
      return cleanup;
    }

    default:
      return NOOP;
  }
}

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */

function clampPercent(p: number): number {
  if (!Number.isFinite(p)) return 0;
  return Math.min(100, Math.max(0, p));
}

/** Current scroll depth as a percentage [0, 100] of the scrollable height. */
function scrollDepthPercent(): number {
  const doc = document.documentElement;
  const body = document.body;
  const scrollTop = window.scrollY || doc.scrollTop || (body ? body.scrollTop : 0);
  const scrollHeight = Math.max(
    doc.scrollHeight,
    body ? body.scrollHeight : 0,
    doc.clientHeight,
  );
  const viewport = window.innerHeight || doc.clientHeight;
  const scrollable = scrollHeight - viewport;
  if (scrollable <= 0) return 100; // nothing to scroll — treat as fully scrolled.
  return (scrollTop / scrollable) * 100;
}

/** Whether an element's box currently intersects the viewport. */
function isInViewport(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const vw = window.innerWidth || document.documentElement.clientWidth;
  return rect.bottom > 0 && rect.right > 0 && rect.top < vh && rect.left < vw;
}
