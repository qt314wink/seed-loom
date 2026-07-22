import { expect, test } from '@playwright/test';

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nL8AAAAASUVORK5CYII=',
  'base64',
);

test('local intake creates traceable evidence and an exportable run', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start a run' }).click();

  const dialog = page.getByRole('dialog', {
    name: 'Begin with evidence, not inference.',
  });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Nothing leaves this browser.');

  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'fixture.png',
    mimeType: 'image/png',
    buffer: onePixelPng,
  });

  await expect(dialog.getByRole('status')).toContainText(
    'Source identity established',
  );
  await expect(dialog.locator('[data-technical-evidence]')).toContainText(
    'source.pixelWidth',
  );

  await dialog.getByRole('button', { name: 'Add observation' }).click();
  const observation = dialog.locator('[data-observation-row]').last();
  await observation.getByLabel('Predicate').fill('material.surface');
  await observation.getByLabel('Observed value').fill('woven linen');

  await expect(dialog.locator('[data-token-preview]')).toContainText(
    'observed.material.surface',
  );
  await expect(dialog.locator('[data-traceability]')).toHaveText('100%');

  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export run JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^seed-loom-run_.+\.json$/);

  const stream = await download.createReadStream();
  let content = '';

  for await (const chunk of stream) {
    content += chunk.toString();
  }

  const run = JSON.parse(content) as {
    run: { engine: string };
    source: { sha256: string };
    evidence: Array<{ predicate: string; method: string }>;
    tokens: Array<{ path: string; evidenceIds: string[] }>;
    verification: { traceabilityCoverage: number };
  };

  expect(run.run.engine).toBe('human-local');
  expect(run.source.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(run.evidence).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        predicate: 'material.surface',
        method: 'human-observation',
      }),
    ]),
  );
  expect(run.tokens).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: 'observed.material.surface',
        evidenceIds: expect.any(Array),
      }),
    ]),
  );
  expect(run.verification.traceabilityCoverage).toBe(1);
});

test('intake rejects unsupported files without creating a run', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start a run' }).click();

  const dialog = page.getByRole('dialog', {
    name: 'Begin with evidence, not inference.',
  });

  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not an image'),
  });

  await expect(dialog.getByRole('status')).toHaveText(
    'The selected file is not a supported image.',
  );
  await expect(
    dialog.getByRole('button', { name: 'Export run JSON' }),
  ).toBeDisabled();
});
