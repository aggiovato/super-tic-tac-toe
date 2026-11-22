import { defineConfig, devices } from '@playwright/test';

const PORT = 4400;
const API_PORT = 8787;

// Optional, for watching the flows (`task e2e:ui`, `task e2e:headed`); CI sets neither.
// SLOW_MO: milliseconds to wait before each browser action. E2E_MOTION=full: play the animations.
const SLOW_MO = Number(process.env['SLOW_MO'] ?? 0);
const FULL_MOTION = process.env['E2E_MOTION'] === 'full';
// WebKit only where its system libraries are: CI, or Playwright's container (PW_WEBKIT=1).
const WEBKIT = !!process.env['CI'] || process.env['PW_WEBKIT'] === '1';

// Runs against the production build (`task e2e` builds first) served with an SPA fallback, or,
// with E2E_BASE_URL, against a deployed version (CD's smoke test on pre): then no local server.
const BASE_URL = process.env['E2E_BASE_URL'];
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL ?? `http://localhost:${PORT}`,
    locale: 'en-US',
    // Flows run without motion so every view settles at once; a few specs cover the animated path.
    reducedMotion: FULL_MOTION ? 'no-preference' : 'reduce',
    launchOptions: { slowMo: SLOW_MO },
    // The production build registers a service worker; flows run without it, as on a first visit.
    // The offline specs allow it (e2e/offline.spec.ts).
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    // The other engines, before the PWA ships (phase 5): desktop layouts only.
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // WebKit needs Ubuntu's libraries: it runs on CI and, locally, in Playwright's container
    // (`task e2e:webkit`). It runs the animated flows a good deal slower under parallel load.
    ...(WEBKIT ? [{ name: 'webkit', use: { ...devices['Desktop Safari'] }, timeout: 60_000 }] : []),
  ],
  webServer: BASE_URL
    ? []
    : [
        // The API Worker (wrangler dev), for the online flows; the build reaches it under /api.
        {
          // Its port is pinned in packages/api (8787), where `task dev` also proxies /api.
          command: 'npm run dev --workspace @super-3t/api',
          url: `http://localhost:${API_PORT}/api/health`,
          reuseExistingServer: !process.env['CI'],
          env: { WRANGLER_SEND_METRICS: 'false' },
          timeout: 60_000,
        },
        {
          command: `node scripts/serve-dist.mjs ${PORT}`,
          url: `http://localhost:${PORT}`,
          reuseExistingServer: !process.env['CI'],
          env: { API_ORIGIN: `http://localhost:${API_PORT}` },
        },
      ],
});
