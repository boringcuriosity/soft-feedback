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

// Warm, instantly-legible emoji ramp (very dissatisfied → loved it).
const REACTION_EMOJI = ['😡', '🙁', '😐', '🙂', '😍'] as const;

/** Pick the emoji glyph for a normalized position `t ∈ [0,1]`. */
function reactionEmoji(t: number): string {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  const i = Math.round(clamped * (REACTION_EMOJI.length - 1));
  return REACTION_EMOJI[Math.max(0, Math.min(REACTION_EMOJI.length - 1, i))]!;
}

/** A real emoji glyph. Decorative (`aria-hidden`); the radio's aria-label carries meaning. */
function emojiGlyph(t: number): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'sf-emoji-glyph';
  span.setAttribute('aria-hidden', 'true');
  span.textContent = reactionEmoji(t);
  return span;
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
    btn.appendChild(emojiGlyph(t));

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
