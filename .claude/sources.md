# External sources

Every external resource in the repo, with its exact revision. To update: pick a new commit,
review the diff in a PR and update this table.

| Resource                                     | Local path                                                                | Origin and revision                                                                                                                          | Date       | Licence                                         | Reason                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| Skill `angular-developer`                    | `.claude/skills/angular-developer/`                                       | https://github.com/angular/skills @ `38b2fc9bb22a0f9ce2d31743ec1fc860faf66cf2` (built from `angular/angular@250ca07`, v22.3.0 release notes) | 2026-11-18 | MIT (frontmatter; the repo has no LICENSE file) | Official Angular development guidance matching the installed 22.3.0. |
| Barlow Semi Condensed (500, 600, 700, latin) | `@fontsource/barlow-semi-condensed` 5.3.0 (npm, self-hosted by the build) | https://github.com/jpt/barlow via Fontsource                                                                                                 | 2026-11-18 | OFL-1.1                                         | Brand typeface (PRODUCT.md), served locally for offline play.        |
| Skill `angular-new-app`                      | `.claude/skills/angular-new-app/`                                         | Same commit as above                                                                                                                         | 2026-11-18 | MIT (frontmatter)                               | Official scaffold; useful when adding workspace apps (phase 6).      |

Copied unmodified.

| Torn-paper strips | `public/textures/tears/` | Supplied by the project owner (`desgarros-raven-teal`: open paper, pointed tear) | 2026-11-19 | Project artwork | Page backdrop. | Excluded from Prettier and ESLint so the pinned material is never rewritten.

## Toolchain versions (recorded at project creation)

| Tool                                                                           | Version                                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Node                                                                           | 24.22.3 (`.nvmrc`; engines `>=24.15.0 <25`)                              |
| npm                                                                            | 11.19.1                                                                  |
| Angular CLI / build                                                            | 22.2.7                                                                   |
| Angular core                                                                   | 22.3.0                                                                   |
| TypeScript                                                                     | 6.0.3                                                                    |
| Vitest / @vitest/coverage-v8                                                   | 5.1.1 / 5.1.1                                                            |
| fast-check                                                                     | 4.10.3                                                                   |
| @ngrx/signals                                                                  | 22.0.1                                                                   |
| Tailwind CSS / @tailwindcss/postcss / PostCSS                                  | 4.3.5 / 4.3.5 / 8.5.33                                                   |
| @playwright/test (Chromium headless shell 159)                                 | 1.65.1                                                                   |
| Playwright browsers / container (WebKit locally, every e2e job on CI)          | Firefox 1572, WebKit 2388 / `mcr.microsoft.com/playwright:v1.65.1-noble` |
| @angular/service-worker (2026-11-22)                                           | 22.3.0                                                                   |
| @types/node                                                                    | 24.19.2                                                                  |
| ESLint / angular-eslint / typescript-eslint                                    | 10.15.0 / 22.8.0 / 8.73.0                                                |
| Prettier                                                                       | 3.10.1                                                                   |
| husky / lint-staged (pre-commit, 2026-11-19)                                   | 9.1.7 / 17.6.1                                                           |
| @commitlint/cli / config-conventional                                          | 21.2.4 / 21.2.4                                                          |
| Task                                                                           | 3.54.0                                                                   |
| wrangler (deploy job, `task serve:cf` via npx; API devDependency)              | 4.158.0                                                                  |
| hono (API, 2026-11-22)                                                         | 4.13.17                                                                  |
| @cloudflare/vitest-plugin / @cloudflare/workers-types (API tests, edge Worker) | 1.6.0 / 5.20261107.1                                                     |

## GitHub Actions (pinned by SHA)

| Action                    | Version | SHA                                        |
| ------------------------- | ------- | ------------------------------------------ |
| actions/checkout          | v7.0.1  | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| actions/setup-node        | v7.1.0  | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| go-task/setup-task        | v2.2.0  | `a00fbb05ce67b35648be3c78cbc9fd85354c757e` |
| actions/download-artifact | v8.0.2  | `9000827ccba6bdab643e8b6fd33ac0654aef8333` |
| actions/upload-artifact   | v7.0.2  | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` |
