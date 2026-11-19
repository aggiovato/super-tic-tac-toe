import { defineConfig, devices } from '@playwright/test';

const PORT = 4400;

// Optional, for watching the flows (`task e2e:ui`, `task e2e:headed`); CI sets neither.
// SLOW_MO: milliseconds to wait before each browser action. E2E_MOTION=full: play the animations.
const SLOW_MO = Number(process.env['SLOW_MO'] ?? 0);
const FULL_MOTION = process.env['E2E_MOTION'] === 'full';

// Runs against the production build (`task e2e` builds first) served with an SPA fallback.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'en-US',
    // Flows run without motion so every view settles at once; a few specs cover the animated path.
    reducedMotion: FULL_MOTION ? 'no-preference' : 'reduce',
    launchOptions: { slowMo: SLOW_MO },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `node scripts/serve-dist.mjs ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env['CI'],
  },
});
