/**
 * Modal renderer — the highest-intrusiveness, opt-in pattern.
 *
 * A centered card over a dimming backdrop, implementing the full W3C APG modal dialog pattern:
 *  - `role="dialog"` + `aria-modal="true"` (set by the base host when `modal: true`),
 *  - focus moves into the dialog on open,
 *  - focus is TRAPPED within the dialog (Tab/Shift+Tab wrap),
 *  - Esc closes,
 *  - clicking the backdrop closes,
 *  - focus is returned to the invoking element on close.
 *
 * Fixed-position overlay → no CLS. Reduced-motion safe via the base entrance/exit handling.
 */

import type { Renderer, RendererContext, RendererHandle } from '../internal/contracts';
import { createBaseHost, isBrowser, noopHandle } from './base';

export const modalRenderer: Renderer = {
  mount(ctx: RendererContext): RendererHandle {
    if (!isBrowser()) return noopHandle();

    return createBaseHost(ctx, {
      modal: true,
      variant: 'soft-modal',
      position: 'center',
      backdrop: true,
      dismissibleOnEsc: true,
      decorateHost: (host) => {
        // Full-viewport fixed layer that flex-centers the card; backdrop sits behind it.
        host.style.position = 'fixed';
        host.style.inset = '0';
        host.style.zIndex = 'var(--sf-z, 2147483000)';
        host.style.display = 'flex';
        host.style.alignItems = 'center';
        host.style.justifyContent = 'center';
        host.style.padding = '20px';
      },
    });
  },
};
