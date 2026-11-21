// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier');

/*
 * Functional blocks. Each has an index.ts and a tsconfig `paths` alias. Shared blocks live in
 * src/app/<block>/ (alias @<block>); each game's layers in src/app/games/<folder>/<layer>/ (alias
 * @<game>/<layer>). A new game adds its alias and folder to GAMES.
 */
const GAMES = { super3t: 'super-3t', classic: 'classic' };
const GAME_ALIASES = Object.keys(GAMES).join('|');
const LAYERS = 'core|ai|challenge|session|state|ui';
const SHARED = 'tictac|match|shell|history|storage|i18n|settings|kit';
const BLOCK_ALIASES = `(?:${GAME_ALIASES})/(?:${LAYERS})|${SHARED}`;

const BLOCK_BOUNDARIES = [
  {
    regex: `^\\.{1,2}/(?:.*/)?(?:${LAYERS}|${SHARED}|games)(?:/|$)`,
    message: 'Import another block through its alias (e.g. "@super3t/core"), not a relative path.',
  },
  {
    regex: `^@(?:${BLOCK_ALIASES})/(?!testing$)`,
    message: 'Import the block alias (e.g. "@super3t/core"), not its internal files.',
  },
];

/** Every game's files may not import another game: what they share goes to `@tictac` or `@kit`. */
const OTHER_GAMES = Object.entries(GAMES)
  .map(([alias, folder]) => ({
    others: Object.keys(GAMES).filter((other) => other !== alias),
    folder,
  }))
  .filter(({ others }) => others.length > 0)
  .map(({ others, folder }) => ({
    files: [`src/app/games/${folder}/**/*.ts`],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `ImportDeclaration[source.value=/^@(?:${others.join('|')})\\//]`,
          message: 'A game never imports another game.',
        },
      ],
    },
  }));

const PLAIN_TYPESCRIPT = {
  regex: '^(?:@angular/|@ngrx/|rxjs(?:/|$))',
  message: '@tictac and the core, ai and challenge of every game are plain TypeScript.',
};

const NO_APP_LAYERS = {
  regex: `^@(?:(?:${GAME_ALIASES})/(?:challenge|session|state|ui)|match|shell|history|storage|i18n|settings|kit)(?:/|$)`,
  message: 'core, ai and challenge must not import app layers.',
};

// Lines that count are code: blank lines and comments are skipped.
const EFFECTIVE = { skipBlankLines: true, skipComments: true };

// Size and shape limits. A file past them is split into components or helpers, not raised.
const SIZE_LIMITS = {
  'max-lines': ['error', { max: 500, ...EFFECTIVE }],
  'max-lines-per-function': ['error', { max: 80, ...EFFECTIVE }],
  complexity: ['error', 15],
  'max-depth': ['error', 4],
  'max-params': ['error', 4],
  'max-nested-callbacks': ['error', 3],
};

module.exports = defineConfig([
  {
    ignores: [
      'dist/',
      'coverage/',
      '.angular/',
      'node_modules/',
      'test-results/',
      'playwright-report/',
      'blob-report/',
      'docs/',
      '.claude/skills/',
      '.impeccable/',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: __dirname },
    },
    processor: angular.processInlineTemplates,
    rules: {
      ...SIZE_LIMITS,
      eqeqeq: ['error', 'always'],
      // Only the bootstrap reports a fatal error to the console.
      'no-console': ['error', { allow: ['error'] }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      // Components may also enhance a native element through an attribute selector
      // (`button[app-button]`), like Angular Material's `mat-button`.
      '@angular-eslint/component-selector': [
        'error',
        { type: ['element', 'attribute'], prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  {
    // Blocks talk to each other only through their alias (`@core`), which points to the block's
    // index.ts. No relative path into another block, no alias into a block's files.
    files: ['src/app/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: BLOCK_BOUNDARIES }] },
  },
  {
    // Opponents and challenges do not depend on Angular, NgRx, RxJS or app layers.
    files: ['src/app/games/*/ai/**/*.ts', 'src/app/games/*/challenge/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { patterns: [PLAIN_TYPESCRIPT, NO_APP_LAYERS] },
      ],
    },
  },
  {
    // An engine depends on nothing else: no framework, no app layer, no opponent.
    files: ['src/app/games/*/core/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            PLAIN_TYPESCRIPT,
            NO_APP_LAYERS,
            { regex: `^@(?:${GAME_ALIASES})/ai(?:/|$)`, message: 'core must not import ai.' },
          ],
        },
      ],
    },
  },
  {
    // The family's shared base: plain TypeScript that no game's layer may leak into.
    files: ['src/app/games/tictac/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            PLAIN_TYPESCRIPT,
            NO_APP_LAYERS,
            { regex: `^@(?:${GAME_ALIASES})/`, message: '@tictac never imports a game.' },
          ],
        },
      ],
    },
  },
  ...OTHER_GAMES,
  {
    // Specs read as one long `describe` of scenarios: longer files and callbacks, nested suites.
    files: ['**/*.spec.ts', 'e2e/**/*.ts'],
    rules: {
      'max-lines': ['error', { max: 1000, ...EFFECTIVE }],
      'max-lines-per-function': 'off',
      'max-nested-callbacks': ['error', 5],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: { 'max-lines': SIZE_LIMITS['max-lines'] },
  },
  {
    files: ['**/*.js'],
    extends: [eslint.configs.recommended],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { require: 'readonly', module: 'writable', __dirname: 'readonly' },
    },
  },
  prettier,
]);
