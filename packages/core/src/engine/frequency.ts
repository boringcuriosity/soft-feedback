import type { StorageAdapter } from '../internal/contracts';
import type { FrequencyPolicy, Survey } from '../types';
import { inSchedule } from './schedule';

const DAY_MS = 24 * 60 * 60 * 1000;

const SURVEY_KEY_PREFIX = 'sf:v1:survey:';
const GLOBAL_KEY = 'sf:v1:global';

/** Library defaults, applied beneath any per-survey or consumer-supplied overrides. */
const POLICY_DEFAULTS: Required<FrequencyPolicy> = {
  oncePerUser: true,
  // 0 / undefined maxShows means "no cap"; we model that as Infinity at evaluation time.
  maxShows: Infinity,
  cooldownDaysAfterSeen: 30,
  cooldownDaysAfterResponse: 90,
  globalWaitDays: 3,
};

/** Persisted per-survey ledger. All timestamps are epoch ms. */
interface SurveyState {
  lastSeen?: number;
  lastResponded?: number;
  shows: number;
  dismissed: number;
  responded: number;
}

/** Persisted global ledger shared by every survey. */
interface GlobalState {
  lastAnyShown?: number;
}

const EMPTY_SURVEY_STATE: SurveyState = { shows: 0, dismissed: 0, responded: 0 };

export interface FrequencyManager {
  /** True if, given persisted history + policy + schedule, this survey may be shown now. */
  canShow(survey: Survey): boolean;
  recordShown(id: string): void;
  recordResponded(id: string): void;
  recordDismissed(id: string): void;
}

/**
 * Create the anti-fatigue frequency manager. State is persisted through the supplied storage
 * adapter so caps and cooldowns survive reloads (when storage is durable).
 *
 * `defaults` are merged beneath {@link POLICY_DEFAULTS}; an individual survey's `frequency`
 * is merged on top of that, so precedence is: survey.frequency > defaults > library defaults.
 */
export function createFrequencyManager(
  storage: StorageAdapter,
  defaults?: FrequencyPolicy,
): FrequencyManager {
  function surveyKey(id: string): string {
    return SURVEY_KEY_PREFIX + id;
  }

  function readSurveyState(id: string): SurveyState {
    const raw = storage.get(surveyKey(id));
    if (!raw) return { ...EMPTY_SURVEY_STATE };
    try {
      const parsed = JSON.parse(raw) as Partial<SurveyState>;
      return {
        lastSeen: parsed.lastSeen,
        lastResponded: parsed.lastResponded,
        shows: parsed.shows ?? 0,
        dismissed: parsed.dismissed ?? 0,
        responded: parsed.responded ?? 0,
      };
    } catch {
      return { ...EMPTY_SURVEY_STATE };
    }
  }

  function writeSurveyState(id: string, state: SurveyState): void {
    storage.set(surveyKey(id), JSON.stringify(state));
  }

  function readGlobalState(): GlobalState {
    const raw = storage.get(GLOBAL_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw) as GlobalState;
    } catch {
      return {};
    }
  }

  function writeGlobalState(state: GlobalState): void {
    storage.set(GLOBAL_KEY, JSON.stringify(state));
  }

  /** Resolve the effective policy for a survey (library defaults < defaults < survey). */
  function resolvePolicy(survey: Survey): Required<FrequencyPolicy> {
    const merged: Required<FrequencyPolicy> = {
      ...POLICY_DEFAULTS,
      ...stripUndefined(defaults),
      ...stripUndefined(survey.frequency),
    };
    // Treat an absent/zero maxShows as "no cap".
    if (!merged.maxShows || merged.maxShows <= 0) merged.maxShows = Infinity;
    return merged;
  }

  return {
    canShow(survey) {
      const now = Date.now();
      const policy = resolvePolicy(survey);
      const state = readSurveyState(survey.id);
      const global = readGlobalState();

      // Gate order matters — mirrors the plan's funnel semantics.

      // 1. Schedule window.
      if (!inSchedule(survey.schedule, now)) return false;

      // 2. oncePerUser: if they've already responded, never ask again.
      if (policy.oncePerUser && state.responded > 0) return false;

      // 3. maxShows cap.
      if (state.shows >= policy.maxShows) return false;

      // 4. Cooldown after a response.
      if (
        state.lastResponded !== undefined &&
        now - state.lastResponded < policy.cooldownDaysAfterResponse * DAY_MS
      ) {
        return false;
      }

      // 5. Cooldown after merely being seen.
      if (
        state.lastSeen !== undefined &&
        now - state.lastSeen < policy.cooldownDaysAfterSeen * DAY_MS
      ) {
        return false;
      }

      // 6. Global wait: don't show ANY survey within N days of the last shown survey.
      if (
        global.lastAnyShown !== undefined &&
        now - global.lastAnyShown < policy.globalWaitDays * DAY_MS
      ) {
        return false;
      }

      return true;
    },

    recordShown(id) {
      const now = Date.now();
      const state = readSurveyState(id);
      state.shows += 1;
      state.lastSeen = now;
      writeSurveyState(id, state);

      const global = readGlobalState();
      global.lastAnyShown = now;
      writeGlobalState(global);
    },

    recordResponded(id) {
      const now = Date.now();
      const state = readSurveyState(id);
      state.responded += 1;
      state.lastResponded = now;
      writeSurveyState(id, state);
    },

    recordDismissed(id) {
      const state = readSurveyState(id);
      state.dismissed += 1;
      writeSurveyState(id, state);
    },
  };
}

/** Drop keys whose value is `undefined` so they don't clobber lower-priority defaults. */
function stripUndefined<T extends object>(obj: T | undefined): Partial<T> {
  if (!obj) return {};
  const out: Partial<T> = {};
  for (const key of Object.keys(obj) as Array<keyof T>) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}
