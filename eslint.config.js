// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier');

// Functional blocks of the app. Each one has an index.ts and a tsconfig `paths` alias.
const BLOCKS = 'core|ai|session|state|ui|history|storage|i18n|settings|kit';

const BLOCK_BOUNDARIES = [
  {
    regex: `^\\.{1,2}/(?:.*/)?(?:${BLOCKS})(?:/|$)`,
    message: 'Import another block through its alias (e.g. "@core"), not a relative path.',
  },
  {
    regex: `^@(?:${BLOCKS})/(?!testing$)`,
    message: 'Import the block alias (e.g. "@core"), not its internal files.',
  },
];

const PLAIN_TYPESCRIPT = {
  regex: '^(?:@angular/|@ngrx/|rxjs(?:/|$))',
  message: 'core and ai are plain TypeScript.',
};

const NO_APP_LAYERS = {
  regex: '^@(?:session|state|ui|history|storage|i18n|settings|kit)(?:/|$)',
  message: 'core and ai must not import app layers.',
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
    // The opponent does not depend on Angular, NgRx, RxJS or app layers.
    files: ['src/app/game/ai/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { patterns: [PLAIN_TYPESCRIPT, NO_APP_LAYERS] },
      ],
    },
  },
  {
    // The engine depends on nothing else: no framework, no app layer, no opponent.
    files: ['src/app/game/core/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            PLAIN_TYPESCRIPT,
            NO_APP_LAYERS,
            { regex: '^@ai(?:/|$)', message: 'core must not import ai.' },
          ],
        },
      ],
    },
  },
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
