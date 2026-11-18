import { defineConfig } from 'vitest/config';

// Engine and opponent run in plain Node, without TestBed. App specs run through `ng test`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/app/game/core/**/*.spec.ts', 'src/app/game/ai/**/*.spec.ts'],
    // Phase 0: no engine yet. Remove once the first phase 1 specs land.
    passWithNoTests: true,
    typecheck: { tsconfig: './tsconfig.core.json' },
  },
});
