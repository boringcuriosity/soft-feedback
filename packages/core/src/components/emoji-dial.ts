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

const VB = 120; // square viewBox

/** A facial expression as numeric control points, all in the 0..VB viewBox space. */
interface Face {
  eyeY: number; // vertical center of the eyes
  eyeR: number; // eye radius
  eyeSquint: number; // 0 = round, 1 = happy squint (eyes become arcs)
  browAngle: number; // degrees; negative = angry/sad inner-down, positive = raised
  browY: number; // brow vertical offset
  mouthCornerY: number; // y of the mouth's outer corners
  mouthCtrlY: number; // y of the mouth's center control point
}

// Three keyframes. The mouth control point crossing the corners is what reads as a smile/frown.
const SAD: Face = {
  eyeY: 50,
  eyeR: 6,
  eyeSquint: 0,
  browAngle: -16,
  browY: 36,
  mouthCornerY: 86,
  mouthCtrlY: 70,
};
const NEUTRAL: Face = {
  eyeY: 50,
  eyeR: 6,
  eyeSquint: 0,
  browAngle: 0,
  browY: 38,
  mouthCornerY: 80,
  mouthCtrlY: 80,
};
const HAPPY: Face = {
  eyeY: 49,
  eyeR: 6,
  eyeSquint: 0.85,
  browAngle: 8,
  browY: 34,
  mouthCornerY: 74,
  mouthCtrlY: 100,
};

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

function lerpFace(a: Face, b: Face, k: number): Face {
  return {
    eyeY: lerp(a.eyeY, b.eyeY, k),
    eyeR: lerp(a.eyeR, b.eyeR, k),
    eyeSquint: lerp(a.eyeSquint, b.eyeSquint, k),
    browAngle: lerp(a.browAngle, b.browAngle, k),
    browY: lerp(a.browY, b.browY, k),
    mouthCornerY: lerp(a.mouthCornerY, b.mouthCornerY, k),
    mouthCtrlY: lerp(a.mouthCtrlY, b.mouthCtrlY, k),
  };
}

/** Interpolate the three keyframes by `t ∈ [0,1]` (0 sad, 0.5 neutral, 1 happy). */
function faceAt(t: number): Face {
  const tt = clamp01(t);
  return tt <= 0.5 ? lerpFace(SAD, NEUTRAL, tt / 0.5) : lerpFace(NEUTRAL, HAPPY, (tt - 0.5) / 0.5);
}

/**
 * Pleasant pastel mood ramp for the face fill: coral (sad) → amber (neutral) →
 * mint (happy). The fill is a soft tint of the mood hue; the edge is the same
 * hue pushed darker for a clean rim. This replaces the old danger→success
 * color-mix, which went muddy olive at the midpoint.
 */
type RGB = [number, number, number];
const mixRGB = (a: RGB, b: RGB, k: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * k),
  Math.round(a[1] + (b[1] - a[1]) * k),
  Math.round(a[2] + (b[2] - a[2]) * k),
];
const toRGB = (c: RGB): string => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
const MOOD_SAD: RGB = [245, 138, 138];
const MOOD_NEU: RGB = [247, 196, 110];
const MOOD_HAP: RGB = [120, 209, 137];
function moodAt(t: number): { fill: string; edge: string } {
  const tt = clamp01(t);
  const c = tt <= 0.5 ? mixRGB(MOOD_SAD, MOOD_NEU, tt / 0.5) : mixRGB(MOOD_NEU, MOOD_HAP, (tt - 0.5) / 0.5);
  return { fill: toRGB(mixRGB(c, [255, 255, 255], 0.7)), edge: toRGB(mixRGB(c, [60, 55, 70], 0.28)) };
}

const NS = 'http://www.w3.org/2000/svg';
const el = (name: string): SVGElement => document.createElementNS(NS, name);

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

  // The big morphing face.
  const svg = el('svg') as SVGSVGElement;
  svg.setAttribute('viewBox', `0 0 ${VB} ${VB}`);
  svg.setAttribute('class', 'sf-dial-face');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const ring = el('circle');
  ring.setAttribute('cx', String(VB / 2));
  ring.setAttribute('cy', String(VB / 2));
  ring.setAttribute('r', String(VB / 2 - 6));
  ring.setAttribute('class', 'sf-dial-face-ring');
  // fill + stroke are mood-driven, set per frame in renderFace.
  ring.setAttribute('fill', toRGB(mixRGB(MOOD_NEU, [255, 255, 255], 0.7)));
  ring.setAttribute('stroke', toRGB(mixRGB(MOOD_NEU, [60, 55, 70], 0.28)));
  ring.setAttribute('stroke-width', '3');

  const browL = el('path');
  browL.setAttribute('class', 'sf-dial-brow');
  browL.setAttribute('fill', 'none');
  browL.setAttribute('stroke', 'currentColor');
  browL.setAttribute('stroke-width', '4');
  browL.setAttribute('stroke-linecap', 'round');
  const browR = el('path');
  browR.setAttribute('class', 'sf-dial-brow');
  browR.setAttribute('fill', 'none');
  browR.setAttribute('stroke', 'currentColor');
  browR.setAttribute('stroke-width', '4');
  browR.setAttribute('stroke-linecap', 'round');

  const eyeL = el('path');
  eyeL.setAttribute('class', 'sf-dial-eye');
  eyeL.setAttribute('fill', 'none');
  eyeL.setAttribute('stroke', 'currentColor');
  eyeL.setAttribute('stroke-width', '5.5');
  eyeL.setAttribute('stroke-linecap', 'round');
  const eyeR = el('path');
  eyeR.setAttribute('class', 'sf-dial-eye');
  eyeR.setAttribute('fill', 'none');
  eyeR.setAttribute('stroke', 'currentColor');
  eyeR.setAttribute('stroke-width', '5.5');
  eyeR.setAttribute('stroke-linecap', 'round');

  const mouth = el('path');
  mouth.setAttribute('class', 'sf-dial-mouth');
  mouth.setAttribute('fill', 'none');
  mouth.setAttribute('stroke', 'currentColor');
  mouth.setAttribute('stroke-width', '5');
  mouth.setAttribute('stroke-linecap', 'round');

  // Cheeks (blush) — a warm, friendly detail that fades in as the face gets happier.
  // Decorative only; color carries no meaning (the mouth shape does), so it's a pure delight cue.
  const cheekL = el('circle');
  cheekL.setAttribute('class', 'sf-dial-cheek');
  cheekL.setAttribute('cy', '62');
  cheekL.setAttribute('r', '8');
  cheekL.setAttribute('fill', '#F0928F');
  cheekL.setAttribute('opacity', '0');
  const cheekR = el('circle');
  cheekR.setAttribute('class', 'sf-dial-cheek');
  cheekR.setAttribute('cy', '62');
  cheekR.setAttribute('r', '8');
  cheekR.setAttribute('fill', '#F0928F');
  cheekR.setAttribute('opacity', '0');

  // Cheeks sit behind the face features but above the ring.
  svg.append(ring, cheekL, cheekR, browL, browR, eyeL, eyeR, mouth);

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

  // Visible verbal value label (also serves sighted users — never value-by-color).
  const valueLabel = document.createElement('div');
  valueLabel.className = 'sf-dial-value-label';
  valueLabel.setAttribute('part', 'dial-label');
  valueLabel.setAttribute('aria-hidden', 'true');

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

  root.append(svg, track, anchors, valueLabel);

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

  // Color hue is a redundant cue: shift only the accent, shape carries meaning.
  const renderFace = (tt: number): void => {
    const f = faceAt(tt);
    const cx = VB / 2;
    const eyeDx = 22;

    // Eyes: when squinting (happy), draw upward arcs; otherwise tiny dots-as-arcs.
    const eyePath = (centerX: number): string => {
      const w = 7;
      const x0 = centerX - w;
      const x1 = centerX + w;
      // squint pulls the arc control upward to form a "^"-ish happy eye.
      const ctrlY = f.eyeY - f.eyeSquint * 9;
      if (f.eyeSquint < 0.2) {
        // Open eye: a short vertical segment with round caps reads as a friendly dot.
        return `M${centerX.toFixed(1)} ${(f.eyeY - 1.7).toFixed(1)} L${centerX.toFixed(1)} ${(f.eyeY + 1.7).toFixed(1)}`;
      }
      return `M${x0.toFixed(1)} ${f.eyeY.toFixed(1)} Q${centerX.toFixed(1)} ${ctrlY.toFixed(1)} ${x1.toFixed(1)} ${f.eyeY.toFixed(1)}`;
    };
    eyeL.setAttribute('d', eyePath(cx - eyeDx));
    eyeR.setAttribute('d', eyePath(cx + eyeDx));

    // Brows: short strokes rotated by browAngle around their own center.
    const browPath = (centerX: number, mirror: number): string => {
      const half = 9;
      const ang = (f.browAngle * Math.PI) / 180 * mirror;
      const dx = Math.cos(ang) * half;
      const dy = Math.sin(ang) * half;
      const x0 = centerX - dx;
      const y0 = f.browY - dy;
      const x1 = centerX + dx;
      const y1 = f.browY + dy;
      return `M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}`;
    };
    browL.setAttribute('d', browPath(cx - eyeDx, 1));
    browR.setAttribute('d', browPath(cx + eyeDx, -1));
    // Brows fade out near neutral so the resting face reads calm (just dot eyes +
    // a soft mouth), and only appear as the expression turns sad or happy.
    const browVis = Math.min(1, Math.abs(clamp01(tt) - 0.5) * 2.4).toFixed(2);
    browL.setAttribute('opacity', browVis);
    browR.setAttribute('opacity', browVis);

    // Mouth: quadratic from left corner through a center control to the right corner.
    mouth.setAttribute(
      'd',
      `M${(cx - 24).toFixed(1)} ${f.mouthCornerY.toFixed(1)} Q${cx.toFixed(1)} ${f.mouthCtrlY.toFixed(1)} ${(cx + 24).toFixed(1)} ${f.mouthCornerY.toFixed(1)}`,
    );

    // Face fill + rim follow the pastel mood ramp (coral → amber → mint).
    const mood = moodAt(tt);
    ring.setAttribute('fill', mood.fill);
    ring.setAttribute('stroke', mood.edge);

    // Cheeks: stay hidden through sad/neutral, then bloom in as the face turns happy.
    const cheekX = 30;
    cheekL.setAttribute('cx', (cx - cheekX).toFixed(1));
    cheekR.setAttribute('cx', (cx + cheekX).toFixed(1));
    const blush = Math.max(0, (clamp01(tt) - 0.55) / 0.45); // 0 until t≈0.55, → 1 at happy
    const cheekOpacity = (blush * blush * 0.4).toFixed(3);
    cheekL.setAttribute('opacity', cheekOpacity);
    cheekR.setAttribute('opacity', cheekOpacity);

    // Redundant color cue via a CSS custom property the theme maps to a hue (sad→happy).
    root.style.setProperty('--sf-dial-t', tt.toFixed(3));

    // Thumb + fill position.
    const pct = clamp01(tt) * 100;
    thumb.style.left = `${pct}%`;
    fill.style.width = `${pct}%`;
  };

  const updateAria = (v: number): void => {
    track.setAttribute('aria-valuenow', String(v));
    const text = valueText(v);
    track.setAttribute('aria-valuetext', text);
    valueLabel.textContent = text;
    valueLabel.classList.toggle('is-set', value !== undefined);
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
