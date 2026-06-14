/**
 * Discrete emoji-face row (typically 5 faces). APG **radiogroup**.
 *
 * Emoji scales must always carry verbal endpoint labels for cross-cultural validity (see plan
 * 04 §2.4), so the min/max anchors are shown beneath the row and each face has a descriptive
 * aria-label. The faces are static SVGs; the continuous morph lives in `emoji-dial.ts`.
 */

import type { Question, RatingQuestion, ResponseValue } from '../types';
import type {
  QuestionComponentContext,
  QuestionComponentHandle,
} from '../internal/contracts';

function isRating(q: Question): q is RatingQuestion {
  return q.type === 'rating';
}

/** Default verbal descriptors interpolated across the scale for aria-labels. */
const FALLBACK_WORDS = [
  'Very dissatisfied',
  'Dissatisfied',
  'Neutral',
  'Satisfied',
  'Very satisfied',
] as const;

const INK = '#3b3c49'; // friendly dark for facial features

/** Pastel mood ramp (coral → amber → mint), matching the emoji-dial's face hue. */
function emojiMood(t: number): { fill: string; edge: string } {
  const mix = (a: number[], b: number[], k: number): number[] => a.map((v, i) => Math.round(v + (b[i]! - v) * k));
  const c = t <= 0.5 ? mix([245, 138, 138], [247, 196, 110], t / 0.5) : mix([247, 196, 110], [120, 209, 137], (t - 0.5) / 0.5);
  const f = mix(c, [255, 255, 255], 0.68);
  const e = mix(c, [60, 55, 70], 0.26);
  return { fill: `rgb(${f[0]}, ${f[1]}, ${f[2]})`, edge: `rgb(${e[0]}, ${e[1]}, ${e[2]})` };
}

/**
 * A static emoji face whose mouth reflects `t ∈ [0,1]` (0 = sad, 0.5 = neutral, 1 = happy).
 * The face is a soft *filled* disc whose color comes from the per-button mood vars
 * (`--sf-emoji-fill` / `--sf-emoji-edge`); features are a friendly dark ink, never gray.
 * Decorative (`aria-hidden`); the radio's aria-label carries the meaning.
 */
function faceSvg(t: number): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('class', 'sf-emoji-face');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const ring = document.createElementNS(ns, 'circle');
  ring.setAttribute('cx', '24');
  ring.setAttribute('cy', '24');
  ring.setAttribute('r', '20.5');
  ring.setAttribute('class', 'sf-emoji-ring');
  ring.style.fill = 'var(--sf-emoji-fill, #eef0f4)';
  ring.style.stroke = 'var(--sf-emoji-edge, #d6d9e2)';
  ring.setAttribute('stroke-width', '2');

  const eyeL = document.createElementNS(ns, 'circle');
  eyeL.setAttribute('cx', '17.5');
  eyeL.setAttribute('cy', '20');
  eyeL.setAttribute('r', '2.6');
  eyeL.setAttribute('fill', INK);
  const eyeR = document.createElementNS(ns, 'circle');
  eyeR.setAttribute('cx', '30.5');
  eyeR.setAttribute('cy', '20');
  eyeR.setAttribute('r', '2.6');
  eyeR.setAttribute('fill', INK);

  // Mouth: a quadratic whose control-point Y swings from a frown (low) to a smile (high).
  // t=0 → corners down, control up (frown); t=1 → corners up, control down (smile).
  const cornerY = 31 - (t - 0.5) * 9; // ends rise as t grows
  const ctrlY = 31 + (t - 0.5) * 24; // control dips below for a smile
  const mouth = document.createElementNS(ns, 'path');
  mouth.setAttribute('d', `M16.5 ${cornerY.toFixed(1)} Q24 ${ctrlY.toFixed(1)} 31.5 ${cornerY.toFixed(1)}`);
  mouth.setAttribute('class', 'sf-emoji-mouth');
  mouth.setAttribute('fill', 'none');
  mouth.setAttribute('stroke', INK);
  mouth.setAttribute('stroke-width', '2.8');
  mouth.setAttribute('stroke-linecap', 'round');

  svg.append(ring, eyeL, eyeR, mouth);
  return svg;
}

export function createRatingEmoji(ctx: QuestionComponentContext): QuestionComponentHandle {
  const q = ctx.question;
  if (!isRating(q)) throw new Error('rating-emoji: expected a rating question');

  const min = Math.round(q.scale.min);
  const max = Math.round(q.scale.max);
  const count = Math.max(1, max - min + 1);

  const root = document.createElement('div');
  root.className = 'sf-scale sf-scale--emoji';

  const group = document.createElement('div');
  group.className = 'sf-scale-track sf-emoji-row';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', q.prompt);
  group.setAttribute('part', 'rating');

  let selected: number | undefined =
    typeof ctx.value === 'number' ? ctx.value : undefined;

  const buttons: HTMLButtonElement[] = [];

  const wordFor = (i: number): string => {
    if (i === 0 && q.labels?.min) return q.labels.min;
    if (i === count - 1 && q.labels?.max) return q.labels.max;
    if (count === 1) return q.midpointLabel ?? FALLBACK_WORDS[2]!;
    const mid = (count - 1) / 2;
    if (Math.abs(i - mid) < 0.5 && q.midpointLabel) return q.midpointLabel;
    const idx = Math.round((i / (count - 1)) * (FALLBACK_WORDS.length - 1));
    return FALLBACK_WORDS[Math.max(0, Math.min(FALLBACK_WORDS.length - 1, idx))]!;
  };

  const labelFor = (i: number): string => {
    const n = min + i;
    return `${wordFor(i)} (${n} of ${max})`;
  };

  const syncState = (): void => {
    buttons.forEach((btn, i) => {
      const n = min + i;
      const isSel = selected === n;
      btn.setAttribute('aria-checked', isSel ? 'true' : 'false');
      btn.classList.toggle('is-selected', isSel);
      btn.tabIndex = isSel || (selected === undefined && i === 0) ? 0 : -1;
    });
  };

  const select = (i: number, commit: boolean, moveFocus: boolean): void => {
    const n = min + i;
    selected = n;
    syncState();
    if (moveFocus) buttons[i]?.focus();
    ctx.onChange(n as ResponseValue);
    if (commit) ctx.onCommit?.(n as ResponseValue);
  };

  const focusIndex = (i: number): void => {
    select(Math.max(0, Math.min(count - 1, i)), false, true);
  };

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sf-rating-btn sf-emoji-btn';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('part', 'rating-button');
    btn.setAttribute('aria-label', labelFor(i));
    btn.setAttribute('aria-checked', 'false');
    // Pastel mood ramp (coral → amber → mint) as a redundant delight cue; shape
    // carries the meaning. The fill is the soft face color, the edge its rim.
    const m = emojiMood(t);
    btn.style.setProperty('--sf-emoji-fill', m.fill);
    btn.style.setProperty('--sf-emoji-edge', m.edge);
    btn.appendChild(faceSvg(t));

    btn.addEventListener('click', () => select(i, true, false));
    btn.addEventListener('keydown', (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          focusIndex(i + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          focusIndex(i - 1);
          break;
        case 'Home':
          e.preventDefault();
          focusIndex(0);
          break;
        case 'End':
          e.preventDefault();
          focusIndex(count - 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          select(i, true, false);
          break;
        default:
          break;
      }
    });

    buttons.push(btn);
    group.appendChild(btn);
  }

  root.appendChild(group);

  if (q.labels?.min || q.labels?.max) {
    const anchors = document.createElement('div');
    anchors.className = 'sf-scale-anchors';
    anchors.setAttribute('part', 'rating-anchors');
    anchors.setAttribute('aria-hidden', 'true');
    const lo = document.createElement('span');
    lo.className = 'sf-scale-anchor sf-scale-anchor--min';
    lo.textContent = q.labels?.min ?? '';
    const hi = document.createElement('span');
    hi.className = 'sf-scale-anchor sf-scale-anchor--max';
    hi.textContent = q.labels?.max ?? '';
    anchors.append(lo, hi);
    root.appendChild(anchors);
  }

  syncState();

  return {
    el: root,
    focus() {
      const target = buttons.find((b) => b.tabIndex === 0) ?? buttons[0];
      target?.focus();
    },
    destroy() {
      root.remove();
    },
  };
}
