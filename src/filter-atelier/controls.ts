import type {
  FilterParameter,
  ParameterValue,
} from '@melodicbloom/svg-filter-atlas';

export interface ControlElements {
  row: HTMLElement;
  input: HTMLInputElement;
  output: HTMLOutputElement;
}

export function createControl(
  parameter: FilterParameter,
  value: ParameterValue,
): ControlElements {
  const row = document.createElement('label');
  row.className = 'filter-atelier__control';

  const head = document.createElement('span');
  head.className = 'filter-atelier__control-head';

  const title = document.createElement('strong');
  title.textContent = parameter.label;

  const output = document.createElement('output');
  output.value = String(value);
  output.textContent = String(value);

  head.append(title, output);

  const input = document.createElement('input');
  input.dataset.parameterKey = parameter.key;
  input.name = parameter.key;

  if (parameter.type === 'number' || parameter.type === 'integer') {
    input.type = 'number';
    input.value = String(value);
    if (parameter.min !== undefined) input.min = String(parameter.min);
    if (parameter.max !== undefined) input.max = String(parameter.max);
    input.step = String(
      parameter.type === 'integer' ? 1 : (parameter.step ?? 'any'),
    );
  } else if (parameter.type === 'color') {
    input.type = 'color';
    input.value = String(value);
  } else if (parameter.type === 'boolean') {
    input.type = 'checkbox';
    input.checked = Boolean(value);
  } else {
    input.type = 'text';
    input.value = String(value);
  }

  const meta = document.createElement('span');
  meta.className = 'filter-atelier__control-meta';
  meta.textContent = [
    `key ${parameter.key}`,
    parameter.min === undefined ? null : `min ${parameter.min}`,
    parameter.max === undefined ? null : `max ${parameter.max}`,
    parameter.step === undefined ? null : `step ${parameter.step}`,
    parameter.unit ?? null,
  ]
    .filter(Boolean)
    .join(' · ');

  row.append(head, input, meta);
  return { row, input, output };
}

export function readControlValue(
  input: HTMLInputElement,
  parameter: FilterParameter,
): ParameterValue {
  if (parameter.type === 'number' || parameter.type === 'integer') {
    if (!Number.isFinite(input.valueAsNumber)) {
      throw new TypeError(`${parameter.key} must be a number`);
    }
    return input.valueAsNumber;
  }

  if (parameter.type === 'boolean') return input.checked;
  return input.value;
}

export function writeControlValue(
  input: HTMLInputElement,
  value: ParameterValue,
): void {
  if (input.type === 'checkbox') {
    input.checked = Boolean(value);
  } else {
    input.value = String(value);
  }
}
