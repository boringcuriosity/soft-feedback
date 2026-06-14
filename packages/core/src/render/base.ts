/**
 * The shared rendering core.
 *
 * Everything visual in soft-feedback funnels through ONE custom element — `<soft-survey>` —
 * that owns a Shadow DOM, injects the base stylesheet, applies appearance/theme, and runs the
 * interactive question → question → thank-you flow while emitting lifecycle events.
 *
 * Each pattern renderer (popover, modal, banner, …) is a thin wrapper that decides *where* and
 * *how* this element is presented (positioning, overlay/backdrop, modality, focus trapping).
 * The flow logic itself lives here, exactly once, in {@link createBaseHost}.
 *
 * Constraints: strict TS, ESM, zero deps, SSR-guarded, reduced-motion safe, no CLS.
 */

import type {
  Renderer,
  RendererContext,
  RendererHandle,
  QuestionComponentHandle,
} from '../internal/contracts';
import type {
  Question,
  ResponseValue,
  Position,
  Appearance,
  ThemeMode,
  ClosingConfig,
} from '../types';
import { animateValue, gooeyShape, prefersReducedMotion } from '../motion/spring';
import { BASE_CSS, applyAppearance } from '../theme';
import { getQuestionComponent } from '../components';

/* ------------------------------------------------------------------ */
/* Environment guards                                                 */
/* ------------------------------------------------------------------ */

/** True only in a real browser document context. Renderers no-op otherwise (SSR safety). */
export function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof customElements !== 'undefined'
  );
}

/* ------------------------------------------------------------------ */
/* The <soft-survey> custom element                                   */
/* ------------------------------------------------------------------ */

export const ELEMENT_NAME = 'soft-survey';

/**
 * The custom element is intentionally a *dumb shell*: it provides the Shadow DOM, the injected
 * stylesheet, and stable structural slots. All behaviour is wired by the flow controller via
 * {@link SoftSurveyElement.shadow}. Keeping the element logic-free means the heavy code only
 * loads when a renderer actually drives it.
 */
export interface SoftSurveyElement extends HTMLElement {
  /** The shadow root, created in the constructor so it is always available to the controller. */
  readonly shadow: ShadowRoot;
}

let ElementCtor: (new () => SoftSurveyElement) | null = null;

/**
 * Lazily create the element constructor. References to `HTMLElement` / `attachShadow` happen
 * only when this is called (always in a browser, via {@link defineSoftSurvey}), so importing
 * the package in Node / SSR never evaluates `extends HTMLElement` and never throws.
 */
function getElementCtor(): new () => SoftSurveyElement {
  if (ElementCtor) return ElementCtor;
  class SoftSurvey extends HTMLElement {
    readonly shadow: ShadowRoot;
    constructor() {
      super();
      this.shadow = this.attachShadow({ mode: 'open' });
    }
  }
  ElementCtor = SoftSurvey as unknown as new () => SoftSurveyElement;
  return ElementCtor;
}

/** Register `<soft-survey>` exactly once. Safe to call repeatedly and on every mount. */
export function defineSoftSurvey(): void {
  if (!isBrowser()) return;
  if (customElements.get(ELEMENT_NAME)) return;
  customElements.define(ELEMENT_NAME, getElementCtor());
}

/* ------------------------------------------------------------------ */
/* Stylesheet injection                                               */
/* ------------------------------------------------------------------ */

/**
 * Inject {@link BASE_CSS} into a shadow root, preferring constructable stylesheets
 * (`adoptedStyleSheets`) and falling back to a `<style>` element on engines without support.
 */
function injectBaseCss(shadow: ShadowRoot): void {
  const proto = typeof Document !== 'undefined' ? Document.prototype : undefined;
  const supportsAdopted =
    typeof CSSStyleSheet === 'function' &&
    'replaceSync' in CSSStyleSheet.prototype &&
    proto !== undefined &&
    'adoptedStyleSheets' in (shadow as unknown as Record<string, unknown>);

  if (supportsAdopted) {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(BASE_CSS);
      shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, sheet];
      return;
    } catch {
      /* fall through to <style> */
    }
  }

  const style = document.createElement('style');
  style.textContent = BASE_CSS;
  shadow.appendChild(style);
}

/* ------------------------------------------------------------------ */
/* Focus management helpers                                           */
/* ------------------------------------------------------------------ */

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

/** Collect tabbable elements within a root (light + shadow DOM aware via the controller root). */
function focusableWithin(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el.getClientRects().length > 0,
  );
}

/* ------------------------------------------------------------------ */
/* Gooey morph geometry                                               */
/* ------------------------------------------------------------------ */

/**
 * Where the card should appear to grow *from* during the gooey entrance, plus how strong the
 * squash/bulge should be. Corner patterns (popover/tab) emerge from their anchored corner like a
 * toast; centered patterns (modal) pop from their middle; full-bleed/inline patterns stay subtle
 * so the wobble never distorts long text or a page-width bar.
 */
function gooeyGeometry(
  variant: string,
  position: Position | undefined,
): { origin: string; intensity: number } {
  if (variant.includes('banner')) return { origin: 'center', intensity: 0.35 };
  if (variant.includes('inline')) return { origin: 'center top', intensity: 0.6 };
  if (variant.includes('modal')) return { origin: 'center', intensity: 0.85 };

  // popover / tab-panel: grow from the anchored corner.
  switch (position) {
    case 'bottom-left':
      return { origin: 'left bottom', intensity: 1 };
    case 'bottom-center':
      return { origin: 'center bottom', intensity: 1 };
    case 'top':
      return { origin: 'right top', intensity: 1 };
    case 'center':
      return { origin: 'center', intensity: 0.9 };
    case 'bottom-right':
    default:
      return { origin: 'right bottom', intensity: 1 };
  }
}

/** Read the card's resting corner radius (px) so the morph bulges relative to the real theme. */
function resolveBaseRadius(card: HTMLElement): number {
  try {
    const raw = getComputedStyle(card).borderTopLeftRadius;
    const px = parseFloat(raw);
    return Number.isFinite(px) ? px : 16;
  } catch {
    return 16;
  }
}

/* ------------------------------------------------------------------ */
/* Base host options + factory                                        */
/* ------------------------------------------------------------------ */

export interface BaseHostOptions {
  /**
   * Modal dialogs trap focus and set `aria-modal`. Nonmodal patterns (popover, tab, banner,
   * inline) are labelled dialogs that manage but do not trap focus.
   */
  modal: boolean;
  /**
   * Structural variant class applied to the card, e.g. `soft-popover`, `soft-modal`. Drives
   * pattern-specific layout/positioning rules defined in BASE_CSS.
   */
  variant: string;
  /** Position hint for corner/edge patterns. Falls back to appearance/render config. */
  position?: Position;
  /**
   * Mount strategy. `overlay` patterns use a fixed-position element appended to <body> (no CLS).
   * `inline` patterns are appended into a caller-provided container, in document flow.
   */
  inlineContainer?: HTMLElement | null;
  /** Whether Escape should dismiss. Modal + nonmodal overlays: true. Inline/banner: configurable. */
  dismissibleOnEsc?: boolean;
  /** Render a translucent backdrop behind the card (modal). */
  backdrop?: boolean;
  /**
   * Called after the card element is built and inserted, before opening transitions, so the
   * pattern wrapper can apply extra positioning/styles to the host element.
   */
  decorateHost?: (host: SoftSurveyElement) => void;
}

/**
 * A live, mounted host. Pattern renderers receive this and may inspect/augment it, but the
 * lifecycle (open/close/destroy) is fully implemented here.
 */
export interface BaseHost extends RendererHandle {
  /** The custom element instance (an overlay's fixed-position root, or an inline child). */
  readonly host: SoftSurveyElement;
}

interface FlowInternals {
  contentEl: HTMLElement;
  footerEl: HTMLElement;
  progressFill: HTMLElement;
  progressBar: HTMLElement;
  liveRegion: HTMLElement;
  cardEl: HTMLElement;
  titleEl: HTMLElement;
}

/**
 * Create and wire a `<soft-survey>` host running the full survey flow.
 *
 * This is the single source of truth for: structure, styling, appearance/theme, the
 * question→question transition, completion + thank-you, lifecycle events, and accessibility
 * (roles, focus move-in/restore, optional trap, Esc, aria-live).
 */
export function createBaseHost(ctx: RendererContext, opts: BaseHostOptions): BaseHost {
  defineSoftSurvey();

  const { runtime, bus, context } = ctx;
  const survey = runtime.survey;
  const appearance: Appearance | undefined = survey.appearance;
  const reduce = prefersReducedMotion();
  const gooey = gooeyGeometry(opts.variant, opts.position);

  // Resolve a global theme from appearance — the renderers receive theme only via the survey.
  const globalTheme: ThemeMode | undefined = appearance?.theme;

  const host = document.createElement(ELEMENT_NAME) as SoftSurveyElement;
  const shadow = host.shadow;
  injectBaseCss(shadow);

  // Appearance/theme tokens are applied to the *host* element so custom properties cascade
  // through the shadow boundary into BASE_CSS.
  applyAppearance(host, appearance, globalTheme);

  // ---- structural DOM (inside shadow) -------------------------------------------------------
  if (opts.backdrop) {
    const backdrop = document.createElement('div');
    backdrop.className = 'soft-backdrop';
    backdrop.setAttribute('part', 'backdrop');
    // Clicking the backdrop dismisses (treated like a close request).
    backdrop.addEventListener('click', () => requestClose('user'));
    shadow.appendChild(backdrop);
  }

  const card = document.createElement('div');
  card.className = `soft-card ${opts.variant}`;
  card.setAttribute('part', 'card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', opts.modal ? 'true' : 'false');
  card.setAttribute('tabindex', '-1');
  if (opts.position) card.setAttribute('data-position', opts.position);
  // Anchor the gooey morph so corner patterns grow from their corner, toast-style.
  card.style.transformOrigin = gooey.origin;

  // Header: title + close button.
  const header = document.createElement('div');
  header.className = 'soft-head';
  header.setAttribute('part', 'head');

  const title = document.createElement('h2');
  title.className = 'soft-title';
  title.setAttribute('part', 'title');
  title.id = `soft-title-${survey.id}`;
  title.textContent = survey.name;
  card.setAttribute('aria-labelledby', title.id);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'soft-close';
  closeBtn.setAttribute('part', 'close');
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
  closeBtn.addEventListener('click', () => requestClose('user'));

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Progress indicator.
  const progressBar = document.createElement('div');
  progressBar.className = 'soft-progress';
  progressBar.setAttribute('part', 'progress');
  progressBar.setAttribute('role', 'progressbar');
  progressBar.setAttribute('aria-valuemin', '0');
  progressBar.setAttribute('aria-valuemax', '100');
  const progressFill = document.createElement('div');
  progressFill.className = 'soft-progress-fill';
  progressBar.appendChild(progressFill);

  // Content slot — question components mount here.
  const content = document.createElement('div');
  content.className = 'soft-content';
  content.setAttribute('part', 'content');

  // Footer — Next/Submit live here when needed.
  const footer = document.createElement('div');
  footer.className = 'soft-foot';
  footer.setAttribute('part', 'foot');

  // aria-live region for announcements (progress, thank-you, errors).
  const live = document.createElement('div');
  live.className = 'soft-sr-only';
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');

  card.appendChild(header);
  card.appendChild(progressBar);
  card.appendChild(content);
  card.appendChild(footer);
  card.appendChild(live);

  // Optional white-label badge (opt-in only).
  if (appearance?.badge) {
    const badge = document.createElement('a');
    badge.className = 'soft-badge';
    badge.setAttribute('part', 'badge');
    badge.href = 'https://github.com/soft-feedback/soft-feedback';
    badge.target = '_blank';
    badge.rel = 'noopener noreferrer';
    badge.textContent = 'Made with soft-feedback';
    card.appendChild(badge);
  }

  shadow.appendChild(card);

  const flow: FlowInternals = {
    contentEl: content,
    footerEl: footer,
    progressFill,
    progressBar,
    liveRegion: live,
    cardEl: card,
    titleEl: title,
  };

  // ---- lifecycle state ----------------------------------------------------------------------
  let currentComponent: QuestionComponentHandle | null = null;
  let previouslyFocused: HTMLElement | null = null;
  let sent = false;
  let closed = false;
  let opened = false;
  let autoDismissTimer: ReturnType<typeof setTimeout> | null = null;
  let cancelTransition: (() => void) | null = null;
  let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  // ---- event emission helpers ---------------------------------------------------------------
  const now = (): string => new Date().toISOString();

  function emitShown(): void {
    bus.emit({ type: 'shown', surveyId: survey.id, at: now() });
  }

  function emitSent(): void {
    const payload = runtime.buildPayload();
    bus.emit({ type: 'sent', surveyId: survey.id, at: now(), payload });
  }

  function emitClosedWithoutSend(): void {
    const hasAnswers = Object.keys(runtime.state.responses).length > 0;
    if (hasAnswers) {
      bus.emit({
        type: 'abandoned',
        surveyId: survey.id,
        at: now(),
        partial: {
          surveyId: survey.id,
          surveyName: survey.name,
          responses: { ...runtime.state.responses },
          startedAt: runtime.state.startedAt,
          context: { url: context.url, device: context.device, locale: context.locale },
        },
      });
    } else {
      bus.emit({ type: 'dismissed', surveyId: survey.id, at: now() });
    }
  }

  // ---- progress -----------------------------------------------------------------------------
  function updateProgress(): void {
    const pct = Math.round(Math.max(0, Math.min(1, runtime.state.progress)) * 100);
    progressBar.setAttribute('aria-valuenow', String(pct));
    // Only show progress once the user has advanced past the first step. On a
    // single-question widget (or the opening screen) an empty bar reads as a
    // broken loading indicator, so it stays hidden until it carries real meaning.
    progressBar.style.display = runtime.state.index > 0 ? '' : 'none';
    if (reduce) {
      flow.progressFill.style.transform = `scaleX(${pct / 100})`;
    } else {
      const fromPct = parseFloat(flow.progressFill.dataset.pct ?? '0');
      animateValue({
        from: fromPct,
        to: pct,
        preset: ctx.motion,
        reducedMotion: reduce,
        onUpdate: (v) => {
          flow.progressFill.style.transform = `scaleX(${v / 100})`;
        },
      });
    }
    flow.progressFill.dataset.pct = String(pct);
  }

  // ---- footer (Next/Submit) -----------------------------------------------------------------
  /**
   * Rating + single-choice questions auto-advance via the component's `onCommit`, so they need
   * no footer button. Text and multiple-choice questions need an explicit Next/Submit.
   */
  function questionNeedsButton(q: Question): boolean {
    if (q.type === 'text') return true;
    if (q.type === 'link') return true;
    if (q.type === 'choice' && q.multiple) return true;
    return false;
  }

  function renderFooter(q: Question, isLast: boolean): void {
    flow.footerEl.replaceChildren();
    if (!questionNeedsButton(q)) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'soft-btn soft-btn-primary';
    btn.setAttribute('part', 'submit');
    btn.textContent = isLast ? 'Submit' : 'Next';
    btn.addEventListener('click', () => advance());
    flow.footerEl.appendChild(btn);
  }

  // ---- question rendering + transitions -----------------------------------------------------
  function mountQuestion(q: Question, direction: 1 | -1 | 0): void {
    cancelTransition?.();

    const handle = getQuestionComponent(q)({
      question: q,
      value: runtime.state.responses[q.id],
      motion: ctx.motion,
      onChange: (value: ResponseValue) => {
        runtime.answer(q.id, value);
      },
      onCommit: (value: ResponseValue) => {
        runtime.answer(q.id, value);
        advance();
      },
    });

    const incoming = handle.el;
    incoming.classList.add('soft-q');

    const outgoing = currentComponent;
    currentComponent = handle;

    // Determine whether this is the final question for button labelling.
    const isLast = isLastQuestion(q);
    renderFooter(q, isLast);
    updateProgress();

    // Show the actual question as the visible heading (components only expose it via aria).
    flow.titleEl.textContent = q.prompt;

    if (reduce || direction === 0 || !outgoing) {
      // Reduced motion / first mount: snap (optionally a tiny opacity fade handled in CSS).
      outgoing?.el.remove();
      outgoing?.destroy();
      flow.contentEl.replaceChildren(incoming);
      focusQuestion(handle, q);
      announce(q.prompt);
      return;
    }

    // Animated cross-slide + height morph between questions.
    //
    // The outgoing question is taken out of flow (absolute overlay) so the incoming
    // one defines the content's natural height immediately. Otherwise both questions
    // stack vertically while the transition runs, and the new (often shorter) question
    // renders *below* the old one — leaving a tall dead space above it for the whole
    // animation. With the outgoing overlaid, we lock the content height and morph it
    // from the old to the new measurement, so the card resizes smoothly with no gap.
    const offset = direction === 1 ? 24 : -24;
    const outEl = outgoing.el;
    const fromHeight = flow.contentEl.offsetHeight;

    incoming.style.opacity = '0';
    incoming.style.transform = `translateX(${offset}px)`;
    flow.contentEl.appendChild(incoming);

    outEl.style.position = 'absolute';
    outEl.style.top = '0';
    outEl.style.left = '0';
    outEl.style.width = '100%';

    // With the outgoing overlaid, the content's measured height is now the incoming's.
    const toHeight = flow.contentEl.offsetHeight;
    flow.contentEl.style.height = `${fromHeight}px`;
    flow.contentEl.style.overflow = 'hidden';

    const clearTransitionStyles = (): void => {
      outEl.remove();
      outgoing.destroy();
      incoming.style.transform = '';
      incoming.style.opacity = '';
      flow.contentEl.style.height = '';
      flow.contentEl.style.overflow = '';
    };

    cancelTransition = animateValue({
      from: 0,
      to: 1,
      preset: ctx.motion,
      reducedMotion: reduce,
      onUpdate: (t) => {
        flow.contentEl.style.height = `${fromHeight + (toHeight - fromHeight) * t}px`;
        outEl.style.opacity = String(1 - t);
        outEl.style.transform = `translateX(${-offset * t}px)`;
        incoming.style.opacity = String(t);
        incoming.style.transform = `translateX(${offset * (1 - t)}px)`;
      },
      onDone: () => {
        clearTransitionStyles();
        focusQuestion(handle, q);
        announce(q.prompt);
        cancelTransition = null;
      },
    });
  }

  function focusQuestion(handle: QuestionComponentHandle, _q: Question): void {
    // Prefer the component's own focus target; otherwise nudge focus to the footer button.
    try {
      handle.focus();
    } catch {
      const firstBtn = flow.footerEl.querySelector<HTMLElement>('button');
      firstBtn?.focus();
    }
  }

  function announce(text: string): void {
    flow.liveRegion.textContent = '';
    // Re-set on next frame so AT reliably re-announces identical/sequential text.
    window.setTimeout(() => {
      flow.liveRegion.textContent = text;
    }, 30);
  }

  // ---- flow control -------------------------------------------------------------------------
  function isLastQuestion(q: Question): boolean {
    // Best-effort: if the question declares no branching and is the last in the array, it's last.
    const qs = survey.questions;
    const last = qs[qs.length - 1];
    return !q.branching && last !== undefined && last.id === q.id;
  }

  function advance(): void {
    if (closed) return;
    const next = runtime.next();
    if (next === null || runtime.isComplete()) {
      complete();
      return;
    }
    mountQuestion(next, 1);
  }

  function start(): void {
    const q = runtime.current();
    if (q === null || runtime.isComplete()) {
      complete();
      return;
    }
    mountQuestion(q, 0);
  }

  // ---- completion / thank-you ---------------------------------------------------------------
  function complete(): void {
    if (sent || closed) return;
    sent = true;
    emitSent();
    showThankYou(survey.closing);
  }

  function showThankYou(closing: ClosingConfig | undefined): void {
    cancelTransition?.();
    currentComponent?.el.remove();
    currentComponent?.destroy();
    currentComponent = null;

    flow.footerEl.replaceChildren();
    flow.progressBar.setAttribute('aria-valuenow', '100');
    flow.progressFill.style.transform = 'scaleX(1)';

    const wrap = document.createElement('div');
    wrap.className = 'soft-thankyou';
    wrap.setAttribute('part', 'thankyou');

    const check = document.createElement('div');
    check.className = 'soft-thankyou-mark';
    check.setAttribute('aria-hidden', 'true');
    check.innerHTML =
      '<svg viewBox="0 0 24 24" width="40" height="40"><path class="soft-thankyou-check" d="M4 12.5l5 5L20 6.5" pathLength="1" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const tyTitle = document.createElement('h2');
    tyTitle.className = 'soft-thankyou-title';
    tyTitle.textContent = closing?.thankYou?.title ?? 'Thank you!';

    wrap.appendChild(check);
    wrap.appendChild(tyTitle);

    if (closing?.thankYou?.description) {
      const desc = document.createElement('p');
      desc.className = 'soft-thankyou-desc';
      desc.textContent = closing.thankYou.description;
      wrap.appendChild(desc);
    }

    if (closing?.cta) {
      const cta = document.createElement('a');
      cta.className = 'soft-btn soft-btn-primary';
      cta.setAttribute('part', 'cta');
      cta.href = closing.cta.href;
      cta.target = '_blank';
      cta.rel = 'noopener noreferrer';
      cta.textContent = closing.cta.label;
      wrap.appendChild(cta);
    }

    flow.contentEl.replaceChildren(wrap);
    flow.titleEl.textContent = closing?.thankYou?.title ?? 'Thank you!';
    announce(closing?.thankYou?.title ?? 'Thank you!');

    // Confirmation morph: the mark blobs in with a bouncy pop while the tick strokes itself on —
    // soft-feedback's "morph to success" moment (reduced-motion safe: the check is simply present).
    const checkPath = check.querySelector<SVGPathElement>('.soft-thankyou-check');
    if (!reduce) {
      check.style.willChange = 'transform, border-radius';
      animateValue({
        from: 0,
        to: 1,
        preset: 'bouncy',
        reducedMotion: reduce,
        onUpdate: (s) => {
          const shape = gooeyShape(s, 28, 1);
          check.style.transform = shape.transform;
          check.style.borderRadius = shape.borderRadius;
        },
        onDone: () => {
          check.style.transform = '';
          check.style.borderRadius = '';
          check.style.willChange = '';
        },
      });
      if (checkPath) {
        checkPath.style.strokeDasharray = '1';
        checkPath.style.strokeDashoffset = '1';
        // Draw the tick slightly behind the pop so it lands as the mark settles.
        animateValue({
          from: 1,
          to: 0,
          preset: 'smooth',
          reducedMotion: reduce,
          onUpdate: (o) => {
            checkPath.style.strokeDashoffset = String(o);
          },
          onDone: () => {
            checkPath.style.strokeDashoffset = '0';
          },
        });
      }
    }

    // Move focus to the thank-you region (or its CTA) so AT lands somewhere sensible.
    const ctaEl = wrap.querySelector<HTMLElement>('a.soft-btn');
    if (ctaEl) {
      ctaEl.focus();
    } else {
      wrap.setAttribute('tabindex', '-1');
      wrap.focus();
    }

    const dismissMs = closing?.autoDismissMs;
    if (typeof dismissMs === 'number' && dismissMs > 0) {
      autoDismissTimer = setTimeout(() => close('sent'), dismissMs);
    }
  }

  // ---- close / destroy ----------------------------------------------------------------------
  /** A user-initiated close (Esc, close button, backdrop). Decides abandoned vs dismissed. */
  function requestClose(_source: 'user'): void {
    if (closed) return;
    if (sent) {
      close('sent');
    } else {
      close('dismissed');
    }
  }

  function close(reason: 'dismissed' | 'sent' | 'auto'): void {
    if (closed) return;
    closed = true;

    if (autoDismissTimer !== null) {
      clearTimeout(autoDismissTimer);
      autoDismissTimer = null;
    }
    cancelTransition?.();

    // Emit the appropriate lifecycle event for non-sent closes.
    if (reason !== 'sent' && !sent) {
      emitClosedWithoutSend();
    }

    detachKeydown();

    const finish = (): void => {
      teardownDom();
      restoreFocus();
    };

    if (reduce) {
      finish();
      return;
    }

    // Exit: the morph runs in reverse — the card pinches and its corners blob out as it shrinks
    // back toward its anchor and fades. `snappy` keeps the dismissal quick and free of a second
    // bounce (a bouncy exit would wobble past zero on the way out).
    const baseRadius = resolveBaseRadius(card);
    card.style.willChange = 'transform, border-radius, opacity';
    animateValue({
      from: 1,
      to: 0,
      preset: 'snappy',
      reducedMotion: reduce,
      onUpdate: (v) => {
        const shape = gooeyShape(v, baseRadius, gooey.intensity);
        card.style.opacity = String(shape.opacity);
        card.style.transform = shape.transform;
        card.style.borderRadius = shape.borderRadius;
      },
      onDone: finish,
    });
  }

  function teardownDom(): void {
    currentComponent?.destroy();
    currentComponent = null;
    host.remove();
  }

  function restoreFocus(): void {
    const target = previouslyFocused;
    previouslyFocused = null;
    if (target && typeof target.focus === 'function' && document.contains(target)) {
      target.focus();
    }
  }

  // ---- keyboard (Esc + focus trap) ----------------------------------------------------------
  function attachKeydown(): void {
    keydownHandler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && (opts.dismissibleOnEsc ?? true)) {
        e.preventDefault();
        e.stopPropagation();
        requestClose('user');
        return;
      }
      if (e.key === 'Tab' && opts.modal) {
        trapTab(e);
      }
    };
    // Listen on the host so events from inside the shadow DOM are caught (they retarget).
    host.addEventListener('keydown', keydownHandler, true);
  }

  function detachKeydown(): void {
    if (keydownHandler) {
      host.removeEventListener('keydown', keydownHandler, true);
      keydownHandler = null;
    }
  }

  /** APG modal focus trap: wrap Tab/Shift+Tab within the card's focusables. */
  function trapTab(e: KeyboardEvent): void {
    const focusables = focusableWithin(card);
    if (focusables.length === 0) {
      e.preventDefault();
      card.focus();
      return;
    }
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    const active = shadow.activeElement as HTMLElement | null;

    if (e.shiftKey) {
      if (active === first || active === null || active === card) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // ---- open ---------------------------------------------------------------------------------
  function open(): void {
    if (opened || closed) return;
    opened = true;

    previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Mount into DOM. Overlay patterns append to <body>; inline patterns into the container.
    const container = opts.inlineContainer ?? document.body;
    container.appendChild(host);

    opts.decorateHost?.(host);

    // Build the first question.
    start();

    attachKeydown();
    emitShown();

    // Move focus into the widget (APG): first the component handled it; ensure the card has focus
    // if nothing inside took it.
    moveFocusIn();

    // Entrance: a gooey blob morph — the card springs up from its anchor, stretches, and lets its
    // corners bulge before firming back to the resting radius. Reduced-motion safe.
    if (!reduce) {
      const baseRadius = resolveBaseRadius(card);
      card.style.opacity = '0';
      card.style.willChange = 'transform, border-radius, opacity';
      animateValue({
        from: 0,
        to: 1,
        preset: ctx.motion,
        reducedMotion: reduce,
        onUpdate: (v) => {
          const shape = gooeyShape(v, baseRadius, gooey.intensity);
          card.style.opacity = String(shape.opacity);
          card.style.transform = shape.transform;
          card.style.borderRadius = shape.borderRadius;
        },
        onDone: () => {
          card.style.transform = '';
          card.style.borderRadius = '';
          card.style.opacity = '';
          card.style.willChange = '';
        },
      });
    }
  }

  function moveFocusIn(): void {
    const active = shadow.activeElement;
    if (active && active !== card) return; // a question component already grabbed focus
    const focusables = focusableWithin(card);
    if (focusables.length > 0) {
      focusables[0]!.focus();
    } else {
      card.focus();
    }
  }

  // ---- public handle ------------------------------------------------------------------------
  return {
    host,
    open,
    close,
    destroy(): void {
      detachKeydown();
      if (autoDismissTimer !== null) clearTimeout(autoDismissTimer);
      cancelTransition?.();
      teardownDom();
    },
  };
}

/* ------------------------------------------------------------------ */
/* Shared resolution helpers for pattern renderers                    */
/* ------------------------------------------------------------------ */

/** Resolve the effective position: explicit render.position → appearance.position → default. */
export function resolvePosition(ctx: RendererContext, fallback: Position): Position {
  const survey = ctx.runtime.survey;
  return survey.render?.position ?? survey.appearance?.position ?? fallback;
}

/**
 * Build a no-op handle for renderers that cannot mount (SSR, missing target). Keeps the
 * `Renderer` contract honest without throwing into the host application.
 */
export function noopHandle(): RendererHandle {
  return {
    open(): void {},
    close(): void {},
    destroy(): void {},
  };
}
