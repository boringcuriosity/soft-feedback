import type { EventBus, StorageAdapter } from '../internal/contracts';
import type { Context, FrequencyPolicy, Survey } from '../types';
import { evaluateConditions } from './conditions';
import { createFrequencyManager, type FrequencyManager } from './frequency';
import { inSchedule } from './schedule';
import { watchDomTrigger } from './triggers';

/** Dependencies injected into the engine — keeps it free of rendering/runtime concerns. */
export interface EngineDeps {
  storage: StorageAdapter;
  bus: EventBus;
  /** Resolve the current context lazily so URL/device/properties stay fresh per decision. */
  getContext: () => Context;
  /** Hand a survey off to be presented (rendered). The engine never renders itself. */
  present: (survey: Survey) => void;
  defaults?: { frequency?: FrequencyPolicy };
}

export interface Engine {
  register(survey: Survey): void;
  unregister(id: string): void;
  /** Notify the engine an app event occurred; may fire 'event'-triggered surveys. */
  track(name: string, props?: Record<string, unknown>): void;
  /** Imperatively request a survey. `force` bypasses all gates. Returns whether it showed. */
  request(id: string, opts?: { force?: boolean }): boolean;
  /** Merge person-properties used by condition evaluation. */
  setProperties(props: Record<string, unknown>): void;
  destroy(): void;
}

/** Internal bookkeeping for a registered survey. */
interface Registration {
  survey: Survey;
  /** Cleanup for the DOM/timer trigger watcher, if any. */
  cleanup: () => void;
}

/**
 * Create the behavioral engine: register → trigger → gate → present. Pure decision logic;
 * it depends only on the storage/bus/context contracts and a `present` callback, never on
 * the renderer or runtime modules.
 */
export function createEngine(deps: EngineDeps): Engine {
  const { storage, bus, getContext, present } = deps;

  const frequency: FrequencyManager = createFrequencyManager(
    storage,
    deps.defaults?.frequency,
  );

  const registrations = new Map<string, Registration>();
  /** Person-properties merged into every resolved context for condition evaluation. */
  let properties: Record<string, unknown> = {};

  let destroyed = false;

  /** Resolve context, layering engine-level properties beneath any context-provided ones. */
  function resolveContext(): Context {
    const ctx = getContext();
    if (Object.keys(properties).length === 0) return ctx;
    return { ...ctx, properties: { ...properties, ...ctx.properties } };
  }

  /**
   * Run the full gate for a survey and present it if it passes.
   * `force` skips schedule/conditions/frequency entirely.
   * Returns whether the survey was presented.
   */
  function attemptShow(survey: Survey, force: boolean): boolean {
    if (force) {
      present(survey);
      return true;
    }

    const ctx = resolveContext();

    if (!inSchedule(survey.schedule)) return false;
    if (!evaluateConditions(survey.conditions, ctx, survey.id)) return false;
    if (!frequency.canShow(survey)) return false;

    present(survey);
    return true;
  }

  /** Wire up a survey's trigger. Returns the cleanup for any attached DOM listeners. */
  function setupTrigger(survey: Survey): () => void {
    const trigger = survey.trigger ?? { type: 'manual' };

    // manual & event triggers are driven imperatively (request/track); no DOM watcher.
    if (trigger.type === 'manual' || trigger.type === 'event') {
      return () => {};
    }

    const ctx = resolveContext();
    return watchDomTrigger(trigger, ctx, () => {
      if (destroyed) return;
      attemptShow(survey, false);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Bus subscriptions: keep frequency ledgers in sync with lifecycle  */
  /* ---------------------------------------------------------------- */

  const unsubShown = bus.on('shown', (e) => {
    // recordShown also stamps the global lastAnyShown ledger.
    frequency.recordShown(e.surveyId);
  });
  const unsubSent = bus.on('sent', (e) => {
    frequency.recordResponded(e.surveyId);
  });
  const unsubDismissed = bus.on('dismissed', (e) => {
    frequency.recordDismissed(e.surveyId);
  });

  return {
    register(survey) {
      if (destroyed) return;
      // Re-registering replaces the prior watcher cleanly.
      const existing = registrations.get(survey.id);
      if (existing) existing.cleanup();

      const cleanup = setupTrigger(survey);
      registrations.set(survey.id, { survey, cleanup });
    },

    unregister(id) {
      const reg = registrations.get(id);
      if (!reg) return;
      reg.cleanup();
      registrations.delete(id);
    },

    track(name) {
      if (destroyed) return;
      for (const { survey } of registrations.values()) {
        const trigger = survey.trigger;
        if (!trigger || trigger.type !== 'event') continue;
        if (trigger.name !== name) continue;

        const delay = trigger.delayMs ?? 0;
        if (delay > 0 && typeof setTimeout !== 'undefined') {
          setTimeout(() => {
            if (!destroyed) attemptShow(survey, false);
          }, delay);
        } else {
          attemptShow(survey, false);
        }
      }
    },

    request(id, opts) {
      if (destroyed) return false;
      const reg = registrations.get(id);
      if (!reg) return false;
      return attemptShow(reg.survey, opts?.force ?? false);
    },

    setProperties(props) {
      properties = { ...properties, ...props };
    },

    destroy() {
      destroyed = true;
      for (const reg of registrations.values()) reg.cleanup();
      registrations.clear();
      unsubShown();
      unsubSent();
      unsubDismissed();
    },
  };
}
