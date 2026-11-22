# Changelog

Notable changes to Super 3T, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/). `task release:*` turns the Unreleased heading into the
new version and date.

## [Unreleased]

### Added

- Online play by invitation, in all three games: Settings creates a private room and its link, the
  other player opens it on their own device, and both see every move as it happens. The game shows
  whether the connection and the rival are there, comes back by itself after a lost connection, and
  keeps the score of the room's games, with a rematch that swaps symbols. Rooms are deleted after
  a week without play. Online play needs Cloudflare: the backup host serves the app without it.

### Changed

- On phones, Settings and the game library open as departure tickets, like the how-to-play
  ticket.
- The history names the winner of a game between two people as they were called when it was played.
  Games saved by earlier versions are read as before.

### Fixed

- Moving between a game and its history no longer stretches or shrinks the page while it fades: the
  history no longer appears oversized for an instant. A game also comes back with its moves already
  on the board, the games library stays still between games, and the first visit to another game no
  longer waits for its code.
- Leaving an online room now closes its connection, so the rival sees you go; coming back to it
  with the back button or the link asks first ("Back to the room") instead of reconnecting
  silently, and "Leave the room" no longer stays behind the back button.
- The online panel shows both players' presence by shape (a filled dot, a ring, a dashed ring)
  instead of an orange dot that read as a warning, and no longer leaves empty rows on phones.
- Returning to Super 3T from its history no longer flashes TIP·TAP·TOE in the title.
- The history of Dots and Boxes shows 3×3 games in a single table, whether they were played on the
  default board or chose 3×3 in the settings.

## [0.4.0] - 2026-11-22

### Changed

- The app is served from Cloudflare instead of Netlify, with the same caching and security headers
  and the same offline support.

### Added

- The app works offline: after the first visit every game, level and page opens and plays with no
  connection, and the app can be installed.
- When a new version is ready the game offers it under the controls, and switching waits until the
  game is saved, so an update never loses a move.

### Fixed

- Dots and Boxes: the lines on the board's edge take a tap at once on phones, also when the finger
  lands just outside the dots.

## [0.3.1] - 2026-11-22

### Fixed

- The end-to-end tests wait for a game to be saved and for the opponent's reply instead of racing
  them, so a slower machine no longer fails the release pipeline.

## [0.3.0] - 2026-11-22

### Added

- Dots and Boxes, the third game, at `/dots`: draw lines between dots, close a box to keep it and
  play again, the most boxes win. 3×3 or 5×5 boxes, two people or the computer at three levels (the
  advanced one solves the endgame exactly), each player's lines and boxes in their own ink, its own
  how-to-play and history, saved like the other games.
- Classic tic tac toe at `/classic`, for two people or against the computer at three levels (the
  advanced one never loses). The app opens on the last game played; Super 3T now lives at
  `/super-3t` (old links redirect).
- A library of games to switch between them: beside the board on wide screens and behind a Games
  button on phones and tablets, with Super 3T as the main game on top, a drawn preview of each game
  and the one being played marked. Settings keep only the game's own options and the app's.
- The computer opponent is named after its level, a train from slowest to fastest (Cercanías,
  Regional, Expreso), with level bars beside its name in the score and the level choice, so the
  level is always in sight.
- Games are saved on this device after every move and resume where they were after a reload or a
  return, also on the opponent's turn. A finished game counts once, however often it is reopened.
  A line under the actions says "Saved", or what went wrong with a way to try again.
- History for each game: results against the computer by level, games for two people and the
  latest finished games, from a History button beside Settings.
- Tactical challenges: three prepared positions (easy, medium, hard) where you play X and must
  send the opponent to a board where any reply hands you the game, then close it. A wrong move
  names the reply that would save the opponent; Try again restarts the position. Each challenge is
  marked solved once. Reach them from Settings (Game) or from the how-to-play ticket.
- How to play: on the first visit a departure ticket explains the game in four rules (winning a
  small board, how your cell picks your opponent's board, where you may play, winning the game),
  each beside a small board drawing, over the real game. Play, Skip or Escape closes it for good;
  Settings reopens it. On short screens only the rules scroll.
- Settings in two tabs, Game and App. The title and tabs stay put while the section scrolls, and
  a fade at its foot shows when there is more below. Short choices (mode, level, language, motion,
  design) sit side by side on one segmented track.
- On phones the settings sheet has a grip and closes when dragged down; a short drag springs back.
- The settings sheet slides in and out: from the right on wide screens, from the bottom on phones.
- Thin scrollbars in the app's colours.

### Changed

- Leaving a game for the challenges or another game no longer asks first: nothing is lost.
- Settings no longer switch games; the game library does.
- Super 3T's board stops growing at 42rem on large screens and sits centred in its space.
- Moving between pages (a game, its history, a challenge) fades and rises instead of cutting.
- On small phones the header buttons show only their icons, so the title's flaps have room.
- Undo against the computer always goes back to your turn, even after it played several times in a
  row.

### Fixed

- Tapping or clicking a player name field now lets you type at once.

## [0.2.0] - 2026-11-20

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

[Unreleased]: https://github.com/aggiovato/super-tic-tac-toe/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/aggiovato/super-tic-tac-toe/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/aggiovato/super-tic-tac-toe/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/aggiovato/super-tic-tac-toe/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/aggiovato/super-tic-tac-toe/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/aggiovato/super-tic-tac-toe/releases/tag/v0.1.0
