/**
 * Theming barrel + the runtime application API.
 *
 * Surfaces:
 *   - `BASE_CSS`        — the full base stylesheet to inject into a Shadow root.
 *   - `THEME_PRESETS`   — built-in token presets.
 *   - `TOKEN_NAMES`     — every public token name (without the `--sf-` prefix).
 *   - `applyAppearance` — resolve theme mode + token overrides onto a host element.
 *   - `tokensToCss`     — serialize a token map into a `:host { ... }` declaration block.
 *   - `DTCG_TOKENS`     — DTCG (W3C Design Tokens) mirror of the default light tokens.
 */

import type { Appearance, ThemeMode } from '../types';

export { BASE_CSS } from './css';
export { THEME_PRESETS } from './presets';

/**
 * Every public token name, without the `--sf-` prefix. Mirrors the `:host` defaults in
 * `BASE_CSS`. Useful for validation, the Theme Studio, and serialization.
 */
export const TOKEN_NAMES: string[] = [
  'color-bg',
  'color-fg',
  'color-muted',
  'color-accent',
  'color-accent-fg',
  'color-border',
  'color-danger',
  'color-success',
  'color-surface',
  'radius',
  'radius-sm',
  'font',
  'shadow',
  'space',
  'space-sm',
  'space-lg',
  'motion-duration',
  'z',
  'max-width',
];

const TOKEN_NAME_SET = new Set(TOKEN_NAMES);

/** Default light token values (source of truth for `DTCG_TOKENS`). */
const DEFAULT_LIGHT_TOKENS: Record<string, string> = {
  'color-bg': '#ffffff',
  'color-fg': '#1a1a23',
  'color-muted': '#6b7280',
  'color-accent': '#4f46e5',
  'color-accent-fg': '#ffffff',
  'color-border': '#e5e7eb',
  'color-danger': '#dc2626',
  'color-success': '#16a34a',
  'color-surface': '#f7f7fb',
  'radius': '14px',
  'radius-sm': '9px',
  'font': 'inherit',
  'shadow': '0 10px 38px -10px rgb(16 18 35 / 0.28), 0 4px 12px -6px rgb(16 18 35 / 0.16)',
  'space': '16px',
  'space-sm': '8px',
  'space-lg': '24px',
  'motion-duration': '0.28s',
  'z': '2147483000',
  'max-width': '380px',
};

/** Token names whose DTCG `$type` is `color`; the rest are `dimension`/`other`. */
const COLOR_TOKENS = new Set([
  'color-bg',
  'color-fg',
  'color-muted',
  'color-accent',
  'color-accent-fg',
  'color-border',
  'color-danger',
  'color-success',
  'color-surface',
]);

function dtcgType(name: string): string {
  if (COLOR_TOKENS.has(name)) return 'color';
  if (name === 'shadow') return 'shadow';
  if (name === 'font') return 'fontFamily';
  if (name === 'motion-duration') return 'duration';
  if (name === 'radius' || name === 'radius-sm' || name.startsWith('space') || name === 'max-width') {
    return 'dimension';
  }
  return 'other';
}

/**
 * DTCG-format (W3C Design Tokens, 2025.10) mirror of the default light tokens. Flat group keyed
 * by token name; each entry carries `$type` + `$value`.
 */
export const DTCG_TOKENS: unknown = (() => {
  const out: Record<string, { $type: string; $value: string }> = {};
  for (const name of TOKEN_NAMES) {
    const value = DEFAULT_LIGHT_TOKENS[name];
    if (value === undefined) continue;
    out[name] = { $type: dtcgType(name), $value: value };
  }
  return { $description: 'soft-feedback default light theme', tokens: out };
})();

/**
 * Serialize a token map (keys without the `--sf-` prefix) into a `:host { ... }` CSS block.
 * Unknown token names are passed through (still prefixed) so forward-compatible tokens work.
 */
export function tokensToCss(tokens: Record<string, string>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(tokens)) {
    if (value == null) continue;
    const name = key.startsWith('--sf-') ? key : `--sf-${key}`;
    lines.push(`  ${name}: ${value};`);
  }
  if (lines.length === 0) return '';
  return `:host {\n${lines.join('\n')}\n}`;
}

/** Set a single `--sf-*` custom property on an element from an unprefixed token name. */
function setToken(host: HTMLElement, key: string, value: string): void {
  const name = key.startsWith('--sf-') ? key : `--sf-${key}`;
  host.style.setProperty(name, value);
}

/** Apply a token map (only well-formed string values) to the host as `--sf-*` properties. */
function applyTokens(host: HTMLElement, tokens: Record<string, string> | undefined): void {
  if (!tokens) return;
  for (const [key, value] of Object.entries(tokens)) {
    if (typeof value === 'string' && value.length > 0) {
      setToken(host, key, value);
    }
  }
}

/**
 * Resolve appearance + global theme onto a host element.
 *
 * Order of operations (later wins):
 *   1. set `data-theme` from `appearance.theme` / `globalTheme` mode (CSS handles light/dark/auto)
 *   2. apply global theme tokens (when `globalTheme` is a `{ tokens }` object)
 *   3. apply per-survey `appearance.tokens`
 *   4. map convenience fields (`maxWidth`, `zIndex`, `fontFamily`) to their tokens
 *
 * `'auto'` is written as `data-theme="auto"` and left to CSS (`prefers-color-scheme`) — no
 * matchMedia listener is required. SSR-safe: a missing element is ignored.
 */
export function applyAppearance(
  host: HTMLElement,
  appearance?: Appearance,
  globalTheme?: ThemeMode | { tokens: Record<string, string> },
): void {
  if (!host || typeof host.setAttribute !== 'function') return;

  // 1. Theme mode. Per-survey appearance.theme wins over the global mode.
  const mode: ThemeMode =
    appearance?.theme ?? (typeof globalTheme === 'string' ? globalTheme : 'auto');
  host.setAttribute('data-theme', mode);

  // 2. Global token theme (when provided as an object).
  if (globalTheme && typeof globalTheme !== 'string') {
    applyTokens(host, globalTheme.tokens);
  }

  // 3. Per-survey token overrides — including a named preset if the map matches one.
  applyTokens(host, appearance?.tokens);

  // 4. Convenience field → token mapping.
  if (typeof appearance?.maxWidth === 'number' && Number.isFinite(appearance.maxWidth)) {
    setToken(host, 'max-width', `${appearance.maxWidth}px`);
  }
  if (typeof appearance?.zIndex === 'number' && Number.isFinite(appearance.zIndex)) {
    setToken(host, 'z', String(appearance.zIndex));
  }
  if (typeof appearance?.fontFamily === 'string' && appearance.fontFamily.length > 0) {
    setToken(host, 'font', appearance.fontFamily);
  }

  // Position is a layout hint consumed by renderers; expose it as a data attribute so
  // renderer CSS / logic can react to it without re-reading the appearance object.
  if (appearance?.position) {
    host.setAttribute('data-position', appearance.position);
  }
}

/** Whether a token name is a recognized public token. */
export function isKnownToken(name: string): boolean {
  return TOKEN_NAME_SET.has(name.startsWith('--sf-') ? name.slice('--sf-'.length) : name);
}
