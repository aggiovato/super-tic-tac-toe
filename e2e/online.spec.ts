import { type Browser, expect, type Page, test, type WebSocketRoute } from '@playwright/test';

// Two players on two browsers (two contexts: separate storage, as on two devices) play the classic
// game online through the API Worker (wrangler dev behind /api), lose the connection, retry and
// converge on one result.

const PREFERENCES = 'super-ttt.preferences';

const status = (page: Page) => page.getByRole('status');
const cell = (page: Page, at: number) =>
  page.getByRole('button', { name: new RegExp(`^Cell ${at + 1},`) });
const online = (page: Page) => page.getByRole('region', { name: 'Online' });
/** All well in the room: the masthead's room button says so (the panel then stays away). */
const allWell = (page: Page) => page.getByRole('button', { name: 'Room: all well' });
/** Opens the room's details from the masthead button. */
/** What the room says, in the masthead button's name (on phones the page shows no panel). */
const roomSays = (page: Page, note: string) =>
  expect(page.getByRole('button', { name: /^Room: / })).toHaveAccessibleName(`Room: ${note}`);
const openRoom = (page: Page) => page.getByRole('button', { name: /^Room: / }).click();
const firstScore = (page: Page) => page.locator('app-score-board dd .sr-only').first();

/**
 * A device (a browser context: its own storage, so its own seat) with the how-to-play ticket
 * already seen. Its room sockets pass through the test: `drop()` cuts this device off, as a lost
 * network does (the server is not told), and refuses new sockets until `restore()`.
 */
async function device(browser: Browser) {
  // Each device its own client address, as two real devices have: the API limits rooms created
  // and joined per address and minute, and every local request would otherwise share one. Against
  // a deployed version (E2E_BASE_URL) Cloudflare sets the real address, so nothing is added.
  const context = await browser.newContext(
    process.env['E2E_BASE_URL']
      ? {}
      : { extraHTTPHeaders: { 'cf-connecting-ip': `e2e-${crypto.randomUUID()}` } },
  );
  await context.addInitScript((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({ seenTutorials: ['super-3t', 'classic', 'dots', 'fleet'] }),
    );
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
  // Nobody plays before the rival is in: the board takes no move meanwhile.
  await expect(cell(host.page, 0)).toBeDisabled();
  const link = await online(host.page).getByRole('textbox', { name: 'Room link' }).inputValue();
  expect(link).toBe(host.page.url());

  // The guest opens the invitation and takes the other seat.
  await guest.page.goto(link);
  for (const { page } of [host, guest]) {
    await expect(allWell(page)).toBeVisible();
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
  await roomSays(host.page, 'Offline. Trying again…');
  await cell(host.page, 1).click();
  await expect(cell(host.page, 1)).toHaveAccessibleName(/^Cell 2, X/);
  await expect(cell(guest.page, 1)).toHaveAccessibleName(/^Cell 2, empty/);

  // Back online, the socket comes back by itself and the move reaches the guest once.
  host.restore();
  await expect(cell(guest.page, 1)).toHaveAccessibleName(/^Cell 2, X/, { timeout: 15_000 });
  await expect(allWell(host.page)).toBeVisible();

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
  await roomSays(host.page, 'Your rival lost the connection. Waiting for them.');
  guest.page = await guest.context.newPage();
  await guest.page.goto(link);
  await expect(status(guest.page)).toHaveText('Game over. X wins.');
  await expect(firstScore(guest.page)).toHaveText('01');
  await expect(allWell(host.page)).toBeVisible();

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
  await expect(allWell(guest.page)).toBeVisible();

  // The history opens over the room: the host never leaves it.
  await host.page.getByRole('button', { name: 'History' }).click();
  await expect(host.page.getByRole('dialog', { name: 'Classic history' })).toBeVisible();
  await host.page.keyboard.press('Escape');
  await expect(host.page).toHaveURL(/\/classic\/online\/[^/]+$/);
  await expect(allWell(host.page)).toBeVisible();

  // The host goes to another game and back: the room waits for them, and so does their rival.
  await host.page.getByRole('button', { name: 'Games' }).click();
  await host.page.getByRole('link', { name: /^Boxes/ }).click();
  await expect(host.page).toHaveURL(/\/dots$/);
  await roomSays(guest.page, 'Your rival lost the connection. Waiting for them.');
  await host.page.goBack();
  await expect(online(host.page)).toContainText('You left this room.');
  await expect(cell(host.page, 0)).toBeDisabled();
  await online(host.page).getByRole('button', { name: 'Back to the room' }).click();
  await expect(allWell(guest.page)).toBeVisible();
  await cell(host.page, 4).click();
  await expect(cell(guest.page, 4)).toHaveAccessibleName(/^Cell 5, X/);

  // "Leave the room" replaces its entry: the back button does not reopen it.
  await openRoom(host.page);
  await online(host.page).getByRole('link', { name: 'Leave the room' }).click();
  await expect(host.page).toHaveURL(/\/classic$/);
  await host.page.goBack();
  await expect(host.page).not.toHaveURL(/online/);

  await host.context.close();
  await guest.context.close();
});

test('two browsers play ship sink online: both place at once and neither sees the other fleet', async ({
  browser,
}) => {
  const host = await device(browser);
  const guest = await device(browser);
  const enemy = (page: Page) => page.getByRole('group', { name: 'Enemy waters', exact: true });
  const why = (page: Page) =>
    page.getByRole('region', { name: 'Next turn' }).getByRole('paragraph');

  await host.page.goto('/fleet');
  await host.page.getByRole('button', { name: 'Settings' }).click();
  await host.page.getByRole('tab', { name: 'Players' }).click();
  await host.page.getByRole('radio', { name: 'Online room' }).check();
  await host.page.getByRole('button', { name: 'Invite someone online' }).click();
  await expect(host.page).toHaveURL(/\/fleet\/online\/[0-9a-f]{64}$/);
  // The fleet can be arranged while the rival is on the way, but not confirmed.
  await expect(host.page.getByRole('button', { name: 'Confirm fleet' })).toBeDisabled();
  const link = await online(host.page).getByRole('textbox', { name: 'Room link' }).inputValue();
  await guest.page.goto(link);
  for (const { page } of [host, guest]) {
    await expect(allWell(page)).toBeVisible();
  }

  // Both confirm their fleets, one right after the other: neither has to wait for the other.
  // Both place at once: no one's turn to tag. Once the host has placed, only the guest may move,
  // and the score says so on each device.
  await host.page.getByRole('button', { name: 'Confirm fleet' }).click();
  await expect(host.page.locator('app-score-board .turn.on')).toHaveText('THEIR TURN');
  await expect(guest.page.locator('app-score-board .turn.on')).toHaveText('YOUR TURN');
  await guest.page.getByRole('button', { name: 'Confirm fleet' }).click();
  for (const { page } of [host, guest]) {
    await expect(enemy(page)).toBeVisible();
    // The rival's fleet is nowhere on the page: no cell of the enemy waters shows a ship.
    await expect(enemy(page).getByRole('button', { name: /, ship$/ })).toHaveCount(0);
  }

  // The host plays X and fires first: aim, then fire. The guest hears where it landed.
  const a1 = enemy(host.page).getByRole('button', { name: /^A1,/ });
  await a1.click();
  await a1.click();
  await expect(a1).toHaveAccessibleName(/^A1, (miss|hit)$/);
  await expect(why(guest.page)).toHaveText(/^Rival (fires at|hits you at) A1/);
  // The guest cannot fire out of turn when the host hit: its waters stay untouched.
  if ((await a1.getAttribute('aria-label'))?.endsWith('hit')) {
    await expect(enemy(guest.page).getByRole('button', { name: /, (miss|hit)$/ })).toHaveCount(0);
  }

  await host.context.close();
  await guest.context.close();
});

test('two browsers chat in a room: unread on the button, the talk kept across a reconnection', async ({
  browser,
}) => {
  const host = await device(browser);
  const guest = await device(browser);
  const fab = (page: Page) => page.getByRole('button', { name: /^Chat/ });
  const chat = (page: Page) => page.getByRole('dialog', { name: 'Chat' });
  const write = async (page: Page, text: string) => {
    await chat(page).getByRole('textbox', { name: 'Write a message' }).fill(text);
    await chat(page).getByRole('textbox', { name: 'Write a message' }).press('Enter');
  };

  await host.page.goto('/classic');
  await host.page.getByRole('button', { name: 'Settings' }).click();
  await host.page.getByRole('tab', { name: 'Players' }).click();
  await host.page.getByRole('radio', { name: 'Online room' }).check();
  await host.page.getByRole('button', { name: 'Invite someone online' }).click();
  await expect(host.page).toHaveURL(/\/classic\/online\/[0-9a-f]{64}$/);
  const link = await online(host.page).getByRole('textbox', { name: 'Room link' }).inputValue();
  await guest.page.goto(link);
  for (const { page } of [host, guest]) {
    await expect(allWell(page)).toBeVisible();
  }

  // The guest writes; the host gets a glimpse of it and the button counts it unread.
  await fab(guest.page).click();
  await write(guest.page, 'Best of three?');
  await expect(chat(guest.page).getByText('Best of three?')).toBeVisible();
  await expect(host.page.getByRole('button', { name: 'Best of three?' })).toBeVisible();
  await expect(fab(host.page)).toHaveAccessibleName('Chat, 1 unread');

  // Opening the chat reads it; the reply reaches the guest, who has the chat open.
  await fab(host.page).click();
  await expect(chat(host.page).getByText('Best of three?')).toBeVisible();
  await write(host.page, 'Deal');
  await expect(chat(guest.page).getByText('Deal')).toBeVisible();
  await chat(host.page).getByRole('button', { name: 'Close' }).click();
  await expect(fab(host.page)).toHaveAccessibleName('Chat');

  // The host loses the connection: a message written meanwhile waits, and goes on reconnecting.
  await host.drop();
  await fab(host.page).click();
  await write(host.page, 'Still there?');
  await expect(chat(host.page).getByText('Sending…')).toBeVisible();
  host.restore();
  await expect(chat(guest.page).getByText('Still there?')).toBeVisible({ timeout: 15_000 });
  await expect(chat(host.page).getByText('Sending…')).toBeHidden();

  // A reload keeps the talk and what was read: nothing unread on the button.
  await host.page.reload();
  await expect(allWell(host.page)).toBeVisible();
  await expect(fab(host.page)).toHaveAccessibleName('Chat');
  await fab(host.page).click();
  for (const text of ['Best of three?', 'Deal', 'Still there?']) {
    await expect(chat(host.page).getByText(text)).toBeVisible();
  }

  await host.context.close();
  await guest.context.close();
});
