function requirePageElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Required Seed-Loom control was not found: ${selector}`);
  }

  return element;
}

const headerTrigger = requirePageElement<HTMLButtonElement>('.small-action');
const heroTrigger = requirePageElement<HTMLAnchorElement>(
  '.hero-actions .button.primary',
);

heroTrigger.setAttribute('aria-haspopup', 'dialog');
heroTrigger.setAttribute('aria-controls', 'run-intake-dialog');

function syncAnalyzerEntrySemantics(): void {
  const style = getComputedStyle(headerTrigger);
  const bounds = headerTrigger.getBoundingClientRect();
  const headerUnavailable =
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    bounds.width === 0 ||
    bounds.height === 0;

  if (headerUnavailable) {
    heroTrigger.setAttribute('role', 'button');
    heroTrigger.setAttribute('aria-label', 'Start a run');
  } else {
    heroTrigger.removeAttribute('role');
    heroTrigger.removeAttribute('aria-label');
  }
}

heroTrigger.addEventListener('click', (event) => {
  event.preventDefault();
  headerTrigger.click();
});

syncAnalyzerEntrySemantics();
window.addEventListener('resize', syncAnalyzerEntrySemantics, { passive: true });
