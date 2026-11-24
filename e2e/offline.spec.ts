import { expect, test, type Page } from '@playwright/test';

// The phase 5 exit: someone reopens the app with no network and plays every game against the
// computer, levels never opened before included. The other specs block the service worker; these
// need it.
test.use({ serviceWorkers: 'allow' });

test.beforeEach(async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Offline emulation with a service worker: Chromium only.');
  await page.addInitScript(() => {
    if (!localStorage.getItem('super-ttt.preferences')) {
      localStorage.setItem(
        'super-ttt.preferences',
        JSON.stringify({ seenTutorials: ['super-3t', 'classic', 'dots'] }),
      );
    }
  });
});

/** Every file the service worker prefetches, from its manifest. */
async function expectedFiles(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const manifest = (await (await fetch('/ngsw.json')).json()) as {
      assetGroups: { installMode: string; urls: string[] }[];
    };
    return manifest.assetGroups
      .filter((group) => group.installMode === 'prefetch')
      .reduce((total, group) => total + group.urls.length, 0);
  });
}

/** Files already in the service worker's caches. */
async function cachedFiles(page: Page): Promise<number> {
  return page.evaluate(async () => {
    let total = 0;
    for (const name of await caches.keys()) {
      if (name.includes(':assets:') && name.endsWith(':cache')) {
        total += (await (await caches.open(name)).keys()).length;
      }
    }
    return total;
  });
}

/** The first visit, online: waits until the whole app is cached and the page is controlled. */
async function installOnline(page: Page): Promise<void> {
  await page.goto('/');
  const files = await expectedFiles(page);
  await expect.poll(() => cachedFiles(page), { timeout: 30_000 }).toBeGreaterThanOrEqual(files);
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
}

/** Moves of the game in progress saved for `gameId` in IndexedDB; observed, never driven. */
async function savedMoves(page: Page, gameId: string): Promise<number> {
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
            const playing = games.filter((game) => game.gameId === id && game.result === null);
            db.close();
            resolve(Math.max(0, ...playing.map((game) => game.moves.length)));
          };
          all.onerror = () => resolve(0);
        };
      }),
    gameId,
  );
}

/** Switches the game on screen to the computer at a level (named after its train). */
async function againstComputer(page: Page, train: string): Promise<void> {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('tab', { name: 'Players' }).click();
  await page.getByRole('radio', { name: 'Against the opponent' }).check();
  await page.getByRole('radio', { name: train }).check();
  await page.getByRole('button', { name: 'Close settings' }).click();
}

test('the app reopens offline and every game plays against the computer', async ({
  page,
  context,
}) => {
  await installOnline(page);
  await context.setOffline(true);

  // Super 3T at the advanced level, never opened before: its Worker comes from the cache.
  await page.goto('/super-3t');
  await againstComputer(page, 'Master');
  const open = page.getByRole('button', { name: 'Open board 5' });
  const center = page.getByRole('button', { name: /^Board 5, cell 5,/ });
  await expect(center.or(open).first()).toBeVisible();
  if (await open.isVisible()) {
    await open.click();
  }
  await center.click();
  await expect(page.getByText(/^Master played cell \d/)).toBeVisible();

  // The classic game at the intermediate level.
  await page.goto('/classic');
  await againstComputer(page, 'Veteran');
  await page
    .getByRole('button', { name: /^Cell \d, empty$/ })
    .first()
    .click();
  await expect(page.getByText(/^Veteran played cell \d/)).toBeVisible();

  // Dots and Boxes at the beginner level.
  await page.goto('/dots');
  await againstComputer(page, 'Rookie');
  await page
    .getByRole('button', { name: /, free$/ })
    .first()
    .click({ force: true });
  await expect(page.getByText(/^Rookie drew a line/).first()).toBeVisible();

  // And the history, by a deep link.
  await page.goto('/dots/history');
  await expect(page.getByRole('heading', { name: 'Boxes history' })).toBeVisible();
});

test('a game played offline is still there after an offline reload', async ({ page, context }) => {
  await installOnline(page);
  await context.setOffline(true);
  await page.goto('/classic');
  await page.getByRole('button', { name: 'Cell 5, empty' }).click();
  // Saving is asynchronous: wait for the move to be written before reloading.
  await expect.poll(() => savedMoves(page, 'classic')).toBe(1);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Cell 5, X' })).toBeVisible();
});
