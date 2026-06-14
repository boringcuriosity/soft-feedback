/**
 * Free-text question — a labelled textarea.
 *
 * The visible label sits OUTSIDE the field (associated via `for`/`id`) so it is never lost when
 * the field has content, and an optional character counter announces remaining length politely.
 * `onChange` fires on input; there is NO `onCommit` — open text advances via the renderer's
 * Next button (open "why" is optional by default per the research notes).
 */

import type { Question, ResponseValue, TextQuestion } from '../types';
import type {
  QuestionComponentContext,
  QuestionComponentHandle,
} from '../internal/contracts';

function isText(q: Question): q is TextQuestion {
  return q.type === 'text';
}

let uid = 0;

export function createText(ctx: QuestionComponentContext): QuestionComponentHandle {
  const q = ctx.question;
  if (!isText(q)) throw new Error('text: expected a text question');

  const id = `sf-text-${++uid}`;

  const root = document.createElement('div');
  root.className = 'sf-text';

  // Label outside the field (the renderer may also render the prompt as a heading; this label is
  // the accessible name for the control itself).
  const label = document.createElement('label');
  label.className = 'sf-text-label';
  label.setAttribute('for', id);
  label.setAttribute('part', 'text-label');
  label.textContent = q.prompt;

  const area = document.createElement('textarea');
  area.id = id;
  area.className = 'sf-input sf-textarea';
  area.setAttribute('part', 'text-input');
  area.rows = 3;
  if (q.placeholder) area.placeholder = q.placeholder;
  if (typeof q.maxLength === 'number' && q.maxLength > 0) area.maxLength = q.maxLength;
  if (q.optional !== false && q.optional) area.setAttribute('aria-required', 'false');
  if (typeof ctx.value === 'string') area.value = ctx.value;

  root.append(label, area);

  /* Optional live character counter. */
  let counter: HTMLDivElement | null = null;
  if (typeof q.maxLength === 'number' && q.maxLength > 0) {
    counter = document.createElement('div');
    counter.className = 'sf-text-counter';
    counter.setAttribute('part', 'text-counter');
    counter.setAttribute('aria-live', 'polite');
    counter.setAttribute('aria-atomic', 'true');
    const sync = (): void => {
      const remaining = q.maxLength! - area.value.length;
      counter!.textContent = `${remaining} characters left`;
    };
    sync();
    area.addEventListener('input', sync);
    root.appendChild(counter);
  }

  area.addEventListener('input', () => {
    ctx.onChange(area.value as ResponseValue);
  });

  return {
    el: root,
    focus() {
      area.focus();
    },
    destroy() {
      root.remove();
    },
  };
}
