// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier');

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
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  {
    // Every functional block exposes its public API through its index.ts. Other blocks import
    // the folder (`../core`), never a file inside it (`../core/engine`).
    files: ['src/app/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/core/*',
                '**/ai/*',
                '**/session/*',
                '**/state/*',
                '**/ui/*',
                '**/history/*',
                '**/storage/*',
                '!**/core/testing',
              ],
              message: 'Import the block through its index.ts (e.g. "../core"), not its files.',
            },
          ],
        },
      ],
    },
  },
  {
    // The engine and the opponent do not depend on Angular, NgRx, RxJS or app adapters.
    files: ['src/app/game/core/**/*.ts', 'src/app/game/ai/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@angular/*', '@ngrx/*', 'rxjs', 'rxjs/*'],
              message: 'core and ai are plain TypeScript.',
            },
            {
              group: ['**/session/**', '**/state/**', '**/ui/**', '**/storage/**', '**/history/**'],
              message: 'core and ai must not import app layers.',
            },
          ],
        },
      ],
    },
  },
  {
    // The engine does not depend on the opponent either.
    files: ['src/app/game/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/ai/**', '../ai', '../ai/*'], message: 'core must not import ai.' },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
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
