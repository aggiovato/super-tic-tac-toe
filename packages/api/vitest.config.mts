import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

// The API's tests run inside the Workers runtime (workerd, through Miniflare), with the Room
// Durable Object from wrangler.jsonc and storage isolated per test.
export default defineConfig({
  // The game-core aliases (@catalog, @super3t/core…) come from the root tsconfig.json.
  resolve: { tsconfigPaths: true },
  plugins: [cloudflareTest({ wrangler: { configPath: './wrangler.jsonc' } })],
  test: { include: ['test/**/*.spec.ts'] },
});
