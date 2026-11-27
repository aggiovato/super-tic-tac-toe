// How to play, the settings sheet on phones and the tactical challenges.
import { expect, test, type Page } from '@playwright/test';
import { asReturningVisitor, status, play, PREFERENCES } from './support/game';

test.beforeEach(asReturningVisitor);

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

test('Players groups who plays and their names; a room opens only from its invitation', async ({
  page,
}) => {
  await page.goto('/classic');
  await page.getByRole('button', { name: 'Settings' }).click();
  // Game holds the game's own settings and a new series, nothing about who plays.
  await expect(page.getByRole('tabpanel', { name: 'Game' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Two players' })).toHaveCount(0);

  await page.getByRole('tab', { name: 'Players' }).click();
  const panel = page.getByRole('tabpanel', { name: 'Players' });
  await expect(panel.getByRole('radio', { name: 'Two players' })).toBeChecked();
  await expect(panel.getByRole('textbox')).toHaveCount(2);

  await panel.getByRole('radio', { name: 'Against the opponent' }).check();
  await expect(panel.getByRole('radio', { name: 'Rookie' })).toBeChecked();
  await expect(panel.getByRole('textbox')).toHaveCount(1);

  // Choosing a room only offers the invitation: the game and its mode stay as they are.
  await panel.getByRole('radio', { name: 'Online room' }).check();
  await expect(panel.getByRole('button', { name: 'Invite someone online' })).toBeVisible();
  await expect(panel.getByRole('radio', { name: 'Rookie' })).toHaveCount(0);
  await expect(page).toHaveURL(/\/classic$/);
  await page.getByRole('button', { name: 'Close settings' }).click();
  await expect(page.locator('app-players dt').last()).toHaveText('Rookie, Beginner');
});
