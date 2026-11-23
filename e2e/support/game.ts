// Helpers shared by the game flows (`e2e/*.spec.ts`): cells, moves, settings and the library.
import { expect, type Page } from '@playwright/test';

/** Cells by engine coordinates (0–8); players see them numbered 1–9. */
export const cell = (page: Page, board: number, cell: number) =>
  page.getByRole('button', { name: new RegExp(`^Board ${board + 1}, cell ${cell + 1},`) });

export const openBoard = (page: Page, board: number) =>
  page.getByRole('button', { name: `Open board ${board + 1}` });

export const status = (page: Page) => page.getByRole('status');

/** Starts a new series from the settings (two presses), back at the opening. */
export async function newSeries(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'New series' }).click();
  await page.getByRole('button', { name: 'Clear the score and start' }).click();
  await page.getByRole('button', { name: 'Close settings' }).click();
}

/** Plays a move whatever the layout: on narrow screens the board is zoomed first if needed. */
export async function play(page: Page, board: number, at: number): Promise<void> {
  const target = cell(page, board, at);
  const open = openBoard(page, board);
  // Wait for the view the last move produced: the cell itself, or the board to open.
  await expect(target.or(open).first()).toBeVisible();
  if (await open.isVisible()) {
    await open.click();
  }
  await target.click();
}

export async function playAll(page: Page, notation: string): Promise<void> {
  for (const token of notation.split(' ')) {
    const [board, at] = token.split('.').map(Number);
    await play(page, board ?? 0, at ?? 0);
  }
}

// Fixtures from packages/game-core/src/super-3t/core/testing/fixtures.ts.
export const CLOSES_OWN_TARGET = '4.0 0.2 2.0 0.4 4.1 1.2 2.1 1.4 4.3 3.2 2.2';
export const GLOBAL_DIAGONAL_WIN =
  '8.6 6.4 4.5 5.2 2.7 7.0 0.3 3.0 0.0 0.8 8.3 3.8 8.0 0.4 4.2 2.0 0.6 6.0 4.8';

export const PREFERENCES = 'super-ttt.preferences';

/**
 * Every flow but the tutorial's own starts as a returning visitor: the how-to-play ticket was
 * already seen. Navigations to `/?e2e-tour` keep the real first visit.
 */
export async function asReturningVisitor({ page }: { page: Page }): Promise<void> {
  await page.addInitScript((key) => {
    if (location.search.includes('e2e-tour')) {
      return;
    }
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, unknown>;
    if (saved['seenTutorials'] === undefined) {
      const seenTutorials = ['super-3t', 'classic', 'dots'];
      localStorage.setItem(key, JSON.stringify({ ...saved, seenTutorials }));
    }
  }, PREFERENCES);
  await page.goto('/');
}

/** Switches to playing against the computer from the settings panel. */
export async function againstComputer(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'Against the opponent' }).check();
  await page.getByRole('button', { name: 'Close settings' }).click();
}

/**
 * Plays the first empty cell of the board the status asks for (board 5 on a free choice). A forced
 * board opens by itself on narrow screens (auto-open is on by default), so it is waited for rather
 * than opened by hand while its own opening may be under way.
 */
export async function playAnyLegal(page: Page): Promise<void> {
  const text = (await status(page).textContent()) ?? '';
  const forced = /board (\d)/.exec(text);
  const board = forced ? Number(forced[1]) - 1 : 4;
  const target = page
    .getByRole('button', { name: new RegExp(`^Board ${board + 1}, cell \\d, empty`) })
    .first();
  if (!forced) {
    const open = openBoard(page, board);
    await expect(target.or(open).first()).toBeVisible();
    if (await open.isVisible()) {
      await open.click();
    }
  }
  await target.click();
}

/** A game in the library: the aside on wide screens, else the games dialog (opened first). */
export async function libraryOpen(page: Page): Promise<void> {
  const toggle = page.getByRole('button', { name: 'Games', exact: true });
  if (await toggle.isVisible()) {
    await toggle.click();
    await expect(page.getByRole('dialog', { name: 'Games' })).toBeVisible();
  }
}

export function gameLink(page: Page, name: string) {
  return page.getByRole('link', { name: new RegExp(`^${name}`) });
}

export async function openGame(page: Page, name: string): Promise<void> {
  await libraryOpen(page);
  await gameLink(page, name).click();
  await expect(page.getByRole('dialog', { name: 'Games' })).toBeHidden();
}

/**
 * The moves of the game in progress saved for `gameId`, read from the browser's IndexedDB: a way to
 * wait for an asynchronous save before reloading, never to drive the game.
 */
export function savedMoves(page: Page, gameId: string): Promise<number> {
  return page.evaluate(
    (id) =>
      new Promise<number>((resolve) => {
        const open = indexedDB.open('super-3t');
        open.onerror = () => resolve(0);
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains('games')) {
            db.close();
            resolve(0);
            return;
          }
          const all = db.transaction('games').objectStore('games').getAll();
          all.onsuccess = () => {
            const games = all.result as { gameId: string; result: unknown; moves: unknown[] }[];
            const open = games.filter((game) => game.gameId === id && game.result === null);
            db.close();
            resolve(Math.max(0, ...open.map((game) => game.moves.length)));
          };
          all.onerror = () => resolve(0);
        };
      }),
    gameId,
  );
}
