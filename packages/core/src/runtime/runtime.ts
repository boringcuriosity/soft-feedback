import type { RuntimeState, SurveyRuntime } from '../internal/contracts';
import type {
  Branch,
  BranchCondition,
  Context,
  Question,
  ResponsePayload,
  ResponseValue,
  Survey,
} from '../types';
import { scoreForMetric } from '../engine/scoring';

/* -------------------------------------------------------------------------------------- */
/* Branching evaluation                                                                    */
/* -------------------------------------------------------------------------------------- */

/** Evaluate a single branch condition against the answer to the just-completed question. */
function matchBranch(cond: BranchCondition, answer: ResponseValue | undefined): boolean {
  switch (cond.op) {
    case 'any':
      // Matches as long as there is an answer at all.
      return answer !== undefined;

    case 'eq':
      return compareEq(answer, cond.value);

    case 'in':
      return Array.isArray(cond.value) && valueInList(answer, cond.value);

    case 'lte': {
      const a = toNumber(answer);
      const b = toNumber(cond.value);
      return a !== undefined && b !== undefined && a <= b;
    }

    case 'gte': {
      const a = toNumber(answer);
      const b = toNumber(cond.value);
      return a !== undefined && b !== undefined && a >= b;
    }

    default:
      return false;
  }
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function compareEq(answer: ResponseValue | undefined, value: BranchCondition['value']): boolean {
  if (Array.isArray(answer)) {
    // For multi-select, eq matches when the single value is among the selected.
    return typeof value !== 'object' && answer.includes(value as string);
  }
  return answer === value;
}

function valueInList(
  answer: ResponseValue | undefined,
  list: Array<number | string>,
): boolean {
  if (Array.isArray(answer)) {
    // Any selected option present in the list satisfies `in`.
    return answer.some((a) => list.includes(a));
  }
  return answer !== undefined && list.includes(answer as number | string);
}

/**
 * Resolve the branching target for a question given its answer. Returns:
 *  - { type: 'question'; id } / { type: 'end' } when a branch matched,
 *  - undefined when no branch matched (caller should fall through to linear next).
 */
function resolveBranch(
  branches: Branch[] | undefined,
  answer: ResponseValue | undefined,
): Branch['goto'] | undefined {
  if (!branches || branches.length === 0) return undefined;
  for (const branch of branches) {
    if (matchBranch(branch.when, answer)) return branch.goto;
  }
  return undefined;
}

/* -------------------------------------------------------------------------------------- */
/* Runtime                                                                                  */
/* -------------------------------------------------------------------------------------- */

/**
 * Create a {@link SurveyRuntime} that drives question flow, applies per-question branching,
 * records responses and produces the final {@link ResponsePayload}.
 *
 * The runtime tracks an explicit *visited path* (an ordered list of question ids actually
 * shown) so that branching and `back()` are coherent even with non-linear flows. `state.index`
 * is the cursor into that visited path, matching the contract's documented semantics.
 */
export function createRuntime(survey: Survey, context: Context): SurveyRuntime {
  const questions = survey.questions;
  const responses: Record<string, ResponseValue> = {};

  // Ordered ids of questions actually visited. Seeded with the first question if any.
  const visited: string[] = questions.length > 0 && questions[0] ? [questions[0].id] : [];

  const startedAt = new Date().toISOString();

  const state: RuntimeState = {
    index: 0,
    responses,
    startedAt,
    progress: questions.length === 0 ? 1 : 0,
    complete: questions.length === 0,
  };

  function questionById(id: string): Question | undefined {
    return questions.find((q) => q.id === id);
  }

  function indexInSurvey(id: string): number {
    return questions.findIndex((q) => q.id === id);
  }

  /** Recompute the best-effort progress estimate into [0, 1]. */
  function updateProgress(): void {
    if (questions.length === 0) {
      state.progress = 1;
      return;
    }
    if (state.complete) {
      state.progress = 1;
      return;
    }
    // visitedIndex / total-questions, clamped to [0, 1).
    state.progress = Math.min(state.index / questions.length, 1);
  }

  function current(): Question | null {
    if (state.complete) return null;
    const id = visited[state.index];
    if (id === undefined) return null;
    return questionById(id) ?? null;
  }

  function answer(questionId: string, value: ResponseValue): void {
    responses[questionId] = value;
  }

  function markComplete(): null {
    state.complete = true;
    state.progress = 1;
    return null;
  }

  function next(): Question | null {
    if (state.complete) return null;

    const cur = current();
    if (!cur) return markComplete();

    const answerValue = responses[cur.id];
    const branchTarget = resolveBranch(cur.branching, answerValue);

    let nextId: string | undefined;

    if (branchTarget) {
      if (branchTarget.type === 'end') {
        return markComplete();
      }
      // Jump to the branch's target question (if it exists).
      nextId = questionById(branchTarget.id) ? branchTarget.id : undefined;
      if (nextId === undefined) return markComplete();
    } else {
      // Linear advance: the survey-order question after the current one.
      const curIdx = indexInSurvey(cur.id);
      const candidate = curIdx >= 0 ? questions[curIdx + 1] : undefined;
      nextId = candidate?.id;
      if (nextId === undefined) return markComplete();
    }

    // If we're stepping forward beyond the recorded path, append; otherwise truncate any
    // stale forward history (the answer may have changed the branch) and append.
    if (state.index === visited.length - 1) {
      visited.push(nextId);
    } else {
      visited.splice(state.index + 1);
      visited.push(nextId);
    }
    state.index += 1;
    updateProgress();
    return current();
  }

  function back(): Question | null {
    if (state.index <= 0) {
      // Already at the first visited question — clear completion if we had ended.
      if (state.complete && visited.length > 0) {
        state.complete = false;
        state.index = 0;
        updateProgress();
        return current();
      }
      return null;
    }
    state.complete = false;
    state.index -= 1;
    updateProgress();
    return current();
  }

  function isComplete(): boolean {
    return state.complete;
  }

  function buildPayload(): ResponsePayload {
    const submittedAt = new Date().toISOString();

    // Self-describing snapshot of every question in the survey (stable ids + prompts).
    const questionSnapshot = questions.map((q) => ({ id: q.id, prompt: q.prompt }));

    const score = survey.metric
      ? scoreForMetric(survey.metric, responses, questions)
      : undefined;

    const payload: ResponsePayload = {
      surveyId: survey.id,
      surveyName: survey.name,
      anonId: context.anonId,
      responses: { ...responses },
      questions: questionSnapshot,
      startedAt,
      submittedAt,
      context: {
        url: context.url,
        device: context.device,
        locale: context.locale,
      },
    };

    if (score) payload.score = score;
    return payload;
  }

  return {
    survey,
    state,
    current,
    answer,
    next,
    back,
    isComplete,
    buildPayload,
  };
}
