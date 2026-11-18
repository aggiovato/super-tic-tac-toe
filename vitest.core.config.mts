import { defineConfig } from 'vitest/config';

// Engine and opponent run in plain Node, without TestBed. App specs run through `ng test`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/app/game/core/**/*.spec.ts', 'src/app/game/ai/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/app/game/core/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/testing/**'],
      reporter: ['text-summary', 'html'],
      thresholds: { branches: 95, lines: 95, functions: 95, statements: 95 },
    },
  },
});
