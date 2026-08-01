import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#atelier');
  await expect(page.locator('#filter-atelier')).toBeVisible();
});

test('controls derive from the canonical nacre recipe', async ({ page }) => {
  const controls = page.locator(
    '#filter-atelier input[data-parameter-key]',
  );

  await expect(controls).toHaveCount(5);
  await expect(
    page.getByRole('heading', {
      name: 'Deterministic candidate export',
    }),
  ).toBeVisible();

  await expect(
    page.locator('[data-testid="atelier-candidate-json"]'),
  ).toContainText(
    'melodicbloom.svg-filter-preset-candidate/0.1',
  );
});

test('draft updates preview and reset restores canonical values', async ({
  page,
}) => {
  const grainX = page.locator(
    'input[data-parameter-key="grain-x"]',
  );
  const initial = await grainX.inputValue();

  await grainX.fill('0.016');
  await expect(page.locator('#filter-atelier')).toHaveAttribute(
    'data-dirty',
    'true',
  );
  await expect(
    page.locator('[data-testid="atelier-candidate-json"]'),
  ).toContainText('"grain-x": 0.016');

  await page.getByRole('button', {
    name: 'Reset canonical preset',
  }).click();

  await expect(grainX).toHaveValue(initial);
  await expect(page.locator('#filter-atelier')).toHaveAttribute(
    'data-dirty',
    'false',
  );
});

test('invalid values block candidate export', async ({ page }) => {
  const surfaceScale = page.locator(
    'input[data-parameter-key="surface-scale"]',
  );

  await surfaceScale.fill('11');

  await expect(
    page.getByRole('button', {
      name: 'Export candidate JSON',
    }),
  ).toBeDisabled();

  await expect(
    page.locator('[data-atelier-validation]'),
  ).toContainText('above');
});

test('candidate download is deterministic and review-gated', async ({
  page,
}) => {
  const downloadPromise = page.waitForEvent('download');

  await page.getByRole('button', {
    name: 'Export candidate JSON',
  }).click();

  const download = await downloadPromise;
  const stream = await download.createReadStream();

  if (!stream) {
    throw new Error('Playwright did not expose the candidate download stream.');
  }

  let content = '';

  for await (const chunk of stream) {
    content += chunk.toString();
  }

  const candidate = JSON.parse(content);

  expect(candidate.governance).toEqual({
    canonicalMutation: false,
    requiresHumanReview: true,
    status: 'draft',
  });
  expect(content).not.toContain('generatedAt');
  expect(content).not.toContain('timestamp');
});
