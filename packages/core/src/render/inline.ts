/**
 * Inline renderer — embeds the survey in the document flow.
 *
 * Mounts the `<soft-survey>` element inside the host page element matched by
 * `survey.render.selector`. No overlay, no fixed positioning: it reserves real space, so
 * surrounding content shifts naturally and there is no CLS surprise.
 *
 * If the selector is missing or matches nothing, the renderer is a safe no-op + console.warn.
 */

import type { Renderer, RendererContext, RendererHandle } from '../internal/contracts';
import { createBaseHost, isBrowser, noopHandle } from './base';

export const inlineRenderer: Renderer = {
  mount(ctx: RendererContext): RendererHandle {
    if (!isBrowser()) return noopHandle();

    const selector = ctx.runtime.survey.render?.selector;
    if (!selector) {
      console.warn(
        '[soft-feedback] inline renderer requires `render.selector`; nothing was mounted.',
      );
      return noopHandle();
    }

    let container: Element | null = null;
    try {
      container = document.querySelector(selector);
    } catch {
      console.warn(`[soft-feedback] inline renderer: invalid selector "${selector}".`);
      return noopHandle();
    }

    if (!(container instanceof HTMLElement)) {
      console.warn(
        `[soft-feedback] inline renderer: no element matched selector "${selector}"; nothing was mounted.`,
      );
      return noopHandle();
    }

    return createBaseHost(ctx, {
      modal: false,
      variant: 'soft-inline',
      backdrop: false,
      dismissibleOnEsc: true,
      inlineContainer: container,
      decorateHost: (host) => {
        host.style.display = 'block';
        host.style.position = 'relative';
        host.style.width = '100%';
      },
    });
  },
};
