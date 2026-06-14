/**
 * Deterministic string hashing for backend-free, stable sampling.
 *
 * We need a hash that:
 *  - is stable across sessions, machines and JS engines (no Math.random, no crypto),
 *  - maps any string into the half-open unit interval [0, 1),
 *  - is cheap (called on the hot trigger-evaluation path).
 *
 * FNV-1a is a well-known, well-distributed non-cryptographic hash. We run it as an
 * unsigned 32-bit operation (forced via `>>> 0`) and then normalise into [0, 1) by
 * dividing by 2^32. Cryptographic strength is explicitly NOT a goal here — this only
 * decides consistent rollout membership.
 */

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
/** 2^32 — the exclusive upper bound of a uint32, used to normalise into [0, 1). */
const UINT32_RANGE = 0x100000000;

/**
 * Hash an arbitrary string to a deterministic float in the half-open range [0, 1).
 *
 * The same input always yields the same output, so a given (anonId, surveyId) pair is
 * consistently inside or outside a sampled rollout — no per-session flicker.
 */
export function hash01(input: string): number {
  let hash = FNV_OFFSET_BASIS;

  for (let i = 0; i < input.length; i++) {
    // XOR the low byte of the code unit, then multiply by the FNV prime.
    // Using Math.imul keeps the multiplication in 32-bit space and fast.
    hash ^= input.charCodeAt(i) & 0xff;
    hash = Math.imul(hash, FNV_PRIME);
  }

  // Coerce to unsigned 32-bit, then normalise to [0, 1).
  return (hash >>> 0) / UINT32_RANGE;
}
