# External sources

Every external resource in the repo, with its exact revision. To update: pick a new commit,
review the diff in a PR and update this table.

| Resource                  | Local path                          | Origin and revision                                                                                                                          | Date       | Licence                                         | Reason                                                               |
| ------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| Skill `angular-developer` | `.claude/skills/angular-developer/` | https://github.com/angular/skills @ `38b2fc9bb22a0f9ce2d31743ec1fc860faf66cf2` (built from `angular/angular@250ca07`, v22.3.0 release notes) | 2026-11-18 | MIT (frontmatter; the repo has no LICENSE file) | Official Angular development guidance matching the installed 22.3.0. |
| Skill `angular-new-app`   | `.claude/skills/angular-new-app/`   | Same commit as above                                                                                                                         | 2026-11-18 | MIT (frontmatter)                               | Official scaffold; useful when adding workspace apps (phase 6).      |

Copied unmodified. Excluded from Prettier and ESLint so the pinned material is never rewritten.

## Toolchain versions (recorded at project creation)

| Tool                                        | Version                                     |
| ------------------------------------------- | ------------------------------------------- |
| Node                                        | 24.22.3 (`.nvmrc`; engines `>=24.15.0 <25`) |
| npm                                         | 11.19.1                                     |
| Angular CLI / build                         | 22.2.7                                      |
| Angular core                                | 22.3.0                                      |
| TypeScript                                  | 6.0.3                                       |
| Vitest / @vitest/coverage-v8                | 5.1.1 / 5.1.1                               |
| fast-check                                  | 4.10.3                                      |
| ESLint / angular-eslint / typescript-eslint | 10.15.0 / 22.8.0 / 8.73.0                   |
| Prettier                                    | 3.10.1                                      |
| Task                                        | 3.54.0                                      |

## GitHub Actions (pinned by SHA)

| Action             | Version | SHA                                        |
| ------------------ | ------- | ------------------------------------------ |
| actions/checkout   | v7.0.1  | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| actions/setup-node | v7.1.0  | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| go-task/setup-task | v2.2.0  | `a00fbb05ce67b35648be3c78cbc9fd85354c757e` |
