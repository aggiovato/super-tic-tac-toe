// Dots and Boxes: drawing lines, closing boxes, board sizes and the opponent.
import { expect, test, type Page } from '@playwright/test';
import { asReturningVisitor, status, PREFERENCES } from './support/game';

test.beforeEach(asReturningVisitor);

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
