/**
 * Tiny, dependency-free spring motion engine.
 *
 * A real RAF-driven critically-ish damped spring integrator used by the renderers and the
 * hero emoji-dial. No external deps; SSR-safe; honors `prefers-reduced-motion`.
 *
 * The integrator advances the spring with a small fixed timestep (semi-implicit Euler) which
 * is stable across a wide range of stiffness/damping/mass values and frame rates.
 */

import type { MotionPreset } from '../types';

/**
 * Spring constants per motion preset.
 *
 *  - `smooth`  — gentle, well-damped, no overshoot (the default feel).
 *  - `bouncy`  — playful, noticeable overshoot then settle.
 *  - `subtle`  — quick and quiet; barely-there motion for understated UIs.
 *  - `snappy`  — fast, tight, minimal overshoot; feels responsive.
 */
export const SPRING_PRESETS: Record<
  MotionPreset,
  { stiffness: number; damping: number; mass: number }
> = {
  smooth: { stiffness: 170, damping: 26, mass: 1 },
  bouncy: { stiffness: 320, damping: 18, mass: 1 },
  subtle: { stiffness: 210, damping: 30, mass: 1 },
  snappy: { stiffness: 420, damping: 34, mass: 1 },
};

/**
 * Whether the user has requested reduced motion.
 *
 * Returns `false` when there is no `window`/`matchMedia` (SSR, very old engines) so callers
 * default to the animated path only when motion is actually safe to use.
 */
export function prefersReducedMotion(): boolean {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export interface AnimateOptions {
  from: number;
  to: number;
  preset?: MotionPreset;
  /** Force the reduced-motion path. When omitted, `prefersReducedMotion()` is consulted. */
  reducedMotion?: boolean;
  onUpdate: (v: number) => void;
  onDone?: () => void;
}

/** Settle thresholds: stop once both displacement and velocity are negligible. */
const REST_DISTANCE = 0.001;
const REST_VELOCITY = 0.001;
/** Fixed physics step (ms) — decoupled from the actual frame delta for stability. */
const STEP_MS = 1000 / 240;
/** Guard against huge deltas after a tab is backgrounded. */
const MAX_FRAME_MS = 64;

/**
 * Animate a single scalar from `from` to `to` using a spring.
 *
 * Returns a cancel function. Calling it stops the animation without firing `onDone`.
 *
 * When reduced motion is requested (explicitly or via the OS preference), the value jumps
 * straight to `to` with a single `onUpdate` followed by `onDone` — no RAF loop is scheduled.
 */
export function animateValue(opts: AnimateOptions): () => void {
  const { from, to, onUpdate, onDone } = opts;

  const reduce = opts.reducedMotion ?? prefersReducedMotion();
  const noRaf = typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function';

  if (reduce || noRaf || from === to) {
    onUpdate(to);
    onDone?.();
    return () => {};
  }

  const { stiffness, damping, mass } = SPRING_PRESETS[opts.preset ?? 'smooth'];

  let position = from;
  let velocity = 0;
  let lastTime: number | null = null;
  let cancelled = false;
  let rafId = 0;

  const tick = (now: number): void => {
    if (cancelled) return;

    if (lastTime === null) lastTime = now;
    let frameMs = now - lastTime;
    lastTime = now;
    if (frameMs > MAX_FRAME_MS) frameMs = MAX_FRAME_MS;

    // Advance the spring with a fixed substep for numerical stability.
    let remaining = frameMs;
    while (remaining > 0) {
      const dt = Math.min(remaining, STEP_MS) / 1000;
      remaining -= STEP_MS;

      const displacement = position - to;
      const springForce = -stiffness * displacement;
      const dampingForce = -damping * velocity;
      const acceleration = (springForce + dampingForce) / mass;

      velocity += acceleration * dt;
      position += velocity * dt;
    }

    const settled =
      Math.abs(velocity) < REST_VELOCITY && Math.abs(position - to) < REST_DISTANCE;

    if (settled) {
      onUpdate(to);
      onDone?.();
      return;
    }

    onUpdate(position);
    rafId = window.requestAnimationFrame(tick);
  };

  rafId = window.requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(rafId);
    }
  };
}

/* ------------------------------------------------------------------ */
/* Gooey shape mapping                                                */
/* ------------------------------------------------------------------ */

export interface GooeyShape {
  /** A `scale(x, y)` transform string with squash-and-stretch baked in. */
  transform: string;
  /** A `border-radius` value (px) that bulges while the spring is in motion. */
  borderRadius: string;
  /** Fade that reaches full opacity well before the spring settles. */
  opacity: number;
}

/**
 * Map a spring sample to a "gooey" blob morph — the soft-feedback signature.
 *
 * A spring driven from 0→1 (entrance) or 1→0 (exit) overshoots its target before settling.
 * We turn that overshoot into:
 *
 *  - **squash-and-stretch** — when the value pushes past 1 the shape stretches horizontally and
 *    pinches vertically (and vice-versa), so the card wobbles like jelly instead of a rigid pop;
 *  - **a radius bulge** — the corner radius swells in proportion to how far the spring is from
 *    rest, so edges go briefly blobby and then firm back up to the resting radius;
 *  - **an early fade** — opacity leads the scale so the morph reads as "appearing", not "growing
 *    from nothing".
 *
 * `s` is the raw spring sample (may exceed 1 on overshoot, or dip below 0 on a bouncy exit).
 * `baseRadius` is the resting corner radius in px. `intensity` scales the whole effect
 * (0 = none, 1 = default); callers pass a lower value for understated patterns (banner/inline).
 */
export function gooeyShape(s: number, baseRadius: number, intensity = 1): GooeyShape {
  // Distance from rest. Positive while overshooting past the target, negative while undershooting.
  const d = (s - 1) * intensity;
  // Stretch along X / squash along Y when overshooting; invert when below rest. Clamp at 0 so a
  // bouncy spring that briefly dips negative never flips the element inside-out.
  const sx = Math.max(0, s * (1 + d * 0.4));
  const sy = Math.max(0, s * (1 - d * 0.4));
  // Edges go blobby in proportion to motion, capped so they never balloon absurdly.
  const bulge = Math.min(36, Math.abs(d) * 80);
  return {
    transform: `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
    borderRadius: `${(baseRadius + bulge).toFixed(2)}px`,
    opacity: Math.max(0, Math.min(1, s * 1.5)),
  };
}
