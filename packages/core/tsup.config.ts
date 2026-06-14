// tsup configuration.
// Authored as a plain object (rather than importing `defineConfig` from 'tsup') so the config
// loads even when tsup is run via npx from outside the package's node_modules.
export default {
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'] as const,
  globalName: 'softFeedback',
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  treeshake: true,
};
