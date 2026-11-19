/**
 * Pre-commit checks on staged files only (run by `.husky/pre-commit`). The whole project is still
 * linted, tested and built by `task check` and CI. Fixes are applied and staged again.
 */
export default {
  // ESLint first (size limits, boundaries, templates, accessibility), then Prettier.
  '*.{ts,html,js}': ['eslint --max-warnings=0 --no-warn-ignored --fix', 'prettier --write'],
  '*.{css,json,md,mjs,mts,yml,yaml}': 'prettier --write --ignore-unknown',
  // App code stays on semantic tokens; the script ignores files outside its scope.
  'src/**/*.{ts,html,css}': 'node scripts/check-tokens.mjs',
};
