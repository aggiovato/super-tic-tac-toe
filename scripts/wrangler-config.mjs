// Writes the app's wrangler config bound to another API Worker, for a version that must not talk to
// production: a PR preview (super-3t-api-pr-<N>) or pre (super-3t-api-pre). Cloudflare keeps the
// bindings in each version, so the version is uploaded with this config instead of wrangler.jsonc.
// Usage: node scripts/wrangler-config.mjs <api-worker> <out.json> (out next to wrangler.jsonc, so
// its relative paths still hold).
import { readFileSync, writeFileSync } from 'node:fs';

const [service, out] = process.argv.slice(2);
if (!service || !/^super-3t-api(-[a-z0-9-]+)?$/.test(service) || !out) {
  throw new Error('Usage: node scripts/wrangler-config.mjs <super-3t-api…> <out.json>');
}
// wrangler.jsonc keeps its comments on their own lines, so dropping those leaves plain JSON.
const source = readFileSync('wrangler.jsonc', 'utf8')
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('//'))
  .join('\n');
const config = JSON.parse(source);
config.services = config.services.map((binding) =>
  binding.binding === 'API' ? { ...binding, service } : binding,
);
writeFileSync(out, `${JSON.stringify(config, null, 2)}\n`);
console.log(`${out}: API → ${service}`);
