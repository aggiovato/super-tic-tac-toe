// The architecture as data, and a check that the code follows it. Part of `npm run lint`.
//
// - DEPENDS: which blocks each block may import, by alias (the "May import" table of CLAUDE.md).
//   Production code only: specs and `testing/` folders may import more, and ESLint still keeps
//   `src/engine/` free of Angular and app layers.
// - No cycles between blocks.
// - Structure: every alias in tsconfig.json once, pointing to an existing index.ts; every block's
//   index.ts has an alias; every shared block is in `SHARED` and every game in `GAMES` of
//   eslint.config.js; every game of the catalog has its engine and app folders, and no folder is
//   left out of the catalog.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** A game's aliases (`@super3t/core`…) from its alias prefix. */
const layer = (game, name) => `@${game}/${name}`;

/** The family's games by alias prefix and folder; `check` below verifies it against the catalog. */
const GAMES = { super3t: 'super-3t', classic: 'classic', dots: 'dots' };
const GAME_CORES = Object.keys(GAMES).map((game) => layer(game, 'core'));

/** What each layer of a game may import, the same for every game. */
const gameLayers = (game) => ({
  [layer(game, 'core')]: ['@tictac'],
  [layer(game, 'ai')]: ['@tictac', layer(game, 'core')],
  [layer(game, 'challenge')]: ['@tictac', layer(game, 'core'), layer(game, 'ai')],
  [layer(game, 'session')]: [
    '@tictac',
    '@catalog',
    '@match',
    layer(game, 'core'),
    layer(game, 'ai'),
    layer(game, 'challenge'),
  ],
  [layer(game, 'state')]: [
    '@tictac',
    '@catalog',
    '@match',
    layer(game, 'core'),
    layer(game, 'session'),
  ],
  [layer(game, 'ui')]: [
    '@tictac',
    '@catalog',
    '@match',
    '@preferences',
    '@i18n',
    '@ui',
    '@layout',
    '@library',
    '@history',
    layer(game, 'core'),
    layer(game, 'challenge'),
    layer(game, 'session'),
    layer(game, 'state'),
  ],
  [layer(game, 'ui/preview')]: ['@tictac', '@ui'],
});

export const DEPENDS = {
  // src/engine: pure TypeScript.
  '@tictac': [],
  '@catalog': ['@tictac', ...GAME_CORES],
  ...Object.assign({}, ...Object.keys(GAMES).map(gameLayers)),
  // src/app/core: app-wide infrastructure.
  '@preferences': ['@catalog'],
  '@storage': ['@catalog', '@preferences'],
  // Every game's copy lives here for now, so it reads each engine's types (rejection reasons).
  '@i18n': ['@catalog', '@preferences', ...GAME_CORES],
  '@match': ['@tictac', '@catalog', '@preferences', '@storage'],
  '@pwa': ['@match', '@i18n', '@ui'],
  // src/app: layout, shared UI and features.
  '@ui': ['@tictac', '@preferences'],
  '@layout': ['@tictac', '@catalog', '@match', '@preferences', '@i18n', '@ui', '@library', '@pwa'],
  '@library': ['@catalog', '@match', '@preferences', '@i18n', '@ui'],
  '@history': ['@catalog', '@storage', '@preferences', '@i18n', '@ui', '@layout', '@pwa'],
};

/** Imports that are not blocks of the app. */
const EXTERNAL = /^@(?:angular|ngrx|fontsource|playwright|vitest)\//;

function read(path) {
  return readFileSync(path, 'utf8');
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : entry.name.endsWith('.ts') ? [path] : [];
  });
}

/** tsconfig.json `paths` as [alias, folder] pairs, keeping duplicates so they can be reported. */
function aliases() {
  const raw = read('tsconfig.json');
  return [...raw.matchAll(/^\s*"(@[^"]+)": \["\.\/(.+)\/index\.ts"\]/gm)].map(([, alias, dir]) => [
    alias,
    dir,
  ]);
}

/** Which block a file belongs to: the alias whose folder holds it, deepest first. */
function blockOf(pairs) {
  const byDepth = [...pairs].sort(([, a], [, b]) => b.length - a.length);
  return (file) => byDepth.find(([, dir]) => file.startsWith(`${dir}/`))?.[0] ?? null;
}

/** The folders that are blocks, by where they sit in the two trees. */
function blockFolders() {
  const children = (dir) =>
    existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => join(dir, entry.name))
      : [];
  const games = Object.values(GAMES);
  return [
    ...children('src/engine').filter((dir) => !games.some((game) => dir.endsWith(`/${game}`))),
    ...games.flatMap((game) => children(`src/engine/${game}`)),
    ...children('src/app/core'),
    ...children('src/app/features').filter((dir) => !dir.endsWith('/games')),
    ...games.flatMap((game) => children(`src/app/features/games/${game}`)),
    'src/app/layout',
    'src/app/ui',
  ];
}

const isTestCode = (file) => file.endsWith('.spec.ts') || file.includes('/testing/');

/** Every block-to-block import of production code, as `from → to`. */
function imports(pairs) {
  const ownerOf = blockOf(pairs);
  const edges = [];
  for (const file of walk('src')) {
    const from = ownerOf(file);
    if (!from || isTestCode(file)) {
      continue;
    }
    for (const [, to] of read(file).matchAll(
      /(?:from|import\()\s*'(@[a-z0-9]+(?:\/[a-z0-9-]+)*)'/g,
    )) {
      if (!EXTERNAL.test(to) && to !== from && !to.endsWith('/testing')) {
        edges.push({ from, to, file });
      }
    }
  }
  return edges;
}

/** A cycle between blocks, as a path, or null. */
function findCycle(edges) {
  const next = new Map();
  for (const { from, to } of edges) {
    next.set(from, new Set([...(next.get(from) ?? []), to]));
  }
  const state = new Map();
  const stack = [];
  const visit = (node) => {
    state.set(node, 'open');
    stack.push(node);
    for (const target of next.get(node) ?? []) {
      if (state.get(target) === 'open') {
        return [...stack.slice(stack.indexOf(target)), target];
      }
      if (!state.has(target)) {
        const found = visit(target);
        if (found) return found;
      }
    }
    stack.pop();
    state.set(node, 'done');
    return null;
  };
  for (const node of next.keys()) {
    if (!state.has(node)) {
      const found = visit(node);
      if (found) return found;
    }
  }
  return null;
}

/** Every problem with the structure and the dependencies; empty when the code follows the map. */
export function check() {
  const problems = [];
  const pairs = aliases();

  // Aliases: each once, each to an index.ts that exists, each with its dependencies declared.
  const seen = new Set();
  for (const [alias, dir] of pairs) {
    if (seen.has(alias)) problems.push(`${alias}: declared twice in tsconfig.json`);
    seen.add(alias);
    if (!existsSync(`${dir}/index.ts`)) problems.push(`${alias}: ${dir}/index.ts does not exist`);
    if (!alias.endsWith('/testing') && !(alias in DEPENDS)) {
      problems.push(`${alias}: no entry in DEPENDS (scripts/check-architecture.mjs)`);
    }
  }
  // A game layer the template lists may not exist in every game (only Super 3T has challenges).
  const gameLayerAliases = new Set(
    Object.keys(GAMES).flatMap((game) => Object.keys(gameLayers(game))),
  );
  for (const alias of Object.keys(DEPENDS)) {
    if (!seen.has(alias) && !gameLayerAliases.has(alias)) {
      problems.push(`${alias}: in DEPENDS but not in tsconfig.json`);
    }
  }
  // Every folder at a block's level is a block: an index.ts and an alias. Folders inside a block
  // (models/, testing/, messages/) group its files and need neither.
  const indexed = new Set(pairs.map(([, dir]) => dir));
  for (const dir of blockFolders()) {
    if (!existsSync(`${dir}/index.ts`)) problems.push(`${dir}: a block without an index.ts`);
    else if (!indexed.has(dir)) problems.push(`${dir}: a block without an alias`);
  }

  // ESLint knows every shared block and every game.
  const lint = read('eslint.config.js');
  const shared = /const SHARED = '([^']+)'/.exec(lint)?.[1].split('|') ?? [];
  for (const alias of Object.keys(DEPENDS).filter((name) => !name.includes('/'))) {
    if (!shared.includes(alias.slice(1))) problems.push(`${alias}: missing from SHARED in eslint`);
  }

  // The catalog's games: their folders, their core alias and their place in ESLint's GAMES.
  const ids = [
    ...read('src/engine/catalog/definitions.ts').matchAll(/^\s+id: '([a-z0-9-]+)',$/gm),
  ].map(([, id]) => id);
  const folders = (dir, skip = []) =>
    readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !skip.includes(entry.name))
      .map((entry) => entry.name);
  const engines = folders('src/engine', ['tictac', 'catalog']);
  const apps = folders('src/app/features/games');
  if (ids.length === 0) problems.push('No game ids found in the catalog.');
  for (const id of ids) {
    if (!engines.includes(id)) problems.push(`${id}: no folder src/engine/${id}/`);
    if (!apps.includes(id)) problems.push(`${id}: no folder src/app/features/games/${id}/`);
    if (!Object.values(GAMES).includes(id))
      problems.push(`${id}: missing from GAMES in this script`);
    if (!new RegExp(`: '${id}'`).test(lint)) problems.push(`${id}: missing from GAMES in eslint`);
  }
  for (const folder of new Set([...engines, ...apps])) {
    if (!ids.includes(folder)) problems.push(`${folder}: a game folder not in the catalog`);
  }

  // Dependencies: only what DEPENDS allows, and no cycle.
  const edges = imports(pairs);
  for (const { from, to, file } of edges) {
    if (from in DEPENDS && !DEPENDS[from].includes(to)) {
      problems.push(`${file}: ${from} may not import ${to}`);
    }
  }
  const cycle = findCycle(edges);
  if (cycle) problems.push(`Blocks import each other in a cycle: ${cycle.join(' → ')}`);
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const problems = check();
  if (problems.length > 0) {
    console.error(`Architecture check failed:\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`Architecture in order: ${Object.keys(DEPENDS).length} blocks, no cycles.`);
}
