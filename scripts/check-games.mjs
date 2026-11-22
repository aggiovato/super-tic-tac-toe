// The catalog (`src/app/games/catalog/definitions.ts`) is the list of games. Each game must also have
// its folder, its path aliases (tsconfig.json) and its lint boundaries (eslint.config.js `GAMES`):
// this check, part of `npm run lint`, fails when they drift apart.
import { readdirSync, readFileSync } from 'node:fs';

const definitions = readFileSync('src/app/games/catalog/definitions.ts', 'utf8');
const ids = [...definitions.matchAll(/^\s+id: '([a-z0-9-]+)',$/gm)].map((match) => match[1]);
const folders = readdirSync('src/app/games', { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !['tictac', 'catalog'].includes(entry.name))
  .map((entry) => entry.name);
const paths = readFileSync('tsconfig.json', 'utf8');
const lint = readFileSync('eslint.config.js', 'utf8');

const problems = [];
if (ids.length === 0) {
  problems.push('No game ids found in the catalog.');
}
for (const id of ids) {
  if (!folders.includes(id)) problems.push(`${id}: no folder src/app/games/${id}/`);
  if (!paths.includes(`./src/app/games/${id}/core/index.ts`)) problems.push(`${id}: no core alias`);
  if (!new RegExp(`: '${id}'`).test(lint)) problems.push(`${id}: missing from GAMES in eslint`);
}
for (const folder of folders) {
  if (!ids.includes(folder)) problems.push(`src/app/games/${folder}/ is not in the catalog`);
}
if (problems.length > 0) {
  console.error(`Games out of sync with the catalog:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`Games in sync with the catalog: ${ids.join(', ')}`);
