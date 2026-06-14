/**
 * Link question — prompt + an action button that opens `href`.
 *
 * Powers "leave a review" / "book a call" peak-end CTAs. This is an honest link the user chooses
 * to follow, NOT a score-gated redirect. Rendered as a real anchor (keyboard- and
 * middle-click-friendly, opens in a new tab safely) styled as a button; activating it records
 * the answer (the href) and calls `onCommit` so the flow can advance / close.
 */

import type { LinkQuestion, Question, ResponseValue } from '../types';
import type {
  QuestionComponentContext,
  QuestionComponentHandle,
} from '../internal/contracts';

function isLink(q: Question): q is LinkQuestion {
  return q.type === 'link';
}

export function createLink(ctx: QuestionComponentContext): QuestionComponentHandle {
  const q = ctx.question;
  if (!isLink(q)) throw new Error('link: expected a link question');

  const root = document.createElement('div');
  root.className = 'sf-link';

  const anchor = document.createElement('a');
  anchor.className = 'sf-link-btn';
  anchor.setAttribute('part', 'link-button');
  anchor.href = q.href;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.textContent = q.buttonLabel;
  // Activating the CTA records the choice and advances the flow.
  const activate = (): void => {
    ctx.onChange(q.href as ResponseValue);
    ctx.onCommit?.(q.href as ResponseValue);
  };
  // Use click (fires for mouse, keyboard Enter, and synthetic activation on anchors).
  anchor.addEventListener('click', () => activate());

  root.appendChild(anchor);

  return {
    el: root,
    focus() {
      anchor.focus();
    },
    destroy() {
      root.remove();
    },
  };
}
