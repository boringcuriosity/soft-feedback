<h1 align="center">soft-feedback</h1>

<p align="center">
  <b>Soft, delightful feedback &amp; micro-survey widgets your users actually want to answer.</b><br/>
  Headless · white-label · framework-agnostic · accessible · MIT.
</p>

<p align="center"><i>We will never make your users hate you.</i></p>

---

```bash
npm i soft-feedback
```

```js
import { soft } from 'soft-feedback';
// No CSS import needed — styles are isolated inside the widget's Shadow DOM.

// One call. Polite defaults. No backend required.
soft.csat({
  trigger: { type: 'event', name: 'ticket_resolved', delayMs: 800 },
  question: 'How was your support experience?',
  onSubmit: (p) => fetch('/api/feedback', { method: 'POST', body: JSON.stringify(p) }),
});

// Fire the trigger from your app whenever the moment is right:
soft.track('ticket_resolved');
```

## Why soft-feedback

- **Delightful by default** — motion-native widgets (incl. a morphing emoji dial), reduce-motion-safe.
- **Polite by default** — never blocks, never fires mid-task, frequency-capped, sampled. The
  anti-irritation engine ships as defaults, not as homework.
- **Ethical by default** — we refuse to ship review-gating dark patterns.
- **Headless + own-your-data** — `onSubmit`/webhook; cookieless/anonymous mode; no hosted service.
- **White-label, free** — theme with CSS custom properties + `::part()`; no vendor branding.
- **Tiny & framework-agnostic** — vanilla Web Components core + React/Vue/Svelte adapters.
- **Metric-correct** — first-class CSAT, NPS, CES (+ DSAT, PMF), scored client-side.

## Widgets

CSAT · NPS · CES · Feature Reaction · Inline "Helpful?" · Always-On Feedback Tab ·
Exit/Cancel Catcher · PMF Probe.

## Packages

| Package | What |
|---|---|
| [`soft-feedback`](./packages/core) | The everything package: engine + renderers + widgets (zero deps) |
| `@soft-feedback/react` | React components + hooks |
| `@soft-feedback/vue` | Vue components + composables |
| `@soft-feedback/svelte` | Svelte components + actions |
| `@soft-feedback/adapters` | Optional data sinks (webhook, Supabase, PostHog, Google Sheets) |

> Status: **in active development** (v0). See the build plan in
> `../feedback-library/plan/` and the research base in `../feedback-library/research/`.

## License

MIT
