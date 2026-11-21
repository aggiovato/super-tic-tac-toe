import { defineConfig } from 'vitest/config';

// @tictac and every game's engine, opponent and challenges run in plain Node, without TestBed. App specs run through `ng test`.
export default defineConfig({
  // Block aliases (@tictac, @super3t/core…) come from tsconfig.json `paths`, the single source of truth.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: [
      'src/app/games/tictac/**/*.spec.ts',
      'src/app/games/*/core/**/*.spec.ts',
      'src/app/games/*/ai/**/*.spec.ts',
      'src/app/games/*/challenge/**/*.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      // Engines, opponents and challenges are held to the same bar.
      include: [
        'src/app/games/tictac/**/*.ts',
        'src/app/games/*/core/**/*.ts',
        'src/app/games/*/ai/**/*.ts',
        'src/app/games/*/challenge/**/*.ts',
      ],
      exclude: ['**/*.spec.ts', '**/testing/**'],
      reporter: ['text-summary', 'html'],
      thresholds: { branches: 95, lines: 95, functions: 95, statements: 95 },
    },
  },
});
