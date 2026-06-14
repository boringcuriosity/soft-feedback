import type {
  Condition,
  Context,
  DeviceType,
  PropertyOp,
  UrlOp,
} from '../types';
import { hash01 } from './hash';

/**
 * Normalise a URL for comparison by stripping a single trailing slash from the path.
 *
 * "exact" matching otherwise produces surprising misses between "/pricing" and "/pricing/".
 * We only touch the trailing slash of the whole string here (the value the author wrote and
 * the live URL are normalised identically).
 */
function normalizeTrailingSlash(value: string): string {
  if (value.length > 1 && value.endsWith('/')) {
    return value.slice(0, -1);
  }
  return value;
}

/**
 * Convert a glob pattern (`*` = any run of chars, `?` = single char) into a RegExp.
 * Everything else is escaped so glob patterns can't accidentally inject regex syntax.
 */
function globToRegExp(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped.replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${pattern}$`);
}

function matchUrl(op: UrlOp, value: string, url: string): boolean {
  switch (op) {
    case 'contains':
      return url.includes(value);
    case 'exact':
      return normalizeTrailingSlash(url) === normalizeTrailingSlash(value);
    case 'regex':
      try {
        return new RegExp(value).test(url);
      } catch {
        // An invalid author-supplied regex should fail closed (condition not met),
        // never throw.
        return false;
      }
    case 'glob':
      try {
        return globToRegExp(value).test(url);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Evaluate a `property` condition against `ctx.properties[key]`.
 * Numeric ops (gt/lt) require both sides to be finite numbers, else fail closed.
 */
function matchProperty(
  key: string,
  op: PropertyOp,
  value: unknown,
  properties: Record<string, unknown>,
): boolean {
  const actual = properties[key];

  switch (op) {
    case 'eq':
      return actual === value;
    case 'neq':
      return actual !== value;
    case 'in':
      return Array.isArray(value) && value.includes(actual);
    case 'gt': {
      const a = Number(actual);
      const b = Number(value);
      return Number.isFinite(a) && Number.isFinite(b) && a > b;
    }
    case 'lt': {
      const a = Number(actual);
      const b = Number(value);
      return Number.isFinite(a) && Number.isFinite(b) && a < b;
    }
    default:
      return false;
  }
}

/** Whether a DOM `document` is available to query (false during SSR). */
function hasDocument(): boolean {
  return typeof document !== 'undefined' && !!document.querySelector;
}

function matchDevice(value: DeviceType, ctx: Context): boolean {
  return ctx.device === value;
}

/** Evaluate a single condition against the context. */
function evaluateCondition(condition: Condition, ctx: Context, surveyId: string): boolean {
  switch (condition.type) {
    case 'url':
      return matchUrl(condition.op, condition.value, ctx.url);

    case 'device':
      return matchDevice(condition.value, ctx);

    case 'selector': {
      // Without a document we cannot assert presence/absence. Fail closed: if the author
      // asked for presence we can't confirm it; if they asked for absence we can't confirm
      // that either. Returning false is the conservative "don't show" choice.
      if (!hasDocument()) return false;
      const found = !!document.querySelector(condition.selector);
      return found === condition.present;
    }

    case 'property':
      return matchProperty(condition.key, condition.op, condition.value, ctx.properties);

    case 'rollout': {
      // Deterministic, backend-free sampling. Without an anonId we cannot place the user
      // consistently, so default to the empty-string seed (still deterministic per survey).
      const seed = `${ctx.anonId ?? ''}:${surveyId}`;
      return hash01(seed) < condition.percent / 100;
    }

    case 'predicate':
      try {
        return condition.fn(ctx);
      } catch {
        // A throwing user predicate must not crash the engine.
        return false;
      }

    default:
      return false;
  }
}

/**
 * Evaluate the full condition list. ALL conditions must pass (logical AND). An undefined or
 * empty list passes vacuously.
 */
export function evaluateConditions(
  conditions: Condition[] | undefined,
  ctx: Context,
  surveyId: string,
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => evaluateCondition(c, ctx, surveyId));
}
