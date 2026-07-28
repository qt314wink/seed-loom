import './intake.css';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type EvidenceMethod = 'browser-file-api' | 'human-observation';

type EvidenceClaim = {
  id: string;
  predicate: string;
  value: JsonValue;
  confidence: number;
  regionIds: string[];
  method: EvidenceMethod;
};

type Transformation = {
  operation: string;
  sourcePath: string | string[];
};

type AnalyzerToken = {
  id: string;
  path: string;
  value: JsonValue;
  class: 'primitive' | 'semantic';
  evidenceIds: string[];
  confidence: number;
  transformation?: Transformation;
};

type Interpretation = {
  id: string;
  predicate: string;
  claim: string;
  qualification: string;
  evidenceIds: string[];
  confidence: number;
  method: 'human-inference';
};

type SourceRecord = {
  id: string;
  kind: 'image';
  name: string;
  mediaType: string;
  byteLength: number;
  width: number;
  height: number;
  sha256: string;
  uri: null;
  regions: [];
};

type ExecutionRecord = {
  application: 'Seed-Loom';
  applicationUrl: string;
  mode: 'browser-local';
  actor: 'human-observer';
  networkTransfer: false;
};

type CaptureContext = {
  tabId?: number;
  relatedTabId?: number;
  duplicatePresence?: boolean;
};

type BrowserAnalyzerRun = {
  run: {
    id: string;
    version: 'seed-loom.browser-intake.v0.2';
    createdAt: string;
    engine: 'human-observation';
    parentRunId: null;
  };
  source: SourceRecord;
  execution: ExecutionRecord;
  captureContext?: CaptureContext;
  evidence: EvidenceClaim[];
  interpretations: Interpretation[];
  tokens: AnalyzerToken[];
  translations: Array<{
    target: 'json';
    artifact: { format: 'seed-loom-evidence-bundle' };
    sourceTokenPaths: string[];
  }>;
  verification: {
    traceabilityCoverage: number;
    unsupportedClaims: number;
    checks: Array<{
      id: string;
      status: 'pass' | 'warning';
      message: string;
    }>;
  };
};

type RunReceipt = {
  schemaVersion: 'seed-loom.provenance-receipt.v0.2';
  runId: string;
  generatedAt: string;
  source: Pick<SourceRecord, 'id' | 'kind' | 'name' | 'mediaType' | 'sha256'>;
  execution: ExecutionRecord;
  evidenceCount: number;
  tokenCount: number;
  derivedTokenCount: number;
  traceabilityCoverage: number;
  unsupportedClaims: number;
  checks: BrowserAnalyzerRun['verification']['checks'];
  statement: string;
};

type ObservationDraft = {
  uiId: string;
  predicate: string;
  value: string;
  confidence: number;
};

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const startButton = document.querySelector<HTMLButtonElement>('.small-action');

if (!startButton) {
  throw new Error('The Seed-Loom start-run control was not found.');
}

startButton.setAttribute('aria-haspopup', 'dialog');
startButton.setAttribute('aria-controls', 'run-intake-dialog');

const dialog = document.createElement('dialog');
dialog.id = 'run-intake-dialog';
dialog.className = 'run-dialog';
dialog.setAttribute('aria-labelledby', 'run-dialog-title');
dialog.innerHTML = `
  <form class="run-shell" method="dialog">
    <header class="run-header">
      <div>
        <p class="run-kicker">Local-first intake · Stage 00</p>
        <h2 id="run-dialog-title">Begin with evidence, not inference.</h2>
        <p>
          Select an image, establish its immutable identity, then add only
          observations that can be defended. Nothing leaves this browser.
        </p>
      </div>
      <button class="run-icon-button" type="button" data-close-run aria-label="Close analyzer run">×</button>
    </header>

    <div class="run-grid">
      <section class="run-source" aria-labelledby="run-source-title">
        <div class="run-section-heading">
          <span>01</span>
          <div>
            <h3 id="run-source-title">Source evidence</h3>
            <p>File metadata is captured deterministically.</p>
          </div>
        </div>

        <label class="run-dropzone">
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-run-file />
          <strong>Select an image</strong>
          <span>PNG, JPEG, WebP, or GIF · maximum 25 MB</span>
        </label>

        <p class="run-status" data-run-status role="status">No source selected.</p>

        <figure class="run-preview" hidden data-run-preview-wrap>
          <img alt="Selected source preview" data-run-preview />
          <figcaption data-run-source-summary></figcaption>
        </figure>

        <dl class="run-evidence-list" data-technical-evidence></dl>
      </section>

      <section class="run-observations" aria-labelledby="run-observations-title">
        <div class="run-section-heading">
          <span>02</span>
          <div>
            <h3 id="run-observations-title">Human observations</h3>
            <p>Editable claims remain distinct from automated metadata.</p>
          </div>
        </div>

        <div class="run-empty" data-observation-empty>
          Add a claim such as <code>material.surface</code> → <code>woven linen</code>.
        </div>

        <div class="run-observation-list" data-observation-list></div>

        <button class="run-secondary-button" type="button" data-add-observation disabled>
          Add observation
        </button>
      </section>
    </div>

    <section class="run-output" aria-labelledby="run-output-title">
      <div class="run-section-heading">
        <span>03</span>
        <div>
          <h3 id="run-output-title">Compiled trace</h3>
          <p>Every token must point back to evidence.</p>
        </div>
      </div>

      <div class="run-metrics">
        <article><strong data-evidence-count>0</strong><span>evidence claims</span></article>
        <article><strong data-token-count>0</strong><span>compiled tokens</span></article>
        <article><strong data-traceability>—</strong><span>traceability</span></article>
      </div>

      <pre class="run-token-preview" data-token-preview aria-label="Compiled token preview">Select a source to begin.</pre>
    </section>

    <footer class="run-footer">
      <button class="run-text-button" type="button" data-reset-run>Reset run</button>
      <div>
        <button class="run-secondary-button" type="button" data-export-receipt disabled>
          Export receipt
        </button>
        <button class="run-primary-button" type="button" data-export-run disabled>
          Export run JSON
        </button>
      </div>
    </footer>
  </form>
`;

document.body.append(dialog);

const fileInput = requireElement<HTMLInputElement>('[data-run-file]');
const status = requireElement<HTMLElement>('[data-run-status]');
const previewWrap = requireElement<HTMLElement>('[data-run-preview-wrap]');
const preview = requireElement<HTMLImageElement>('[data-run-preview]');
const sourceSummary = requireElement<HTMLElement>('[data-run-source-summary]');
const technicalEvidence = requireElement<HTMLElement>('[data-technical-evidence]');
const observationList = requireElement<HTMLElement>('[data-observation-list]');
const observationEmpty = requireElement<HTMLElement>('[data-observation-empty]');
const addObservationButton = requireElement<HTMLButtonElement>('[data-add-observation]');
const exportRunButton = requireElement<HTMLButtonElement>('[data-export-run]');
const exportReceiptButton = requireElement<HTMLButtonElement>('[data-export-receipt]');
const evidenceCount = requireElement<HTMLElement>('[data-evidence-count]');
const tokenCount = requireElement<HTMLElement>('[data-token-count]');
const traceability = requireElement<HTMLElement>('[data-traceability]');
const tokenPreview = requireElement<HTMLElement>('[data-token-preview]');

let createdAt = new Date().toISOString();
let source: SourceRecord | null = null;
let metadataEvidence: EvidenceClaim[] = [];
let observations: ObservationDraft[] = [];
let previewUrl: string | null = null;
let nextDraftIndex = 1;

startButton.addEventListener('click', () => {
  dialog.showModal();
  fileInput.focus();
});

dialog.querySelector('[data-close-run]')?.addEventListener('click', () => {
  dialog.close();
});

dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) {
    return;
  }

  const bounds = dialog.getBoundingClientRect();
  const outside =
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom;

  if (outside) {
    dialog.close();
  }
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith('image/')) {
    setStatus('The selected file is not a supported image.', true);
    return;
  }

  if (file.size > MAX_FILE_BYTES) {
    setStatus('The selected image exceeds the 25 MB intake limit.', true);
    return;
  }

  setStatus('Reading source evidence…');
  fileInput.disabled = true;

  try {
    const [sha256, dimensions] = await Promise.all([
      digestFile(file),
      readImageDimensions(file),
    ]);

    createdAt = new Date().toISOString();
    observations = [];
    nextDraftIndex = 1;
    source = {
      id: `src_${sha256.slice(0, 16)}`,
      kind: 'image',
      name: file.name,
      mediaType: file.type || 'application/octet-stream',
      byteLength: file.size,
      width: dimensions.width,
      height: dimensions.height,
      sha256,
      uri: null,
      regions: [],
    };
    metadataEvidence = createMetadataEvidence(source);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    previewUrl = URL.createObjectURL(file);
    preview.src = previewUrl;
    previewWrap.hidden = false;
    sourceSummary.textContent = `${file.name} · ${dimensions.width} × ${dimensions.height} px`;
    addObservationButton.disabled = false;
    exportRunButton.disabled = false;
    exportReceiptButton.disabled = false;
    setStatus('Source identity established. Add defensible observations.');
    renderAll();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
  } finally {
    fileInput.disabled = false;
  }
});

addObservationButton.addEventListener('click', () => {
  observations.push({
    uiId: `draft_${nextDraftIndex}`,
    predicate: '',
    value: '',
    confidence: 1,
  });
  nextDraftIndex += 1;
  renderObservations();
  renderOutput();
  observationList
    .querySelector<HTMLInputElement>('[data-observation-row]:last-child [data-predicate]')
    ?.focus();
});

observationList.addEventListener('input', (event) => {
  const input = event.target as HTMLInputElement;
  const row = input.closest<HTMLElement>('[data-observation-row]');
  const uiId = row?.dataset.observationId;
  const observation = observations.find((candidate) => candidate.uiId === uiId);

  if (!observation) {
    return;
  }

  if (input.matches('[data-predicate]')) {
    observation.predicate = input.value;
  } else if (input.matches('[data-value]')) {
    observation.value = input.value;
  } else if (input.matches('[data-confidence]')) {
    observation.confidence = Number(input.value);
    row?.querySelector<HTMLElement>('[data-confidence-value]')?.replaceChildren(
      document.createTextNode(`${Math.round(observation.confidence * 100)}%`),
    );
  }

  renderOutput();
});

observationList.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
    '[data-remove-observation]',
  );
  const row = button?.closest<HTMLElement>('[data-observation-row]');
  const uiId = row?.dataset.observationId;

  if (!uiId) {
    return;
  }

  observations = observations.filter((candidate) => candidate.uiId !== uiId);
  renderObservations();
  renderOutput();
});

dialog.querySelector('[data-reset-run]')?.addEventListener('click', resetRun);

exportRunButton.addEventListener('click', () => {
  const run = buildRun();

  if (run) {
    downloadJson(`seed-loom-${run.run.id}.json`, run);
  }
});

exportReceiptButton.addEventListener('click', () => {
  const run = buildRun();

  if (run) {
    downloadJson(`seed-loom-${run.run.id}-receipt.json`, createReceipt(run));
  }
});

function renderAll(): void {
  renderTechnicalEvidence();
  renderObservations();
  renderOutput();
}

function renderTechnicalEvidence(): void {
  technicalEvidence.replaceChildren();

  for (const claim of metadataEvidence) {
    const term = document.createElement('dt');
    term.textContent = claim.predicate;
    const detail = document.createElement('dd');
    detail.textContent = String(claim.value);
    technicalEvidence.append(term, detail);
  }
}

function renderObservations(): void {
  observationList.replaceChildren();
  observationEmpty.hidden = observations.length > 0;

  for (const observation of observations) {
    const row = document.createElement('article');
    row.className = 'run-observation-row';
    row.dataset.observationRow = '';
    row.dataset.observationId = observation.uiId;

    const predicateLabel = document.createElement('label');
    predicateLabel.textContent = 'Predicate';
    const predicateInput = document.createElement('input');
    predicateInput.type = 'text';
    predicateInput.placeholder = 'material.surface';
    predicateInput.value = observation.predicate;
    predicateInput.dataset.predicate = '';
    predicateLabel.append(predicateInput);

    const valueLabel = document.createElement('label');
    valueLabel.textContent = 'Observed value';
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.placeholder = 'woven linen';
    valueInput.value = observation.value;
    valueInput.dataset.value = '';
    valueLabel.append(valueInput);

    const confidenceLabel = document.createElement('label');
    confidenceLabel.className = 'run-confidence-control';
    confidenceLabel.textContent = 'Confidence';
    const confidenceValue = document.createElement('span');
    confidenceValue.dataset.confidenceValue = '';
    confidenceValue.textContent = `${Math.round(observation.confidence * 100)}%`;
    const confidenceInput = document.createElement('input');
    confidenceInput.type = 'range';
    confidenceInput.min = '0';
    confidenceInput.max = '1';
    confidenceInput.step = '0.01';
    confidenceInput.value = String(observation.confidence);
    confidenceInput.dataset.confidence = '';
    confidenceLabel.append(confidenceValue, confidenceInput);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'run-remove-button';
    removeButton.dataset.removeObservation = '';
    removeButton.textContent = 'Remove';
    removeButton.setAttribute('aria-label', `Remove observation ${observation.uiId}`);

    row.append(predicateLabel, valueLabel, confidenceLabel, removeButton);
    observationList.append(row);
  }
}

function renderOutput(): void {
  const run = buildRun();

  if (!run) {
    evidenceCount.textContent = '0';
    tokenCount.textContent = '0';
    traceability.textContent = '—';
    tokenPreview.textContent = 'Select a source to begin.';
    return;
  }

  evidenceCount.textContent = String(run.evidence.length);
  tokenCount.textContent = String(run.tokens.length);
  traceability.textContent = `${Math.round(run.verification.traceabilityCoverage * 100)}%`;
  tokenPreview.textContent = JSON.stringify(
    Object.fromEntries(run.tokens.map((token) => [token.path, token.value])),
    null,
    2,
  );
}

function buildRun(): BrowserAnalyzerRun | null {
  if (!source) {
    return null;
  }

  const humanEvidence = createHumanEvidence(observations);
  const evidence = [...metadataEvidence, ...humanEvidence];
  const observedTokens = compileObservedTokens(evidence);
  const derivedTokens = compileDerivedTokens(humanEvidence, observedTokens);
  const tokens = [...observedTokens, ...derivedTokens];
  const evidenceIdSet = new Set(evidence.map((claim) => claim.id));
  const supportedTokens = tokens.filter(
    (token) =>
      token.evidenceIds.length > 0 &&
      token.evidenceIds.every((evidenceId) => evidenceIdSet.has(evidenceId)),
  ).length;
  const traceabilityCoverage = tokens.length === 0 ? 1 : supportedTokens / tokens.length;
  const unsupportedClaims = tokens.length - supportedTokens;
  const sourcePaths = new Set(observedTokens.map((token) => token.path));
  const transformationsValid = derivedTokens.every((token) => {
    const paths = normalizeSourcePaths(token.transformation?.sourcePath);
    return paths.length > 0 && paths.every((path) => sourcePaths.has(path));
  });
  const runId = createRunId(source.sha256, createdAt);
  const execution: ExecutionRecord = {
    application: 'Seed-Loom',
    applicationUrl: window.location.origin,
    mode: 'browser-local',
    actor: 'human-observer',
    networkTransfer: false,
  };

  return {
    run: {
      id: runId,
      version: 'seed-loom.browser-intake.v0.2',
      createdAt,
      engine: 'human-observation',
      parentRunId: null,
    },
    source,
    execution,
    evidence,
    interpretations: [],
    tokens,
    translations: [
      {
        target: 'json',
        artifact: { format: 'seed-loom-evidence-bundle' },
        sourceTokenPaths: tokens.map((token) => token.path),
      },
    ],
    verification: {
      traceabilityCoverage,
      unsupportedClaims,
      checks: [
        {
          id: 'source-sha256',
          status: source.sha256.length === 64 ? 'pass' : 'warning',
          message: 'The image source has a browser-generated SHA-256 identity.',
        },
        {
          id: 'evidence-links',
          status: unsupportedClaims === 0 ? 'pass' : 'warning',
          message: `${supportedTokens}/${tokens.length} generated tokens reference valid evidence IDs.`,
        },
        {
          id: 'derived-transformations',
          status: transformationsValid ? 'pass' : 'warning',
          message: transformationsValid
            ? 'Every derived token records an operation and valid observed source path.'
            : 'One or more derived tokens have an invalid transformation source path.',
        },
        {
          id: 'evidence-lanes',
          status: 'pass',
          message: 'File metadata and human observations retain distinct evidence methods.',
        },
      ],
    },
  };
}

function createMetadataEvidence(record: SourceRecord): EvidenceClaim[] {
  const values: Array<[string, JsonValue]> = [
    ['source.mediaType', record.mediaType],
    ['source.byteLength', record.byteLength],
    ['source.pixelWidth', record.width],
    ['source.pixelHeight', record.height],
    ['source.aspectRatio', Number((record.width / record.height).toFixed(4))],
  ];

  return values.map(([predicate, value], index) => ({
    id: stableEvidenceId(predicate, index + 1),
    predicate,
    value,
    confidence: 1,
    regionIds: [],
    method: 'browser-file-api',
  }));
}

function createHumanEvidence(drafts: ObservationDraft[]): EvidenceClaim[] {
  const complete = drafts.filter(
    (draft) => draft.predicate.trim() !== '' && draft.value.trim() !== '',
  );
  const occurrences = new Map<string, number>();

  return complete.map((draft) => {
    const predicate = normalizePredicate(draft.predicate);
    const occurrence = (occurrences.get(predicate) ?? 0) + 1;
    occurrences.set(predicate, occurrence);

    return {
      id: stableEvidenceId(predicate, occurrence),
      predicate,
      value: draft.value.trim(),
      confidence: draft.confidence,
      regionIds: [],
      method: 'human-observation',
    };
  });
}

function compileObservedTokens(evidenceClaims: EvidenceClaim[]): AnalyzerToken[] {
  const occurrences = new Map<string, number>();

  return evidenceClaims.map((claim) => {
    const basePath = claim.predicate.startsWith('source.')
      ? claim.predicate
      : `observed.${claim.predicate}`;
    const occurrence = (occurrences.get(basePath) ?? 0) + 1;
    occurrences.set(basePath, occurrence);
    const path = occurrence === 1 ? basePath : `${basePath}.${occurrence}`;

    return {
      id: stableTokenId(path),
      path,
      value: claim.value,
      class: claim.method === 'browser-file-api' ? 'primitive' : 'semantic',
      evidenceIds: [claim.id],
      confidence: claim.confidence,
    };
  });
}

function compileDerivedTokens(
  evidenceClaims: EvidenceClaim[],
  observedTokens: AnalyzerToken[],
): AnalyzerToken[] {
  const derived: AnalyzerToken[] = [];
  const claimsByPredicate = new Map(evidenceClaims.map((claim) => [claim.predicate, claim]));
  const paths = new Set(observedTokens.map((token) => token.path));
  const accent = claimsByPredicate.get('color.accent');

  if (accent && typeof accent.value === 'string') {
    const colors = accent.value
      .split(';')
      .map((part) => part.trim().replace(/\s+highlights?$/i, ''))
      .filter(Boolean);

    if (colors.length > 1) {
      derived.push(
        derivedToken(
          'derived.color.accent',
          colors,
          [accent.id],
          accent.confidence,
          'split-semicolon-list',
          'observed.color.accent',
        ),
      );
    }
  }

  const grid = claimsByPredicate.get('geometry.grid');

  if (grid && typeof grid.value === 'string') {
    const dimensions = parseGridDimensions(grid.value);

    if (dimensions) {
      derived.push(
        derivedToken(
          'derived.geometry.grid.columns',
          dimensions.columns,
          [grid.id],
          grid.confidence,
          'parse-grid-dimensions',
          'observed.geometry.grid',
        ),
        derivedToken(
          'derived.geometry.grid.rows',
          dimensions.rows,
          [grid.id],
          grid.confidence,
          'parse-grid-dimensions',
          'observed.geometry.grid',
        ),
      );
    }
  }

  const title = claimsByPredicate.get('typography.title.text');
  const subtitle = claimsByPredicate.get('typography.subtitle.text');

  if (title && subtitle) {
    derived.push(
      derivedToken(
        'derived.typography.roles',
        {
          title: String(title.value),
          subtitle: String(subtitle.value),
        },
        [title.id, subtitle.id],
        Math.min(title.confidence, subtitle.confidence),
        'map-explicit-typography-roles',
        ['observed.typography.title.text', 'observed.typography.subtitle.text'],
      ),
    );
  }

  const ctaLabel = claimsByPredicate.get('interactive.cta.label');
  const ctaPosition = claimsByPredicate.get('interactive.cta.position');

  if (ctaLabel && ctaPosition) {
    derived.push(
      derivedToken(
        'derived.interactive.cta.role',
        'call-to-action control',
        [ctaLabel.id, ctaPosition.id],
        Math.min(ctaLabel.confidence, ctaPosition.confidence),
        'classify-cta-role',
        ['observed.interactive.cta.label', 'observed.interactive.cta.position'],
      ),
    );
  }

  return derived.filter((token) =>
    normalizeSourcePaths(token.transformation?.sourcePath).every((path) => paths.has(path)),
  );
}

function derivedToken(
  path: string,
  value: JsonValue,
  evidenceIds: string[],
  confidence: number,
  operation: string,
  sourcePath: string | string[],
): AnalyzerToken {
  return {
    id: stableTokenId(path),
    path,
    value,
    class: 'semantic',
    evidenceIds,
    confidence,
    transformation: { operation, sourcePath },
  };
}

function createReceipt(run: BrowserAnalyzerRun): RunReceipt {
  return {
    schemaVersion: 'seed-loom.provenance-receipt.v0.2',
    runId: run.run.id,
    generatedAt: new Date().toISOString(),
    source: {
      id: run.source.id,
      kind: run.source.kind,
      name: run.source.name,
      mediaType: run.source.mediaType,
      sha256: run.source.sha256,
    },
    execution: run.execution,
    evidenceCount: run.evidence.length,
    tokenCount: run.tokens.length,
    derivedTokenCount: run.tokens.filter((token) => token.path.startsWith('derived.')).length,
    traceabilityCoverage: run.verification.traceabilityCoverage,
    unsupportedClaims: run.verification.unsupportedClaims,
    checks: run.verification.checks,
    statement:
      'This receipt records a browser-local compilation from deterministic file metadata and explicit human observations. It does not claim automated visual understanding.',
  };
}

function parseGridDimensions(value: string): { columns: number; rows: number } | null {
  const normalized = value.toLowerCase();
  const match = normalized.match(
    /([a-z0-9-]+)\s+columns?\s+(?:by|x|×)\s+([a-z0-9-]+)\s+rows?/,
  );

  if (!match) {
    return null;
  }

  const columnText = match[1];
  const rowText = match[2];

  if (!columnText || !rowText) {
    return null;
  }

  const columns = parseCount(columnText);
  const rows = parseCount(rowText);

  return columns === null || rows === null ? null : { columns, rows };
}

function parseCount(value: string): number | null {
  const numeric = Number(value);

  if (Number.isInteger(numeric) && numeric > 0) {
    return numeric;
  }

  const words: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
  };

  return words[value] ?? null;
}

function normalizePredicate(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

  return normalized || 'claim';
}

function stableEvidenceId(predicate: string, occurrence: number): string {
  const suffix = occurrence > 1 ? `_${occurrence}` : '';
  return `ev_${idSegment(predicate)}${suffix}`;
}

function stableTokenId(path: string): string {
  return `tok_${idSegment(path)}`;
}

function createRunId(sha256: string, timestamp: string): string {
  const compactTime = timestamp.replace(/\D/g, '').slice(0, 14);
  return `run_${sha256.slice(0, 12)}_${compactTime}`;
}

function idSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'claim';
}

function normalizeSourcePaths(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

async function digestFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const dimensions = { width: bitmap.width, height: bitmap.height };
  bitmap.close();

  if (dimensions.width === 0 || dimensions.height === 0) {
    throw new Error('The selected image has invalid dimensions.');
  }

  return dimensions;
}

function resetRun(): void {
  source = null;
  metadataEvidence = [];
  observations = [];
  nextDraftIndex = 1;
  createdAt = new Date().toISOString();
  fileInput.value = '';
  addObservationButton.disabled = true;
  exportRunButton.disabled = true;
  exportReceiptButton.disabled = true;
  previewWrap.hidden = true;
  preview.removeAttribute('src');
  sourceSummary.textContent = '';
  technicalEvidence.replaceChildren();

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }

  setStatus('No source selected.');
  renderAll();
  fileInput.focus();
}

function downloadJson(filename: string, value: unknown): void {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function setStatus(message: string, error = false): void {
  status.textContent = message;
  status.dataset.error = String(error);
}

function requireElement<T extends Element>(selector: string): T {
  const element = dialog.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Required intake element was not found: ${selector}`);
  }

  return element;
}
