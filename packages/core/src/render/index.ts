/**
 * Render layer barrel.
 *
 * One custom element (`<soft-survey>`) + shared flow controller, presented by six pattern
 * renderers. {@link getRenderer} maps a `RenderPattern` to its renderer.
 */

import type { RenderPattern } from '../types';
import type { Renderer } from '../internal/contracts';

import { popoverRenderer } from './popover';
import { inlineRenderer } from './inline';
import { tabRenderer } from './tab';
import { modalRenderer } from './modal';
import { bannerRenderer } from './banner';
import { headlessRenderer } from './headless';

/** Pattern → renderer lookup table. Exhaustive over {@link RenderPattern}. */
const RENDERERS: Record<RenderPattern, Renderer> = {
  popover: popoverRenderer,
  inline: inlineRenderer,
  tab: tabRenderer,
  modal: modalRenderer,
  banner: bannerRenderer,
  headless: headlessRenderer,
};

/**
 * Resolve the renderer for a render pattern. Falls back to the popover (the documented default)
 * for any unrecognized value so a malformed config never throws into the host app.
 */
export function getRenderer(pattern: RenderPattern): Renderer {
  return RENDERERS[pattern] ?? popoverRenderer;
}

export {
  popoverRenderer,
  inlineRenderer,
  tabRenderer,
  modalRenderer,
  bannerRenderer,
  headlessRenderer,
};

export type { HeadlessHandle } from './headless';

export {
  defineSoftSurvey,
  createBaseHost,
  isBrowser,
  resolvePosition,
  noopHandle,
  ELEMENT_NAME,
} from './base';
export type { SoftSurveyElement, BaseHost, BaseHostOptions } from './base';
