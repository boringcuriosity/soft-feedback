/**
 * soft-feedback — public type model.
 *
 * The serializable survey object is the heart of the system. It is self-describing and uses
 * STABLE question ids so analytics survive question-wording changes (PostHog's key lesson).
 */

import type { StorageAdapter, Sink } from './internal/contracts';

export type Metric = 'csat' | 'nps' | 'ces' | 'dsat' | 'pmf' | 'custom';

export type ResponseValue = number | string | string[];

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/* ----------------------------------------------------------------------------------------- */
/* Questions                                                                                  */
/* ----------------------------------------------------------------------------------------- */

export type QuestionType = 'rating' | 'choice' | 'text' | 'link';

/** How a rating question is presented. `emoji-dial` is the hero morphing control. */
export type RatingDisplay = 'number' | 'emoji' | 'stars' | 'emoji-dial' | 'thumbs';

export interface BaseQuestion {
  /** Stable identifier — responses are keyed by this; never reuse/repurpose. */
  id: string;
  type: QuestionType;
  prompt: string;
  description?: string;
  /** When true, the user may skip (open-text "why" is optional by default). */
  optional?: boolean;
  /** Per-question routing based on the answer. */
  branching?: Branch[];
}

export interface RatingQuestion extends BaseQuestion {
  type: 'rating';
  display: RatingDisplay;
  scale: { min: number; max: number };
  /** Verbal endpoint anchors — research says always anchor scales. */
  labels?: { min?: string; max?: string };
  midpointLabel?: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
}

export interface ChoiceQuestion extends BaseQuestion {
  type: 'choice';
  multiple?: boolean;
  options: ChoiceOption[];
  /** Shuffle non-ordinal options to mitigate primacy/order bias. */
  shuffle?: boolean;
  allowOther?: boolean;
}

export interface TextQuestion extends BaseQuestion {
  type: 'text';
  placeholder?: string;
  maxLength?: number;
}

export interface LinkQuestion extends BaseQuestion {
  type: 'link';
  href: string;
  buttonLabel: string;
}

export type Question = RatingQuestion | ChoiceQuestion | TextQuestion | LinkQuestion;

export interface BranchCondition {
  op: 'lte' | 'gte' | 'eq' | 'in' | 'any';
  value?: number | string | Array<number | string>;
}

export interface Branch {
  when: BranchCondition;
  goto: { type: 'question'; id: string } | { type: 'end' };
}

/* ----------------------------------------------------------------------------------------- */
/* Triggers & conditions (the behavioral engine inputs)                                       */
/* ----------------------------------------------------------------------------------------- */

export type Trigger =
  | { type: 'manual' }
  | { type: 'event'; name: string; delayMs?: number }
  | { type: 'elementVisible'; selector: string; delayMs?: number }
  | { type: 'timeOnPage'; ms: number }
  | { type: 'scrollDepth'; percent: number }
  | { type: 'exitIntent' }
  | { type: 'idle'; ms: number }
  | { type: 'routeChange'; match?: string };

export type UrlOp = 'contains' | 'exact' | 'regex' | 'glob';
export type PropertyOp = 'eq' | 'neq' | 'in' | 'gt' | 'lt';

export type Condition =
  | { type: 'url'; op: UrlOp; value: string }
  | { type: 'device'; value: DeviceType }
  | { type: 'selector'; selector: string; present: boolean }
  | { type: 'property'; key: string; op: PropertyOp; value: unknown }
  | { type: 'rollout'; percent: number }
  | { type: 'predicate'; fn: (ctx: Context) => boolean };

export interface FrequencyPolicy {
  /** Don't show again once the user has responded. Default: true. */
  oncePerUser?: boolean;
  maxShows?: number;
  cooldownDaysAfterSeen?: number;
  cooldownDaysAfterResponse?: number;
  /** Don't show ANY soft-feedback survey within N days of the last one. */
  globalWaitDays?: number;
}

export interface Schedule {
  start?: string;
  end?: string;
  recurEveryDays?: number;
}

/* ----------------------------------------------------------------------------------------- */
/* Rendering & appearance                                                                     */
/* ----------------------------------------------------------------------------------------- */

export type RenderPattern = 'popover' | 'inline' | 'tab' | 'modal' | 'banner' | 'headless';
export type Position = 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top' | 'center';
export type MotionPreset = 'smooth' | 'bouncy' | 'subtle' | 'snappy';
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface RenderConfig {
  pattern: RenderPattern;
  /** Required for `inline`: CSS selector of the mount target. */
  selector?: string;
  position?: Position;
  motion?: MotionPreset;
}

export interface Appearance {
  theme?: ThemeMode;
  position?: Position;
  fontFamily?: string;
  maxWidth?: number;
  zIndex?: number;
  /** Opt-in "made with soft-feedback" badge. Off by default (white-label). */
  badge?: boolean;
  /** Token overrides applied as CSS custom properties, e.g. { 'color-accent': '#4f46e5' }. */
  tokens?: Record<string, string>;
}

export interface ClosingConfig {
  thankYou?: { title?: string; description?: string };
  autoDismissMs?: number;
  cta?: { label: string; href: string };
}

/* ----------------------------------------------------------------------------------------- */
/* Survey                                                                                     */
/* ----------------------------------------------------------------------------------------- */

export interface Survey {
  id: string;
  schemaVersion?: 1;
  name: string;
  metric?: Metric;
  questions: Question[];
  trigger?: Trigger;
  conditions?: Condition[];
  frequency?: FrequencyPolicy;
  schedule?: Schedule;
  render?: RenderConfig;
  appearance?: Appearance;
  closing?: ClosingConfig;
  meta?: Record<string, unknown>;
}

/* ----------------------------------------------------------------------------------------- */
/* Runtime context                                                                            */
/* ----------------------------------------------------------------------------------------- */

export interface Context {
  url: string;
  device: DeviceType;
  locale?: string;
  properties: Record<string, unknown>;
  /** Stable-ish anon id (omitted/ephemeral in fully-anonymous mode). */
  anonId?: string;
}

/* ----------------------------------------------------------------------------------------- */
/* Events & response payload (the data contract — adopted from PostHog)                       */
/* ----------------------------------------------------------------------------------------- */

export interface ScoreResult {
  metric: Metric;
  value: number;
  bucket?: string;
}

export interface ResponsePayload {
  surveyId: string;
  surveyName: string;
  anonId?: string;
  /** Keyed by stable question id. */
  responses: Record<string, ResponseValue>;
  /** Self-describing snapshot of the questions asked. */
  questions: Array<{ id: string; prompt: string }>;
  score?: ScoreResult;
  startedAt: string;
  submittedAt: string;
  context: { url: string; device: string; locale?: string };
}

export type SoftEventType = 'shown' | 'sent' | 'dismissed' | 'abandoned';

export type SoftEvent =
  | { type: 'shown'; surveyId: string; at: string }
  | { type: 'sent'; surveyId: string; at: string; payload: ResponsePayload }
  | { type: 'dismissed'; surveyId: string; at: string }
  | { type: 'abandoned'; surveyId: string; at: string; partial: Partial<ResponsePayload> };

/* ----------------------------------------------------------------------------------------- */
/* Global configuration                                                                       */
/* ----------------------------------------------------------------------------------------- */

export interface SoftConfig {
  theme?: ThemeMode | { tokens: Record<string, string> };
  motion?: MotionPreset;
  /** Cookieless / no-PII mode. Default: true. */
  anonymous?: boolean;
  storage?: StorageAdapter;
  sinks?: Sink[];
  onEvent?: (e: SoftEvent) => void;
  defaults?: { frequency?: FrequencyPolicy };
  locale?: string;
  properties?: Record<string, unknown>;
}

/* Re-export the runtime contracts that appear in the public surface. */
export type { StorageAdapter, Sink } from './internal/contracts';
