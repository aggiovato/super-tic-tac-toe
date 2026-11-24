import { type Browser, expect, type Page, test, type WebSocketRoute } from '@playwright/test';

// Two players on two browsers (two contexts: separate storage, as on two devices) play the classic
// game online through the API Worker (wrangler dev behind /api), lose the connection, retry and
// converge on one result.

const PREFERENCES = 'super-ttt.preferences';

const status = (page: Page) => page.getByRole('status');
const cell = (page: Page, at: number) =>
  page.getByRole('button', { name: new RegExp(`^Cell ${at + 1},`) });
const online = (page: Page) => page.getByRole('region', { name: 'Online' });
const firstScore = (page: Page) => page.locator('app-score-board dd .sr-only').first();

/**
 * A device (a browser context: its own storage, so its own seat) with the how-to-play ticket
 * already seen. Its room sockets pass through the test: `drop()` cuts this device off, as a lost
 * network does (the server is not told), and refuses new sockets until `restore()`.
 */
async function device(browser: Browser) {
  const context = await browser.newContext();
  await context.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({ seenTutorials: ['super-3t', 'classic', 'dots'] }));
  }, PREFERENCES);
  let down = false;
  let current: WebSocketRoute | null = null;
  await context.routeWebSocket(/\/api\/game-rooms\/.+\/socket/, (socket) => {
    if (down) {
      void socket.close({ code: 1006, reason: 'Offline (test)' });
      return;
    }
    current = socket;
    socket.connectToServer();
  });
  return {
    context,
    page: await context.newPage(),
    drop: async () => {
      down = true;
      await current?.close({ code: 1006, reason: 'Offline (test)' });
    },
    restore: () => {
      down = false;
    },
  };
}

test('two browsers play online, lose the connection, retry and converge on one result', async ({
  browser,
}) => {
  const host = await device(browser);
  const guest = await device(browser);

  // The host creates a room from the settings and gets its link.
  await host.page.goto('/classic');
  await host.page.getByRole('button', { name: 'Settings' }).click();
  await host.page.getByRole('tab', { name: 'Players' }).click();
  await host.page.getByRole('radio', { name: 'Online room' }).check();
  await host.page.getByRole('button', { name: 'Invite someone online' }).click();
  await expect(host.page).toHaveURL(/\/classic\/online\/[0-9a-f]{64}$/);
  await expect(online(host.page)).toContainText(/Rival\s*not in yet/);
  const link = await online(host.page).getByRole('textbox', { name: 'Room link' }).inputValue();
  expect(link).toBe(host.page.url());

  // The guest opens the invitation and takes the other seat.
  await guest.page.goto(link);
  for (const { page } of [host, guest]) {
    await expect(online(page)).toContainText(/Rival\s*connected/);
  }
  await expect(host.page.locator('app-score-board')).toContainText('You');
  await expect(host.page.locator('app-score-board')).toContainText('Rival');

  // The host plays X and opens; the guest cannot play out of turn.
  await cell(host.page, 0).click();
  await expect(cell(guest.page, 0)).toHaveAccessibleName(/^Cell 1, X/);
  await cell(guest.page, 3).click();
  await expect(cell(host.page, 3)).toHaveAccessibleName(/^Cell 4, O/);

  // The host loses the connection (the server only notices later, as with a real network): a
  // move made meanwhile shows at once and waits.
  await host.drop();
  await expect(online(host.page)).toContainText('Offline. Trying again…');
  await cell(host.page, 1).click();
  await expect(cell(host.page, 1)).toHaveAccessibleName(/^Cell 2, X/);
  await expect(cell(guest.page, 1)).toHaveAccessibleName(/^Cell 2, empty/);

  // Back online, the socket comes back by itself and the move reaches the guest once.
  host.restore();
  await expect(cell(guest.page, 1)).toHaveAccessibleName(/^Cell 2, X/, { timeout: 15_000 });
  await expect(online(host.page)).toContainText(/Rival\s*connected/);

  await cell(guest.page, 4).click();
  await expect(cell(host.page, 4)).toHaveAccessibleName(/^Cell 5, O/);
  await cell(host.page, 2).click();
  for (const { page } of [host, guest]) {
    await expect(status(page)).toHaveText('Game over. X wins.');
    await expect(firstScore(page)).toHaveText('01');
  }

  // The guest leaves (the tab closes) and the host sees it; the link brings them back to their
  // own seat, with the result counted once.
  await guest.page.close();
  await expect(online(host.page)).toContainText('Your rival lost the connection');
  guest.page = await guest.context.newPage();
  await guest.page.goto(link);
  await expect(status(guest.page)).toHaveText('Game over. X wins.');
  await expect(firstScore(guest.page)).toHaveText('01');
  await expect(online(host.page)).toContainText(/Rival\s*connected/);

  // The rematch swaps symbols: the guest plays X and opens.
  await host.page.getByRole('button', { name: 'Rematch' }).click();
  for (const { page } of [host, guest]) {
    await expect(page.getByRole('button', { name: /^Cell \d, empty$/ })).toHaveCount(9);
    await expect(firstScore(page)).toHaveText('01');
  }
  await cell(guest.page, 8).click();
  await expect(cell(host.page, 8)).toHaveAccessibleName(/^Cell 9, X/);

  await host.context.close();
  await guest.context.close();
});

test('an invitation to a room that does not exist says so and offers local play', async ({
  page,
}) => {
  await page.goto(`/classic/online/${'0'.repeat(64)}`);
  await expect(online(page)).toContainText('This room does not exist.');
  await online(page).getByRole('link', { name: 'Play on this device' }).click();
  await expect(page).toHaveURL(/\/classic$/);
});

test('the history opens over a room; coming back to a room left asks first, leaving skips it', async ({
  browser,
}) => {
  const host = await device(browser);
  const guest = await device(browser);
  await host.page.goto('/classic');
  await host.page.getByRole('button', { name: 'Settings' }).click();
  await host.page.getByRole('tab', { name: 'Players' }).click();
  await host.page.getByRole('radio', { name: 'Online room' }).check();
  await host.page.getByRole('button', { name: 'Invite someone online' }).click();
  await expect(host.page).toHaveURL(/\/classic\/online\//);
  const link = host.page.url();
  await guest.page.goto(link);
  await expect(online(guest.page)).toContainText('connected');

  // The history opens over the room: the host never leaves it.
  await host.page.getByRole('button', { name: 'History' }).click();
  await expect(host.page.getByRole('dialog', { name: 'Classic history' })).toBeVisible();
  await host.page.keyboard.press('Escape');
  await expect(host.page).toHaveURL(/\/classic\/online\/[^/]+$/);
  await expect(online(host.page)).toContainText('connected');

  // The host goes to another game and back: the room waits for them, and so does their rival.
  await host.page.getByRole('button', { name: 'Games' }).click();
  await host.page.getByRole('link', { name: /^Boxes/ }).click();
  await expect(host.page).toHaveURL(/\/dots$/);
  await expect(online(guest.page).getByText('offline')).toBeVisible();
  await host.page.goBack();
  await expect(online(host.page)).toContainText('You left this room.');
  await expect(cell(host.page, 0)).toBeDisabled();
  await online(host.page).getByRole('button', { name: 'Back to the room' }).click();
  await expect(online(guest.page).getByText('offline')).toBeHidden();
  await cell(host.page, 4).click();
  await expect(cell(guest.page, 4)).toHaveAccessibleName(/^Cell 5, X/);

  // "Leave the room" replaces its entry: the back button does not reopen it.
  await online(host.page).getByRole('link', { name: 'Leave the room' }).click();
  await expect(host.page).toHaveURL(/\/classic$/);
  await host.page.goBack();
  await expect(host.page).not.toHaveURL(/online/);

  await host.context.close();
  await guest.context.close();
});
