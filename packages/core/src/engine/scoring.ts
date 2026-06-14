import type {
  Metric,
  Question,
  RatingQuestion,
  ResponseValue,
  ScoreResult,
} from '../types';

/* ------------------------------------------------------------------ */
/* Aggregate metric calculators (operate over many respondents)        */
/* ------------------------------------------------------------------ */

/** Keep only finite numbers from a values array. */
function numbers(values: number[]): number[] {
  return values.filter((v) => typeof v === 'number' && Number.isFinite(v));
}

function round(n: number): number {
  return Math.round(n);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Net Promoter Score over a set of 0–10 ratings.
 * Promoters 9–10, passives 7–8, detractors 0–6. Score = %promoters − %detractors (integer).
 */
export function nps(values: number[]): {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
} {
  const v = numbers(values);
  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  for (const n of v) {
    if (n >= 9) promoters += 1;
    else if (n >= 7) passives += 1;
    else detractors += 1;
  }

  const total = v.length;
  const score =
    total === 0 ? 0 : round((promoters / total) * 100 - (detractors / total) * 100);

  return { score, promoters, passives, detractors };
}

/**
 * Customer Satisfaction. `percent` is the top-box share (default [4,5] on a 1–5 scale);
 * `mean` is the simple average.
 */
export function csat(
  values: number[],
  topBox: number[] = [4, 5],
): { percent: number; mean: number } {
  const v = numbers(values);
  const box = new Set(topBox);
  const top = v.filter((n) => box.has(n)).length;
  return {
    percent: v.length === 0 ? 0 : round((top / v.length) * 100),
    mean: mean(v),
  };
}

/**
 * Customer Effort Score. Top-box default [5,6,7] (the "easy" end of a 1–7 agreement scale).
 */
export function ces(
  values: number[],
  topBox: number[] = [5, 6, 7],
): { percent: number; mean: number } {
  const v = numbers(values);
  const box = new Set(topBox);
  const top = v.filter((n) => box.has(n)).length;
  return {
    percent: v.length === 0 ? 0 : round((top / v.length) * 100),
    mean: mean(v),
  };
}

/**
 * Dissatisfaction. `percent` is the bottom-box share (default [1,2] on a 1–5 scale).
 */
export function dsat(values: number[], bottomBox: number[] = [1, 2]): { percent: number } {
  const v = numbers(values);
  const box = new Set(bottomBox);
  const bottom = v.filter((n) => box.has(n)).length;
  return { percent: v.length === 0 ? 0 : round((bottom / v.length) * 100) };
}

/**
 * Product/Market Fit (Sean Ellis test). Counts respondents who would be "very" disappointed
 * if they could no longer use the product. `hasFit` is true at the 40% threshold.
 *
 * Accepts any string values; the canonical "very disappointed" choice may be encoded as
 * 'very' (recommended option id). Empty / 'na' / other values are simply not counted as very.
 */
export function pmf(values: string[]): { veryDisappointedPercent: number; hasFit: boolean } {
  const v = values.filter((s) => typeof s === 'string' && s.length > 0);
  const total = v.length;
  const very = v.filter((s) => s === 'very').length;
  const percent = total === 0 ? 0 : round((very / total) * 100);
  return { veryDisappointedPercent: percent, hasFit: percent >= 40 };
}

/* ------------------------------------------------------------------ */
/* Single-respondent scoring (attached to each ResponsePayload.score)  */
/* ------------------------------------------------------------------ */

/** Type guard: a rating question. */
function isRating(q: Question): q is RatingQuestion {
  return q.type === 'rating';
}

/**
 * Pick the question whose answer should drive the survey's headline metric: the first
 * rating question that actually has a numeric response. Falls back to the first rating
 * question present (even without a response) so callers can still identify the metric column.
 */
function primaryRatingQuestion(
  questions: Question[],
  responses: Record<string, ResponseValue>,
): RatingQuestion | undefined {
  const ratings = questions.filter(isRating);
  const answered = ratings.find((q) => typeof responses[q.id] === 'number');
  return answered ?? ratings[0];
}

/** Coerce a stored response into a finite number, or undefined. */
function asNumber(value: ResponseValue | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return undefined;
}

/** Coerce a stored response into a single string (first element of an array), or undefined. */
function asString(value: ResponseValue | undefined): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

/** NPS bucket for a single rating. */
function npsBucket(n: number): string {
  if (n >= 9) return 'promoter';
  if (n >= 7) return 'passive';
  return 'detractor';
}

/**
 * Compute a single respondent's {@link ScoreResult} for the survey's declared metric.
 *
 * Returns `undefined` when the metric can't be scored (no metric, no suitable answer, or a
 * 'custom' metric for which scoring is consumer-defined).
 */
export function scoreForMetric(
  metric: Metric,
  responses: Record<string, ResponseValue>,
  questions: Question[],
): ScoreResult | undefined {
  switch (metric) {
    case 'nps': {
      const q = primaryRatingQuestion(questions, responses);
      const value = q ? asNumber(responses[q.id]) : undefined;
      if (value === undefined) return undefined;
      return { metric, value, bucket: npsBucket(value) };
    }

    case 'csat': {
      const q = primaryRatingQuestion(questions, responses);
      const value = q ? asNumber(responses[q.id]) : undefined;
      if (value === undefined) return undefined;
      // Top-box for a single respondent => satisfied/unsatisfied band.
      const bucket = value >= 4 ? 'satisfied' : value <= 2 ? 'dissatisfied' : 'neutral';
      return { metric, value, bucket };
    }

    case 'ces': {
      const q = primaryRatingQuestion(questions, responses);
      const value = q ? asNumber(responses[q.id]) : undefined;
      if (value === undefined) return undefined;
      const bucket = value >= 5 ? 'low-effort' : value <= 3 ? 'high-effort' : 'neutral';
      return { metric, value, bucket };
    }

    case 'dsat': {
      const q = primaryRatingQuestion(questions, responses);
      const value = q ? asNumber(responses[q.id]) : undefined;
      if (value === undefined) return undefined;
      const bucket = value <= 2 ? 'dissatisfied' : 'satisfied';
      return { metric, value, bucket };
    }

    case 'pmf': {
      // PMF is choice-based; find the first choice/text answer.
      const choice = questions.find((q) => q.type === 'choice' || q.type === 'text');
      const raw = choice ? asString(responses[choice.id]) : undefined;
      if (raw === undefined) return undefined;
      const isVery = raw === 'very';
      // value: 1 if "very disappointed", else 0 — a per-respondent indicator.
      return { metric, value: isVery ? 1 : 0, bucket: raw };
    }

    case 'custom':
    default:
      // Custom metrics are scored by the consumer; nothing to compute generically.
      return undefined;
  }
}
