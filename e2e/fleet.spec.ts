// Ship Sink: placing the fleet, aiming and firing, the computer's replies and resuming.
import { expect, test, type Page } from '@playwright/test';
import { asReturningVisitor, savedMoves, status } from './support/game';

test.beforeEach(asReturningVisitor);

const enemy = (page: Page) => page.getByRole('group', { name: 'Enemy waters', exact: true });
const enemyCell = (page: Page, name: string) =>
  enemy(page).getByRole('button', { name: new RegExp(`^${name},`) });
const ROWS = 'ABCDEFGHIJ';
/** The sentence under the departure row. */
const why = (page: Page) => page.getByRole('region', { name: 'Next turn' }).getByRole('paragraph');

/** Places the dealt fleet, after shuffling and turning a ship. */
async function placeFleet(page: Page): Promise<void> {
  await expect(why(page)).toHaveText(/^Tap a ship, then its new spot/);
  await page.getByRole('button', { name: 'Shuffle' }).click();
  await page.getByRole('button', { name: 'Turn' }).click();
  await page.getByRole('button', { name: 'Confirm fleet' }).click();
  await expect(enemy(page)).toBeVisible();
}

/**
 * Fires (two taps: aim, then fire) at the cells in reading order that were not fired at, until a
 * miss passes the turn and the computer answers.
 */
async function fireUntilAnswered(page: Page): Promise<void> {
  for (let i = 0; i < 100; i++) {
    const name = `${ROWS[Math.floor(i / 10)]}${(i % 10) + 1}`;
    const target = enemyCell(page, name);
    if (!(await target.getAttribute('aria-label'))?.endsWith('not fired at')) continue;
    await target.click();
    await expect(why(page)).toHaveText(new RegExp(`^Aiming at ${name}\\.`));
    await target.click();
    await expect(target).not.toHaveAccessibleName(/not fired at$/);
    if ((await target.getAttribute('aria-label'))?.endsWith('miss')) break;
  }
  // The computer fires until it misses, and the turn comes back.
  await expect(why(page)).toHaveText(/ fires at .*: miss\. Your turn\.$/);
}

test.describe('ship sink', () => {
  test('is played against the computer, never by two people on one screen', async ({ page }) => {
    await page.goto('/fleet');
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('tab', { name: 'Players' }).click();
    await expect(page.getByRole('radio', { name: 'Against the opponent' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Two players' })).toHaveCount(0);
    await expect(page.getByRole('radio', { name: 'Online room' })).toHaveCount(0);
  });

  test('places the fleet, fires, hears the computer and resumes after a reload', async ({
    page,
  }) => {
    await page.goto('/fleet');
    await placeFleet(page);
    await expect(why(page)).toHaveText('Your turn: pick a cell in the enemy waters.');
    // Nothing of the computer's fleet is on the page, and there is no undo to peek with.
    await expect(enemy(page).getByRole('button', { name: /, ship$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Undo' })).toHaveCount(0);

    await fireUntilAnswered(page);
    const fired = await enemy(page)
      .getByRole('button', { name: /, (miss|hit|sunk)$/ })
      .count();
    expect(fired).toBeGreaterThan(0);
    await expect.poll(() => savedMoves(page, 'fleet')).toBeGreaterThan(fired + 1);

    await page.reload();
    await expect(enemy(page).getByRole('button', { name: /, (miss|hit|sunk)$/ })).toHaveCount(
      fired,
    );
    await expect(status(page)).toContainText('Rival fleet');
  });

  test('aims with the arrows and fires with Enter', async ({ page }) => {
    await page.goto('/fleet');
    await placeFleet(page);
    await enemy(page).locator('[tabindex="0"]').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await expect(why(page)).toHaveText(/^Aiming at B2\./);
    await page.keyboard.press('Enter');
    await expect(enemyCell(page, 'B2')).toHaveAccessibleName(/^B2, (miss|hit)$/);
  });
});
