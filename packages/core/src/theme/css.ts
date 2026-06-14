/**
 * Base stylesheet for the soft-feedback widget UI — injected once into each Shadow root.
 *
 * Everything themeable is a `--sf-*` custom property (these pierce the Shadow boundary, so a
 * single override re-skins the whole widget). Selectors match the real markup emitted by the
 * renderers (`.soft-*` structure) and the question components (`.sf-*`), with `[part]` hooks
 * used as robust fallbacks. Low specificity so consumer overrides cascade last.
 *
 * Design goals: beautiful out of the box (soft shadow, ~14px radius, indigo accent, roomy
 * spacing), light/dark/auto, never color-alone, visible focus rings, ≥44px targets,
 * reduced-motion safe.
 */

export const BASE_CSS = `
/* ===== Tokens (light) ============================================================ */
:host {
  --sf-color-bg: #ffffff;
  --sf-color-fg: #1a1a23;
  --sf-color-muted: #6b7280;
  --sf-color-accent: #4f46e5;
  --sf-color-accent-fg: #ffffff;
  --sf-color-border: #e6e7ee;
  --sf-color-danger: #dc2626;
  --sf-color-success: #16a34a;
  --sf-color-surface: #f6f7fb;

  --sf-radius: 16px;
  --sf-radius-sm: 11px;

  --sf-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --sf-shadow: 0 12px 40px -12px rgb(16 18 35 / 0.30), 0 4px 14px -8px rgb(16 18 35 / 0.18);

  --sf-space: 16px;
  --sf-space-sm: 8px;
  --sf-space-lg: 22px;

  --sf-motion-duration: 0.28s;
  --sf-z: 2147483000;
  --sf-max-width: 384px;

  --_sf-accent-soft: color-mix(in srgb, var(--sf-color-accent) 12%, transparent);
  --_sf-focus-ring: 0 0 0 3px color-mix(in srgb, var(--sf-color-accent) 42%, transparent);

  display: block;
  box-sizing: border-box;
  color: var(--sf-color-fg);
  font-family: var(--sf-font);
  font-size: 15px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
*, *::before, *::after { box-sizing: border-box; }

/* ===== Dark theme (explicit + system when auto) =================================== */
:host([data-theme="dark"]), :host([data-theme="auto"]) {
  /* placeholder so selector exists; real values below */
}
:host([data-theme="dark"]) {
  --sf-color-bg: #16161e;
  --sf-color-fg: #f3f4f8;
  --sf-color-muted: #9aa1ad;
  --sf-color-accent: #818cf8;
  --sf-color-accent-fg: #15151c;
  --sf-color-border: #2c2d38;
  --sf-color-danger: #f87171;
  --sf-color-success: #4ade80;
  --sf-color-surface: #1e1f29;
  --sf-shadow: 0 14px 46px -10px rgb(0 0 0 / 0.66), 0 4px 16px -8px rgb(0 0 0 / 0.5);
}
@media (prefers-color-scheme: dark) {
  :host([data-theme="auto"]) {
    --sf-color-bg: #16161e;
    --sf-color-fg: #f3f4f8;
    --sf-color-muted: #9aa1ad;
    --sf-color-accent: #818cf8;
    --sf-color-accent-fg: #15151c;
    --sf-color-border: #2c2d38;
    --sf-color-danger: #f87171;
    --sf-color-success: #4ade80;
    --sf-color-surface: #1e1f29;
    --sf-shadow: 0 14px 46px -10px rgb(0 0 0 / 0.66), 0 4px 16px -8px rgb(0 0 0 / 0.5);
  }
}

/* ===== Backdrop (modal) ========================================================== */
.soft-backdrop {
  position: fixed; inset: 0;
  background: rgb(12 13 24 / 0.46);
  -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);
  pointer-events: auto;
}

/* ===== Card / shell ============================================================== */
.soft-card {
  position: relative;
  box-sizing: border-box;
  width: min(var(--sf-max-width), calc(100vw - 32px));
  max-width: 100%;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: var(--sf-color-bg);
  color: var(--sf-color-fg);
  border: 1px solid var(--sf-color-border);
  border-radius: var(--sf-radius);
  box-shadow: var(--sf-shadow);
  padding: var(--sf-space-lg);
  /* Opt-in frosted glass: the glass preset sets --sf-backdrop; otherwise no-op. */
  -webkit-backdrop-filter: var(--sf-backdrop, none);
  backdrop-filter: var(--sf-backdrop, none);
  /* popover/tab host is a pass-through frame (pointer-events:none); re-enable on the card. */
  pointer-events: auto;
  font-family: var(--sf-font);
  /* Keep the gooey squash-and-stretch morph crisp and on the GPU. */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.soft-modal { width: min(var(--sf-max-width), calc(100vw - 40px)); }
.soft-inline { box-shadow: none; width: 100%; max-height: none; overflow: visible; }
.soft-banner {
  width: 100%; max-width: none; border-radius: 0;
  border-left: 0; border-right: 0; box-shadow: none;
}

/* ===== Header ==================================================================== */
.soft-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: var(--sf-space); margin-bottom: var(--sf-space);
}
.soft-title {
  margin: 0; font-size: 1.0625rem; font-weight: 650; line-height: 1.35;
  letter-spacing: -0.01em; color: var(--sf-color-fg);
}
.soft-close {
  flex: 0 0 auto; position: relative;
  width: 30px; height: 30px; margin: -4px -4px 0 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--sf-color-muted); background: transparent; border: 0; border-radius: 999px;
  cursor: pointer; transition: background-color .2s ease, color .2s ease;
}
.soft-close::after { content: ""; position: absolute; inset: -7px; } /* 44px hit area */
.soft-close:hover { background: var(--sf-color-surface); color: var(--sf-color-fg); }

/* ===== Progress ================================================================== */
.soft-progress {
  height: 4px; width: 100%; background: var(--sf-color-border);
  border-radius: 999px; overflow: hidden; margin-bottom: var(--sf-space);
}
.soft-progress-fill {
  height: 100%; width: 100%; transform-origin: left center; transform: scaleX(0);
  background: var(--sf-color-accent); border-radius: inherit;
}

/* ===== Content / question wrapper ================================================ */
.soft-content { position: relative; }
.soft-q { display: block; }

/* ===== Footer + buttons ========================================================= */
.soft-foot {
  display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap;
  gap: var(--sf-space-sm); margin-top: var(--sf-space-lg);
}
.soft-foot:empty { display: none; }
/* Inline optional comment revealed after a last-step rating; full-width above the button. */
.soft-inline-comment { width: 100%; min-height: 64px; margin: 0; animation: sf-rise .28s ease both; }
.soft-btn {
  min-height: 44px; min-width: 88px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px 18px; font: inherit; font-weight: 600; text-decoration: none;
  border-radius: var(--sf-radius-sm); border: 1.5px solid transparent; cursor: pointer;
  transition: transform var(--sf-motion-duration) cubic-bezier(.22,1,.36,1),
    background-color .2s ease, box-shadow .2s ease, opacity .2s ease;
}
.soft-btn:active { transform: translateY(1px); }
.soft-btn:disabled { opacity: .5; cursor: not-allowed; }
.soft-btn-primary { background: var(--sf-color-accent); color: var(--sf-color-accent-fg); }
.soft-btn-primary:hover:not(:disabled) {
  box-shadow: 0 8px 20px -8px var(--sf-color-accent); transform: translateY(-1px);
}

/* ===== Rating: number scale ===================================================== */
.sf-scale { display: flex; flex-direction: column; gap: var(--sf-space-sm); }
.sf-scale-track, [part="rating"] {
  display: flex; flex-wrap: wrap; gap: var(--sf-space-sm); align-items: stretch;
}
.sf-rating-btn, [part="rating-button"] {
  flex: 1 1 0; min-width: 44px; min-height: 44px;
  display: inline-flex; align-items: center; justify-content: center;
  padding: 10px; font: inherit; font-weight: 550; color: var(--sf-color-fg);
  background: var(--sf-color-surface); border: 1.5px solid var(--sf-color-border);
  border-radius: var(--sf-radius-sm); cursor: pointer;
  transition: transform var(--sf-motion-duration) cubic-bezier(.22,1,.36,1),
    border-color .2s ease, background-color .2s ease, box-shadow .2s ease;
}
.sf-rating-btn:hover { border-color: var(--sf-color-accent); transform: translateY(-1px); }
.sf-rating-btn.is-selected, .sf-rating-btn[aria-checked="true"] {
  border-color: var(--sf-color-accent); background: var(--_sf-accent-soft);
  box-shadow: inset 0 0 0 1px var(--sf-color-accent); font-weight: 700;
}
.sf-scale-anchors {
  display: flex; justify-content: space-between; gap: var(--sf-space);
  font-size: .8rem; color: var(--sf-color-muted);
}

/* ===== Rating: stars ============================================================ */
.sf-stars { display: flex; gap: 4px; justify-content: center; }
.sf-star {
  background: none; border: 0; padding: 4px; line-height: 0; cursor: pointer;
  color: var(--sf-color-border); transition: transform .15s ease, color .15s ease;
}
.sf-star .sf-star-icon { width: 34px; height: 34px; display: block; }
.sf-star:hover { transform: scale(1.12); }
.sf-star.is-filled, .sf-star.is-selected, .sf-star[aria-checked="true"], .sf-star[data-filled="true"] { color: #f5b301; }

/* ===== Rating: emoji row ======================================================== */
.sf-emoji-row { display: flex; gap: var(--sf-space-sm); justify-content: space-between; }
.sf-emoji-btn {
  flex: 1 1 0; background: none; border: 0; cursor: pointer; padding: 7px 5px;
  line-height: 1; border-radius: var(--sf-radius-sm);
  transition: transform .18s cubic-bezier(.22,1,.36,1), background-color .18s ease;
}
.sf-emoji-btn:hover { transform: translateY(-2px) scale(1.08); }
.sf-emoji-btn.is-selected, .sf-emoji-btn[aria-checked="true"] { transform: scale(1.16); }

/* ===== Rating: thumbs =========================================================== */
.sf-scale--thumbs .sf-scale-track, .sf-thumbs {
  display: flex; gap: var(--sf-space); justify-content: center; flex-wrap: nowrap;
}
.sf-thumbs button, .sf-thumb {
  flex: 0 0 auto; width: 60px; height: 60px; min-width: 0; padding: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--sf-color-muted);
  background: var(--sf-color-surface); border: 1.5px solid var(--sf-color-border);
  border-radius: 50%; cursor: pointer;
  transition: transform .18s ease, border-color .2s ease, background-color .2s ease, color .2s ease;
}
.sf-thumb-emoji { font-size: 30px; line-height: 1; display: block; }
.sf-thumbs button:hover, .sf-thumb:hover {
  transform: translateY(-2px); border-color: var(--sf-color-accent); color: var(--sf-color-fg);
}
.sf-thumb--up:hover { color: var(--sf-color-success); }
.sf-thumb--down:hover { color: var(--sf-color-danger); }
.sf-thumbs button.is-selected, .sf-thumbs button[aria-checked="true"],
.sf-thumb.is-selected, .sf-thumb[aria-checked="true"] {
  border-color: var(--sf-color-accent); background: var(--_sf-accent-soft);
  color: var(--sf-color-accent); transform: scale(1.06);
}

/* ===== Hero: emoji dial ========================================================= */
.sf-dial { display: flex; flex-direction: column; align-items: center; gap: var(--sf-space); }
.sf-dial-emoji {
  height: 96px; display: flex; align-items: center; justify-content: center;
  font-size: 80px; line-height: 1; user-select: none;
}
.sf-dial-track {
  position: relative; width: 100%; height: 44px; display: flex; align-items: center;
  cursor: pointer; touch-action: none;
}
.sf-dial-track::before {
  content: ""; position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%);
  height: 8px; border-radius: 999px; background: var(--sf-color-border);
}
.sf-dial-fill {
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  height: 8px; width: 50%; border-radius: 999px; background: var(--sf-color-accent);
  pointer-events: none;
}
.sf-dial-ticks { position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); height: 8px; pointer-events: none; }
.sf-dial-tick {
  position: absolute; top: 50%; width: 2px; height: 8px; transform: translate(-50%, -50%);
  background: color-mix(in srgb, var(--sf-color-bg) 70%, transparent); border-radius: 1px;
}
.sf-dial-thumb {
  position: absolute; top: 50%; left: 50%; width: 26px; height: 26px;
  transform: translate(-50%, -50%); border-radius: 50%;
  background: var(--sf-color-bg); border: 3px solid var(--sf-color-accent);
  box-shadow: var(--sf-shadow); cursor: grab;
}
.sf-dial-thumb:active { cursor: grabbing; }
.sf-dial-track:focus-visible { outline: none; }
.sf-dial-track:focus-visible .sf-dial-thumb { outline: 2px solid var(--sf-color-accent); outline-offset: 3px; }
.sf-dial-anchors { display: flex; justify-content: space-between; width: 100%; font-size: .8rem; color: var(--sf-color-muted); }
.sf-dial-value-label { min-height: 1.2em; font-weight: 650; color: var(--sf-color-fg); }
.sf-dial-value-label:not(.is-set) { color: var(--sf-color-muted); font-weight: 500; }

/* ===== Choice =================================================================== */
.sf-choice-group { display: flex; flex-direction: column; gap: var(--sf-space-sm); }
.sf-option {
  display: flex; align-items: center; gap: var(--sf-space-sm); width: 100%;
  min-height: 44px; padding: 11px var(--sf-space); text-align: start; font: inherit;
  color: var(--sf-color-fg); background: var(--sf-color-surface);
  border: 1.5px solid var(--sf-color-border); border-radius: var(--sf-radius-sm); cursor: pointer;
  transition: border-color .2s ease, background-color .2s ease, transform var(--sf-motion-duration) cubic-bezier(.22,1,.36,1);
}
.sf-option:hover { border-color: var(--sf-color-accent); transform: translateY(-1px); }
.sf-option.is-selected, .sf-option[aria-checked="true"] {
  border-color: var(--sf-color-accent); background: var(--_sf-accent-soft); font-weight: 600;
}
.sf-option-box {
  flex: 0 0 auto; width: 19px; height: 19px;
  /* A fraction of the text color so the control stays visible on any surface,
     including translucent presets (glass) where --sf-color-border is near-white. */
  border: 2px solid color-mix(in srgb, var(--sf-color-fg) 34%, transparent);
  border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
  color: var(--sf-color-accent-fg);
}
.sf-option[role="checkbox"] .sf-option-box { border-radius: 6px; }
.sf-option.is-selected .sf-option-box, .sf-option[aria-checked="true"] .sf-option-box {
  border-color: var(--sf-color-accent); background: var(--sf-color-accent);
}
.sf-option-label { flex: 1 1 auto; }
.sf-choice-other { margin-top: var(--sf-space-sm); }

/* ===== Text ==================================================================== */
.sf-text { display: flex; flex-direction: column; gap: 6px; }
.sf-text-label { font-size: .9rem; color: var(--sf-color-muted); }
.sf-textarea, .sf-input {
  width: 100%; min-height: 44px; padding: 11px var(--sf-space); font: inherit;
  color: var(--sf-color-fg); background: var(--sf-color-bg);
  border: 1.5px solid var(--sf-color-border); border-radius: var(--sf-radius-sm);
  transition: border-color .2s ease, box-shadow .2s ease;
}
.sf-textarea { min-height: 96px; resize: vertical; line-height: 1.5; }
.sf-textarea::placeholder, .sf-input::placeholder { color: var(--sf-color-muted); }
.sf-textarea:hover, .sf-input:hover { border-color: var(--sf-color-accent); }
.sf-input--other { margin-top: 6px; }
.sf-text-counter { font-size: .75rem; text-align: end; color: var(--sf-color-muted); }

/* ===== Link ==================================================================== */
.sf-link { display: flex; justify-content: center; }
.sf-link-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 44px; padding: 11px 20px; font: inherit; font-weight: 600; text-decoration: none;
  border-radius: var(--sf-radius-sm); background: var(--sf-color-accent); color: var(--sf-color-accent-fg);
  cursor: pointer; transition: box-shadow .2s ease, transform var(--sf-motion-duration) cubic-bezier(.22,1,.36,1);
}
.sf-link-btn:hover { box-shadow: 0 8px 20px -8px var(--sf-color-accent); transform: translateY(-1px); }

/* ===== Thank-you =============================================================== */
.soft-thankyou {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  gap: var(--sf-space-sm); padding: var(--sf-space) 0;
}
.soft-thankyou-mark {
  width: 56px; height: 56px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; color: var(--sf-color-success);
  background: color-mix(in srgb, var(--sf-color-success) 16%, transparent);
  transform-origin: center; backface-visibility: hidden;
}
.soft-thankyou-check { will-change: stroke-dashoffset; }
.soft-thankyou-title { margin: 0; font-size: 1.1rem; font-weight: 650; }
.soft-thankyou-desc { margin: 0; color: var(--sf-color-muted); font-size: .9rem; }

/* ===== Badge =================================================================== */
.soft-badge {
  display: block; margin-top: var(--sf-space); text-align: center;
  font-size: .7rem; color: var(--sf-color-muted); text-decoration: none;
}
.soft-badge:hover { color: var(--sf-color-fg); }

/* ===== SR-only ================================================================= */
.soft-sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* ===== Focus =================================================================== */
:host :focus-visible { outline: 2px solid var(--sf-color-accent); outline-offset: 2px; }
.sf-textarea:focus-visible, .sf-input:focus-visible {
  outline: none; border-color: var(--sf-color-accent); box-shadow: var(--_sf-focus-ring);
}

/* ============================================================================
   Polish layer — refined states, selection "pops", and per-component delight.
   Declared after the base rules (later-wins) but BEFORE the reduced-motion and
   forced-colors blocks, so those (which use !important) always have the final
   say. Every motion here is a transition/animation the reduced-motion block
   neutralizes automatically.
   ============================================================================ */
@keyframes sf-pop {
  0% { transform: scale(1); }
  45% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
@keyframes sf-check-in {
  0% { transform: rotate(45deg) scale(0); opacity: 0; }
  60% { transform: rotate(45deg) scale(1.18); opacity: 1; }
  100% { transform: rotate(45deg) scale(1); opacity: 1; }
}
@keyframes sf-dot-in {
  0% { transform: scale(0); }
  60% { transform: scale(1.25); }
  100% { transform: scale(1); }
}
@keyframes sf-rise {
  from { opacity: 0; transform: translateY(7px); }
  to { opacity: 1; transform: none; }
}
@keyframes sf-glow {
  from { opacity: 0.85; transform: scale(0.55); }
  to { opacity: 0; transform: scale(1.35); }
}

/* ---- Number scale: one connected, premium scale (NPS / CES) --------------- */
.sf-scale--number .sf-scale-track {
  flex-wrap: nowrap; gap: 0; border-radius: var(--sf-radius-sm); overflow: hidden;
  border: 1.5px solid var(--sf-color-border);
  background: linear-gradient(90deg,
    color-mix(in srgb, #ef4444 42%, transparent),
    color-mix(in srgb, #f59e0b 40%, transparent) 50%,
    color-mix(in srgb, #22c55e 46%, transparent));
}
.sf-scale--number .sf-rating-btn {
  flex: 1 1 0; min-width: 0; height: 48px; padding: 0;
  border: none; border-right: 1px solid var(--sf-color-border); border-radius: 0;
  background: transparent; color: var(--sf-color-fg);
  font-weight: 600; font-size: .95rem; font-variant-numeric: tabular-nums;
  transition: background-color .14s ease, color .14s ease;
}
.sf-scale--number .sf-rating-btn:last-child { border-right: none; }
.sf-scale--number .sf-rating-btn:hover { background: var(--_sf-accent-soft); transform: none; box-shadow: none; }
.sf-scale--number .sf-rating-btn.is-selected,
.sf-scale--number .sf-rating-btn[aria-checked="true"] {
  background: var(--sf-color-accent); color: var(--sf-color-accent-fg);
  box-shadow: none; transform: none; animation: none;
}

/* ---- Stars: warm gold, glow, springy fill -------------------------------- */
.sf-star { transition: transform .18s cubic-bezier(.34,1.56,.64,1), color .16s ease, filter .2s ease; }
.sf-star.is-filled .sf-star-icon { filter: drop-shadow(0 2px 6px rgba(245,179,1,.45)); }
.sf-star:hover, .sf-star:focus-visible { transform: scale(1.16) rotate(-5deg); }
.sf-star.is-selected { animation: sf-pop .5s cubic-bezier(.34,1.56,.64,1); }

/* ---- Thumbs: emoji 👍 / 👎, tactile success/danger selection ------------- */
.sf-thumb { width: 66px; height: 66px; }
.sf-thumb-emoji { transition: transform .18s cubic-bezier(.34,1.56,.64,1); }
.sf-thumb:hover .sf-thumb-emoji { transform: scale(1.14); }
.sf-thumb--up.is-selected, .sf-thumb--up[aria-checked="true"] {
  border-color: var(--sf-color-success);
  background: color-mix(in srgb, var(--sf-color-success) 16%, transparent);
  animation: sf-pop .5s cubic-bezier(.34,1.56,.64,1);
}
.sf-thumb--up:hover { border-color: var(--sf-color-success); background: color-mix(in srgb, var(--sf-color-success) 9%, transparent); }
.sf-thumb--down.is-selected, .sf-thumb--down[aria-checked="true"] {
  border-color: var(--sf-color-danger);
  background: color-mix(in srgb, var(--sf-color-danger) 16%, transparent);
  animation: sf-pop .5s cubic-bezier(.34,1.56,.64,1);
}
.sf-thumb--down:hover { border-color: var(--sf-color-danger); background: color-mix(in srgb, var(--sf-color-danger) 9%, transparent); }

/* ---- Emoji row: full-color real emoji, clear selection ------------------- */
.sf-emoji-glyph { font-size: 34px; line-height: 1; display: block; }
.sf-emoji-btn { transition: transform .2s cubic-bezier(.34,1.56,.64,1), background-color .2s ease; }
.sf-emoji-btn:hover { transform: translateY(-3px) scale(1.12); background: color-mix(in srgb, var(--sf-color-accent) 7%, transparent); }
.sf-emoji-btn.is-selected, .sf-emoji-btn[aria-checked="true"] {
  background: var(--_sf-accent-soft);
  animation: sf-pop .5s cubic-bezier(.34,1.56,.64,1);
}
.sf-emoji-btn.is-selected .sf-emoji-glyph, .sf-emoji-btn[aria-checked="true"] .sf-emoji-glyph {
  filter: drop-shadow(0 5px 10px rgba(30,30,55,.2));
}

/* ---- Choice options: crisp rows, clear selection, animated check/dot ------ */
.sf-choice-group { gap: 10px; }
.sf-option {
  background: var(--sf-color-bg); gap: 12px; padding: 13px 15px; font-weight: 500;
  box-shadow: 0 1px 2px rgba(20,22,45,.04);
}
.sf-option:hover {
  border-color: var(--sf-color-accent); background: var(--_sf-accent-soft);
  box-shadow: 0 6px 16px -8px rgba(20,22,45,.22);
}
.sf-option.is-selected, .sf-option[aria-checked="true"] {
  background: var(--_sf-accent-soft); border-color: var(--sf-color-accent);
  box-shadow: 0 1px 2px rgba(20,22,45,.04);
  animation: sf-pop .4s cubic-bezier(.34,1.56,.64,1);
}
.sf-option-box { width: 20px; height: 20px; border-width: 2px; }
.sf-option-box { position: relative; }
.sf-option-box::after { content: ""; position: absolute; }
.sf-option[role="checkbox"] .sf-option-box::after {
  width: 5px; height: 9px; left: 50%; top: 46%; margin: -5px 0 0 -2.5px;
  border: solid var(--sf-color-accent-fg); border-width: 0 2px 2px 0;
  transform: rotate(45deg) scale(0); opacity: 0;
}
.sf-option[role="checkbox"].is-selected .sf-option-box::after,
.sf-option[role="checkbox"][aria-checked="true"] .sf-option-box::after {
  animation: sf-check-in .3s cubic-bezier(.34,1.56,.64,1) forwards;
}
.sf-option[role="radio"] .sf-option-box::after {
  inset: 0; margin: auto; width: 8px; height: 8px; border-radius: 50%;
  background: var(--sf-color-accent-fg); transform: scale(0);
}
.sf-option[role="radio"].is-selected .sf-option-box::after,
.sf-option[role="radio"][aria-checked="true"] .sf-option-box::after {
  animation: sf-dot-in .28s cubic-bezier(.34,1.56,.64,1) forwards;
}
.sf-choice-group .sf-option { animation: sf-rise .34s ease both; }
.sf-choice-group .sf-option:nth-child(1) { animation-delay: .02s; }
.sf-choice-group .sf-option:nth-child(2) { animation-delay: .07s; }
.sf-choice-group .sf-option:nth-child(3) { animation-delay: .12s; }
.sf-choice-group .sf-option:nth-child(4) { animation-delay: .17s; }
.sf-choice-group .sf-option:nth-child(5) { animation-delay: .22s; }
.sf-choice-group .sf-option:nth-child(n+6) { animation-delay: .27s; }

/* ---- Dial: big emoji face that snaps + pops, premium rail ----------------- */
.sf-dial { gap: 20px; }
.sf-dial-emoji { filter: drop-shadow(0 6px 10px rgba(20,20,40,.14)); will-change: transform; }
@keyframes sf-dial-emoji-pop { 0% { transform: scale(.74); } 55% { transform: scale(1.14); } 100% { transform: scale(1); } }
.sf-dial-emoji--pop { animation: sf-dial-emoji-pop .42s cubic-bezier(.34,1.56,.64,1); }
.sf-dial-track { height: 40px; }
.sf-dial-ticks { display: none; }
/* Rail = a fraction of the text color so the unfilled track is clearly visible on
   any surface (light, dark, or a translucent glass preset). */
.sf-dial-track::before { height: 10px; background: color-mix(in srgb, var(--sf-color-fg) 18%, transparent); box-shadow: none; }
.sf-dial-fill { height: 10px; background: linear-gradient(90deg, color-mix(in srgb, var(--sf-color-accent) 78%, #fff), var(--sf-color-accent)); }
/* Thumb = a solid accent disc with a card-colored ring, so it reads on every theme
   (a bg-colored center used to vanish into a dark card). */
.sf-dial-thumb {
  width: 28px; height: 28px; border: 3px solid var(--sf-color-bg);
  background: var(--sf-color-accent);
  box-shadow: 0 3px 10px rgba(20,22,45,.35), 0 0 0 0 var(--_sf-accent-soft);
  transition: box-shadow .18s ease, transform .12s ease;
}
.sf-dial-track:hover .sf-dial-thumb { box-shadow: 0 4px 12px rgba(20,22,45,.3), 0 0 0 6px var(--_sf-accent-soft); }
.sf-dial-track:active .sf-dial-thumb {
  transform: translate(-50%, -50%) scale(1.1);
  box-shadow: 0 5px 14px rgba(20,22,45,.32), 0 0 0 9px var(--_sf-accent-soft);
}
.sf-dial-value-label { font-size: .95rem; }

/* ---- Card & header: softer shell, calmer hierarchy ----------------------- */
.soft-card { border-radius: 18px; padding: 22px 24px 24px; box-shadow: 0 1px 2px rgba(20,22,45,.05), 0 20px 50px -18px rgba(20,22,45,.30); }
.soft-head { margin-bottom: 20px; }
.soft-title { font-size: 1.075rem; font-weight: 700; letter-spacing: -0.012em; line-height: 1.32; }
.soft-close { width: 32px; height: 32px; border-radius: 10px; margin: -4px -6px 0 0; }
.soft-close:hover { background: var(--sf-color-surface); color: var(--sf-color-fg); }

/* ---- Progress: rounded, gradient, soft glow ------------------------------ */
.soft-progress { height: 5px; margin-bottom: 20px; }
.soft-progress-fill {
  background: linear-gradient(90deg, color-mix(in srgb, var(--sf-color-accent) 72%, var(--sf-color-accent-fg)), var(--sf-color-accent));
  box-shadow: 0 0 8px -2px var(--sf-color-accent);
}

/* ---- Primary button: gradient + lift ------------------------------------- */
.soft-btn-primary {
  background: linear-gradient(180deg, color-mix(in srgb, var(--sf-color-accent) 90%, #fff), var(--sf-color-accent));
  box-shadow: 0 4px 12px -6px var(--sf-color-accent);
}
.soft-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 24px -8px var(--sf-color-accent); }

/* ---- Thank-you: a soft glow burst behind the mark ------------------------ */
.soft-thankyou-mark { position: relative; }
.soft-thankyou-mark::before {
  content: ""; position: absolute; inset: -10px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle, color-mix(in srgb, var(--sf-color-success) 34%, transparent), transparent 70%);
  animation: sf-glow .9s ease forwards;
}

/* ---- Text: accent the label while focused -------------------------------- */
.sf-text:focus-within .sf-text-label { color: var(--sf-color-accent); }

/* ---- Focus refinements: shape-appropriate rings -------------------------- */
/* Number cells live inside an overflow:hidden track, so an outline would clip.
   Use an inset ring that reads cleanly within the connected scale. */
.sf-scale--number .sf-rating-btn:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--sf-color-accent);
}
/* The dial communicates focus through its thumb ring, not a rectangle around the rail. */
.sf-dial-track:focus-visible { outline: none; }

/* ===== Reduced motion ========================================================== */
@media (prefers-reduced-motion: reduce) {
  :host * {
    animation-duration: .001ms !important; animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
  .soft-card, .sf-rating-btn, .sf-option, .soft-btn, .sf-emoji-btn { transform: none !important; }
}

/* ===== Forced colors =========================================================== */
@media (forced-colors: active) {
  .soft-card, .sf-rating-btn, .sf-option, .sf-input, .sf-textarea, .soft-btn { border-color: CanvasText; }
  .sf-rating-btn[aria-checked="true"], .sf-option[aria-checked="true"], .sf-rating-btn.is-selected, .sf-option.is-selected { outline: 2px solid Highlight; }
  :host :focus-visible { outline: 2px solid Highlight; }
}
`;
