const card = document.querySelector('[data-swatch-card]');

if (card) {
  const control = card.querySelector('button[aria-controls]');
  const details = document.getElementById(control?.getAttribute('aria-controls') ?? '');
  const label = card.querySelector('[data-control-label]');

  if (control && details && label) {
    control.addEventListener('click', () => {
      const isExpanded = control.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !isExpanded;

      control.setAttribute('aria-expanded', String(nextExpanded));
      card.dataset.state = nextExpanded ? 'expanded' : 'collapsed';
      details.hidden = !nextExpanded;
      label.textContent = nextExpanded ? 'Pleat details' : 'Unfold details';
    });
  }
}
