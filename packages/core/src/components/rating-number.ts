/**
 * Number-scale rating, e.g. NPS 0–10 or CSAT 1–5.
 *
 * Rendered as an APG **radiogroup** of buttons with roving tabindex, Arrow/Home/End keys and a
 * visible focus ring. Verbal endpoint anchors (`labels.min` / `labels.max`) are shown beneath
 * the scale because research says always anchor scales — and so meaning never rests on a number
 * alone (WCAG 1.4.1). Selecting a value commits the answer (advances the flow).
 */

import type { Question, RatingQuestion, ResponseValue } from '../types';
import type {
  QuestionComponentContext,
  QuestionComponentHandle,
} from '../internal/contracts';

function isRating(q: Question): q is RatingQuestion {
  return q.type === 'rating';
}

export function createRatingNumber(ctx: QuestionComponentContext): QuestionComponentHandle {
  const q = ctx.question;
  if (!isRating(q)) throw new Error('rating-number: expected a rating question');

  const min = Math.round(q.scale.min);
  const max = Math.round(q.scale.max);
  const count = Math.max(0, max - min) + 1;

  const root = document.createElement('div');
  root.className = 'sf-scale sf-scale--number';

  const group = document.createElement('div');
  group.className = 'sf-scale-track';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', q.prompt);
  group.setAttribute('part', 'rating');

  let selected: number | undefined =
    typeof ctx.value === 'number' ? ctx.value : undefined;

  const buttons: HTMLButtonElement[] = [];

  const labelFor = (n: number): string => {
    if (n === min && q.labels?.min) return `${n}, ${q.labels.min}`;
    if (n === max && q.labels?.max) return `${n}, ${q.labels.max}`;
    const ordinal = n - min + 1;
    return `${n}, ${ordinal} of ${count}`;
  };

  const syncState = (): void => {
    buttons.forEach((btn, i) => {
      const n = min + i;
      const isSel = selected === n;
      btn.setAttribute('aria-checked', isSel ? 'true' : 'false');
      btn.classList.toggle('is-selected', isSel);
      // Roving tabindex: the selected (or first) option is the single tab stop.
      const focusable = isSel || (selected === undefined && i === 0);
      btn.tabIndex = focusable ? 0 : -1;
    });
  };

  const select = (n: number, commit: boolean, moveFocus: boolean): void => {
    selected = n;
    syncState();
    if (moveFocus) buttons[n - min]?.focus();
    ctx.onChange(n as ResponseValue);
    if (commit) ctx.onCommit?.(n as ResponseValue);
  };

  const focusIndex = (i: number): void => {
    const clamped = Math.max(0, Math.min(count - 1, i));
    select(min + clamped, false, true);
  };

  for (let i = 0; i < count; i++) {
    const n = min + i;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sf-rating-btn';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('part', 'rating-button');
    btn.setAttribute('aria-label', labelFor(n));
    btn.setAttribute('aria-checked', 'false');
    btn.textContent = String(n);

    btn.addEventListener('click', () => select(n, true, false));
    btn.addEventListener('keydown', (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          focusIndex(i + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
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
          select(n, true, false);
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
