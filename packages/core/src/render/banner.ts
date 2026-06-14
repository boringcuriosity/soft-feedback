/**
 * Banner renderer — a full-width bar pinned to the top or bottom edge.
 *
 * Good for small announcements / lightweight asks. Nonmodal (labelled dialog, no focus trap),
 * Esc-dismissible, focus moved in on open and restored on close. Fixed-position so it overlays
 * rather than reflowing the page (no CLS).
 *
 * Position resolution: `top` → top bar; anything else → bottom bar (the only two sensible
 * banner placements).
 */

import type { Renderer, RendererContext, RendererHandle } from '../internal/contracts';
import { createBaseHost, resolvePosition, isBrowser, noopHandle } from './base';

export const bannerRenderer: Renderer = {
  mount(ctx: RendererContext): RendererHandle {
    if (!isBrowser()) return noopHandle();

    const position = resolvePosition(ctx, 'bottom-center');
    const atTop = position === 'top';

    return createBaseHost(ctx, {
      modal: false,
      variant: atTop ? 'soft-banner soft-banner-top' : 'soft-banner soft-banner-bottom',
      position: atTop ? 'top' : 'bottom-center',
      backdrop: false,
      dismissibleOnEsc: true,
      decorateHost: (host) => {
        host.style.position = 'fixed';
        host.style.left = '0';
        host.style.right = '0';
        host.style.zIndex = 'var(--soft-z, 2147483000)';
        if (atTop) host.style.top = '0';
        else host.style.bottom = '0';
      },
    });
  },
};
