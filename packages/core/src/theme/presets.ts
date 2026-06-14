/**
 * Built-in theme presets.
 *
 * Each preset is a partial token map (keys WITHOUT the `--sf-` prefix) that layers over the
 * base light/dark defaults. Apply by spreading into `appearance.tokens` or by passing through
 * `applyAppearance`. Consumers can copy-paste and tweak, or import directly.
 */

export const THEME_PRESETS: Record<string, Record<string, string>> = {
  /**
   * `minimal` — flat, borderless-feeling, near-monochrome. Lets content lead.
   */
  minimal: {
    'color-accent': '#111827',
    'color-accent-fg': '#ffffff',
    'color-surface': '#ffffff',
    'color-border': '#ececef',
    'radius': '8px',
    'radius-sm': '6px',
    'shadow': '0 1px 2px rgb(16 18 35 / 0.06), 0 6px 16px -10px rgb(16 18 35 / 0.18)',
  },

  /**
   * `soft` — pillowy, friendly, generous radius and a warm indigo accent. The signature feel.
   */
  soft: {
    'color-accent': '#6366f1',
    'color-accent-fg': '#ffffff',
    'color-surface': '#f5f5ff',
    'color-border': '#e6e6f5',
    'radius': '18px',
    'radius-sm': '12px',
    'space': '18px',
    'space-lg': '26px',
    'shadow': '0 14px 50px -12px rgb(79 70 229 / 0.28), 0 4px 14px -8px rgb(16 18 35 / 0.14)',
  },

  /**
   * `glass` — translucent frosted card. Best over imagery; relies on host backdrop-filter.
   */
  glass: {
    'color-bg': 'rgba(255, 255, 255, 0.42)',
    'color-fg': '#1a1726',
    'color-muted': '#4b475a',
    'color-surface': 'rgba(255, 255, 255, 0.28)',
    'color-border': 'rgba(255, 255, 255, 0.65)',
    'color-accent': '#7c3aed',
    'color-accent-fg': '#ffffff',
    'radius': '22px',
    'radius-sm': '14px',
    // Lighter frost: a gentler blur over a more translucent card so the colours
    // behind read through, with a crisp light rim + inner highlight for premium glass.
    'backdrop': 'blur(12px) saturate(1.4)',
    'shadow':
      '0 24px 70px -24px rgb(16 18 35 / 0.45), inset 0 1px 0 rgb(255 255 255 / 0.7), inset 0 0 0 1px rgb(255 255 255 / 0.22)',
  },

  /**
   * `glass-dark` — the dark-mode companion to `glass`: a translucent smoked card
   * with light text. Apply this instead of `glass` when the theme is dark.
   */
  'glass-dark': {
    'color-bg': 'rgba(28, 28, 40, 0.5)',
    'color-fg': '#f4f4f8',
    'color-muted': '#aeb2c2',
    'color-surface': 'rgba(255, 255, 255, 0.09)',
    'color-border': 'rgba(255, 255, 255, 0.16)',
    'color-accent': '#a78bfa',
    'color-accent-fg': '#16131f',
    'radius': '22px',
    'radius-sm': '14px',
    'backdrop': 'blur(12px) saturate(1.4)',
    'shadow':
      '0 26px 70px -22px rgb(0 0 0 / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.12), inset 0 0 0 1px rgb(255 255 255 / 0.07)',
  },

  /**
   * `high-contrast` — accessibility-first: pure black/white, thick borders, strong focus.
   * Meets WCAG AAA contrast for text.
   */
  'high-contrast': {
    'color-bg': '#ffffff',
    'color-fg': '#000000',
    'color-muted': '#1f1f1f',
    'color-accent': '#0000ee',
    'color-accent-fg': '#ffffff',
    'color-border': '#000000',
    'color-surface': '#ffffff',
    'color-danger': '#b00000',
    'color-success': '#006400',
    'radius': '6px',
    'radius-sm': '4px',
    'shadow': 'none',
  },
};
