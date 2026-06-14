/**
 * Tab renderer — the lowest-intrusiveness, user-initiated pattern.
 *
 * A persistent "Feedback" button is pinned to a screen edge. Clicking it opens the survey panel
 * (a nonmodal popover-style card). The button itself stays put for the lifetime of the renderer;
 * the panel toggles open/closed. Because the survey only appears on an explicit user action, this
 * is the passive/always-on feedback affordance.
 *
 * Lifecycle mapping:
 *  - `open()`   shows the persistent tab button (does NOT auto-open the panel — it's passive).
 *  - clicking the tab opens the panel via a fresh base host (emits `shown`).
 *  - panel close behaves like the popover (dismissed / abandoned / sent).
 *  - `close()`/`destroy()` tear down both the panel and the tab button.
 */

import type { Renderer, RendererContext, RendererHandle } from '../internal/contracts';
import type { BaseHost } from './base';
import { createBaseHost, resolvePosition, isBrowser, noopHandle, defineSoftSurvey } from './base';
import { animateValue, prefersReducedMotion } from '../motion/spring';

export const tabRenderer: Renderer = {
  mount(ctx: RendererContext): RendererHandle {
    if (!isBrowser()) return noopHandle();
    defineSoftSurvey();

    const position = resolvePosition(ctx, 'bottom-right');
    const onLeft = position.includes('left');
    const accent =
      (ctx.runtime.survey.appearance?.tokens?.['color-accent'] as string | undefined) ?? '#4f46e5';

    let tabButton: HTMLButtonElement | null = null;
    let panel: BaseHost | null = null;
    let destroyed = false;

    function buildTabButton(): HTMLButtonElement {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'soft-tab-button';
      btn.setAttribute('aria-haspopup', 'dialog');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = 'Feedback';

      // The tab lives in light DOM (not the shadow root), so it is styled inline here.
      btn.style.cssText = [
        'position:fixed',
        'bottom:0',
        onLeft ? 'left:24px' : 'right:24px',
        'z-index:2147483000',
        'margin:0',
        'padding:10px 18px',
        "font:600 14px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
        'color:#fff',
        `background:${accent}`,
        'border:0',
        'border-radius:12px 12px 0 0',
        'box-shadow:0 -6px 24px -8px rgb(16 18 35 / .35)',
        'cursor:pointer',
        'transform-origin:center bottom',
        'will-change:transform,border-radius',
        'transition:transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s ease, border-radius .22s cubic-bezier(.22,1,.36,1)',
      ].join(';');
      // Gooey hover: the nub lifts, swells, and softens its corners like a drip about to fall.
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-3px) scale(1.04)';
        btn.style.borderRadius = '16px 16px 6px 6px';
        btn.style.boxShadow = '0 -12px 30px -8px rgb(16 18 35 / .42)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0) scale(1)';
        btn.style.borderRadius = '12px 12px 0 0';
        btn.style.boxShadow = '0 -6px 24px -8px rgb(16 18 35 / .35)';
      });
      btn.addEventListener('pointerdown', () => {
        btn.style.transform = 'translateY(0) scale(.96)';
      });
      btn.addEventListener('pointerup', () => {
        btn.style.transform = 'translateY(-3px) scale(1.04)';
      });

      btn.addEventListener('click', () => togglePanel());
      return btn;
    }

    /** A bouncy slide-up so the tab arrives with personality instead of just appearing. */
    function animateTabIn(btn: HTMLButtonElement): void {
      if (prefersReducedMotion()) return;
      animateValue({
        from: 0,
        to: 1,
        preset: 'bouncy',
        onUpdate: (v) => {
          btn.style.transform = `translateY(${(1 - v) * 120}%)`;
        },
        onDone: () => {
          btn.style.transform = 'translateY(0) scale(1)';
        },
      });
    }

    function togglePanel(): void {
      if (panel) {
        panel.close('dismissed');
        return;
      }
      openPanel();
    }

    function openPanel(): void {
      if (panel || destroyed) return;

      // Each open builds a fresh base host so the flow restarts cleanly. The base host emits
      // `shown` on open and the appropriate close event; we intercept teardown to reset our
      // toggle state and return focus to the tab button.
      const base = createBaseHost(ctx, {
        modal: false,
        variant: 'soft-tab-panel',
        position,
        backdrop: false,
        dismissibleOnEsc: true,
        decorateHost: (host) => {
          host.style.position = 'fixed';
          host.style.zIndex = '2147483000';
          host.style.bottom = '64px';
          if (onLeft) host.style.left = '24px';
          else host.style.right = '24px';
          host.style.pointerEvents = 'none';
        },
      });

      panel = base;
      tabButton?.setAttribute('aria-expanded', 'true');

      // Wrap close so the toggle state resets and focus returns to the tab button.
      const originalClose = base.close;
      base.close = (reason): void => {
        originalClose(reason);
      };

      // Observe element removal to reset state. The base host returns focus to the previously
      // focused element (the tab button) automatically; we just clear `panel`.
      const observer = new MutationObserver(() => {
        if (!document.contains(base.host)) {
          panel = null;
          tabButton?.setAttribute('aria-expanded', 'false');
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      base.open();
    }

    return {
      open(): void {
        if (destroyed || tabButton) return;
        tabButton = buildTabButton();
        document.body.appendChild(tabButton);
        animateTabIn(tabButton);
      },
      close(reason): void {
        // Closing the renderer closes the panel (if open) but the tab is the persistent affordance;
        // a programmatic close tears the whole thing down.
        panel?.close(reason === 'auto' ? 'dismissed' : reason);
        panel = null;
        tabButton?.remove();
        tabButton = null;
      },
      destroy(): void {
        destroyed = true;
        panel?.destroy();
        panel = null;
        tabButton?.remove();
        tabButton = null;
      },
    };
  },
};
