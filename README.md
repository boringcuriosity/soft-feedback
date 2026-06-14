<h1 align="center">soft-feedback</h1>

<p align="center">
  <b>Soft, delightful feedback &amp; micro-survey widgets your users actually want to answer.</b><br/>
  Headless · white-label · framework-agnostic · accessible · own-your-data · MIT.
</p>

<p align="center"><i>We will never make your users hate you.</i></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/boringcuriosity/soft-feedback/main/assets/widgets-gallery.png" alt="soft-feedback widgets: a draggable emoji-dial CSAT, a one-tap emoji reaction row, a 5-star scale, and inline thumbs helpful" width="820" />
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/boringcuriosity/soft-feedback/main/assets/widgets-glass.png" alt="The same widgets under the frosted glass theme preset over a colourful background" width="720" /><br/>
  <sub>Every widget, fully themeable — here the built-in <code>glass</code> preset over a gradient.</sub>
</p>

> **Status: v0, in active development.** Zero runtime dependencies. ~25 KB gzipped.

---

## Why

Most in-app surveys are either ugly, annoying, or a hosted service that owns your data. soft-feedback is none of those:

- **Delightful by default** — motion-native widgets (a morphing emoji dial, real emoji, springy reveals), reduce-motion safe.
- **Polite by default** — nothing auto-fires on load; frequency-capped, sampled, never mid-task. The anti-irritation engine ships as defaults, not homework.
- **White-label & own-your-data** — theme with CSS tokens, send responses anywhere you like (`onSubmit`, webhook, your DB). No hosted backend, cookieless/anonymous mode.
- **Framework-agnostic & isolated** — vanilla Web Components with Shadow DOM, so styles can't collide with your app. Works in React, Vue, Svelte, or plain HTML.
- **A dashboard included** — a static, local-first results dashboard that reads the exact payloads you store.

---

## Install

```bash
npm i soft-feedback
```

```js
import { soft } from 'soft-feedback';
// No CSS import — styles live inside each widget's Shadow DOM.
```

No `<Provider>`, no mount point, no stylesheet. Just call `soft.*`.

---

## Quick start

```js
import { soft } from 'soft-feedback';

// Register a survey that fires on one of your app events.
soft.csat({
  trigger: { type: 'event', name: 'ticket_resolved', delayMs: 800 },
  onSubmit: (p) => fetch('/api/feedback', { method: 'POST', body: JSON.stringify(p) }),
});

// Fire the moment when it's right. The engine decides if it's polite to show.
soft.track('ticket_resolved');
```

Want to show one immediately (e.g. on a button click)?

```js
soft.nps().show(true); // bypasses the politeness gates
```

### React

There's no adapter to learn — it's just a function call from an effect or handler.

```jsx
import { useEffect } from 'react';
import { soft } from 'soft-feedback';

function FeedbackTriggers() {
  useEffect(() => {
    const w = soft.csat({
      trigger: { type: 'event', name: 'ticket_resolved' },
      onSubmit: (p) => fetch('/api/feedback', { method: 'POST', body: JSON.stringify(p) }),
    });
    return () => w.destroy(); // clean up on unmount
  }, []);
  return null;
}

// elsewhere, when a ticket closes:
soft.track('ticket_resolved');
```

Embed one inline in your content (e.g. a "Was this helpful?" under an article):

```jsx
function Helpful() {
  useEffect(() => {
    const w = soft.helpful({ render: { pattern: 'inline', selector: '#helpful' } });
    return () => w.destroy();
  }, []);
  return <div id="helpful" />;
}
```

> Vue, Svelte, Angular, or vanilla JS: identical — call `soft.*` from `onMounted` / `onMount` / an event handler. Nothing is React-specific.

---

## Widgets

| Call | Metric | Default look |
|---|---|---|
| `soft.csat()` | CSAT | morphing **emoji dial** (drag) |
| `soft.nps()` | NPS | 0–10 connected scale |
| `soft.ces()` | CES | 1–7 effort scale |
| `soft.reaction()` | CSAT | one-tap emoji row 😡🙂😍 |
| `soft.helpful()` | CSAT | inline 👍 / 👎 |
| `soft.pmf()` | PMF | Sean-Ellis choice |
| `soft.churn()` | — | exit-reason picker |
| `soft.tab()` | — | always-on feedback tab |

Every widget is a self-contained flow: rating → optional follow-up → thank-you. Rating displays are interchangeable via `display`: `'emoji-dial' | 'number' | 'stars' | 'emoji' | 'thumbs'`.

```js
soft.csat({ display: 'stars', scale: { min: 1, max: 5 } }); // 5-star CSAT
```

---

## When it shows (the politeness engine)

This is the part most libraries leave to you. You declare intent; the engine enforces it.

```js
soft.nps({
  trigger:   { type: 'event', name: 'feature_used', delayMs: 1500 },
  conditions:[{ type: 'url', op: 'contains', value: '/app' },
              { type: 'device', value: 'desktop' }],
  frequency: { oncePerUser: true, cooldownDaysAfterResponse: 90, globalWaitDays: 14 },
});
```

- **Triggers**: `manual`, `event`, `elementVisible`, `timeOnPage`, `scrollDepth`, `exitIntent`, `idle`, `routeChange`.
- **Conditions**: `url`, `device`, `selector`, `property`, `rollout` (sampling %), `predicate`.
- **Frequency**: once-per-user, max shows, cooldowns, and a global "don't show ANY survey within N days" cap.

Nothing fires until you `soft.track(...)` the matching event (or call `.show()`).

---

## Storing data (you own it)

Pick whichever fits your stack. All of them receive the same **`ResponsePayload`**.

```js
// 1. Per-survey callback — POST to your endpoint.
soft.csat({ onSubmit: (p) => fetch('/api/feedback', { method:'POST', body: JSON.stringify(p) }) });

// 2. Global sinks — fan every response out to one or more destinations.
import { soft, webhook, consoleSink } from 'soft-feedback';
soft.init({ sinks: [ webhook('https://api.example.com/feedback'), consoleSink() ] });

// 3. Every lifecycle event (shown / sent / dismissed / abandoned), for your analytics.
soft.on((e) => myAnalytics.track('survey_' + e.type, e));
```

The payload is self-describing and analytics-stable (responses keyed by stable question ids):

```jsonc
{
  "surveyId": "sf:nps",
  "surveyName": "NPS",
  "metric": "nps",
  "responses": { "sf:nps:rating": 9, "sf:nps:why": "fast and reliable" },
  "questions": [{ "id": "sf:nps:rating", "prompt": "How likely are you to recommend us?" }],
  "score": { "metric": "nps", "value": 9, "bucket": "promoter" },
  "startedAt": "2026-06-01T10:00:00.000Z",
  "submittedAt": "2026-06-01T10:00:12.000Z",
  "context": { "url": "https://acme.app/checkout", "device": "desktop", "locale": "en-US" }
}
```

**Store this object as-is** in your DB / warehouse and the dashboard below will read it directly. Anonymous and cookieless by default; no PII unless you add it via `soft.setProperties(...)`.

---

## Theming

White-label out of the box. Override any `--sf-*` token; a single override re-skins the whole widget.

```js
soft.csat({
  appearance: {
    theme: 'auto',                 // 'light' | 'dark' | 'auto'
    tokens: { 'color-accent': '#e11d48', 'radius': '20px' },
    maxWidth: 420,
  },
});
```

Built-in presets (spread into `appearance.tokens`): `minimal`, `soft`, `glass`, `glass-dark`, `high-contrast`.

```js
import { THEME_PRESETS } from 'soft-feedback';
soft.csat({ appearance: { theme: 'dark', tokens: THEME_PRESETS['glass-dark'] } });
```

Motion presets via `render.motion`: `subtle` (default), `smooth`, `bouncy`, `snappy`. Patterns via `render.pattern`: `popover`, `inline`, `modal`, `banner`, `tab`, `headless`. Positions: `bottom-right`, `bottom-left`, `bottom-center`, `top`, `center`.

---

## Accessibility

WCAG 2.2 AA. APG patterns (radiogroup / slider / checkbox) with full keyboard support and roving tabindex, visible focus on every control, meaning never carried by color alone, `prefers-reduced-motion` and `forced-colors` honored, ≥44px touch targets on primary actions. The headless renderer (`pattern: 'headless'`) lets you drive the flow and render your own UI.

---

## Dashboard

A **static, local-first results dashboard** lives in [`apps/dashboard/index.html`](apps/dashboard/index.html). It visualizes a `ResponsePayload[]` — the exact shape you store — and computes NPS, CSAT, CES, and PMF correctly client-side, with trends, distributions, verbatims, and segments. **Nothing leaves the browser.** Self-host it anywhere (Vercel, Netlify, S3, GitHub Pages, your own server).

It opens with demo data. Feed it your real responses three ways:

### 1. Connect to a backend (URL) — works with anything

Click **Connect**, paste an endpoint that returns your payloads as JSON, and (optionally) an API key. It's saved locally and re-fetched on load. The token is sent as both an `Authorization: Bearer …` and an `apikey` header, and the dashboard unwraps common envelopes (`[...]`, `{ data }`, `{ results }`, `{ rows }`, `{ value }`), so most backends "just work":

| Backend | Endpoint | Token field |
|---|---|---|
| **Supabase** | `https://<project>.supabase.co/rest/v1/feedback?select=*` | your `anon` key |
| **Firebase RTDB** | `https://<db>.firebaseio.com/feedback.json?auth=<token>` | (in the URL) |
| **Postgres / your API** | `https://api.you.com/feedback` returning `ResponsePayload[]` | a Bearer token |
| **Static file / S3** | `https://cdn.you.com/feedback.json` | — |
| **Google Sheets** | a published-to-web JSON endpoint mapping rows to payloads | — |

> The dashboard only reads. Expose a read-only endpoint that returns the stored payloads (a Supabase view, a serverless function, a presigned URL). For exotic schemas, transform your rows into the payload shape inside that endpoint.

### 2. Import a file

**Import** a `.json` file (or drag-drop it) containing a `ResponsePayload[]`. Handy for a one-off look at an export from your warehouse.

### 3. The playground loop (zero setup)

The [playground](apps/playground/index.html) writes submitted responses to `localStorage`; the dashboard reads the same key. Answer a few widgets, open the dashboard, and your real interactions appear. Great for demos and local development.

You can also **Export CSV** from the dashboard for spreadsheets.

---

## Playground

[`apps/playground/index.html`](apps/playground/index.html) is an interactive builder: pick a widget, configure everything (pattern, position, motion, theme, presets, colors, follow-up), hit **Fire**, and copy the generated `soft.*` code. Self-contained, no build.

Run both locally:

```bash
python3 -m http.server 8000
# playground → http://localhost:8000/apps/playground/index.html
# dashboard  → http://localhost:8000/apps/dashboard/index.html
```

---

## Packages

| Package | What |
|---|---|
| [`soft-feedback`](./packages/core) | Everything: engine + renderers + widgets + scoring + sinks (zero deps) |

Framework adapters (`@soft-feedback/react`, `vue`, `svelte`) and optional data-sink integrations are planned; today the core is framework-agnostic and needs no adapter.

---

## License

MIT.
