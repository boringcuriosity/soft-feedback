/**
 * THE HERO — the morphing emoji dial.
 *
 * A single SVG face whose features (mouth curve, eyes, optional brows) morph *continuously*
 * from sad → neutral → happy as a normalized value `t ∈ [0,1]` slides along a horizontal track.
 * Instead of five static icons, you watch one face come alive.
 *
 * How the morph works
 * -------------------
 * Each facial feature is defined at three keyframes — SAD (t=0), NEUTRAL (t=0.5), HAPPY (t=1) —
 * as a small set of numeric control points (no path string parsing). For a given `t` we linearly
 * interpolate between the two bracketing keyframes, then serialise the control points into SVG
 * path `d` / element attributes. A spring (`animateValue`) drives `t` between positions so drags
 * feel weighted and the snap-to-detent overshoots playfully (per the chosen motion preset).
 *
 * Accessibility (APG slider)
 * --------------------------
 * - `role="slider"` with `aria-valuemin/max/now` on the discrete scale value, plus
 *   `aria-valuetext` set to the verbal label for that value (labels.min/max, midpointLabel, or a
 *   sensible default) so screen readers announce "Very satisfied", not "4".
 * - Arrow keys step ±1 detent, Home/End jump to the ends; Enter/Space commit.
 * - The whole track is the hit area and is ≥44px tall (WCAG 2.5.8); visible focus ring via CSS.
 * - Color is a REDUNDANT cue only — the mouth shape carries the meaning (WCAG 1.4.1).
 * - Reduced motion: no tween — the face snaps instantly to the discrete expression.
 * - Optional haptic detents on mobile via `navigator.vibrate` (feature-guarded).
 *
 * Interactions: pointer drag along the track, click-to-position, and full keyboard.
 * `onChange` fires continuously as the value crosses detents; `onCommit` fires on release/Enter.
 */

import type { Question, RatingQuestion, ResponseValue } from '../types';
import type {
  QuestionComponentContext,
  QuestionComponentHandle,
} from '../internal/contracts';
import { animateValue, prefersReducedMotion } from '../motion/spring';

function isRating(q: Question): q is RatingQuestion {
  return q.type === 'rating';
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

// A big, expressive real emoji that snaps to the nearest expression as the dial
// moves (very dissatisfied → very satisfied). Warm and instantly legible; the
// continuous SVG morph read as uncanny, so we let a real glyph carry the feeling.
const DIAL_EMOJI = ['😞', '🙁', '😐', '🙂', '😄'] as const;
function dialEmoji(t: number): string {
  const i = Math.round(clamp01(t) * (DIAL_EMOJI.length - 1));
  return DIAL_EMOJI[Math.max(0, Math.min(DIAL_EMOJI.length - 1, i))]!;
}

export function createEmojiDial(ctx: QuestionComponentContext): QuestionComponentHandle {
  const q = ctx.question;
  if (!isRating(q)) throw new Error('emoji-dial: expected a rating question');

  const min = Math.round(q.scale.min);
  const max = Math.round(q.scale.max);
  const span = Math.max(1, max - min);
  const steps = span; // number of intervals; detents = span + 1

  const reduced = prefersReducedMotion();

  /* value (discrete scale point) ↔ t (normalized 0..1) helpers */
  const valueToT = (v: number): number => clamp01((v - min) / span);
  const tToNearestValue = (t: number): number => min + Math.round(clamp01(t) * span);

  // Current committed/selected discrete value (undefined until the user acts).
  let value: number | undefined = typeof ctx.value === 'number' ? ctx.value : undefined;
  // Live normalized position of the thumb/face (decoupled from `value` during a drag).
  let t = value !== undefined ? valueToT(value) : 0.5;

  /* ----------------------------- DOM scaffold ----------------------------- */

  const root = document.createElement('div');
  root.className = 'sf-dial';

  // The big expressive emoji face.
  const face = document.createElement('div');
  face.className = 'sf-dial-emoji';
  face.setAttribute('aria-hidden', 'true');
  face.textContent = dialEmoji(t);

  // The track + thumb (the actual slider control).
  const track = document.createElement('div');
  track.className = 'sf-dial-track';
  track.setAttribute('part', 'dial');
  track.setAttribute('role', 'slider');
  track.setAttribute('tabindex', '0');
  track.setAttribute('aria-label', q.prompt);
  track.setAttribute('aria-valuemin', String(min));
  track.setAttribute('aria-valuemax', String(max));

  const fill = document.createElement('div');
  fill.className = 'sf-dial-fill';
  fill.setAttribute('aria-hidden', 'true');

  const thumb = document.createElement('div');
  thumb.className = 'sf-dial-thumb';
  thumb.setAttribute('part', 'dial-thumb');
  thumb.setAttribute('aria-hidden', 'true');

  // Detent ticks for visual affordance (decorative).
  const ticks = document.createElement('div');
  ticks.className = 'sf-dial-ticks';
  ticks.setAttribute('aria-hidden', 'true');
  for (let i = 0; i <= steps; i++) {
    const tick = document.createElement('span');
    tick.className = 'sf-dial-tick';
    tick.style.left = `${(i / steps) * 100}%`;
    ticks.appendChild(tick);
  }

  track.append(ticks, fill, thumb);

  // Endpoint anchors.
  const anchors = document.createElement('div');
  anchors.className = 'sf-dial-anchors';
  anchors.setAttribute('aria-hidden', 'true');
  const lo = document.createElement('span');
  lo.className = 'sf-dial-anchor sf-dial-anchor--min';
  lo.textContent = q.labels?.min ?? '';
  const hi = document.createElement('span');
  hi.className = 'sf-dial-anchor sf-dial-anchor--max';
  hi.textContent = q.labels?.max ?? '';
  anchors.append(lo, hi);

  root.append(face, track, anchors);

  /* ----------------------------- value text ----------------------------- */

  const DEFAULT_WORDS = [
    'Very dissatisfied',
    'Dissatisfied',
    'Neutral',
    'Satisfied',
    'Very satisfied',
  ] as const;

  const valueText = (v: number): string => {
    if (v === min && q.labels?.min) return q.labels.min;
    if (v === max && q.labels?.max) return q.labels.max;
    if (q.midpointLabel && v === Math.round((min + max) / 2)) return q.midpointLabel;
    const frac = (v - min) / span;
    const idx = Math.round(frac * (DEFAULT_WORDS.length - 1));
    return DEFAULT_WORDS[Math.max(0, Math.min(DEFAULT_WORDS.length - 1, idx))]!;
  };

  /* ----------------------------- rendering ------------------------------ */

  let lastEmoji = '';
  const renderFace = (tt: number): void => {
    // The emoji snaps to the nearest expression; a quick bounce sells each change.
    const glyph = dialEmoji(tt);
    if (glyph !== lastEmoji) {
      lastEmoji = glyph;
      face.textContent = glyph;
      if (!reduced) {
        face.classList.remove('sf-dial-emoji--pop');
        void face.offsetWidth; // restart the pop animation
        face.classList.add('sf-dial-emoji--pop');
      }
    }
    // Thumb + fill follow the live drag position continuously.
    const pct = clamp01(tt) * 100;
    thumb.style.left = `${pct}%`;
    fill.style.width = `${pct}%`;
  };

  const updateAria = (v: number): void => {
    track.setAttribute('aria-valuenow', String(v));
    // Screen readers get the verbal value via aria-valuetext; there's no visible value label.
    track.setAttribute('aria-valuetext', valueText(v));
  };

  /* ----------------------------- animation ------------------------------ */

  let cancelAnim: (() => void) | null = null;

  const stopAnim = (): void => {
    if (cancelAnim) {
      cancelAnim();
      cancelAnim = null;
    }
  };

  /** Animate `t` toward a target with the configured spring (or snap if reduced motion). */
  const animateTo = (target: number, preset = ctx.motion): void => {
    stopAnim();
    cancelAnim = animateValue({
      from: t,
      to: target,
      preset,
      reducedMotion: reduced,
      onUpdate: (v) => {
        t = v;
        renderFace(t);
      },
      onDone: () => {
        t = target;
        renderFace(t);
        cancelAnim = null;
      },
    });
  };

  /* ------------------------------ haptics ------------------------------- */

  const vibrate = (): void => {
    try {
      const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
      if (typeof nav.vibrate === 'function') nav.vibrate(8);
    } catch {
      /* feature absent — ignore */
    }
  };

  /* --------------------------- value commits ---------------------------- */

  /** Set the discrete value (snapping). `commit` advances the flow; `animate` tweens the face. */
  const setValue = (v: number, opts: { commit: boolean; animate: boolean }): void => {
    const clamped = Math.max(min, Math.min(max, Math.round(v)));
    const changed = clamped !== value;
    value = clamped;
    updateAria(clamped);
    const target = valueToT(clamped);
    if (opts.animate && !reduced) {
      animateTo(target);
    } else {
      stopAnim();
      t = target;
      renderFace(t);
    }
    if (changed) {
      vibrate();
      ctx.onChange(clamped as ResponseValue);
    }
    if (opts.commit) ctx.onCommit?.(clamped as ResponseValue);
  };

  /* --------------------------- pointer drag ----------------------------- */

  let dragging = false;
  let lastDetent: number | undefined;

  const tFromClientX = (clientX: number): number => {
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return t;
    const rtl = getComputedStyle(track).direction === 'rtl';
    let frac = (clientX - rect.left) / rect.width;
    if (rtl) frac = 1 - frac;
    return clamp01(frac);
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (!dragging) return;
    e.preventDefault();
    const nt = tFromClientX(e.clientX);
    stopAnim();
    t = nt;
    renderFace(t);
    // Fire onChange + haptic as we cross each detent during the drag.
    const detent = tToNearestValue(nt);
    if (detent !== lastDetent) {
      lastDetent = detent;
      if (detent !== value) {
        value = detent;
        updateAria(detent);
        vibrate();
        ctx.onChange(detent as ResponseValue);
      }
    }
  };

  const endDrag = (e: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    try {
      track.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
    const snapped = tToNearestValue(t);
    setValue(snapped, { commit: true, animate: true });
    lastDetent = undefined;
  };

  const onPointerDown = (e: PointerEvent): void => {
    // Primary button / touch / pen only.
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    track.focus();
    dragging = true;
    lastDetent = undefined;
    try {
      track.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    // Click-to-position: jump the face toward the press point immediately.
    const nt = tFromClientX(e.clientX);
    t = nt;
    renderFace(t);
    const detent = tToNearestValue(nt);
    if (detent !== value) {
      value = detent;
      updateAria(detent);
      vibrate();
      ctx.onChange(detent as ResponseValue);
    }
    lastDetent = detent;
  };

  track.addEventListener('pointerdown', onPointerDown);

  /* ----------------------------- keyboard ------------------------------- */

  const step = (delta: number): void => {
    const base = value ?? tToNearestValue(t);
    setValue(base + delta, { commit: false, animate: true });
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        step(+1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        step(-1);
        break;
      case 'PageUp':
        e.preventDefault();
        step(+Math.max(1, Math.round(steps / 4)));
        break;
      case 'PageDown':
        e.preventDefault();
        step(-Math.max(1, Math.round(steps / 4)));
        break;
      case 'Home':
        e.preventDefault();
        setValue(min, { commit: false, animate: true });
        break;
      case 'End':
        e.preventDefault();
        setValue(max, { commit: false, animate: true });
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        setValue(value ?? tToNearestValue(t), { commit: true, animate: false });
        break;
      default:
        break;
    }
  };

  track.addEventListener('keydown', onKeyDown);

  /* ------------------------------ init ---------------------------------- */

  if (value !== undefined) {
    updateAria(value);
  } else {
    // Show the neutral face and announce the midpoint without marking it "set".
    track.setAttribute('aria-valuenow', String(tToNearestValue(0.5)));
    track.setAttribute('aria-valuetext', valueText(tToNearestValue(0.5)));
  }
  renderFace(t);

  return {
    el: root,
    focus() {
      track.focus();
    },
    destroy() {
      stopAnim();
      track.removeEventListener('pointerdown', onPointerDown);
      track.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      root.remove();
    },
  };
}
