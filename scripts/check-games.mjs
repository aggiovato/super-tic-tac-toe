// The catalog (`src/engine/catalog/definitions.ts`) is the list of games. Each game must also have
// its engine folder (src/engine/<id>/), its app folder (src/app/features/games/<id>/), its path
// aliases (tsconfig.json) and its lint boundaries (eslint.config.js `GAMES`): this check, part of
// `npm run lint`, fails when they drift apart.
import { readdirSync, readFileSync } from 'node:fs';

const definitions = readFileSync('src/engine/catalog/definitions.ts', 'utf8');
const ids = [...definitions.matchAll(/^\s+id: '([a-z0-9-]+)',$/gm)].map((match) => match[1]);
const foldersIn = (dir, shared = []) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !shared.includes(entry.name))
    .map((entry) => entry.name);
const engines = foldersIn('src/engine', ['tictac', 'catalog']);
const apps = foldersIn('src/app/features/games');
const paths = readFileSync('tsconfig.json', 'utf8');
const lint = readFileSync('eslint.config.js', 'utf8');

const problems = [];
if (ids.length === 0) {
  problems.push('No game ids found in the catalog.');
}
for (const id of ids) {
  if (!engines.includes(id)) problems.push(`${id}: no folder src/engine/${id}/`);
  if (!apps.includes(id)) problems.push(`${id}: no folder src/app/features/games/${id}/`);
  if (!paths.includes(`./src/engine/${id}/core/index.ts`)) problems.push(`${id}: no core alias`);
  if (!new RegExp(`: '${id}'`).test(lint)) problems.push(`${id}: missing from GAMES in eslint`);
}
for (const folder of new Set([...engines, ...apps])) {
  if (!ids.includes(folder)) problems.push(`${folder}: a game folder not in the catalog`);
}
if (problems.length > 0) {
  console.error(`Games out of sync with the catalog:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`Games in sync with the catalog: ${ids.join(', ')}`);
