/**
 * Popover renderer — the default, lowest-intrusiveness active ask.
 *
 * A nonmodal, dismissible card that slides in from a screen corner (default bottom-right).
 * Fixed-position so it never causes layout shift. Esc-dismissible; focus is moved in on open
 * and restored on close, but focus is NOT trapped (it is a nonmodal dialog per APG).
 */

import type { Renderer, RendererContext, RendererHandle } from '../internal/contracts';
import { createBaseHost, resolvePosition, isBrowser, noopHandle } from './base';

export const popoverRenderer: Renderer = {
  mount(ctx: RendererContext): RendererHandle {
    if (!isBrowser()) return noopHandle();

    const position = resolvePosition(ctx, 'bottom-right');

    return createBaseHost(ctx, {
      modal: false,
      variant: 'soft-popover',
      position,
      backdrop: false,
      dismissibleOnEsc: true,
      decorateHost: (host) => {
        host.style.position = 'fixed';
        host.style.zIndex = 'var(--soft-z, 2147483000)';
        // Corner anchoring; the slide-in transform is handled by the base entrance animation.
        applyCorner(host, position);
        host.style.pointerEvents = 'none'; // host is a positioning frame; the card re-enables it
      },
    });
  },
};

/** Pin the host element to the requested corner/edge using fixed insets. */
function applyCorner(host: HTMLElement, position: string): void {
  const gap = '16px';
  // Reset.
  host.style.top = '';
  host.style.bottom = '';
  host.style.left = '';
  host.style.right = '';

  switch (position) {
    case 'bottom-left':
      host.style.bottom = gap;
      host.style.left = gap;
      break;
    case 'bottom-center':
      host.style.bottom = gap;
      host.style.left = '50%';
      host.style.transform = 'translateX(-50%)';
      break;
    case 'top':
      host.style.top = gap;
      host.style.right = gap;
      break;
    case 'center':
      host.style.top = '50%';
      host.style.left = '50%';
      host.style.transform = 'translate(-50%, -50%)';
      break;
    case 'bottom-right':
    default:
      host.style.bottom = gap;
      host.style.right = gap;
      break;
  }
}
