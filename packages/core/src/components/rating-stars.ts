/**
 * Star rating. APG **radiogroup** of star buttons (no half-stars).
 *
 * Each star is a labeled radio ("3 of 5 stars"); the SVG glyph is decorative (`aria-hidden`).
 * Hovering/focusing fills the run up to that star so the affordance reads visually, but meaning
 * is carried by the per-option aria-label and the count — not color alone. Selecting commits.
 */

import type { Question, RatingQuestion, ResponseValue } from '../types';
import type {
  QuestionComponentContext,
  QuestionComponentHandle,
} from '../internal/contracts';

function isRating(q: Question): q is RatingQuestion {
  return q.type === 'rating';
}

/** Decorative star path on a 24×24 viewBox. */
function starSvg(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'sf-star-icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute(
    'd',
    'M12 2.5l2.92 5.92 6.53.95-4.72 4.6 1.11 6.5L12 17.9l-5.84 3.07 1.11-6.5-4.72-4.6 6.53-.95L12 2.5z',
  );
  path.setAttribute('fill', 'currentColor');
  svg.appendChild(path);
  return svg;
}

export function createRatingStars(ctx: QuestionComponentContext): QuestionComponentHandle {
  const q = ctx.question;
  if (!isRating(q)) throw new Error('rating-stars: expected a rating question');

  const min = 1;
  const max = Math.max(1, Math.round(q.scale.max));
  const count = max;

  const root = document.createElement('div');
  root.className = 'sf-scale sf-scale--stars';

  const group = document.createElement('div');
  group.className = 'sf-scale-track sf-stars';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', q.prompt);
  group.setAttribute('part', 'rating');

  let selected: number | undefined =
    typeof ctx.value === 'number' ? ctx.value : undefined;

  const buttons: HTMLButtonElement[] = [];

  const labelFor = (n: number): string => {
    if (n === max && q.labels?.max) return `${n} of ${count} stars, ${q.labels.max}`;
    if (n === min && q.labels?.min) return `${n} of ${count} stars, ${q.labels.min}`;
    return `${n} of ${count} stars`;
  };

  const paintFill = (upTo: number | undefined): void => {
    buttons.forEach((btn, i) => {
      btn.classList.toggle('is-filled', upTo !== undefined && i + 1 <= upTo);
    });
  };

  const syncState = (): void => {
    buttons.forEach((btn, i) => {
      const n = i + 1;
      const isSel = selected === n;
      btn.setAttribute('aria-checked', isSel ? 'true' : 'false');
      btn.classList.toggle('is-selected', isSel);
      btn.tabIndex = isSel || (selected === undefined && i === 0) ? 0 : -1;
    });
    paintFill(selected);
  };

  const select = (n: number, commit: boolean, moveFocus: boolean): void => {
    selected = n;
    syncState();
    if (moveFocus) buttons[n - 1]?.focus();
    ctx.onChange(n as ResponseValue);
    if (commit) ctx.onCommit?.(n as ResponseValue);
  };

  const focusIndex = (i: number): void => {
    const clamped = Math.max(0, Math.min(count - 1, i));
    select(clamped + 1, false, true);
  };

  for (let i = 0; i < count; i++) {
    const n = i + 1;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sf-rating-btn sf-star';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('part', 'rating-button');
    btn.setAttribute('aria-label', labelFor(n));
    btn.setAttribute('aria-checked', 'false');
    btn.appendChild(starSvg());

    btn.addEventListener('click', () => select(n, true, false));
    btn.addEventListener('mouseenter', () => paintFill(n));
    btn.addEventListener('mouseleave', () => paintFill(selected));
    btn.addEventListener('focus', () => paintFill(n));
    btn.addEventListener('blur', () => paintFill(selected));
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
