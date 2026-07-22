import './styles.css';

type StageId =
  | 'evidence'
  | 'interpretation'
  | 'tokens'
  | 'code'
  | 'verification';

type Stage = {
  id: StageId;
  index: string;
  label: string;
  botanicalState: string;
  summary: string;
  metric: string;
  metricLabel: string;
  items: Array<{
    title: string;
    detail: string;
    confidence?: number;
  }>;
  trace: string;
};

const stages: Stage[] = [
  {
    id: 'evidence',
    index: '01',
    label: 'Evidence',
    botanicalState: 'Rooted observation',
    summary:
      'Observable material, color, geometry, density, hierarchy, and texture claims remain separate from interpretation.',
    metric: '97%',
    metricLabel: 'observable coverage',
    items: [
      {
        title: 'Woven linen ground',
        detail: 'Fine orthogonal grain with warm fiber variance.',
        confidence: 0.97,
      },
      {
        title: 'Ceramic cactus ribs',
        detail: 'Five repeated vertical structural channels.',
        confidence: 0.94,
      },
      {
        title: 'Copper attachment points',
        detail:
          'Metallic nodes join trace lines to material samples.',
        confidence: 0.91,
      },
    ],
    trace:
      'source.region.07 → evidence.material.ceramic-rib',
  },
  {
    id: 'interpretation',
    index: '02',
    label: 'Interpretation',
    botanicalState: 'Branching meaning',
    summary:
      'Primary and alternative readings stay visible together, with confidence, evidence support, and disambiguation questions.',
    metric: '3',
    metricLabel: 'live readings',
    items: [
      {
        title: 'Tactile computational craft',
        detail:
          'Primary reading supported by textile process paths and technical labels.',
        confidence: 0.94,
      },
      {
        title: 'Heirloom systems diagram',
        detail:
          'Alternative reading preserving archive, lineage, and care.',
        confidence: 0.76,
      },
      {
        title: 'Technical folk ecology',
        detail:
          'Alternative reading emphasizing living structure and regional craft.',
        confidence: 0.68,
      },
    ],
    trace:
      'evidence.* → interpretation.material-logic-interface',
  },
  {
    id: 'tokens',
    index: '03',
    label: 'Tokens',
    botanicalState: 'Leafing vocabulary',
    summary:
      'Primitive, semantic, component, motion, material, symbol, and constraint values retain their source evidence.',
    metric: '42',
    metricLabel: 'compiled tokens',
    items: [
      {
        title: 'material.cactus.ceramic',
        detail:
          'roughness .34 · ridgeHighlight .72 · depth 18px',
      },
      {
        title: 'motion.rootTrace',
        detail: '520ms · provenance becomes visible',
      },
      {
        title: 'symbol.spine',
        detail:
          'constraint, refusal, warning, protected boundary',
      },
    ],
    trace:
      'interpretation.material-logic → token.material.cactus.ceramic',
  },
  {
    id: 'code',
    index: '04',
    label: 'Code',
    botanicalState: 'Woven translation',
    summary:
      'Canonical tokens compile into portable CSS, Tailwind, Figma, React, Motion, SVG, GLSL, prompt, and JSON targets.',
    metric: '9',
    metricLabel: 'translation targets',
    items: [
      {
        title: '--cactus-ridge-highlight',
        detail: '0.72',
      },
      {
        title: 'motion.rootTrace.duration',
        detail: '520',
      },
      {
        title: 'data-symbol="spine"',
        detail: 'constraint state contract',
      },
    ],
    trace:
      'token.* → translation.css + translation.react + translation.json',
  },
  {
    id: 'verification',
    index: '05',
    label: 'Verification',
    botanicalState: 'Validated bloom',
    summary:
      'Traceability, accessibility, visual stability, unsupported inference, style drift, and performance are tested before release.',
    metric: '8/8',
    metricLabel: 'gates passing',
    items: [
      {
        title: 'Traceability coverage',
        detail:
          'Every generated token links to evidence or an explicit human decision.',
        confidence: 1,
      },
      {
        title: 'Reduced motion',
        detail:
          'Growth transforms become opacity and persistent state labels.',
        confidence: 1,
      },
      {
        title: 'Visual regression',
        detail:
          'Desktop, mobile, and five active-stage screenshots are compared in CI.',
        confidence: 1,
      },
    ],
    trace: 'artifact + behavior → checks → evidence ledger',
  },
];

const materials = [
  [
    'satin',
    'Satin / iridescent lamé',
    'Broad anisotropic light and spectral shift',
  ],
  [
    'velvet',
    'Velvet / flock',
    'Deep pile, absorbed light, protected emphasis',
  ],
  [
    'quilt',
    'Quilted batting',
    'Compressed volume and stage containment',
  ],
  [
    'lace',
    'Crochet / lace',
    'Open-work logic, permeability, connective tissue',
  ],
  [
    'braid',
    'Braided cord',
    'Explicit translation path and durable linkage',
  ],
  [
    'denim',
    'Denim / twill',
    'Technical substrate, repeatable work surface',
  ],
  [
    'embroidery',
    'Embroidery',
    'Semantic contour, route, annotation, proof',
  ],
  [
    'parchment',
    'Parchment / paper',
    'Documentation, audit, reversible record',
  ],
  [
    'wood',
    'Wood grain',
    'Organic structure and directional inheritance',
  ],
  [
    'glass',
    'Glass',
    'Preview, transparency, inspectable overlay',
  ],
  [
    'silicone',
    'Silicone',
    'Flexible industrial boundary and safe compression',
  ],
  [
    'metal',
    'Copper / brass',
    'Attachment, verification, conductive state',
  ],
] as const;

let active: StageId = 'evidence';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Seed-Loom app root was not found.');
}

app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="#top" aria-label="Seed-Loom home">
      Seed-<em>Loom</em>
    </a>

    <nav aria-label="Primary navigation">
      <a href="#analyzer">Analyzer</a>
      <a href="#materials">Materials</a>
      <a href="#trace">Evidence</a>
      <a href="#commerce">Systems</a>
    </nav>

    <button class="small-action" type="button">
      Start a run
    </button>
  </header>

  <main id="top">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow">
          Traceable creative intelligence
        </p>

        <h1 id="hero-title">
          A living system can be soft, thorned, and exact.
        </h1>

        <p class="lede">
          Seed-Loom turns visual signals into evidence,
          interpretations, tokens, code, and verified
          systems—without hiding the thread between them.
        </p>

        <div class="hero-actions">
          <a class="button primary" href="#analyzer">
            Enter analyzer
          </a>

          <a class="button" href="#materials">
            Inspect materials
          </a>
        </div>
      </div>

      <div
        class="organism-shell"
        aria-label="Interactive five-rib cactus analyzer"
      >
        <div class="flower" aria-hidden="true">
          ${Array.from(
            { length: 8 },
            (_, index) =>
              `<span class="petal" style="--i:${index}"></span>`,
          ).join('')}
          <span class="flower-core"></span>
        </div>

        <div
          class="cactus"
          role="tablist"
          aria-label="Analyzer stages"
        >
          ${stages
            .map(
              (stage, index) => `
                <button
                  class="rib ${index === 0 ? 'is-active' : ''}"
                  role="tab"
                  aria-selected="${index === 0}"
                  aria-controls="stage-panel"
                  data-stage="${stage.id}"
                  style="--rib:${index}"
                  title="${stage.label}"
                >
                  <span>${stage.index}</span>
                  <b>${stage.label}</b>
                </button>
              `,
            )
            .join('')}

          <span
            class="spine-field"
            aria-hidden="true"
          ></span>
        </div>

        <div class="pot">
          <span>OMNI-LOOM REFERENCE</span>
          <b>material logic → executable system</b>
        </div>
      </div>
    </section>

    <section
      class="material-section"
      id="materials"
      aria-labelledby="materials-title"
    >
      <div class="section-heading">
        <p class="eyebrow">
          Inherited material atlas
        </p>

        <h2 id="materials-title">
          The deck's textures are now first-class system fields.
        </h2>

        <p class="material-intro">
          Each swatch is both visible and operational: it
          defines light response, depth, interaction, semantic
          role, allowed density, and translation targets.
        </p>
      </div>

      <div class="material-grid">
        ${materials
          .map(
            ([id, name, role]) => `
              <article
                class="material-card material-${id}"
                data-material="${id}"
              >
                <div
                  class="material-swatch"
                  aria-hidden="true"
                >
                  <span></span>
                </div>

                <div>
                  <h3>${name}</h3>
                  <p>${role}</p>
                  <code>material.${id}</code>
                </div>
              </article>
            `,
          )
          .join('')}
      </div>
    </section>

    <section
      class="analyzer-section"
      id="analyzer"
      aria-labelledby="analyzer-title"
    >
      <div class="section-heading">
        <p class="eyebrow">Live analyzer shell</p>

        <h2 id="analyzer-title">
          Five ribs. One inspectable transformation.
        </h2>
      </div>

      <div class="analyzer-grid">
        <aside
          class="stage-rail"
          aria-label="Analyzer stage controls"
        >
          ${stages
            .map(
              (stage, index) => `
                <button
                  type="button"
                  data-stage="${stage.id}"
                  class="stage-button ${
                    index === 0 ? 'is-active' : ''
                  }"
                >
                  <span>${stage.index}</span>

                  <span>
                    <b>${stage.label}</b>
                    <small>${stage.botanicalState}</small>
                  </span>
                </button>
              `,
            )
            .join('')}
        </aside>

        <article
          class="stage-panel"
          id="stage-panel"
          tabindex="-1"
          aria-live="polite"
        ></article>
      </div>
    </section>

    <section
      class="trace-section"
      id="trace"
      aria-labelledby="trace-title"
    >
      <div>
        <p class="eyebrow">Provenance field</p>

        <h2 id="trace-title">
          Every transformation leaves a root and a thread.
        </h2>
      </div>

      <ol class="trace-chain">
        <li>
          <span>Source region</span>
          <b>OMNI / 07</b>
        </li>

        <li>
          <span>Evidence</span>
          <b>ceramic rib</b>
        </li>

        <li>
          <span>Interpretation</span>
          <b>durable structure</b>
        </li>

        <li>
          <span>Token</span>
          <b>material.cactus</b>
        </li>

        <li>
          <span>Code</span>
          <b>CSS + JSON</b>
        </li>

        <li>
          <span>Gate</span>
          <b>visual stable</b>
        </li>
      </ol>
    </section>

    <section
      class="commerce-section"
      id="commerce"
      aria-labelledby="commerce-title"
    >
      <div class="section-heading">
        <p class="eyebrow">
          Cultivation architecture
        </p>

        <h2 id="commerce-title">
          Reusable systems, grown under explicit constraints.
        </h2>
      </div>

      <div class="plans">
        ${[
          ['Seed', 'Explore public references'],
          ['Garden', 'Compile private design systems'],
          ['Conservatory', 'Validate teams and production'],
          ['Biome', 'Govern enterprise ontologies'],
        ]
          .map(
            ([name, description], index) => `
              <article class="plan">
                <span class="plan-symbol">
                  ${['✦', '❋', '✺', '✹'][index]}
                </span>

                <h3>${name}</h3>
                <p>${description}</p>

                <button type="button">
                  Inspect ${name}
                </button>
              </article>
            `,
          )
          .join('')}
      </div>
    </section>
  </main>

  <footer>
    <a class="brand" href="#top">
      Seed-<em>Loom</em>
    </a>

    <p>Every transformation leaves a thread.</p>
  </footer>
`;

function requireElement<T extends Element>(
  selector: string,
): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(
      `Required element was not found: ${selector}`,
    );
  }

  return element;
}

const panel =
  requireElement<HTMLElement>('#stage-panel');

function renderStage(
  stageId: StageId,
  focus = false,
): void {
  const stage = stages.find(
    (candidate) => candidate.id === stageId,
  );

  if (!stage) {
    return;
  }

  active = stageId;
  document.documentElement.dataset.stage = stageId;

  document
    .querySelectorAll<HTMLElement>('[data-stage]')
    .forEach((control) => {
      const selected =
        control.dataset.stage === stageId;

      control.classList.toggle(
        'is-active',
        selected,
      );

      if (control.getAttribute('role') === 'tab') {
        control.setAttribute(
          'aria-selected',
          String(selected),
        );
      }
    });

  panel.innerHTML = `
    <header class="panel-header">
      <div>
        <p class="panel-index">
          ${stage.index} / ${stage.botanicalState}
        </p>

        <h3>${stage.label}</h3>
      </div>

      <div class="metric">
        <strong>${stage.metric}</strong>
        <span>${stage.metricLabel}</span>
      </div>
    </header>

    <p class="panel-summary">
      ${stage.summary}
    </p>

    <div class="specimens">
      ${stage.items
        .map(
          (item) => `
            <article class="specimen">
              <span
                class="specimen-node"
                aria-hidden="true"
              ></span>

              <div>
                <h4>${item.title}</h4>
                <p>${item.detail}</p>

                ${
                  item.confidence === undefined
                    ? ''
                    : `
                      <div class="confidence">
                        <i
                          style="width:${
                            item.confidence * 100
                          }%"
                        ></i>
                      </div>
                    `
                }
              </div>
            </article>
          `,
        )
        .join('')}
    </div>

    <div class="trace-readout">
      <span>TRACE</span>
      <code>${stage.trace}</code>
    </div>
  `;

  if (focus) {
    panel.focus();
  }
}

document.addEventListener('click', (event) => {
  const target = (
    event.target as HTMLElement
  ).closest<HTMLElement>('[data-stage]');

  const stageId = target?.dataset.stage as
    | StageId
    | undefined;

  if (stageId) {
    renderStage(
      stageId,
      target?.getAttribute('role') !== 'tab',
    );
  }
});

document
  .querySelector('.cactus')
  ?.addEventListener('keydown', (event) => {
    if (
      !(event instanceof KeyboardEvent) ||
      ![
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ].includes(event.key)
    ) {
      return;
    }

    event.preventDefault();

    const index = stages.findIndex(
      (stage) => stage.id === active,
    );

    let next = index;

    if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = stages.length - 1;
    } else {
      const direction =
        event.key === 'ArrowRight' ||
        event.key === 'ArrowDown'
          ? 1
          : -1;

      next =
        (index + direction + stages.length) %
        stages.length;
    }

    const stage = stages[next];

    if (stage) {
      renderStage(stage.id);

      document
        .querySelector<HTMLButtonElement>(
          `.rib[data-stage="${stage.id}"]`,
        )
        ?.focus();
    }
  });

renderStage(active);



