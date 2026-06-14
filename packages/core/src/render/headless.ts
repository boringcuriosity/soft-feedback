/**
 * Headless renderer — no DOM at all.
 *
 * Emits the same lifecycle events as the visual renderers and exposes the runtime + bus on the
 * returned handle so a consumer (e.g. a React/Vue adapter, or a fully custom UI) can drive the
 * flow themselves. This is the "full control" escape hatch from the widget set.
 *
 * Behaviour:
 *  - `open()`  emits `shown` (once).
 *  - `close('sent')` emits `sent` with the built payload (unless already sent).
 *  - `close('dismissed' | 'auto')` emits `abandoned` if partial answers exist, else `dismissed`.
 *  - `destroy()` is a silent cleanup (no event).
 *
 * Because it never touches the DOM it is fully SSR-safe.
 */

import type {
  Renderer,
  RendererContext,
  RendererHandle,
  SurveyRuntime,
  EventBus,
} from '../internal/contracts';

/** The headless handle additionally exposes the runtime + bus for consumer-driven flows. */
export interface HeadlessHandle extends RendererHandle {
  readonly runtime: SurveyRuntime;
  readonly bus: EventBus;
}

export const headlessRenderer: Renderer = {
  mount(ctx: RendererContext): RendererHandle {
    const { runtime, bus, context } = ctx;
    const survey = runtime.survey;
    const now = (): string => new Date().toISOString();

    let opened = false;
    let sent = false;
    let closed = false;

    function emitClosedWithoutSend(): void {
      const hasAnswers = Object.keys(runtime.state.responses).length > 0;
      if (hasAnswers) {
        bus.emit({
          type: 'abandoned',
          surveyId: survey.id,
          at: now(),
          partial: {
            surveyId: survey.id,
            surveyName: survey.name,
            responses: { ...runtime.state.responses },
            startedAt: runtime.state.startedAt,
            context: { url: context.url, device: context.device, locale: context.locale },
          },
        });
      } else {
        bus.emit({ type: 'dismissed', surveyId: survey.id, at: now() });
      }
    }

    const handle: HeadlessHandle = {
      runtime,
      bus,
      open(): void {
        if (opened || closed) return;
        opened = true;
        bus.emit({ type: 'shown', surveyId: survey.id, at: now() });
      },
      close(reason): void {
        if (closed) return;
        closed = true;
        if (reason === 'sent') {
          if (!sent) {
            sent = true;
            bus.emit({ type: 'sent', surveyId: survey.id, at: now(), payload: runtime.buildPayload() });
          }
          return;
        }
        if (!sent) emitClosedWithoutSend();
      },
      destroy(): void {
        closed = true;
      },
    };

    return handle;
  },
};
