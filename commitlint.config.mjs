/**
 * Commit messages: Conventional Commits, header only (`type(scope): summary`), as CLAUDE.md
 * requires. Checked by `.husky/commit-msg`. Merge and revert commits from git are ignored.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // The project's types, nothing else (no `style`, `revert`).
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'test', 'docs', 'chore', 'ci', 'build', 'perf'],
    ],
    // Lowercase summary with no trailing full stop.
    'subject-case': [2, 'always', 'lower-case'],
    'subject-full-stop': [2, 'never', '.'],
    'scope-case': [2, 'always', 'lower-case'],
    // Header only: no body and no footer, so no `Co-Authored-By` or other trailers either.
    'body-empty': [2, 'always'],
    'footer-empty': [2, 'always'],
    'trailer-exists': [0],
  },
};
