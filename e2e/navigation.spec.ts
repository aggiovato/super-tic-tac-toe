import { expect, type Page, test } from '@playwright/test';

// Page changes: what the router's view transitions animate must keep its shape, and a game comes
// back already in place.

const PREFERENCES = 'super-ttt.preferences';

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({ seenTutorials: ['super-3t', 'classic', 'dots'] }));
  }, PREFERENCES);
});

/** Width of the element a page change animates as `page`, and the viewport's. */
function pageLayer(page: Page) {
  return page.evaluate(() => {
    const named = [...document.querySelectorAll('*')].filter(
      (element) => getComputedStyle(element).viewTransitionName === 'page',
    );
    return {
      count: named.length,
      width: named[0]?.getBoundingClientRect().width ?? 0,
      viewport: document.documentElement.clientWidth,
    };
  });
}

test('every page animates a full-width layer, so no snapshot is stretched into another', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The widths that differ are the wide-screen ones.');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/classic');
  await expect(page.getByRole('status')).toBeVisible();
  expect(await pageLayer(page)).toEqual({ count: 1, width: 1440, viewport: 1440 });
  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByRole('heading', { name: 'Classic history' })).toBeVisible();
  expect(await pageLayer(page)).toEqual({ count: 1, width: 1440, viewport: 1440 });
});

test('a game comes back from its history with its moves already on the first render', async ({
  page,
}) => {
  await page.goto('/classic');
  const cell = page.getByRole('button', { name: /^Cell 5,/ });
  await cell.click();
  await expect(cell).toHaveAccessibleName(/^Cell 5, X/);
  await page.getByRole('button', { name: 'History' }).click();
  await expect(page).toHaveURL(/\/classic\/history$/);
  // Every render of the board on the way back, recorded as it happens.
  await page.evaluate(() => {
    const seen: number[] = [];
    (window as unknown as { seen: number[] }).seen = seen;
    new MutationObserver(() => {
      const cells = document.querySelectorAll('app-classic-board [aria-label^="Cell"]');
      if (cells.length > 0) {
        seen.push(
          [...cells].filter((c) => (c.getAttribute('aria-label') ?? '').includes(' X')).length,
        );
      }
    }).observe(document.body, { subtree: true, childList: true, attributes: true });
  });
  await page.getByRole('button', { name: 'Back to the game' }).click();
  await expect(cell).toHaveAccessibleName(/^Cell 5, X/);
  const seen = await page.evaluate(() => (window as unknown as { seen: number[] }).seen);
  expect(seen.length).toBeGreaterThan(0);
  expect(seen.every((marks) => marks === 1)).toBe(true);
});
