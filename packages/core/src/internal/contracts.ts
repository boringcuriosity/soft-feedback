/**
 * Internal runtime contracts. These interfaces let the engine, runtime, renderers and
 * components be implemented independently while staying wire-compatible.
 *
 * Implementation agents: build AGAINST these. Do not change their shapes without updating
 * every consumer.
 */

import type {
  Survey,
  Question,
  ResponseValue,
  ResponsePayload,
  SoftEvent,
  SoftEventType,
  Context,
  MotionPreset,
} from '../types';

/* ------------------------------------------------------------------ */
/* Storage                                                            */
/* ------------------------------------------------------------------ */

export interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/* ------------------------------------------------------------------ */
/* Data sinks                                                         */
/* ------------------------------------------------------------------ */

/** A sink receives every lifecycle event. Must never throw into the host app. */
export type Sink = (event: SoftEvent) => void | Promise<void>;

/* ------------------------------------------------------------------ */
/* Event bus                                                          */
/* ------------------------------------------------------------------ */

export interface EventBus {
  emit(event: SoftEvent): void;
  /** Subscribe to one event type or '*' for all. Returns an unsubscribe fn. */
  on(type: SoftEventType | '*', handler: (event: SoftEvent) => void): () => void;
}

/* ------------------------------------------------------------------ */
/* Survey runtime — drives question flow, branching, response capture */
/* ------------------------------------------------------------------ */

export interface RuntimeState {
  /** Index into the *visited* path, not the raw questions array. */
  index: number;
  responses: Record<string, ResponseValue>;
  startedAt: string;
  /** 0..1 best-effort completion estimate. */
  progress: number;
  complete: boolean;
}

export interface SurveyRuntime {
  readonly survey: Survey;
  readonly state: RuntimeState;
  /** The question currently being answered, or null when complete. */
  current(): Question | null;
  /** Record an answer for a question (does not advance). */
  answer(questionId: string, value: ResponseValue): void;
  /** Advance, applying branching rules; returns the next question or null at end. */
  next(): Question | null;
  /** Step back to the previous visited question, if any. */
  back(): Question | null;
  isComplete(): boolean;
  /** Build the final response payload (includes client-side score when metric is known). */
  buildPayload(): ResponsePayload;
}

/* ------------------------------------------------------------------ */
/* Renderers — mount a runtime into the DOM, report lifecycle         */
/* ------------------------------------------------------------------ */

export interface RendererContext {
  runtime: SurveyRuntime;
  bus: EventBus;
  context: Context;
  motion: MotionPreset;
}

export interface RendererHandle {
  open(): void;
  close(reason: 'dismissed' | 'sent' | 'auto'): void;
  destroy(): void;
}

export interface Renderer {
  mount(ctx: RendererContext): RendererHandle;
}

/* ------------------------------------------------------------------ */
/* Question component contract — renders one question into a host el  */
/* ------------------------------------------------------------------ */

export interface QuestionComponentContext {
  question: Question;
  value: ResponseValue | undefined;
  motion: MotionPreset;
  /** Called when the user provides/changes an answer. */
  onChange(value: ResponseValue): void;
  /** Called when the answer should advance the flow (e.g. rating tapped). */
  onCommit?(value: ResponseValue): void;
}

export interface QuestionComponentHandle {
  /** Root element the renderer appends into its content slot. */
  readonly el: HTMLElement;
  focus(): void;
  destroy(): void;
}

export type QuestionComponentFactory = (
  ctx: QuestionComponentContext,
) => QuestionComponentHandle;
