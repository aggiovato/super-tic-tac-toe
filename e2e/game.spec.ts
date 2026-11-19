import { expect, test, type Page } from '@playwright/test';

/** Cells by engine coordinates (0–8); players see them numbered 1–9. */
const cell = (page: Page, board: number, cell: number) =>
  page.getByRole('button', { name: new RegExp(`^Board ${board + 1}, cell ${cell + 1},`) });

const openBoard = (page: Page, board: number) =>
  page.getByRole('button', { name: `Open board ${board + 1}` });

const status = (page: Page) => page.getByRole('status');

/** Plays a move whatever the layout: on narrow screens the board is zoomed first if needed. */
async function play(page: Page, board: number, at: number): Promise<void> {
  const target = cell(page, board, at);
  const open = openBoard(page, board);
  // Wait for the view the last move produced: the cell itself, or the board to open.
  await expect(target.or(open).first()).toBeVisible();
  if (await open.isVisible()) {
    await open.click();
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
  await expect(page.getByText('Close three boards in a row to win.')).toBeVisible();
  await expect(status(page)).toHaveText('X to move. May pick any open board.');

  await play(page, 4, 2);
  await expect(status(page)).toHaveText('O to move. Must play on board 3.');
  await expect(page.getByText('X played cell 3, so O plays on board 3.')).toBeVisible();

  await page.goto('/');
  await playAll(page, CLOSES_OWN_TARGET);
  await expect(status(page)).toHaveText('O to move. May pick any open board.');
  await expect(page.getByText('but board 3 is closed')).toBeVisible();
});

test('explains a refused move and takes back the last one', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Refused cells are on the whole board, a desktop flow');
  await play(page, 4, 2);
  // Unavailable cells are aria-disabled but still reachable by a tap, which explains the refusal.
  await cell(page, 5, 0).click({ force: true });
  await expect(page.getByText('This turn is played on board 3.')).toBeVisible();

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(status(page)).toHaveText('X to move. May pick any open board.');
  await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
});

test('a won game counts once and the rematch swaps symbols', async ({ page }) => {
  await playAll(page, GLOBAL_DIAGONAL_WIN);
  await expect(status(page)).toHaveText('Game over. X wins.');

  const score = page.getByRole('definition');
  await expect(score.first()).toContainText('01');

  await page.getByRole('button', { name: 'Rematch' }).click();
  await expect(status(page)).toHaveText('X to move. May pick any open board.');
  await expect(score.first()).toContainText('01');
  // Player 2 now plays X and moves first.
  await expect(page.getByRole('term').filter({ hasText: 'Player 2' })).toBeVisible();
});

test('plays by keyboard from a single entry point', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Keyboard play is a desktop flow');
  const first = cell(page, 0, 0);
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await expect(cell(page, 0, 4)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(status(page)).toHaveText('O to move. Must play on board 5.');
  // Focus moves to the first legal cell of the forced board, and arrows skip illegal cells.
  await expect(cell(page, 4, 0)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(cell(page, 4, 1)).toBeFocused();
});

test('narrow screens open a board and come back', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Opening boards is the narrow-screen flow');
  await openBoard(page, 4).click();
  await cell(page, 4, 2).click();
  // After a beat on the whole board, the forced board opens by itself.
  await expect(cell(page, 2, 0)).toBeVisible();
  await page.getByRole('button', { name: 'Show all' }).click();
  await expect(openBoard(page, 2)).toBeVisible();
  await openBoard(page, 2).click();
  await page.keyboard.press('Escape');
  await expect(openBoard(page, 2)).toBeFocused();
});

test('a move that sends the opponent to the same board keeps it open', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Boards open and close on narrow screens');
  await openBoard(page, 4).click();
  await cell(page, 4, 4).click();
  await expect(status(page)).toHaveText('O to move. Must play on board 5.');
  await expect(cell(page, 4, 0)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show all' })).toBeVisible();
});

test('with full motion the forced board opens by itself after a move', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Boards open and close on narrow screens');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openBoard(page, 4).click();
  await cell(page, 4, 2).click();
  await expect(status(page)).toHaveText('O to move. Must play on board 3.');
  // The open board closes into the grid, then board 3 opens from its place.
  await expect(cell(page, 2, 0)).toBeVisible({ timeout: 3000 });
  await expect(page.getByRole('button', { name: 'Show all' })).toBeVisible();
});

test('settings switch language, rename players and need a second press to reset', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Player 1 name').fill('Ana');
  await page.getByRole('radio', { name: 'Español' }).check();
  await expect(status(page)).toHaveText('Turno de Ana. Puede elegir cualquier tablero abierto.');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');

  await page.getByRole('button', { name: 'Nueva serie' }).click();
  await expect(page.getByRole('button', { name: 'Borrar marcador y empezar' })).toBeVisible();
});

test('every board grid is square, whole and open', async ({ page, isMobile }) => {
  const isSquare = async (grid: ReturnType<Page['locator']>) => {
    const box = await grid.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs((box?.width ?? 0) - (box?.height ?? 1))).toBeLessThan(1);
  };
  await isSquare(page.locator('[data-cells="4"]'));
  if (isMobile) {
    await openBoard(page, 4).click();
    await expect(cell(page, 4, 0)).toBeVisible();
    await isSquare(page.getByRole('group', { name: 'Board 5' }).locator('[data-cells="4"]'));
  }
});

test('a closed board draws its mark once, not each time the views switch', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Views are rebuilt only on narrow screens');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const drawing = () =>
    page.evaluate(
      () =>
        document.getAnimations().filter((animation) => {
          const name = animation instanceof CSSAnimation ? animation.animationName : '';
          return name.endsWith('draw-mark');
        }).length,
    );
  // X closes board 5 along its top row; O is then sent to board 3, which opens by itself.
  await playAll(page, '4.0 0.4 4.1 1.4 4.2');
  await expect(cell(page, 2, 0)).toBeVisible({ timeout: 3000 });
  await page.getByRole('button', { name: 'Show all' }).click();
  await expect(openBoard(page, 2)).toBeVisible();
  expect(await drawing()).toBe(0);
});

test('winning a board spells TIP, TAP and TOE beside the name', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Super 3T');
  const ending = page.locator('app-brand-title .flaps');
  // Folded away until a board is won.
  await expect(ending).toBeHidden();
  // X wins board 5 along its top row.
  await playAll(page, '4.0 0.4 4.1 1.4 4.2');
  await expect(ending).toBeVisible();
  await expect(ending).toHaveText(/I\s*P/);
  await expect(ending).toHaveText(/A\s*P/);
  await expect(ending).toHaveText(/O\s*E/);
  await expect(ending).toBeHidden();
});

test('the three boards that win the game flash', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const flashing = () =>
    page.evaluate(() =>
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation instanceof CSSAnimation && animation.animationName.endsWith('spark-win'),
        )
        .map((animation) => {
          const target =
            animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
          return target?.querySelector('[data-cells]')?.getAttribute('data-cells');
        })
        .sort(),
    );
  await playAll(page, GLOBAL_DIAGONAL_WIN);
  await expect(status(page)).toHaveText(/wins/);
  await expect.poll(flashing).toEqual(['0', '4', '8']);
  // No winning board becomes a stacking context (a held `translate` from the closing shake),
  // which would lift the game's strike line above its large mark.
  const translates = await page.evaluate(() =>
    ['0', '4', '8'].map((board) => {
      const platform = document.querySelector(`[data-cells="${board}"]`)?.parentElement;
      return platform ? getComputedStyle(platform).translate : null;
    }),
  );
  expect(translates).toEqual(['none', 'none', 'none']);
});

/** Switches to playing against the computer from the settings panel. */
async function againstOpponent(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'Against the opponent' }).check();
  await page.getByRole('button', { name: 'Close settings' }).click();
}

/**
 * Plays the first empty cell of the board the status asks for (board 5 on a free choice). A forced
 * board opens by itself on narrow screens (auto-open is on by default), so it is waited for rather
 * than opened by hand while its own opening may be under way.
 */
async function playAnyLegal(page: Page): Promise<void> {
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

test.describe('against the opponent', () => {
  test('every move of yours gets a legal reply, then it is your turn again', async ({
    page,
    isMobile,
  }) => {
    await againstOpponent(page);
    await expect(page.locator('app-score-board dt').last()).toHaveText('Opponent');
    for (let round = 0; round < 3; round++) {
      await playAnyLegal(page);
      await expect(status(page)).toHaveText(/^Opponent to move/);
      await expect(status(page)).toHaveText(/^X to move/);
    }
    if (isMobile) {
      // Narrow screens: after the reply your forced board opens by itself; a reply that sends you
      // to a closed board leaves a free choice on the whole board.
      const forced = ((await status(page).textContent()) ?? '').includes('Must play on board');
      await expect(
        forced
          ? page.getByRole('button', { name: 'Show all' })
          : page.getByRole('button', { name: /^Open board/ }).first(),
      ).toBeVisible();
    } else {
      await expect(page.locator('[aria-label$=", O"]')).toHaveCount(3);
      await expect(page.locator('[aria-label$=", X"]')).toHaveCount(3);
    }
  });

  test('undo takes back the reply and your move', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The board counts are read on the whole board');
    await againstOpponent(page);
    const undo = page.getByRole('button', { name: 'Undo' });
    await expect(undo).toBeDisabled();
    await playAnyLegal(page);
    await expect(status(page)).toHaveText(/^X to move/);
    await undo.click();
    await expect(status(page)).toHaveText('X to move. May pick any open board.');
    await expect(page.locator('[aria-label$=", O"], [aria-label$=", X"]')).toHaveCount(0);
  });

  test('switching mode with a game under way asks once more before clearing it', async ({
    page,
  }) => {
    await play(page, 4, 2);
    await expect(status(page)).toHaveText('O to move. Must play on board 3.');
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('radio', { name: 'Against the opponent' }).check();
    const confirm = page.getByRole('button', { name: 'Switch and clear the score' });
    await expect(confirm).toBeVisible();
    // Nothing changed yet: the game in progress is still there.
    await expect(status(page)).toHaveText('O to move. Must play on board 3.');
    await confirm.click();
    await expect(confirm).toHaveCount(0);
    await expect(status(page)).toHaveText('X to move. May pick any open board.');
    await expect(page.locator('app-score-board dt').last()).toHaveText('Opponent');
  });

  for (const level of ['Intermediate', 'Advanced']) {
    test(`the ${level.toLowerCase()} level answers too, and is remembered`, async ({ page }) => {
      await againstOpponent(page);
      await page.getByRole('button', { name: 'Settings' }).click();
      await page.getByRole('radio', { name: level }).check();
      await page.getByRole('button', { name: 'Close settings' }).click();
      for (let round = 0; round < 2; round++) {
        await playAnyLegal(page);
        await expect(status(page)).toHaveText(/^Opponent to move/);
        await expect(status(page)).toHaveText(/^X to move/);
      }
      await page.reload();
      await page.getByRole('button', { name: 'Settings' }).click();
      await expect(page.getByRole('radio', { name: level })).toBeChecked();
    });
  }

  test('the mode is remembered after a reload', async ({ page }) => {
    await againstOpponent(page);
    await page.reload();
    await expect(page.locator('app-score-board dt').last()).toHaveText('Opponent');
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('radio', { name: 'Against the opponent' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Beginner' })).toBeChecked();
    await expect(page.getByLabel('Player 2 name')).toHaveCount(0);
  });
});
