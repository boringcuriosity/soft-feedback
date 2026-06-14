/**
 * Single- or multiple-choice question.
 *
 * - Single (`multiple` falsy): an APG **radiogroup** with roving tabindex + Arrow/Home/End;
 *   selecting an option commits (advances the flow).
 * - Multiple: a **checkbox group** (native checkbox semantics, each in the tab order); no commit
 *   (the renderer's Next button advances).
 *
 * `shuffle` randomises non-"Other" options to mitigate primacy/order bias. `allowOther` appends
 * an "Other" option that, when chosen, reveals a free-text field; its text is folded into the
 * change payload as a synthetic value so analytics can read it.
 *
 * onChange payload: the selected option id (single) or an array of ids (multiple). When "Other"
 * is active with text, the array also carries `other:<text>` (and `other` alone while empty).
 */

import type {
  ChoiceOption,
  ChoiceQuestion,
  Question,
  ResponseValue,
} from '../types';
import type {
  QuestionComponentContext,
  QuestionComponentHandle,
} from '../internal/contracts';

function isChoice(q: Question): q is ChoiceQuestion {
  return q.type === 'choice';
}

const OTHER_ID = 'other';

/** Simple (non-deterministic) Fisher–Yates shuffle. */
function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

export function createChoice(ctx: QuestionComponentContext): QuestionComponentHandle {
  const q = ctx.question;
  if (!isChoice(q)) throw new Error('choice: expected a choice question');

  const multiple = q.multiple === true;

  const root = document.createElement('div');
  root.className = multiple ? 'sf-choice sf-choice--multi' : 'sf-choice sf-choice--single';

  const group = document.createElement('div');
  group.className = 'sf-choice-group';
  group.setAttribute('part', 'choice');
  group.setAttribute('role', multiple ? 'group' : 'radiogroup');
  group.setAttribute('aria-label', q.prompt);

  // Build the working option list (shuffle copy, then append Other).
  const opts: ChoiceOption[] = q.options.slice();
  if (q.shuffle) shuffleInPlace(opts);
  if (q.allowOther) opts.push({ id: OTHER_ID, label: 'Other' });

  /* selection state */
  const selectedSingle = (): string | undefined =>
    typeof ctx.value === 'string' ? ctx.value : undefined;
  const selectedMulti = new Set<string>(
    Array.isArray(ctx.value) ? (ctx.value as string[]).map((v) => v.split(':')[0]!) : [],
  );
  let single: string | undefined = !multiple ? selectedSingle() : undefined;

  /* "Other" text field (created lazily, kept in DOM but hidden) */
  let otherText = '';
  let otherInput: HTMLInputElement | null = null;
  let otherWrap: HTMLDivElement | null = null;

  const buttons: HTMLElement[] = [];

  const isOtherActive = (): boolean =>
    multiple ? selectedMulti.has(OTHER_ID) : single === OTHER_ID;

  const showOther = (show: boolean): void => {
    if (!otherWrap) return;
    otherWrap.hidden = !show;
    if (show) otherInput?.focus();
  };

  const emitChange = (): void => {
    if (multiple) {
      const ids: string[] = [];
      for (const opt of opts) {
        if (!selectedMulti.has(opt.id)) continue;
        if (opt.id === OTHER_ID) {
          ids.push(otherText ? `${OTHER_ID}:${otherText}` : OTHER_ID);
        } else {
          ids.push(opt.id);
        }
      }
      ctx.onChange(ids as ResponseValue);
    } else {
      if (single === undefined) return;
      const val = single === OTHER_ID && otherText ? `${OTHER_ID}:${otherText}` : single;
      ctx.onChange(val as ResponseValue);
    }
  };

  /* ----------------------------- single ----------------------------- */

  const syncSingle = (): void => {
    buttons.forEach((btn, i) => {
      const id = opts[i]!.id;
      const isSel = single === id;
      btn.setAttribute('aria-checked', isSel ? 'true' : 'false');
      btn.classList.toggle('is-selected', isSel);
      btn.tabIndex = isSel || (single === undefined && i === 0) ? 0 : -1;
    });
  };

  const selectSingle = (i: number, moveFocus: boolean, commit: boolean): void => {
    const opt = opts[i]!;
    single = opt.id;
    syncSingle();
    showOther(opt.id === OTHER_ID);
    if (moveFocus) buttons[i]?.focus();
    emitChange();
    // Commit only for non-Other (Other needs the user to type first).
    if (commit && opt.id !== OTHER_ID) ctx.onCommit?.(
      (opt.id) as ResponseValue,
    );
  };

  const focusSingle = (i: number): void => {
    selectSingle(Math.max(0, Math.min(opts.length - 1, i)), true, false);
  };

  /* ---------------------------- multiple ---------------------------- */

  const toggleMulti = (i: number): void => {
    const opt = opts[i]!;
    const cb = buttons[i] as HTMLElement;
    if (selectedMulti.has(opt.id)) {
      selectedMulti.delete(opt.id);
      cb.setAttribute('aria-checked', 'false');
      cb.classList.remove('is-selected');
    } else {
      selectedMulti.add(opt.id);
      cb.setAttribute('aria-checked', 'true');
      cb.classList.add('is-selected');
    }
    if (opt.id === OTHER_ID) showOther(selectedMulti.has(OTHER_ID));
    emitChange();
  };

  /* ---------------------------- build DOM --------------------------- */

  opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sf-option';
    btn.setAttribute('part', 'choice-option');
    btn.setAttribute('role', multiple ? 'checkbox' : 'radio');
    btn.setAttribute('aria-checked', 'false');
    if (multiple) btn.tabIndex = 0;

    const box = document.createElement('span');
    box.className = 'sf-option-box';
    box.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.className = 'sf-option-label';
    text.textContent = opt.label;
    btn.append(box, text);

    if (multiple) {
      btn.addEventListener('click', () => toggleMulti(i));
      btn.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleMulti(i);
        }
      });
    } else {
      btn.addEventListener('click', () => selectSingle(i, false, true));
      btn.addEventListener('keydown', (e: KeyboardEvent) => {
        switch (e.key) {
          case 'ArrowDown':
          case 'ArrowRight':
            e.preventDefault();
            focusSingle(i + 1);
            break;
          case 'ArrowUp':
          case 'ArrowLeft':
            e.preventDefault();
            focusSingle(i - 1);
            break;
          case 'Home':
            e.preventDefault();
            focusSingle(0);
            break;
          case 'End':
            e.preventDefault();
            focusSingle(opts.length - 1);
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            selectSingle(i, false, true);
            break;
          default:
            break;
        }
      });
    }

    buttons.push(btn);
    group.appendChild(btn);
  });

  root.appendChild(group);

  /* "Other" reveal */
  if (q.allowOther) {
    otherWrap = document.createElement('div');
    otherWrap.className = 'sf-choice-other';
    otherWrap.hidden = !isOtherActive();

    otherInput = document.createElement('input');
    otherInput.type = 'text';
    otherInput.className = 'sf-input sf-input--other';
    otherInput.setAttribute('part', 'choice-other-input');
    otherInput.setAttribute('aria-label', 'Other, please specify');
    otherInput.placeholder = 'Please specify…';
    otherInput.value = '';
    otherInput.addEventListener('input', () => {
      otherText = otherInput!.value.trim();
      emitChange();
    });

    otherWrap.appendChild(otherInput);
    root.appendChild(otherWrap);
  }

  /* init selection state */
  if (multiple) {
    buttons.forEach((btn, i) => {
      const sel = selectedMulti.has(opts[i]!.id);
      btn.setAttribute('aria-checked', sel ? 'true' : 'false');
      btn.classList.toggle('is-selected', sel);
    });
    showOther(isOtherActive());
  } else {
    syncSingle();
    showOther(isOtherActive());
  }

  return {
    el: root,
    focus() {
      if (multiple) {
        buttons[0]?.focus();
      } else {
        const target = buttons.find((b) => b.tabIndex === 0) ?? buttons[0];
        target?.focus();
      }
    },
    destroy() {
      root.remove();
    },
  };
}
