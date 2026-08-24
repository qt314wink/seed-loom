import { expect, test } from '@playwright/test';

const stages = ['evidence', 'interpretation', 'tokens', 'code', 'verification'] as const;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('homepage and complete material atlas remain visually stable', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /soft, thorned, and exact/i })).toBeVisible();
  await page.locator('#materials').scrollIntoViewIfNeeded();
  await expect(page.locator('.material-card')).toHaveCount(12);
  await expect(page.locator('#materials')).toHaveScreenshot('material-atlas.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.015
  });
});

for (const stage of stages) {
  test(`${stage} rib controls its live analyzer field`, async ({ page }) => {
    await page.locator('#analyzer').scrollIntoViewIfNeeded();
    await page.locator(`.stage-button[data-stage="${stage}"]`).click();
    await expect(page.locator('html')).toHaveAttribute('data-stage', stage);
    await expect(page.locator('.stage-panel')).toHaveScreenshot(`stage-${stage}.png`, {
      animations: 'disabled',
      maxDiffPixelRatio: 0.015
    });
  });
}

test('cactus rib tabs are keyboard navigable', async ({ page }) => {
  const first = page.locator('.rib[data-stage="evidence"]');
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.rib[data-stage="interpretation"]')).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-stage', 'interpretation');
});

test('obligations compile into a gated build order', async ({ page }) => {
  await page.locator('#orders').scrollIntoViewIfNeeded();
  await expect(page.locator('#build-order-list > li')).toHaveCount(3);
  await page.getByLabel('Meet the handoff').check();
  await expect(page.locator('#order-readiness')).toHaveText('4 obligations');
  await expect(page.locator('#build-order-list > li')).toHaveCount(4);
  await expect(page.locator('#build-order-list > li').last()).toContainText('Protect access');
  await page.getByRole('button', { name: 'Build the order' }).click();
  await expect(page.locator('.build-order')).toBeFocused();
});

test('mobile shell preserves material and analyzer legibility', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await expect(page).toHaveScreenshot('mobile-shell.png', {
    fullPage: true,
    animations: 'disabled',
    maxDiffPixelRatio: 0.02
  });
});
