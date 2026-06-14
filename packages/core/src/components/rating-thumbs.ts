/**
 * Thumbs up/down — a 2-point rating mapped onto the question's scale
 * (min → 👎 down, max → 👍 up). APG **radiogroup** of two radios.
 *
 * Powers the inline "Helpful?" widget (branch to "why" on 👎). Meaning is carried by the
 * per-option aria-label and the distinct icon shapes, never color alone (WCAG 1.4.1).
 * Selecting commits the answer.
 */

import type { Question, RatingQuestion, ResponseValue } from '../types';
import type {
  QuestionComponentContext,
  QuestionComponentHandle,
} from '../internal/contracts';

function isRating(q: Question): q is RatingQuestion {
  return q.type === 'rating';
}

function thumbSvg(up: boolean): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', up ? 'sf-thumb-icon sf-thumb-icon--up' : 'sf-thumb-icon sf-thumb-icon--down');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(ns, 'path');
  // Thumbs-up glyph; the down variant is the same shape rotated 180° via CSS/transform.
  path.setAttribute(
    'd',
    'M2 10h3.5v11H2V10zm6.5 0 4-7.2c.9.2 1.6 1 1.6 2v3.7H21a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 19.7 21H8.5V10z',
  );
  path.setAttribute('fill', 'currentColor');
  // The down variant is rotated 180° via CSS (.sf-thumb-icon--down) so it rotates around its
  // own centre; an SVG `transform` attribute would rotate around (0,0) and fly off-canvas.
  svg.appendChild(path);
  return svg;
}

export function createRatingThumbs(ctx: QuestionComponentContext): QuestionComponentHandle {
  const q = ctx.question;
  if (!isRating(q)) throw new Error('rating-thumbs: expected a rating question');

  const min = Math.round(q.scale.min);
  const max = Math.round(q.scale.max);

  const root = document.createElement('div');
  root.className = 'sf-scale sf-scale--thumbs';

  const group = document.createElement('div');
  group.className = 'sf-scale-track sf-thumbs';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', q.prompt);
  group.setAttribute('part', 'rating');

  let selected: number | undefined =
    typeof ctx.value === 'number' ? ctx.value : undefined;

  // Order: down (min) then up (max). Each entry: [value, up?, label].
  const items: Array<{ value: number; up: boolean; label: string }> = [
    { value: min, up: false, label: q.labels?.min ?? 'No, not helpful' },
    { value: max, up: true, label: q.labels?.max ?? 'Yes, helpful' },
  ];

  const buttons: HTMLButtonElement[] = [];

  const syncState = (): void => {
    buttons.forEach((btn, i) => {
      const item = items[i]!;
      const isSel = selected === item.value;
      btn.setAttribute('aria-checked', isSel ? 'true' : 'false');
      btn.classList.toggle('is-selected', isSel);
      btn.tabIndex = isSel || (selected === undefined && i === 0) ? 0 : -1;
    });
  };

  const select = (i: number, commit: boolean, moveFocus: boolean): void => {
    const item = items[i]!;
    selected = item.value;
    syncState();
    if (moveFocus) buttons[i]?.focus();
    ctx.onChange(item.value as ResponseValue);
    if (commit) ctx.onCommit?.(item.value as ResponseValue);
  };

  const focusIndex = (i: number): void => {
    select(Math.max(0, Math.min(items.length - 1, i)), false, true);
  };

  items.forEach((item, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = item.up ? 'sf-rating-btn sf-thumb sf-thumb--up' : 'sf-rating-btn sf-thumb sf-thumb--down';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('part', 'rating-button');
    btn.setAttribute('aria-label', item.label);
    btn.setAttribute('aria-checked', 'false');
    btn.appendChild(thumbSvg(item.up));

    btn.addEventListener('click', () => select(i, true, false));
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
          focusIndex(items.length - 1);
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
  });

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
