# Changelog

Notable changes to Super 3T, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/). `task release:*` turns the Unreleased heading into the
new version and date.

## [Unreleased]

### Added

- Play against the computer: choose the game mode and the opponent's level in the settings; both
  are remembered between visits. You play X in the first game and symbols swap on every rematch.
  - Beginner: wins a board or the game when one move does it, otherwise plays a weighted random move.
  - Intermediate: never hands you the game while it has a safe move, and weighs board wins, blocks
    and the board its move sends you to.
  - Advanced: looks several moves ahead (alpha-beta search with iterative deepening) within 600 ms
    and plays a settled endgame at once.
- The opponent thinks in a Web Worker, so the board stays responsive. It waits at least 450 ms so
  your own move lands first. While it thinks the board takes no moves. Undo takes back its reply
  and your move together.
- The Super 3T mark: a T on a split-flap tile with a smaller tilted 3. The title in the header reads
  "Super" followed by the mark.
- Favicons (SVG, and ICO at 16, 32 and 48 px), app icons for iOS and Android (including maskable)
  and a web app manifest, so the game can be installed.
- A social preview image with Open Graph and Twitter metadata for shared links.
- Winning a board unfolds two flap tiles after the mark's T, spelling TIP, TAP and TOE.
- A board that closes flickers and shakes briefly. The three boards that win the game flash three
  times. With reduced motion neither plays.

### Changed

- The app is called Super 3T.
- Every board's 3×3 grid is square, on the whole board and on an open board.
- On narrow screens, board movements no longer overlap: the open board settles into its slot,
  then the forced board opens from its own. They are slower and smoother.
- A closed board draws its large mark and strike line once, instead of every time the view
  switches.
- Changing the game mode or level while a game or a score is under way asks for a second press.

### Fixed

- On short phones the board no longer runs under the score; the page scrolls instead.
- On scaled screens, a stray line no longer shows at the edge of the right-hand boards.
- The game's winning line passes beneath all three large marks again.

### Development

- The page, board and settings are split into smaller components.
- The opponent lives in a pure TypeScript `@ai` block, tested in Node. It has tactical positions,
  generated games, deterministic work budgets and seeded batches between levels. Coverage of 95 %
  or more now applies to the engine and the opponent alike.
- Commits run a pre-commit hook (ESLint, Prettier and the token check on staged files) and a
  commit-msg hook (Conventional Commits, header only).
- ESLint size limits: 500 lines per file, 80 per function, complexity 15.
- `task e2e:ui` and `task e2e:headed` play the e2e flows where you can watch them, with
  `SLOW_MO` and `E2E_MOTION=full`. `task icons` redraws every icon from one script.

## [0.1.0] - 2026-11-19

First production release: Ultimate Tic Tac Toe for two people on one device.

### Added

- Rules engine (rules version 1): legality, local and global resolution, forced and free targets,
  and replay of a game from its moves.
- Game screen told as a split-flap departure board. The flap row announces who moves and the
  board they must play. Boards are numbered 1 to 9, closing marks and winning lines are drawn
  on, and the score counts a series.
- Narrow screens open one board at a time. You can play by keyboard, undo, have a rematch, and set
  player names, language (Spanish and English), motion, hints and a high-contrast design.
- Continuous integration with deploys to Netlify: a preview for every pull request and production
  for every version tag.

[Unreleased]: https://github.com/aggiovato/super-tic-tac-toe/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/aggiovato/super-tic-tac-toe/releases/tag/v0.1.0
