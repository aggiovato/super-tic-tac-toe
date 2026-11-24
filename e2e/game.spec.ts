import { expect, test, type Page } from '@playwright/test';

/** Cells by engine coordinates (0–8); players see them numbered 1–9. */
const cell = (page: Page, board: number, cell: number) =>
  page.getByRole('button', { name: new RegExp(`^Board ${board + 1}, cell ${cell + 1},`) });

const openBoard = (page: Page, board: number) =>
  page.getByRole('button', { name: `Open board ${board + 1}` });

const status = (page: Page) => page.getByRole('status');

/** Starts a new series from the settings (two presses), back at the opening. */
async function newSeries(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'New series' }).click();
  await page.getByRole('button', { name: 'Clear the score and start' }).click();
  await page.getByRole('button', { name: 'Close settings' }).click();
}

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

// Fixtures from packages/game-core/src/super-3t/core/testing/fixtures.ts.
const CLOSES_OWN_TARGET = '4.0 0.2 2.0 0.4 4.1 1.2 2.1 1.4 4.3 3.2 2.2';
const GLOBAL_DIAGONAL_WIN =
  '8.6 6.4 4.5 5.2 2.7 7.0 0.3 3.0 0.0 0.8 8.3 3.8 8.0 0.4 4.2 2.0 0.6 6.0 4.8';

const PREFERENCES = 'super-ttt.preferences';

test.beforeEach(async ({ page }) => {
  // Every flow but the tutorial's own starts as a returning visitor: the how-to-play ticket was
  // already seen. Navigations to `/?e2e-tour` keep the real first visit.
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
});

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
async function againstComputer(page: Page): Promise<void> {
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
    await againstComputer(page);
    await expect(page.locator('app-score-board dt').last()).toHaveText('Rookie, Beginner');
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
    await page.getByRole('radio', { name: 'Against the opponent' }).check();
    const confirm = page.getByRole('button', { name: 'Switch and clear the score' });
    await expect(confirm).toBeVisible();
    // Nothing changed yet: the game in progress is still there.
    await expect(status(page)).toHaveText('O to move. Must play on board 3.');
    await confirm.click();
    await expect(confirm).toHaveCount(0);
    await expect(status(page)).toHaveText('X to move. May pick any open board.');
    await expect(page.locator('app-score-board dt').last()).toHaveText('Rookie, Beginner');
  });

  // Each level is a train: its name in the level choice, the score and the status.
  for (const [level, train] of [
    ['Intermediate', 'Veteran'],
    ['Advanced', 'Master'],
  ]) {
    test(`the ${level.toLowerCase()} level answers too, and is remembered`, async ({ page }) => {
      await againstComputer(page);
      await page.getByRole('button', { name: 'Settings' }).click();
      await page.getByRole('radio', { name: train }).check();
      await page.getByRole('button', { name: 'Close settings' }).click();
      for (let round = 0; round < 2; round++) {
        await playAnyLegal(page);
        await expect(status(page)).toHaveText(new RegExp(`^${train} to move`));
        await expect(status(page)).toHaveText(/^X to move/);
      }
      await page.reload();
      await page.getByRole('button', { name: 'Settings' }).click();
      await expect(page.getByRole('radio', { name: train })).toBeChecked();
    });
  }

  test('the mode is remembered after a reload', async ({ page }) => {
    await againstComputer(page);
    await page.reload();
    await expect(page.locator('app-score-board dt').last()).toHaveText('Rookie, Beginner');
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('radio', { name: 'Against the opponent' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Rookie' })).toBeChecked();
    await expect(page.getByLabel('Player 2 name')).toHaveCount(0);
  });
});

test.describe('how to play', () => {
  /** A real first visit: no preferences stored, and the init script left out. */
  async function firstVisit(page: Page): Promise<void> {
    await page.evaluate((key) => localStorage.removeItem(key), PREFERENCES);
    await page.goto('/?e2e-tour');
  }

  test('shows the four rules on the first visit, then only when asked', async ({ page }) => {
    await firstVisit(page);
    const ticket = page.getByRole('dialog', { name: 'How to play' });
    await expect(ticket).toBeVisible();
    await expect(ticket.getByRole('listitem')).toHaveCount(4);
    await expect(ticket.getByRole('heading', { name: 'How to play' })).toBeFocused();
    await ticket.getByRole('button', { name: 'Play' }).click();
    await expect(ticket).toBeHidden();
    // The game behind is the real one, ready for the first move.
    await play(page, 4, 2);
    await expect(status(page)).toHaveText('O to move. Must play on board 3.');

    await page.reload();
    await expect(page.locator('.board')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'How to play' })).toBeHidden();
  });

  test('links to the challenges before any game is under way', async ({ page }) => {
    await firstVisit(page);
    await page.getByRole('link', { name: /Practise with a tactical challenge/ }).click();
    await expect(page).toHaveURL(/\/super-3t\/challenge\/diagonal-2026-11$/);
    await expect(page.getByRole('dialog', { name: 'How to play' })).toBeHidden();
  });

  test('closes with Skip or Escape and reopens from the settings', async ({ page }) => {
    await firstVisit(page);
    const ticket = page.getByRole('dialog', { name: 'How to play' });
    await expect(ticket).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(ticket).toBeHidden();

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'How to play' }).click();
    await expect(ticket).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeHidden();
    await ticket.getByRole('button', { name: 'Skip' }).click();
    await expect(ticket).toBeHidden();
  });
});

test('on phones the settings sheet closes when dragged down by its head', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The bottom sheet and its drag exist on narrow screens only');
  const sheet = page.getByRole('heading', { name: 'Settings' });
  /** Drags the head down by `distance` px with touch input, in small steps, then lifts. */
  async function dragHead(distance: number): Promise<void> {
    const head = await page.locator('#settings-panel .sheet-head').boundingBox();
    if (!head) {
      throw new Error('The settings sheet is not open');
    }
    const cdp = await page.context().newCDPSession(page);
    const x = head.x + head.width / 2;
    const y = head.y + 10;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let step = 1; step <= 10; step++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y: y + (distance * step) / 10 }],
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }

  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(sheet).toBeVisible();
  // A short drag springs back.
  await dragHead(40);
  await expect(sheet).toBeVisible();
  await dragHead(400);
  await expect(sheet).toBeHidden();
});

test.describe('tactical challenges', () => {
  const progress = (page: Page) => page.locator('app-challenge-panel .progress');

  test('a wrong move names the saving reply; the key move and the finish solve it, once', async ({
    page,
  }) => {
    await page.goto('/super-3t/challenge');
    await expect(page).toHaveURL(/\/super-3t\/challenge\/diagonal-2026-11$/);
    await expect(status(page)).toHaveText('X to move. Must play on board 3.');

    await play(page, 2, 0);
    await expect(progress(page)).toHaveText(
      'The opponent would hold out on board 1, cell 9. Try another move.',
    );
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(progress(page)).toHaveText('Find the key move.');

    await play(page, 2, 8);
    await expect(progress(page)).toHaveText(/That was it!/);
    await expect(status(page)).toHaveText('X to move. May pick any open board.');
    await play(page, 2, 5);
    await expect(progress(page)).toHaveText('Challenge solved!');
    await expect(page.getByRole('radio', { name: 'Easy ✓' })).toBeChecked();

    await page.reload();
    await expect(page.getByRole('radio', { name: 'Easy ✓' })).toBeChecked();
    await expect(page.getByRole('button', { name: 'Next challenge' })).toHaveCount(0);
    await page.getByRole('radio', { name: 'Medium' }).check();
    await expect(page).toHaveURL(/\/super-3t\/challenge\/column-2026-11$/);
    await expect(status(page)).toHaveText('X to move. May pick any open board.');
  });

  test('settings lead to the challenges, and the game is still there on the way back', async ({
    page,
  }) => {
    await play(page, 4, 2);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Tactical challenges' }).click();
    await expect(page).toHaveURL(/\/super-3t\/challenge\//);
    await page.getByRole('button', { name: 'Back to the game' }).click();
    await expect(page).toHaveURL(/\/super-3t$/);
    await expect(status(page)).toHaveText('O to move. Must play on board 3.');
  });
});

/** A game in the library: the aside on wide screens, else the games dialog (opened first). */
async function libraryOpen(page: Page): Promise<void> {
  const toggle = page.getByRole('button', { name: 'Games', exact: true });
  if (await toggle.isVisible()) {
    await toggle.click();
    await expect(page.getByRole('dialog', { name: 'Games' })).toBeVisible();
  }
}

function gameLink(page: Page, name: string) {
  return page.getByRole('link', { name: new RegExp(`^${name}`) });
}

async function openGame(page: Page, name: string): Promise<void> {
  await libraryOpen(page);
  await gameLink(page, name).click();
  await expect(page.getByRole('dialog', { name: 'Games' })).toBeHidden();
}

/**
 * The moves of the game in progress saved for `gameId`, read from the browser's IndexedDB: a way to
 * wait for an asynchronous save before reloading, never to drive the game.
 */
function savedMoves(page: Page, gameId: string): Promise<number> {
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
    await expect(page.getByText('Saved')).toBeVisible();
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

test.describe('dots and boxes', () => {
  const line = (page: Page, name: string) =>
    page.getByRole('button', { name: new RegExp(`^${name}, (free|.*'s)$`) });
  /** Draws lines in order; names as "Horizontal line, row 1, dots 1 and 2". */
  async function draw(page: Page, ...names: string[]): Promise<void> {
    for (const name of names) {
      // The board resolves a tap to the nearest line: tap where the line is drawn.
      await line(page, name).click({ force: true });
    }
  }

  test('a tap just outside the dots draws the edge line nearest to it', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/dots');
    const field = page.getByRole('group', { name: 'Dot board', exact: true });
    const box = await field.boundingBox();
    if (!box) {
      throw new Error('The board is not on screen.');
    }
    // A finger aiming at an edge line lands a little outside the dots, in the platform's margin.
    const step = box.width / 3;
    const off = step / 6;
    const touches: [number, number, string][] = [
      [box.x + step / 2, box.y - off, 'Horizontal line, row 1, dots 1 and 2'],
      [box.x - off, box.y + step * 1.5, 'Vertical line, column 1, dots 2 and 3'],
      [box.x + step * 2.5, box.y + box.height + off, 'Horizontal line, row 4, dots 3 and 4'],
      [box.x + box.width + off, box.y + step / 2, 'Vertical line, column 4, dots 1 and 2'],
    ];
    for (const [x, y, name] of touches) {
      if (isMobile) {
        await page.touchscreen.tap(x, y);
      } else {
        await page.mouse.click(x, y);
      }
      await expect(page.getByRole('button', { name: new RegExp(`^${name}, .*'s$`) })).toHaveCount(
        1,
      );
    }
  });
  test('closing a box keeps it and plays again; the game resumes after a reload', async ({
    page,
  }) => {
    await page.goto('/dots');
    await expect(status(page)).toHaveText('Boxes: X 0, O 0. X to move.');
    await expect(page.getByRole('button', { name: /, free$/ })).toHaveCount(24);
    // X top, O left, X right: O closes the box with the bottom and plays again.
    await draw(
      page,
      'Horizontal line, row 1, dots 1 and 2',
      'Vertical line, column 1, dots 1 and 2',
      'Vertical line, column 2, dots 1 and 2',
      'Horizontal line, row 2, dots 1 and 2',
    );
    await expect(page.getByText('O closed a box and plays again.', { exact: true })).toBeVisible();
    // The departure row is now the box score; screen readers hear the count.
    await expect(status(page)).toHaveText('O closed a box and plays again. Boxes: X 0, O 1.');

    await page.reload();
    await expect(status(page)).toHaveText(/^O closed a box/);
    await expect(page.getByRole('button', { name: /, free$/ })).toHaveCount(20);

    // The keyboard plays too: the free line in the tab order, then Enter.
    await page
      .getByRole('button', { name: /, free$/ })
      .and(page.locator('[tabindex="0"]'))
      .focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: /, free$/ })).toHaveCount(19);
  });

  test('the board size is a setting: 5×5 boxes', async ({ page }) => {
    await page.goto('/dots');
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('radio', { name: '5×5 boxes' }).check();
    await page.getByRole('button', { name: 'Close settings' }).click();
    await expect(page.getByRole('button', { name: /, free$/ })).toHaveCount(60);
  });

  test('the opponent answers, and a box it closes lets it play again', async ({ page }) => {
    await page.goto('/dots');
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('radio', { name: 'Against the opponent' }).check();
    await page.getByRole('radio', { name: 'Master' }).check();
    await page.getByRole('button', { name: 'Close settings' }).click();
    const theirs = page.getByRole('button', { name: /, Master's$/ });
    for (let round = 1; round <= 3; round++) {
      await page
        .getByRole('button', { name: /, free$/ })
        .first()
        .click({ force: true });
      // The opponent replies (more than once when it closes a box) before X moves again.
      await expect.poll(() => theirs.count()).toBeGreaterThanOrEqual(round);
      await expect(page.locator('app-dots-status [role="img"]')).toHaveAttribute(
        'aria-label',
        /X to move|Game over/,
      );
    }
    await expect(page.getByRole('button', { name: /, Master's$/ }).first()).toBeVisible();
  });

  test('shows its own how-to-play on the first visit', async ({ page }) => {
    await page.evaluate((key) => localStorage.removeItem(key), PREFERENCES);
    await page.goto('/dots?e2e-tour');
    const ticket = page.getByRole('dialog', { name: 'How to play' });
    await expect(ticket).toBeVisible();
    await expect(ticket.getByRole('listitem')).toHaveCount(4);
    await ticket.getByRole('button', { name: 'Play' }).click();
    await expect(ticket).toBeHidden();
    await page.reload();
    await expect(page.getByRole('dialog', { name: 'How to play' })).toBeHidden();
  });
});
