// The classic game, the game library and saving and resuming games.
import { expect, test, type Page } from '@playwright/test';
import {
  asReturningVisitor,
  status,
  play,
  againstComputer,
  libraryOpen,
  gameLink,
  openGame,
  savedMoves,
} from './support/game';

test.beforeEach(asReturningVisitor);

test.describe('classic tic tac toe', () => {
  const classicCell = (page: Page, at: number) =>
    page.getByRole('button', { name: new RegExp(`^Cell ${at + 1},`) });

  test('on wide screens the library folds to a rail and stays folded after a reload', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Phones reach the library from the games button.');
    // The aside shows from 87.5rem wide; narrower windows use the games button too.
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('/classic');
    await expect(gameLink(page, 'Boxes')).toBeVisible();
    await page.getByRole('button', { name: 'Hide games' }).click();
    await expect(gameLink(page, 'Boxes')).toBeHidden();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Show games' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await page.getByRole('button', { name: 'Show games' }).click();
    await expect(gameLink(page, 'Boxes')).toBeVisible();
  });

  test('the game library switches games, each keeps its own game, and the app reopens on the last', async ({
    page,
  }) => {
    await play(page, 4, 2);
    // The game on screen is marked as playing.
    await libraryOpen(page);
    await expect(gameLink(page, 'Super 3T')).toHaveAttribute('aria-current', 'page');
    await expect(gameLink(page, 'Classic')).not.toHaveAttribute('aria-current');
    await gameLink(page, 'Classic').click();
    await expect(page).toHaveURL(/\/classic$/);
    await expect(page.getByRole('dialog', { name: 'Games' })).toBeHidden();
    await expect(status(page)).toHaveText('X to move.');

    await page.goto('/');
    await expect(page).toHaveURL(/\/classic$/);
    await openGame(page, 'Super 3T');
    await expect(page).toHaveURL(/\/super-3t$/);
    await expect(status(page)).toHaveText('O to move. Must play on board 3.');
  });

  test('two people play to a win, the score counts it and the rematch swaps symbols', async ({
    page,
  }) => {
    await page.goto('/classic');
    // X: 0, 1, 2 · O: 3, 4.
    for (const at of [0, 3, 1, 4]) {
      await classicCell(page, at).click();
    }
    await expect(status(page)).toHaveText('X to move.');
    // A taken cell is aria-disabled; pressing it anyway is refused with a reason.
    await classicCell(page, 0).click({ force: true });
    await expect(page.getByText('That cell is already taken.')).toBeVisible();
    await classicCell(page, 2).click();
    await expect(status(page)).toHaveText('Game over. X wins.');
    await expect(page.locator('app-score-board dd .sr-only').first()).toHaveText('01');
    await page.getByRole('button', { name: 'Rematch' }).click();
    // Player 2 now plays X and opens.
    await expect(status(page)).toHaveText('X to move.');
    await expect(page.getByRole('button', { name: /^Cell \d, empty$/ })).toHaveCount(9);
  });

  for (const [level, train] of [
    ['Beginner', 'Rookie'],
    ['Intermediate', 'Veteran'],
    ['Advanced', 'Master'],
  ]) {
    test(`the ${level.toLowerCase()} opponent answers every move`, async ({ page }) => {
      await page.goto('/classic');
      await page.getByRole('button', { name: 'Settings' }).click();
      await page.getByRole('tab', { name: 'Players' }).click();
      await page.getByRole('radio', { name: 'Against the opponent' }).check();
      await page.getByRole('radio', { name: train }).check();
      await page.getByRole('button', { name: 'Close settings' }).click();
      for (let round = 1; round <= 2; round++) {
        await page
          .getByRole('button', { name: /^Cell \d, empty$/ })
          .first()
          .click();
        // Wait for the reply itself: "X to move" is also true before it, even before X's move.
        await expect(page.getByRole('button', { name: /, O$/ })).toHaveCount(round);
      }
    });
  }
});

test.describe('saving and resuming', () => {
  const classicCell = (page: Page, at: number) =>
    page.getByRole('button', { name: new RegExp(`^Cell ${at + 1},`) });

  test('a game saved before seats (schema 1) resumes with its mode and level', async ({ page }) => {
    // The app creates its database on the first visit; then a game is stored as version 1 did.
    await page.goto('/classic');
    await expect(page.getByText('Saved')).toBeVisible();
    await page.evaluate(
      () =>
        new Promise<void>((resolve, reject) => {
          const open = indexedDB.open('super-3t');
          open.onsuccess = () => {
            const tx = open.result.transaction(['series', 'games'], 'readwrite');
            tx.objectStore('series').put({
              gameId: 'classic',
              seriesId: 'old-series',
              currentGameId: 'old-game',
              wins: [0, 1],
              draws: 0,
              version: 100,
            });
            tx.objectStore('games').put({
              id: 'old-game',
              gameId: 'classic',
              schemaVersion: 1,
              rulesVersion: 1,
              seriesId: 'old-series',
              mode: 'opponent',
              level: 'advanced',
              seed: 11,
              xPlayer: 0,
              moves: [{ cell: 4 }, { cell: 0 }],
              revision: 2,
              result: null,
              startedAt: 1,
              updatedAt: 2,
              finishedAt: null,
            });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error ?? new Error('write failed'));
          };
          open.onerror = () => reject(open.error ?? new Error('open failed'));
        }),
    );
    await page.reload();
    await expect(classicCell(page, 4)).toHaveAccessibleName(/^Cell 5, X/);
    await expect(classicCell(page, 0)).toHaveAccessibleName(/^Cell 1, O/);
    // Against the computer at the advanced level: its train name, and X to move.
    await expect(page.locator('app-score-board dt').last()).toHaveText('Master, Advanced');
    await expect(status(page)).toHaveText(/^X to move/);
  });

  test('a game resumes after a reload, on the same turn', async ({ page }) => {
    await play(page, 4, 2);
    await play(page, 2, 4);
    // Both moves written before the reload: "Saved" is already showing from the first one, so it
    // cannot tell the second save has landed (it had not, once, on a busy CI runner).
    await expect.poll(() => savedMoves(page, 'super-3t')).toBe(2);
    await page.reload();
    await expect(status(page)).toHaveText('X to move. Must play on board 5.');
    await expect(page.getByText('O played cell 5, so X plays on board 5.')).toBeVisible();
  });

  test("a reload on the opponent's turn asks it once, and the game goes on", async ({
    page,
    isMobile,
  }) => {
    await againstComputer(page);
    await play(page, 4, 2);
    // Reload once X's move is written (saving is asynchronous, slower on CI) and, as a rule, before
    // the reply lands: the saved game stopped on the opponent's turn. "Saved" shows once the
    // restored game is back (the empty game shown while it loads is never saved).
    await expect.poll(() => savedMoves(page, 'super-3t')).toBeGreaterThanOrEqual(1);
    await page.reload();
    await expect(page.getByText('Saved')).toBeVisible();
    await expect(status(page)).toHaveText(/^X to move/);
    if (!isMobile) {
      // The whole board shows every mark: one move each, the reply played once.
      await expect(page.locator('[aria-label$=", O"]')).toHaveCount(1);
      await expect(page.locator('[aria-label$=", X"]')).toHaveCount(1);
    }
  });

  test('a finished game counts once, however often it is reopened, and shows in the history', async ({
    page,
  }) => {
    await page.goto('/classic');
    for (const at of [0, 3, 1, 4, 2]) {
      await classicCell(page, at).click();
    }
    await expect(status(page)).toHaveText('Game over. X wins.');
    for (let visit = 0; visit < 2; visit++) {
      await page.reload();
      await expect(status(page)).toHaveText('Game over. X wins.');
      await expect(page.locator('app-score-board dd .sr-only').first()).toHaveText('01');
    }
    await page.getByRole('button', { name: 'History' }).click();
    await expect(page).toHaveURL(/\/classic\/history$/);
    await expect(page.getByText('1 game for two people.')).toBeVisible();
    // Phones show the latest games on their own tab; wide screens on a second ticket.
    const latest = page.getByRole('tab', { name: 'Latest departures' });
    if (await latest.isVisible()) {
      await latest.click();
    }
    await expect(page.getByText('Player 1 wins')).toBeVisible();
    await page.getByRole('button', { name: 'Back to the game' }).click();
    await expect(page).toHaveURL(/\/classic$/);
    await expect(status(page)).toHaveText('Game over. X wins.');
  });
});
