import { expect, test, type Page } from '@playwright/test';

const stages = ['evidence', 'interpretation', 'tokens', 'code', 'verification'] as const;
const materialAtlasCaptureStyle = `
  html { scroll-behavior: auto !important; }
  .site-header { display: none !important; }
  #materials {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: auto !important;
  }
  #app > main > :not(#materials), #app > footer { visibility: hidden !important; }
`;

function stagePanelCaptureStyle(width: number, top: number): string {
  return `
    html { scroll-behavior: auto !important; }
    .site-header { display: none !important; }
    #analyzer, .analyzer-grid { position: static !important; }
    .stage-panel {
      position: absolute !important;
      top: ${top}px !important;
      left: 0 !important;
      width: ${width}px !important;
    }
    #app > main > :not(#analyzer),
    #analyzer > :not(.analyzer-grid),
    .analyzer-grid > :not(.stage-panel),
    #app > footer { visibility: hidden !important; }
  `;
}

async function waitForBrandFonts(page: Page): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          try {
            const loadedFaces = await Promise.all([
              document.fonts.load('400 18px Manrope', 'Each swatch'),
              document.fonts.load('700 21px "Playfair Display"', 'Textures'),
              document.fonts.load('500 11px "DM Mono"', 'material.satin')
            ]);
            await document.fonts.ready;
            return loadedFaces.every(
              (faces) => faces.length > 0 && faces.every((face) => face.status === 'loaded')
            );
          } catch {
            return false;
          }
        }),
      { timeout: 15_000 }
    )
    .toBe(true);
}

async function scrollToDocumentOrigin(
  page: Page
): Promise<{ scrollX: number; scrollY: number; visualPageTop: number }> {
  return page.evaluate(async () => {
    window.scrollTo(0, 0);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
    return {
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      visualPageTop: window.visualViewport?.pageTop ?? window.scrollY
    };
  });
}

async function expectStagePanelScreenshot(
  page: Page,
  name: string
): Promise<void> {
  const stagePanel = page.locator('.stage-panel');
  await waitForBrandFonts(page);
  const preStyleBoundingBox = await stagePanel.boundingBox();
  expect(preStyleBoundingBox).not.toBeNull();
  const captureOrigin = await scrollToDocumentOrigin(page);
  expect(captureOrigin.scrollX).toBe(0);
  expect(captureOrigin.scrollY).toBe(0);
  const captureStyle = await page.addStyleTag({
    content: stagePanelCaptureStyle(preStyleBoundingBox!.width, captureOrigin.visualPageTop)
  });

  try {
    await expect(page.locator('.site-header')).toBeHidden();
    await waitForBrandFonts(page);

    const settledOrigin = await scrollToDocumentOrigin(page);
    expect(settledOrigin.scrollX).toBe(0);
    expect(settledOrigin.scrollY).toBe(0);
    expect(settledOrigin.visualPageTop).toBe(captureOrigin.visualPageTop);

    const postStyleBoundingBox = await stagePanel.boundingBox();
    expect(postStyleBoundingBox).not.toBeNull();
    expect(postStyleBoundingBox!.x).toBe(0);
    expect(postStyleBoundingBox!.y).toBe(0);
    expect(postStyleBoundingBox!.width).toBe(preStyleBoundingBox!.width);
    expect(postStyleBoundingBox!.height).toBe(preStyleBoundingBox!.height);

    await expect(stagePanel).toHaveScreenshot(name, {
      animations: 'disabled',
      maxDiffPixelRatio: 0.015
    });
  } finally {
    await captureStyle.evaluate((element) => element.remove());
  }
}

async function expectMaterialAtlasScreenshot(page: Page): Promise<void> {
  const materialAtlas = page.locator('#materials');
  await waitForBrandFonts(page);
  const preStyleBoundingBox = await materialAtlas.boundingBox();
  expect(preStyleBoundingBox).not.toBeNull();
  const captureStyle = await page.addStyleTag({ content: materialAtlasCaptureStyle });

  try {
    await expect(page.locator('.site-header')).toBeHidden();
    await waitForBrandFonts(page);

    const scrollY = await page.evaluate(async () => {
      window.scrollTo(0, 0);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      return window.scrollY;
    });
    expect(scrollY).toBe(0);

    const postStyleBoundingBox = await materialAtlas.boundingBox();
    expect(postStyleBoundingBox).not.toBeNull();
    expect(postStyleBoundingBox!.x).toBe(0);
    expect(postStyleBoundingBox!.y).toBe(0);
    expect(postStyleBoundingBox!.width).toBe(preStyleBoundingBox!.width);
    expect(postStyleBoundingBox!.height).toBe(preStyleBoundingBox!.height);

    await expect(materialAtlas).toHaveScreenshot('material-atlas.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.015
    });
  } finally {
    await captureStyle.evaluate((element) => element.remove());
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('homepage and complete material atlas remain visually stable', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /soft, thorned, and exact/i })).toBeVisible();
  await expect(page.locator('.material-card')).toHaveCount(12);
  await expectMaterialAtlasScreenshot(page);
});

for (const stage of stages) {
  test(`${stage} rib controls its live analyzer field`, async ({ page }) => {
    await page.locator('#analyzer').scrollIntoViewIfNeeded();
    await page.locator(`.stage-button[data-stage="${stage}"]`).click();
    await expect(page.locator('html')).toHaveAttribute('data-stage', stage);
    await expectStagePanelScreenshot(page, `stage-${stage}.png`);
  });
}

test('cactus rib tabs are keyboard navigable', async ({ page }) => {
  const first = page.locator('.rib[data-stage="evidence"]');
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.rib[data-stage="interpretation"]')).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-stage', 'interpretation');
});

test('mobile shell preserves material and analyzer legibility', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await expect(page).toHaveScreenshot('mobile-shell.png', {
    fullPage: true,
    animations: 'disabled',
    maxDiffPixelRatio: 0.02
  });
});
