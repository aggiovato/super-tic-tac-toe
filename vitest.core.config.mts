import { defineConfig } from 'vitest/config';

// @tictac and every game's engine, opponent and challenges run in plain Node, without TestBed. App specs run through `ng test`.
export default defineConfig({
  // Block aliases (@tictac, @super3t/core…) come from tsconfig.json `paths`, the single source of truth.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['src/engine/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      // Engines, opponents and challenges are held to the same bar.
      include: ['src/engine/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/testing/**'],
      reporter: ['text-summary', 'html'],
      thresholds: { branches: 95, lines: 95, functions: 95, statements: 95 },
    },
  },
});
