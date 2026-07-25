import { expect, test } from '@playwright/test';

const twoPixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR4nGP8z/D/PwMDAwMTAxQAAC4IAwGyw9v6AAAAAElFTkSuQmCC',
  'base64',
);

test('local intake emits a canonical evidence-linked bundle', async ({ page }) => {
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
    buffer: twoPixelPng,
  });

  await expect(dialog.getByRole('status')).toContainText(
    'Source identity established',
  );
  await expect(dialog.locator('[data-technical-evidence]')).toContainText(
    'source.pixelWidth',
  );

  const addObservation = async (predicate: string, value: string) => {
    await dialog.getByRole('button', { name: 'Add observation' }).click();
    const observation = dialog.locator('[data-observation-row]').last();
    await observation.getByLabel('Predicate').fill(predicate);
    await observation.getByLabel('Observed value').fill(value);
  };

  await addObservation('material.surface', 'woven linen');
  await addObservation('color.accent', 'cyan; magenta; warm yellow highlights');
  await addObservation('geometry.grid', 'three columns by five rows of thumbnails');

  await expect(dialog.locator('[data-token-preview]')).toContainText(
    'observed.material.surface',
  );
  await expect(dialog.locator('[data-token-preview]')).toContainText(
    'derived.color.accent',
  );
  await expect(dialog.locator('[data-token-preview]')).toContainText(
    'derived.geometry.grid.columns',
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
    run: { id: string; version: string; engine: string };
    source: { id: string; sha256: string };
    execution: {
      application: string;
      mode: string;
      actor: string;
      networkTransfer: boolean;
    };
    evidence: Array<{
      id: string;
      predicate: string;
      method: string;
    }>;
    tokens: Array<{
      id: string;
      path: string;
      evidenceIds: string[];
      transformation?: { operation: string; sourcePath: string | string[] };
    }>;
    translations: Array<{ target: string; sourceTokenPaths: string[] }>;
    verification: {
      traceabilityCoverage: number;
      unsupportedClaims: number;
      checks: Array<{ id: string; status: string }>;
    };
  };

  expect(run.run.id).toMatch(/^run_[a-f0-9]{12}_\d{14}$/);
  expect(run.run.version).toBe('seed-loom.browser-intake.v0.2');
  expect(run.run.engine).toBe('human-observation');
  expect(run.source.id).toMatch(/^src_[a-f0-9]{16}$/);
  expect(run.source.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(run.execution).toMatchObject({
    application: 'Seed-Loom',
    mode: 'browser-local',
    actor: 'human-observer',
    networkTransfer: false,
  });
  expect(run.evidence).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: 'ev_material_surface',
        predicate: 'material.surface',
        method: 'human-observation',
      }),
    ]),
  );
  expect(run.tokens).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: 'tok_observed_material_surface',
        path: 'observed.material.surface',
        evidenceIds: ['ev_material_surface'],
      }),
      expect.objectContaining({
        id: 'tok_derived_color_accent',
        path: 'derived.color.accent',
        evidenceIds: ['ev_color_accent'],
        transformation: {
          operation: 'split-semicolon-list',
          sourcePath: 'observed.color.accent',
        },
      }),
      expect.objectContaining({
        path: 'derived.geometry.grid.columns',
        evidenceIds: ['ev_geometry_grid'],
        transformation: {
          operation: 'parse-grid-dimensions',
          sourcePath: 'observed.geometry.grid',
        },
      }),
    ]),
  );
  expect(run.translations[0]).toMatchObject({
    target: 'json',
    sourceTokenPaths: expect.arrayContaining([
      'observed.material.surface',
      'derived.color.accent',
    ]),
  });
  expect(run.verification.traceabilityCoverage).toBe(1);
  expect(run.verification.unsupportedClaims).toBe(0);
  expect(run.verification.checks).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'evidence-links', status: 'pass' }),
      expect.objectContaining({ id: 'derived-transformations', status: 'pass' }),
    ]),
  );
});

test('receipt separates source identity from execution metadata', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start a run' }).click();

  const dialog = page.getByRole('dialog', {
    name: 'Begin with evidence, not inference.',
  });

  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'fixture.png',
    mimeType: 'image/png',
    buffer: twoPixelPng,
  });
  await expect(dialog.getByRole('status')).toContainText('Source identity established');

  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export receipt' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^seed-loom-run_.+-receipt\.json$/);

  const stream = await download.createReadStream();
  let content = '';

  for await (const chunk of stream) {
    content += chunk.toString();
  }

  const receipt = JSON.parse(content) as {
    schemaVersion: string;
    source: { id: string; sha256: string };
    execution: { application: string; mode: string; networkTransfer: boolean };
    derivedTokenCount: number;
  };

  expect(receipt.schemaVersion).toBe('seed-loom.provenance-receipt.v0.2');
  expect(receipt.source.id).toMatch(/^src_[a-f0-9]{16}$/);
  expect(receipt.source.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(receipt.execution).toMatchObject({
    application: 'Seed-Loom',
    mode: 'browser-local',
    networkTransfer: false,
  });
  expect(receipt.derivedTokenCount).toBe(0);
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
