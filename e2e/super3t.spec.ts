// Super 3T: the rules on the board, the views, the finale and playing the computer.
import { expect, test, type Page } from '@playwright/test';
import {
  asReturningVisitor,
  cell,
  openBoard,
  status,
  newSeries,
  play,
  playAll,
  CLOSES_OWN_TARGET,
  GLOBAL_DIAGONAL_WIN,
  againstComputer,
  playAnyLegal,
} from './support/game';

test.beforeEach(asReturningVisitor);

test('opening, forced target and free choice', async ({ page }) => {
  await expect(page.getByText('Close three boards in a row to win.')).toBeVisible();
  await expect(status(page)).toHaveText('X to move. May pick any open board.');

  await play(page, 4, 2);
  await expect(status(page)).toHaveText('O to move. Must play on board 3.');
  await expect(page.getByText('X played cell 3, so O plays on board 3.')).toBeVisible();

  // The game is saved: a new series, not a reload, starts from the opening.
  await newSeries(page);
  await playAll(page, CLOSES_OWN_TARGET);
  await expect(status(page)).toHaveText('O to move. May pick any open board.');
  await expect(page.getByText('but board 3 is closed')).toBeVisible();
});

test('explains a refused move; two people on one device have no undo', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Refused cells are on the whole board, a desktop flow');
  await play(page, 4, 2);
  // Unavailable cells are aria-disabled but still reachable by a tap, which explains the refusal.
  await cell(page, 5, 0).click({ force: true });
  await expect(page.getByText('This turn is played on board 3.')).toBeVisible();

  // Undo is offered only against the computer at its first level.
  await expect(page.getByRole('button', { name: 'Undo' })).toHaveCount(0);
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
  await page.getByRole('tab', { name: 'Players' }).click();
  // A real click in the field, then typing: a window listener once cancelled every press.
  await page.getByLabel('Player 1 name').click();
  await page.keyboard.type('Ana');
  await expect(page.getByLabel('Player 1 name')).toHaveValue('Ana');
  await page.getByRole('tab', { name: 'App' }).click();
  await expect(page.getByRole('tab', { name: 'App' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('radio', { name: 'Español' }).check();
  await expect(status(page)).toHaveText('Turno de Ana. Puede elegir cualquier tablero abierto.');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');

  // Arrow keys move between the tabs.
  await page.getByRole('tab', { name: 'Aplicación' }).press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Jugadores' })).toBeFocused();
  await page.getByRole('tab', { name: 'Jugadores' }).press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Partida' })).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: 'Partida' })).toBeVisible();
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
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Super 3T');
  const ending = page.locator('app-brand-title .flaps');
  // Folded away until a board is won.
  await expect(ending).toBeHidden();
  // Every text the flaps turn to, recorded as it happens: each ending is up for about a second, too
  // short to catch by polling on a slow engine.
  await page.evaluate(() => {
    const seen: string[] = [];
    (window as unknown as { flapTexts: string[] }).flapTexts = seen;
    const title = document.querySelector('app-brand-title');
    if (!title) {
      return;
    }
    new MutationObserver(() => {
      const text = title.querySelector('.flaps')?.textContent?.replace(/\s/g, '') ?? '';
      if (text && seen.at(-1) !== text) {
        seen.push(text);
      }
    }).observe(title, { subtree: true, childList: true, characterData: true });
  });
  // X wins board 5 along its top row.
  await playAll(page, '4.0 0.4 4.1 1.4 4.2');
  await expect(ending).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { flapTexts: string[] }).flapTexts.join(' ')),
    )
    .toMatch(/IP.*AP.*OE/);
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
            animation instanceof CSSAnimation && animation.animationName.endsWith('win-flash'),
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

test.describe('against the opponent', () => {
  test('every move of yours gets a legal reply, then it is your turn again', async ({
    page,
    isMobile,
  }) => {
    await againstComputer(page);
    await expect(page.locator('app-players dt').last()).toHaveText('Rookie, Beginner');
    for (let round = 0; round < 3; round++) {
      await playAnyLegal(page);
      await expect(status(page)).toHaveText(/^Rookie to move/);
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
    await againstComputer(page);
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
    await page.getByRole('tab', { name: 'Players' }).click();
    await page.getByRole('radio', { name: 'Against the computer' }).check();
    const confirm = page.getByRole('button', { name: 'Switch and clear the score' });
    await expect(confirm).toBeVisible();
    // Nothing changed yet: the game in progress is still there.
    await expect(status(page)).toHaveText('O to move. Must play on board 3.');
    await confirm.click();
    await expect(confirm).toHaveCount(0);
    await expect(status(page)).toHaveText('X to move. May pick any open board.');
    await expect(page.locator('app-players dt').last()).toHaveText('Rookie, Beginner');
  });

  // Each level is a rank: its name in the level choice, the score and the status.
  for (const [level, train] of [
    ['Intermediate', 'Veteran'],
    ['Advanced', 'Master'],
  ]) {
    test(`the ${level.toLowerCase()} level answers too, and is remembered`, async ({ page }) => {
      await againstComputer(page);
      await page.getByRole('button', { name: 'Settings' }).click();
      await page.getByRole('tab', { name: 'Players' }).click();
      await page.getByRole('radio', { name: train }).check();
      await page.getByRole('button', { name: 'Close settings' }).click();
      for (let round = 0; round < 2; round++) {
        await playAnyLegal(page);
        await expect(status(page)).toHaveText(new RegExp(`^${train} to move`));
        await expect(status(page)).toHaveText(/^X to move/);
      }
      await page.reload();
      await page.getByRole('button', { name: 'Settings' }).click();
      await page.getByRole('tab', { name: 'Players' }).click();
      await expect(page.getByRole('radio', { name: train })).toBeChecked();
    });
  }

  test('the mode is remembered after a reload', async ({ page }) => {
    await againstComputer(page);
    await page.reload();
    await expect(page.locator('app-players dt').last()).toHaveText('Rookie, Beginner');
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('tab', { name: 'Players' }).click();
    await expect(page.getByRole('radio', { name: 'Against the computer' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Rookie' })).toBeChecked();
    await expect(page.getByLabel('Player 2 name')).toHaveCount(0);
  });
});
