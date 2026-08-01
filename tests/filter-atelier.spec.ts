import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#atelier');
  await expect(page.locator('#filter-atelier')).toBeVisible();
});

test('atelier is an isolated authoring mode', async ({ page }) => {
  await expect(page.locator('body')).toHaveAttribute(
    'data-atelier-open',
    'true',
  );
  await expect(page.locator('main')).toBeHidden();
  await expect(page.locator('main')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.site-header')).toBeHidden();
  await expect(
    page.getByRole('heading', {
      name: 'Shape the material. Preserve the source.',
    }),
  ).toBeVisible();
});

test('canonical preset loads valid and exportable', async ({ page }) => {
  const controls = page.locator(
    '#filter-atelier input[data-parameter-key]',
  );
  const azimuth = page.locator(
    'input[data-parameter-key="azimuth"]',
  );

  await expect(controls).toHaveCount(5);
  await expect(azimuth).toHaveValue('250');
  await expect(azimuth).toHaveAttribute('step', '5');
  await expect(page.locator('[data-atelier-validation]')).toContainText(
    'Valid draft',
  );
  await expect(
    page.getByRole('button', { name: 'Export candidate' }),
  ).toBeEnabled();
  await expect(
    page.locator('[data-testid="atelier-candidate-json"]'),
  ).toContainText('melodicbloom.svg-filter-preset-candidate/0.1');
  await expect(
    page.locator('[data-atelier-candidate-details]'),
  ).not.toHaveAttribute('open', '');
});

test('invalid edit pauses preview and reset restores a valid canonical draft', async ({
  page,
}) => {
  const azimuth = page.locator(
    'input[data-parameter-key="azimuth"]',
  );
  const row = page.locator('[data-control-key="azimuth"]');

  await azimuth.fill('252');

  await expect(page.locator('#filter-atelier')).toHaveAttribute(
    'data-dirty',
    'true',
  );
  await expect(row).toHaveAttribute('data-invalid', 'true');
  await expect(row).toContainText('must align to 5° increments');
  await expect(page.locator('[data-atelier-preview]')).toHaveAttribute(
    'data-invalid',
    'true',
  );
  await expect(
    page.getByRole('button', { name: 'Export candidate' }),
  ).toBeDisabled();

  await page.getByRole('button', { name: 'Reset draft' }).click();

  await expect(azimuth).toHaveValue('250');
  await expect(row).toHaveAttribute('data-invalid', 'false');
  await expect(page.locator('[data-atelier-preview]')).toHaveAttribute(
    'data-invalid',
    'false',
  );
  await expect(page.locator('#filter-atelier')).toHaveAttribute(
    'data-dirty',
    'false',
  );
  await expect(
    page.getByRole('button', { name: 'Export candidate' }),
  ).toBeEnabled();
});

test('out-of-range values show field-level feedback', async ({ page }) => {
  const surfaceScale = page.locator(
    'input[data-parameter-key="surface-scale"]',
  );
  const row = page.locator('[data-control-key="surface-scale"]');

  await surfaceScale.fill('11');

  await expect(row).toHaveAttribute('data-invalid', 'true');
  await expect(row).toContainText('must be no more than 10');
  await expect(surfaceScale).toHaveAttribute('aria-invalid', 'true');
  await expect(
    page.getByRole('button', { name: 'Export candidate' }),
  ).toBeDisabled();
});

test('candidate download is deterministic and review-gated', async ({
  page,
}) => {
  const downloadPromise = page.waitForEvent('download');

  await page.getByRole('button', { name: 'Export candidate' }).click();

  const download = await downloadPromise;
  const stream = await download.createReadStream();

  if (!stream) {
    throw new Error('Playwright did not expose the candidate download stream.');
  }

  let content = '';
  for await (const chunk of stream) content += chunk.toString();

  const candidate = JSON.parse(content);
  expect(candidate.governance).toEqual({
    canonicalMutation: false,
    requiresHumanReview: true,
    status: 'draft',
  });
  expect(candidate.candidate.values.azimuth).toBe(250);
  expect(content).not.toContain('generatedAt');
  expect(content).not.toContain('timestamp');
});

test('closing atelier restores the site surface', async ({ page }) => {
  await page.getByRole('button', { name: 'Close atelier' }).first().click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#filter-atelier')).toBeHidden();
  await expect(page.locator('body')).not.toHaveAttribute(
    'data-atelier-open',
    'true',
  );
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('main')).not.toHaveAttribute(
    'aria-hidden',
    'true',
  );
});

test('mobile hierarchy puts preview before controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const preview = await page.locator('.filter-atelier__preview-panel').boundingBox();
  const controls = await page.locator('.filter-atelier__controls-panel').boundingBox();

  if (!preview || !controls) {
    throw new Error('Atelier panels were not measurable.');
  }

  expect(preview.y).toBeLessThan(controls.y);
});

test('material filters are clipped to inner swatch layers', async ({ page }) => {
  await page.getByRole('button', { name: 'Close atelier' }).first().click();
  await page.locator('#materials').scrollIntoViewIfNeeded();

  const result = await page.locator('.material-satin').evaluate((card) => {
    const swatch = card.querySelector<HTMLElement>('.material-swatch');
    const layer = card.querySelector<HTMLElement>(
      '.material-swatch > span.has-atlas-material-filter',
    );
    const content = card.querySelector<HTMLElement>('div:last-child');

    if (!swatch || !layer || !content) {
      throw new Error('Material containment structure is incomplete.');
    }

    return {
      overflow: getComputedStyle(swatch).overflow,
      contain: getComputedStyle(swatch).contain,
      layerFilter: getComputedStyle(layer).filter,
      contentFilter: getComputedStyle(content).filter,
      layerParentIsSwatch: layer.parentElement === swatch,
    };
  });

  expect(result.overflow).toBe('hidden');
  expect(result.contain).toContain('paint');
  expect(result.layerFilter).not.toBe('none');
  expect(result.contentFilter).toBe('none');
  expect(result.layerParentIsSwatch).toBe(true);
});
