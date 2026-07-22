import './intake.css';

type JsonValue = string | number | boolean | null;

type EvidenceClaim = {
  id: string;
  predicate: string;
  value: JsonValue;
  confidence: number;
  regionIds: string[];
  method: 'browser-file-api' | 'human-observation';
};

type AnalyzerToken = {
  path: string;
  value: JsonValue;
  class: 'primitive' | 'semantic';
  evidenceIds: string[];
  confidence: number;
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

type BrowserAnalyzerRun = {
  run: {
    id: string;
    version: 'seed-loom.browser-intake.v0.1';
    createdAt: string;
    engine: 'human-local';
    parentRunId: null;
  };
  source: SourceRecord;
  evidence: EvidenceClaim[];
  interpretations: [];
  tokens: AnalyzerToken[];
  translations: [];
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
  schemaVersion: 'seed-loom.provenance-receipt.v0.1';
  runId: string;
  generatedAt: string;
  sourceSha256: string;
  evidenceCount: number;
  tokenCount: number;
  traceabilityCoverage: number;
  unsupportedClaims: number;
  execution: {
    environment: 'browser';
    engine: 'human-local';
    networkTransfer: false;
  };
  interpretation: string;
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

let runId = createId('run');
let createdAt = new Date().toISOString();
let source: SourceRecord | null = null;
let metadataEvidence: EvidenceClaim[] = [];
let observations: EvidenceClaim[] = [];
let previewUrl: string | null = null;

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

    runId = createId('run');
    createdAt = new Date().toISOString();
    observations = [];
    source = {
      id: createId('src'),
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
    id: createId('ev'),
    predicate: '',
    value: '',
    confidence: 1,
    regionIds: [],
    method: 'human-observation',
  });
  renderObservations();
  renderOutput();
  observationList.querySelector<HTMLInputElement>('[data-observation-row]:last-child [data-predicate]')?.focus();
});

observationList.addEventListener('input', (event) => {
  const input = event.target as HTMLInputElement;
  const row = input.closest<HTMLElement>('[data-observation-row]');
  const id = row?.dataset.observationId;
  const observation = observations.find((candidate) => candidate.id === id);

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
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-remove-observation]');
  const row = button?.closest<HTMLElement>('[data-observation-row]');
  const id = row?.dataset.observationId;

  if (!id) {
    return;
  }

  observations = observations.filter((candidate) => candidate.id !== id);
  renderObservations();
  renderOutput();
});

dialog.querySelector('[data-reset-run]')?.addEventListener('click', resetRun);

exportRunButton.addEventListener('click', () => {
  const run = buildRun();

  if (!run) {
    return;
  }

  downloadJson(`seed-loom-${run.run.id}.json`, run);
});

exportReceiptButton.addEventListener('click', () => {
  const run = buildRun();

  if (!run) {
    return;
  }

  downloadJson(`seed-loom-${run.run.id}-receipt.json`, createReceipt(run));
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
    row.dataset.observationId = observation.id;

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
    valueInput.value = String(observation.value);
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
    removeButton.setAttribute('aria-label', `Remove observation ${observation.id}`);

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

  const completeObservations = observations.filter(
    (claim) => claim.predicate.trim() !== '' && String(claim.value).trim() !== '',
  );
  const evidence = [...metadataEvidence, ...completeObservations];
  const tokens = compileTokens(evidence);
  const supportedTokens = tokens.filter((token) => token.evidenceIds.length > 0).length;
  const traceabilityCoverage = tokens.length === 0 ? 1 : supportedTokens / tokens.length;
  const unsupportedClaims = tokens.length - supportedTokens;

  return {
    run: {
      id: runId,
      version: 'seed-loom.browser-intake.v0.1',
      createdAt,
      engine: 'human-local',
      parentRunId: null,
    },
    source,
    evidence,
    interpretations: [],
    tokens,
    translations: [],
    verification: {
      traceabilityCoverage,
      unsupportedClaims,
      checks: [
        {
          id: 'source.sha256',
          status: source.sha256.length === 64 ? 'pass' : 'warning',
          message: 'The source is identified by a browser-generated SHA-256 digest.',
        },
        {
          id: 'evidence.separation',
          status: 'pass',
          message: 'Browser metadata and human observations retain distinct methods.',
        },
        {
          id: 'tokens.traceable',
          status: unsupportedClaims === 0 ? 'pass' : 'warning',
          message: `${supportedTokens}/${tokens.length} tokens link to evidence IDs.`,
        },
      ],
    },
  };
}

function createMetadataEvidence(record: SourceRecord): EvidenceClaim[] {
  const ratio = Number((record.width / record.height).toFixed(4));

  return [
    evidence('source.mediaType', record.mediaType),
    evidence('source.byteLength', record.byteLength),
    evidence('source.pixelWidth', record.width),
    evidence('source.pixelHeight', record.height),
    evidence('source.aspectRatio', ratio),
  ];
}

function evidence(predicate: string, value: JsonValue): EvidenceClaim {
  return {
    id: createId('ev'),
    predicate,
    value,
    confidence: 1,
    regionIds: [],
    method: 'browser-file-api',
  };
}

function compileTokens(evidenceClaims: EvidenceClaim[]): AnalyzerToken[] {
  const seen = new Map<string, number>();

  return evidenceClaims.map((claim) => {
    const basePath = claim.predicate.startsWith('source.')
      ? claim.predicate
      : `observed.${slugify(claim.predicate)}`;
    const occurrence = seen.get(basePath) ?? 0;
    seen.set(basePath, occurrence + 1);
    const path = occurrence === 0 ? basePath : `${basePath}.${occurrence + 1}`;

    return {
      path,
      value: claim.value,
      class: claim.method === 'browser-file-api' ? 'primitive' : 'semantic',
      evidenceIds: [claim.id],
      confidence: claim.confidence,
    };
  });
}

function createReceipt(run: BrowserAnalyzerRun): RunReceipt {
  return {
    schemaVersion: 'seed-loom.provenance-receipt.v0.1',
    runId: run.run.id,
    generatedAt: new Date().toISOString(),
    sourceSha256: run.source.sha256,
    evidenceCount: run.evidence.length,
    tokenCount: run.tokens.length,
    traceabilityCoverage: run.verification.traceabilityCoverage,
    unsupportedClaims: run.verification.unsupportedClaims,
    execution: {
      environment: 'browser',
      engine: 'human-local',
      networkTransfer: false,
    },
    interpretation:
      'This receipt proves the exported run was compiled locally from source metadata and explicit human observations. It does not claim automated visual understanding.',
  };
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
  runId = createId('run');
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

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

  return slug || 'claim';
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function requireElement<T extends Element>(selector: string): T {
  const element = dialog.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Required intake element was not found: ${selector}`);
  }

  return element;
}
