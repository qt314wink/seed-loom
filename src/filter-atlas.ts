import {
  filterUrl,
  filters,
  type FilterSelection,
} from '@melodicbloom/svg-filter-atlas';

const FILTER_DEFINITIONS_ID = 'seed-loom-filter-atlas-definitions';
const FILTER_STYLE_ID = 'seed-loom-filter-atlas-style';

const approvedSelections = [
  { recipe: 'nacre-laminate', preset: 'abalone-ridge' },
  { recipe: 'washi-fiber', preset: 'kozo-fine' },
  { recipe: 'brass-inlay', preset: 'soft-patina' },
  { recipe: 'stained-glass-light', preset: 'cathedral-calm' },
] as const satisfies readonly FilterSelection[];

type MaterialBinding = {
  selector: string;
  recipe: string;
  preset: string;
  rationale: string;
};

const materialBindings: readonly MaterialBinding[] = [
  {
    selector: '.material-satin .material-swatch',
    recipe: 'nacre-laminate',
    preset: 'abalone-ridge',
    rationale: 'Broad spectral response for satin and iridescent lamé.',
  },
  {
    selector: '.material-parchment .material-swatch',
    recipe: 'washi-fiber',
    preset: 'kozo-fine',
    rationale: 'Fine directional fiber without degrading text readability.',
  },
  {
    selector: '.material-metal .material-swatch',
    recipe: 'brass-inlay',
    preset: 'soft-patina',
    rationale: 'Restrained conductive edge for copper and brass.',
  },
  {
    selector: '.material-glass .material-swatch',
    recipe: 'stained-glass-light',
    preset: 'cathedral-calm',
    rationale: 'Low-displacement transmitted color for inspectable glass.',
  },
];

function mountDefinitions(): void {
  if (document.getElementById(FILTER_DEFINITIONS_ID)) return;

  const shell = document.createElement('div');
  shell.innerHTML = filters.definitions(approvedSelections);

  const svg = shell.firstElementChild;
  if (!(svg instanceof SVGSVGElement)) {
    throw new Error('SVG Filter Atlas did not produce a valid definition bundle.');
  }

  svg.id = FILTER_DEFINITIONS_ID;
  svg.setAttribute('focusable', 'false');
  document.body.prepend(svg);
}

function mountStyle(): void {
  if (document.getElementById(FILTER_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = FILTER_STYLE_ID;
  style.textContent = `
    .has-atlas-material-filter {
      filter: var(--seed-loom-material-filter);
      isolation: isolate;
    }

    @media (forced-colors: active) {
      .has-atlas-material-filter {
        filter: none;
      }
    }
  `;
  document.head.append(style);
}

function bindMaterials(): void {
  for (const binding of materialBindings) {
    const elements = document.querySelectorAll<HTMLElement>(binding.selector);

    for (const element of elements) {
      element.classList.add('has-atlas-material-filter');
      element.style.setProperty(
        '--seed-loom-material-filter',
        filterUrl(binding.recipe, binding.preset),
      );
      element.dataset.filterRecipe = binding.recipe;
      element.dataset.filterPreset = binding.preset;
      element.dataset.filterRationale = binding.rationale;
    }
  }
}

/**
 * Mounts one shared SVG definition bundle and applies the approved v0.1
 * material bindings. Text, navigation, and large scrolling surfaces are
 * intentionally left unfiltered.
 */
export function installSeedLoomFilterAtlas(): void {
  if (!CSS.supports('filter', 'url("#seed-loom-filter-test")')) return;
  mountDefinitions();
  mountStyle();
  bindMaterials();
}
