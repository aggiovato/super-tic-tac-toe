import { expect, test, type Page } from '@playwright/test';

const cell = (page: Page, board: number, cell: number) =>
  page.getByRole('button', { name: new RegExp(`^Board ${board}, cell ${cell},`) });

const status = (page: Page) => page.getByRole('status');

/** Plays a move whatever the layout: on narrow screens the board is zoomed first if needed. */
async function play(page: Page, board: number, at: number): Promise<void> {
  const target = cell(page, board, at);
  const zoom = page.getByRole('button', { name: `Zoom into board ${board}` });
  // Wait for the view the last move produced: the cell itself, or the board to zoom into.
  await expect(target.or(zoom)).toBeVisible();
  if (await zoom.isVisible()) {
    await zoom.click();
  }
  await target.click();
}

async function playAll(page: Page, notation: string): Promise<void> {
  for (const token of notation.split(' ')) {
    const [board, at] = token.split('.').map(Number);
    await play(page, board ?? 0, at ?? 0);
  }
}

// Fixtures from src/app/game/core/testing/fixtures.ts.
const CLOSES_OWN_TARGET = '4.0 0.2 2.0 0.4 4.1 1.2 2.1 1.4 4.3 3.2 2.2';
const GLOBAL_DIAGONAL_WIN =
  '8.6 6.4 4.5 5.2 2.7 7.0 0.3 3.0 0.0 0.8 8.3 3.8 8.0 0.4 4.2 2.0 0.6 6.0 4.8';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('opening, forced target and free choice', async ({ page }) => {
  await expect(page.getByText('Choose where to start')).toBeVisible();
  await expect(status(page)).toHaveText('X to move. May pick any open board.');

  await play(page, 4, 2);
  await expect(status(page)).toHaveText('O to move. Must play on board 2.');
  await expect(page.getByText('X played cell 2, so O plays on board 2.')).toBeVisible();

  await page.goto('/');
  await playAll(page, CLOSES_OWN_TARGET);
  await expect(status(page)).toHaveText('O to move. May pick any open board.');
  await expect(page.getByText('but board 2 is closed')).toBeVisible();
});

test('a won game counts once and the rematch swaps symbols', async ({ page }) => {
  await playAll(page, GLOBAL_DIAGONAL_WIN);
  await expect(status(page)).toHaveText('Game over. X wins.');

  const score = page.getByRole('definition');
  await expect(score.first()).toContainText('01');

  await page.getByRole('button', { name: 'Rematch' }).click();
  await expect(status(page)).toHaveText('X to move. May pick any open board.');
  await expect(page.getByText('Player 1 (O)')).toBeVisible();
  await expect(score.first()).toContainText('01');
});

test('plays by keyboard from a single entry point', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Keyboard play is a desktop flow');
  const first = cell(page, 0, 0);
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await expect(cell(page, 0, 4)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(status(page)).toHaveText('O to move. Must play on board 4.');
  // Focus moves to the first legal cell of the forced board.
  await expect(cell(page, 4, 0)).toBeFocused();
});

test('narrow screens zoom into a board and come back', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Zoom is the narrow-screen flow');
  await page.getByRole('button', { name: 'Zoom into board 4' }).click();
  await cell(page, 4, 2).click();
  // The forced board opens zoomed.
  await expect(cell(page, 2, 0)).toBeVisible();
  await page.getByRole('button', { name: 'Show the whole board' }).click();
  await expect(page.getByRole('button', { name: 'Zoom into board 2' })).toBeVisible();
  await page.getByRole('button', { name: 'Zoom into board 2' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Zoom into board 2' })).toBeFocused();
});

test('works with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await play(page, 4, 2);
  await expect(status(page)).toHaveText('O to move. Must play on board 2.');
});

test('switches language', async ({ page }) => {
  await page.getByRole('button', { name: 'Español' }).click();
  await expect(status(page)).toHaveText('Turno de X. Puede elegir cualquier tablero abierto.');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});
