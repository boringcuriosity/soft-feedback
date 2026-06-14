# Product

## Register

product

## Users
Developers and product teams who embed feedback into their own apps, plus the
end-users those apps survey. Two audiences, one bar:
- **Integrators** operate the playground/builder to configure a widget and copy
  working code. They are in a task: pick a metric, set placement, theme it, ship.
- **Respondents** meet a widget mid-flow in someone else's product. They are
  interrupted, so the widget must be fast to read, easy to answer, and easy to ignore.

## Product Purpose
A headless, white-label library of feedback & micro-survey widgets (CSAT, NPS,
CES, reaction, inline "helpful?", PMF, churn, always-on tab) plus an interactive
playground for configuring them. Success = a respondent answers without
resentment, and an integrator ships the right widget in minutes with their own
brand, their own data, no hosted service.

## Brand Personality
Soft, delightful, considerate. Three words: **calm, tactile, honest.** Motion is
springy and morph-native (the emoji dial, the gooey card) but always in service
of state, never decoration. The promise the product makes to respondents is
literal: "we will never make your users hate you." The playground should feel
like a well-made instrument, not a marketing page.

## Anti-references
- **Heavy glassmorphism** (the explicit one): decorative blur/glass surfaces as a
  default aesthetic. The earlier playground leaned on animated blobs + frosted
  glass; that was wrong and has been removed.
- **Cold, sterile enterprise survey tools** (Qualtrics/SurveyMonkey grey): the
  personality-free corporate look this library reacts against.
- **Review-gating dark patterns**: never route happy users to app-store reviews
  and unhappy ones to a private form. Ethical by default.
- **Generic SaaS-cream / Tailwind-default**: indigo-on-white starter look.

## Design Principles
- **Practice what we preach.** The playground and widgets must themselves feel
  soft and delightful; the demo IS the proof.
- **Polite by default.** Nothing auto-fires, nothing blocks, motion never nags.
  Delight lives in moments (a selection pop, a morph), not in page choreography.
- **Never meaning by color alone.** Shape, label, and copy carry the meaning;
  color is always a redundant cue.
- **Own your look, own your data.** Every visual is a `--sf-*` token; theming is a
  single override. No vendor branding, no hosted dependency.
- **Earned familiarity over surprise.** Standard affordances, keyboard-complete,
  consistent vocabulary across every widget.

## Accessibility & Inclusion
WCAG 2.2 AA. Body text ≥4.5:1, large/bold ≥3:1, in both light and dark themes.
APG patterns (radiogroup/slider/checkbox) with roving tabindex and full keyboard.
Visible focus on every control. `prefers-reduced-motion` and `forced-colors`
honored everywhere. ≥44px touch targets on primary actions.
