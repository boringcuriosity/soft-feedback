/**
 * soft-feedback — public API.
 *
 * The ergonomic `soft.*` surface (one call per widget) plus lower-level building blocks for
 * headless/advanced use. Polite, research-backed defaults: nothing auto-fires on load, the
 * "why" follow-up is optional and branched, anonymous + white-label by default.
 */

import type {
  Appearance,
  Branch,
  ChoiceOption,
  ChoiceQuestion,
  ClosingConfig,
  Condition,
  Context,
  FrequencyPolicy,
  Metric,
  Question,
  RatingDisplay,
  RatingQuestion,
  RenderConfig,
  ResponsePayload,
  SoftConfig,
  SoftEvent,
  Survey,
  TextQuestion,
  ThemeMode,
  Trigger,
} from './types';
import type { Engine } from './engine';
import type { EventBus, StorageAdapter, SurveyRuntime } from './internal/contracts';

import { buildContext, createBus, createEngine, hash01 } from './engine';
import { defaultStorage } from './storage';
import { createRuntime } from './runtime';
import { getRenderer, headlessRenderer } from './render';

/* ------------------------------------------------------------------------------------------ */
/* Module state (a single library instance per page)                                           */
/* ------------------------------------------------------------------------------------------ */

let engine: Engine | null = null;
let bus: EventBus | null = null;
let storage: StorageAdapter | null = null;
let initialized = false;

let baseContext: Context | null = null;
let globalMotion: NonNullable<SoftConfig['motion']> = 'subtle';
let globalTheme: SoftConfig['theme'] = 'auto';

function currentUrl(fallback: string): string {
  try {
    if (typeof window !== 'undefined' && window.location) return window.location.href;
  } catch {
    /* ignore */
  }
  return fallback;
}

function getContext(): Context {
  const base = baseContext ?? { url: '', device: 'desktop', properties: {} };
  return { ...base, url: currentUrl(base.url), properties: { ...base.properties } };
}

function mergeAppearance(appearance: Appearance | undefined): Appearance {
  const theme: ThemeMode =
    appearance?.theme ?? (typeof globalTheme === 'string' ? globalTheme : 'auto');
  const globalTokens = typeof globalTheme === 'object' ? globalTheme.tokens : undefined;
  const tokens = { ...globalTokens, ...appearance?.tokens };
  return { ...appearance, theme, ...(Object.keys(tokens).length ? { tokens } : {}) };
}

/** Present a survey: build a runtime + the right renderer, then open it. */
function present(survey: Survey): void {
  if (!bus) return;
  const ctx = getContext();
  const effective: Survey = { ...survey, appearance: mergeAppearance(survey.appearance) };
  const runtime = createRuntime(effective, ctx);
  const renderer = getRenderer(effective.render?.pattern ?? 'popover');
  const motion = effective.render?.motion ?? globalMotion;
  const handle = renderer.mount({ runtime, bus, context: ctx, motion });
  handle.open();
}

/**
 * Initialize the library. Called automatically with defaults on first widget use; call it
 * explicitly to set global theme, motion, anonymity, storage, data sinks, or an event hook.
 */
export function init(config: SoftConfig = {}): void {
  storage = config.storage ?? defaultStorage();
  const anonymous = config.anonymous ?? true;
  globalMotion = config.motion ?? 'subtle';
  globalTheme = config.theme ?? 'auto';

  bus = createBus();

  // Fan every lifecycle event out to configured sinks + the global onEvent hook.
  const sinks = config.sinks ?? [];
  bus.on('*', (event) => {
    for (const sink of sinks) {
      try {
        const r = sink(event);
        if (r && typeof (r as Promise<void>).then === 'function') {
          (r as Promise<void>).catch(() => {});
        }
      } catch {
        /* sinks must never throw into the host app */
      }
    }
    if (config.onEvent) {
      try {
        config.onEvent(event);
      } catch {
        /* ignore */
      }
    }
  });

  baseContext = buildContext({
    storage,
    anonymous,
    ...(config.locale !== undefined ? { locale: config.locale } : {}),
    ...(config.properties !== undefined ? { properties: config.properties } : {}),
  });

  engine = createEngine({
    storage,
    bus,
    getContext,
    present,
    ...(config.defaults ? { defaults: config.defaults } : {}),
  });

  initialized = true;
}

function ensureInit(): void {
  if (!initialized) init();
}

function E(): Engine {
  ensureInit();
  return engine as Engine;
}
function B(): EventBus {
  ensureInit();
  return bus as EventBus;
}

/* ------------------------------------------------------------------------------------------ */
/* Widget option types + controller                                                            */
/* ------------------------------------------------------------------------------------------ */

export interface WidgetController {
  readonly id: string;
  readonly survey: Survey;
  /** Imperatively request the widget. Pass `true` to bypass frequency/condition gates. */
  show(force?: boolean): boolean;
  /** Unregister and remove all listeners for this widget. */
  destroy(): void;
}

export interface BaseWidgetOptions {
  id?: string;
  trigger?: Trigger;
  conditions?: Condition[];
  frequency?: FrequencyPolicy;
  render?: Partial<RenderConfig>;
  appearance?: Appearance;
  closing?: ClosingConfig;
  onSubmit?: (payload: ResponsePayload) => void;
  onEvent?: (event: SoftEvent) => void;
  /** Optional open-text follow-up: a custom prompt, or `false` to disable. */
  followUp?: string | false;
}

export interface RatingWidgetOptions extends BaseWidgetOptions {
  question?: string;
  display?: RatingDisplay;
  scale?: { min: number; max: number };
  labels?: { min?: string; max?: string };
}

export interface ChoiceWidgetOptions extends BaseWidgetOptions {
  question?: string;
  options?: ChoiceOption[];
  multiple?: boolean;
  allowOther?: boolean;
}

function defaultId(metric: string, seed: string): string {
  return `sf:${metric}:${hash01(seed).toString(36).slice(2, 8)}`;
}

function defaultClosing(): ClosingConfig {
  return {
    thankYou: { title: 'Thanks for the feedback!', description: 'We really appreciate it.' },
    autoDismissMs: 3500,
  };
}

function buildRender(opts: BaseWidgetOptions, defaultPattern: RenderConfig['pattern']): RenderConfig {
  return {
    pattern: opts.render?.pattern ?? defaultPattern,
    ...(opts.render?.position !== undefined ? { position: opts.render.position } : {}),
    ...(opts.render?.selector !== undefined ? { selector: opts.render.selector } : {}),
    ...(opts.render?.motion !== undefined ? { motion: opts.render.motion } : {}),
  };
}

function baseSurvey(
  id: string,
  name: string,
  metric: Metric,
  questions: Question[],
  opts: BaseWidgetOptions,
  defaultPattern: RenderConfig['pattern'],
): Survey {
  return {
    id,
    name,
    metric,
    questions,
    trigger: opts.trigger ?? { type: 'manual' },
    ...(opts.conditions ? { conditions: opts.conditions } : {}),
    ...(opts.frequency ? { frequency: opts.frequency } : {}),
    render: buildRender(opts, defaultPattern),
    ...(opts.appearance ? { appearance: opts.appearance } : {}),
    closing: opts.closing ?? defaultClosing(),
  };
}

/** Build the optional follow-up text question(s), branching low vs high off the rating. */
function followUp(
  surveyId: string,
  opts: BaseWidgetOptions,
  lowPrompt: string,
  highPrompt: string,
  threshold: number,
): { extra: Question[]; ratingBranching?: Branch[] } {
  if (opts.followUp === false) return { extra: [] };

  if (typeof opts.followUp === 'string') {
    const why: TextQuestion = {
      id: `${surveyId}:why`,
      type: 'text',
      prompt: opts.followUp,
      optional: true,
      placeholder: 'Optional',
    };
    return { extra: [why] };
  }

  const low: TextQuestion = {
    id: `${surveyId}:low`,
    type: 'text',
    prompt: lowPrompt,
    optional: true,
    placeholder: 'Optional',
    branching: [{ when: { op: 'any' }, goto: { type: 'end' } }],
  };
  const high: TextQuestion = {
    id: `${surveyId}:high`,
    type: 'text',
    prompt: highPrompt,
    optional: true,
    placeholder: 'Optional',
  };
  const ratingBranching: Branch[] = [
    { when: { op: 'lte', value: threshold }, goto: { type: 'question', id: low.id } },
    { when: { op: 'gte', value: threshold + 1 }, goto: { type: 'question', id: high.id } },
  ];
  return { extra: [low, high], ratingBranching };
}

function register(survey: Survey, opts: BaseWidgetOptions): WidgetController {
  const unsubs: Array<() => void> = [];
  const eventBus = B();

  if (opts.onSubmit) {
    const fn = opts.onSubmit;
    unsubs.push(
      eventBus.on('sent', (e) => {
        if (e.surveyId === survey.id && e.type === 'sent') fn(e.payload);
      }),
    );
  }
  if (opts.onEvent) {
    const fn = opts.onEvent;
    unsubs.push(
      eventBus.on('*', (e) => {
        if (e.surveyId === survey.id) fn(e);
      }),
    );
  }

  E().register(survey);

  return {
    id: survey.id,
    survey,
    show: (force = false) => E().request(survey.id, { force }),
    destroy: () => {
      E().unregister(survey.id);
      for (const u of unsubs) u();
    },
  };
}

/* ------------------------------------------------------------------------------------------ */
/* Widget helpers                                                                              */
/* ------------------------------------------------------------------------------------------ */

function ratingWidget(
  metric: Metric,
  name: string,
  defaults: {
    question: string;
    display: RatingDisplay;
    scale: { min: number; max: number };
    labels: { min: string; max: string };
    low: string;
    high: string;
    pattern: RenderConfig['pattern'];
    followUpDefault?: string | false;
  },
  opts: RatingWidgetOptions,
): WidgetController {
  const question = opts.question ?? defaults.question;
  const id = opts.id ?? defaultId(metric, question);
  const scale = opts.scale ?? defaults.scale;
  const threshold = Math.floor((scale.min + scale.max) / 2);

  const fuOpts: BaseWidgetOptions =
    defaults.followUpDefault !== undefined && opts.followUp === undefined
      ? { ...opts, followUp: defaults.followUpDefault }
      : opts;
  const fu = followUp(id, fuOpts, defaults.low, defaults.high, threshold);

  const rating: RatingQuestion = {
    id: `${id}:rating`,
    type: 'rating',
    prompt: question,
    display: opts.display ?? defaults.display,
    scale,
    labels: opts.labels ?? defaults.labels,
    ...(fu.ratingBranching ? { branching: fu.ratingBranching } : {}),
  };

  const survey = baseSurvey(id, name, metric, [rating, ...fu.extra], opts, defaults.pattern);
  return register(survey, opts);
}

/** CSAT — satisfaction with a specific experience. Hero emoji-dial by default. */
export function csat(opts: RatingWidgetOptions = {}): WidgetController {
  return ratingWidget(
    'csat',
    'CSAT',
    {
      question: 'How would you rate your experience?',
      display: 'emoji-dial',
      scale: { min: 1, max: 5 },
      labels: { min: 'Very dissatisfied', max: 'Very satisfied' },
      low: 'What could we improve?',
      high: 'What did you love most?',
      pattern: 'popover',
    },
    opts,
  );
}

/** NPS — relational loyalty / likelihood to recommend (0–10). */
export function nps(opts: RatingWidgetOptions = {}): WidgetController {
  return ratingWidget(
    'nps',
    'NPS',
    {
      question: 'How likely are you to recommend us to a friend or colleague?',
      display: 'number',
      scale: { min: 0, max: 10 },
      labels: { min: 'Not at all likely', max: 'Extremely likely' },
      low: "What's the main reason for your score?",
      high: 'What do you love most about us?',
      pattern: 'popover',
    },
    opts,
  );
}

/** CES — ease/effort of completing a task (1–7). */
export function ces(opts: RatingWidgetOptions = {}): WidgetController {
  return ratingWidget(
    'ces',
    'CES',
    {
      question: 'How easy was it to complete your task?',
      display: 'number',
      scale: { min: 1, max: 7 },
      labels: { min: 'Very difficult', max: 'Very easy' },
      low: 'What made it difficult?',
      high: 'What made it easy?',
      pattern: 'popover',
    },
    opts,
  );
}

/** Inline "Was this helpful?" — binary thumbs, branches to "why" on a thumbs-down. */
export function helpful(opts: RatingWidgetOptions = {}): WidgetController {
  return ratingWidget(
    'csat',
    'Helpful',
    {
      question: 'Was this helpful?',
      display: 'thumbs',
      scale: { min: 0, max: 1 },
      labels: { min: 'No', max: 'Yes' },
      low: 'What was missing or wrong?',
      high: 'Glad it helped! Anything to add?',
      pattern: 'inline',
    },
    opts,
  );
}

/** Feature Reaction — a quick one-tap emotional pulse (single emoji). */
export function reaction(opts: RatingWidgetOptions = {}): WidgetController {
  return ratingWidget(
    'csat',
    'Reaction',
    {
      question: 'How do you feel about this?',
      display: 'emoji',
      scale: { min: 1, max: 5 },
      labels: { min: 'Hated it', max: 'Loved it' },
      low: 'What would make it better?',
      high: 'What did you love?',
      pattern: 'popover',
      followUpDefault: false, // keep reaction to a single tap by default
    },
    opts,
  );
}

/** PMF probe — the Sean Ellis test ("how would you feel if you could no longer use this?"). */
export function pmf(opts: ChoiceWidgetOptions = {}): WidgetController {
  const question = opts.question ?? 'How would you feel if you could no longer use this product?';
  const id = opts.id ?? defaultId('pmf', question);
  const options: ChoiceOption[] = opts.options ?? [
    { id: 'very', label: 'Very disappointed' },
    { id: 'somewhat', label: 'Somewhat disappointed' },
    { id: 'not', label: 'Not disappointed' },
    { id: 'na', label: "N/A, I no longer use it" },
  ];
  const choice: ChoiceQuestion = { id: `${id}:pmf`, type: 'choice', prompt: question, options };
  const extra: Question[] =
    opts.followUp === false
      ? []
      : [
          {
            id: `${id}:why`,
            type: 'text',
            prompt:
              typeof opts.followUp === 'string'
                ? opts.followUp
                : 'What is the main benefit you receive from this product?',
            optional: true,
            placeholder: 'Optional',
          } as TextQuestion,
        ];
  const survey = baseSurvey(id, 'PMF', 'pmf', [choice, ...extra], opts, 'popover');
  return register(survey, opts);
}

/** Exit / Cancel catcher — reason picker + optional comment. */
export function churn(opts: ChoiceWidgetOptions = {}): WidgetController {
  const question = opts.question ?? "What's the main reason you're leaving?";
  const id = opts.id ?? defaultId('churn', question);
  const options: ChoiceOption[] = opts.options ?? [
    { id: 'too-expensive', label: 'Too expensive' },
    { id: 'missing-features', label: 'Missing features I need' },
    { id: 'too-hard', label: 'Too difficult to use' },
    { id: 'found-better', label: 'Found a better product' },
    { id: 'no-longer-needed', label: 'No longer needed' },
  ];
  const choice: ChoiceQuestion = {
    id: `${id}:reason`,
    type: 'choice',
    prompt: question,
    options,
    allowOther: opts.allowOther ?? true,
  };
  const extra: Question[] =
    opts.followUp === false
      ? []
      : [
          {
            id: `${id}:comment`,
            type: 'text',
            prompt:
              typeof opts.followUp === 'string'
                ? opts.followUp
                : "Anything we could have done better?",
            optional: true,
            placeholder: 'Optional',
          } as TextQuestion,
        ];
  const survey = baseSurvey(id, 'Churn', 'custom', [choice, ...extra], opts, 'popover');
  return register(survey, opts);
}

/** Always-On Feedback Tab — a persistent, user-initiated feedback channel. */
export function tab(opts: ChoiceWidgetOptions = {}): WidgetController {
  const question = opts.question ?? 'What kind of feedback do you have?';
  const id = opts.id ?? defaultId('tab', question);
  const options: ChoiceOption[] = opts.options ?? [
    { id: 'bug', label: '🐞 Something is broken' },
    { id: 'idea', label: '💡 I have an idea' },
    { id: 'praise', label: '❤️ I love something' },
    { id: 'other', label: '💬 Other' },
  ];
  const category: ChoiceQuestion = {
    id: `${id}:category`,
    type: 'choice',
    prompt: question,
    options,
  };
  const message: TextQuestion = {
    id: `${id}:message`,
    type: 'text',
    prompt: 'Tell us more',
    placeholder: 'Your feedback…',
  };
  const survey = baseSurvey(id, 'Feedback Tab', 'custom', [category, message], opts, 'tab');
  const controller = register(survey, opts);
  // The tab button is always-on: mount it immediately (user opens the panel on click).
  controller.show(true);
  return controller;
}

/* ------------------------------------------------------------------------------------------ */
/* Lower-level API                                                                             */
/* ------------------------------------------------------------------------------------------ */

/** Register a fully-custom survey object. */
export function survey(
  s: Survey,
  hooks?: { onSubmit?: (p: ResponsePayload) => void; onEvent?: (e: SoftEvent) => void },
): WidgetController {
  return register(s, { ...hooks });
}

/** Fire an app event; runs any `{ type: 'event', name }`-triggered surveys. */
export function track(name: string, props?: Record<string, unknown>): void {
  E().track(name, props);
}

/** Merge person-properties used for condition targeting. */
export function setProperties(props: Record<string, unknown>): void {
  E().setProperties(props);
}

export interface HeadlessSession {
  runtime: SurveyRuntime;
  bus: EventBus;
  close(reason?: 'dismissed' | 'sent' | 'auto'): void;
}

/** Drive a survey yourself: get the runtime + event bus, render your own UI. */
export function headless(s: Survey): HeadlessSession {
  ensureInit();
  const ctx = getContext();
  const effective: Survey = { ...s, appearance: mergeAppearance(s.appearance) };
  const runtime = createRuntime(effective, ctx);
  const eventBus = B();
  const handle = headlessRenderer.mount({
    runtime,
    bus: eventBus,
    context: ctx,
    motion: globalMotion,
  });
  handle.open();
  return {
    runtime,
    bus: eventBus,
    close: (reason = 'dismissed') => handle.close(reason),
  };
}

/** Subscribe to all lifecycle events globally. Returns an unsubscribe fn. */
export function on(handler: (e: SoftEvent) => void): () => void {
  return B().on('*', handler);
}

/* ------------------------------------------------------------------------------------------ */
/* The `soft` fluent object + re-exports                                                       */
/* ------------------------------------------------------------------------------------------ */

export const soft = {
  init,
  csat,
  nps,
  ces,
  helpful,
  reaction,
  pmf,
  churn,
  tab,
  survey,
  headless,
  track,
  setProperties,
  on,
};

export default soft;

// Public types
export * from './types';

// Lower-level building blocks (headless/advanced)
export { createRuntime } from './runtime';
export { getRenderer } from './render';
export { createBus, buildContext, hash01 } from './engine';
export { defaultStorage, createMemoryStorageAdapter } from './storage';
// Client-side scoring (namespaced to avoid clashing with the widget helpers above)
export {
  nps as scoreNps,
  csat as scoreCsat,
  ces as scoreCes,
  dsat as scoreDsat,
  pmf as scorePmf,
  scoreForMetric,
} from './engine';
// Tree-shakeable data sinks
export { webhook, http, consoleSink } from './data';
