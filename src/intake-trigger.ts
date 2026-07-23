const headerTrigger = document.querySelector<HTMLButtonElement>('.small-action');
const heroTrigger = document.querySelector<HTMLAnchorElement>('.hero-actions .button.primary');

if (!headerTrigger || !heroTrigger) {
  throw new Error('Seed-Loom analyzer entry controls were not found.');
}

heroTrigger.setAttribute('aria-haspopup', 'dialog');
heroTrigger.setAttribute('aria-controls', 'run-intake-dialog');

function syncAnalyzerEntrySemantics(): void {
  const headerUnavailable = getComputedStyle(headerTrigger).display === 'none';

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
