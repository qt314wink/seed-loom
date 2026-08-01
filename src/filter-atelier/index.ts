import './styles.css';
import { createControl, readControlValue, writeControlValue } from './controls';
import { downloadCandidate, serializeCandidate } from './export';
import { loadAuthoringModel } from './model';
import { clearPreview, renderPreview } from './preview';
import { DraftStore } from './state';
import { validateDraft } from './validation';

function syncVisibility(section: HTMLElement): void {
  section.hidden = window.location.hash !== '#atelier';
}

function renderIssues(
  host: HTMLElement,
  issues: readonly { path: string; message: string }[],
): void {
  host.replaceChildren();

  if (issues.length === 0) {
    host.textContent = 'Valid draft · candidate export enabled.';
    return;
  }

  const list = document.createElement('ul');
  list.className = 'filter-atelier__issues';

  for (const issue of issues) {
    const item = document.createElement('li');
    item.textContent = `${issue.path}: ${issue.message}`;
    list.append(item);
  }

  host.append(list);
}

export function mountFilterAtelier(): void {
  if (document.querySelector('#filter-atelier')) return;

  const model = loadAuthoringModel();
  const store = new DraftStore(model);
  const section = document.createElement('section');
  section.id = 'filter-atelier';
  section.className = 'filter-atelier';
  section.setAttribute('aria-labelledby', 'filter-atelier-title');

  section.innerHTML = `
    <header class="filter-atelier__header">
      <p class="filter-atelier__kicker">Governed authoring vertical slice 05</p>
      <h2 id="filter-atelier-title">Deterministic candidate export</h2>
      <p>
        A valid draft can leave the browser only as a review-required candidate.
        Canonical recipe files remain read-only.
      </p>
    </header>
    <div class="filter-atelier__body">
      <div class="filter-atelier__grid">
        <article class="filter-atelier__panel">
          <h3>${model.recipe.name} · ${model.presetName}</h3>
          <div class="filter-atelier__controls" data-atelier-controls></div>
        </article>
        <article class="filter-atelier__panel">
          <div class="filter-atelier__status-line">
            <h3>Compiled preview</h3>
            <strong data-atelier-dirty>Canonical</strong>
          </div>
          <div class="filter-atelier__preview">
            <div
              class="filter-atelier__preview-surface"
              data-atelier-preview-surface
              aria-label="Live nacre filter preview"
            ></div>
          </div>
          <div data-atelier-definitions></div>
          <div
            class="filter-atelier__status"
            data-atelier-validation
            aria-live="polite"
          ></div>
        </article>
      </div>
      <article class="filter-atelier__panel">
        <h3>Candidate JSON</h3>
        <pre
          class="filter-atelier__candidate"
          data-atelier-candidate
          data-testid="atelier-candidate-json"
        ></pre>
      </article>
      <div class="filter-atelier__actions">
        <button type="button" data-atelier-reset>Reset canonical preset</button>
        <button type="button" data-atelier-export>
          Export candidate JSON
        </button>
        <a href="#materials">Close atelier</a>
      </div>
    </div>
  `;

  const controlsHost = section.querySelector<HTMLElement>(
    '[data-atelier-controls]',
  );
  const dirtyHost = section.querySelector<HTMLElement>(
    '[data-atelier-dirty]',
  );
  const definitionsHost = section.querySelector<HTMLElement>(
    '[data-atelier-definitions]',
  );
  const previewSurface = section.querySelector<HTMLElement>(
    '[data-atelier-preview-surface]',
  );
  const validationHost = section.querySelector<HTMLElement>(
    '[data-atelier-validation]',
  );
  const candidateHost = section.querySelector<HTMLElement>(
    '[data-atelier-candidate]',
  );
  const resetButton = section.querySelector<HTMLButtonElement>(
    '[data-atelier-reset]',
  );
  const exportButton = section.querySelector<HTMLButtonElement>(
    '[data-atelier-export]',
  );

  if (
    !controlsHost ||
    !dirtyHost ||
    !definitionsHost ||
    !previewSurface ||
    !validationHost ||
    !candidateHost ||
    !resetButton ||
    !exportButton
  ) {
    throw new Error('Filter atelier export surface failed to mount.');
  }

  const controls = new Map<
    string,
    ReturnType<typeof createControl>
  >();
  let latestValues = model.canonicalValues;

  for (const parameter of model.controls) {
    const elements = createControl(
      parameter,
      parameter.canonicalValue,
    );
    controls.set(parameter.key, elements);
    controlsHost.append(elements.row);

    elements.input.addEventListener('input', () => {
      try {
        store.set(
          parameter.key,
          readControlValue(elements.input, parameter),
        );
        elements.input.setCustomValidity('');
      } catch (error) {
        elements.input.setCustomValidity(
          error instanceof Error ? error.message : String(error),
        );
      }
    });
  }

  resetButton.addEventListener('click', () => store.reset());
  exportButton.addEventListener('click', () => {
    downloadCandidate(model, latestValues);
  });

  store.subscribe((snapshot) => {
    latestValues = snapshot.values;
    section.dataset.dirty = String(snapshot.dirty);
    dirtyHost.textContent = snapshot.dirty
      ? `Draft · revision ${snapshot.revision}`
      : 'Canonical';

    for (const [key, elements] of controls) {
      const value = snapshot.values[key];

      if (value === undefined) {
        throw new Error(`Draft value missing for ${key}`);
      }

      writeControlValue(elements.input, value);
      elements.output.value = String(value);
      elements.output.textContent = String(value);
    }

    const validation = validateDraft(model, snapshot.values);
    renderIssues(validationHost, validation.issues);
    exportButton.disabled = !validation.valid;

    if (validation.valid) {
      renderPreview(
        model.recipe,
        snapshot.values,
        definitionsHost,
        previewSurface,
      );
      candidateHost.textContent =
        serializeCandidate(model, snapshot.values);
    } else {
      clearPreview(definitionsHost, previewSurface);
      candidateHost.textContent =
        'Candidate serialization blocked until the draft is valid.';
    }
  });

  const anchor = document.querySelector('#analyzer');

  if (anchor?.parentElement) {
    anchor.parentElement.insertBefore(section, anchor);
  } else {
    (document.querySelector('main') ?? document.body).append(section);
  }

  syncVisibility(section);
  window.addEventListener('hashchange', () => syncVisibility(section));
}
