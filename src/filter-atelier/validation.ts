import {
  resolveParameters,
  validateRecipe,
  type FilterParameter,
  type FilterRecipe,
  type ParameterValue,
} from '@melodicbloom/svg-filter-atlas';
import type { AuthoringModel } from './model';

export interface DraftIssue {
  path: string;
  message: string;
}

export interface DraftValidation {
  valid: boolean;
  issues: readonly DraftIssue[];
}

function isStepAligned(
  value: number,
  parameter: FilterParameter,
): boolean {
  if (parameter.step === undefined) return true;
  const origin = parameter.min ?? 0;
  const quotient = (value - origin) / parameter.step;
  return Math.abs(quotient - Math.round(quotient)) < 1e-8;
}

function candidateRecipe(
  model: AuthoringModel,
  values: Readonly<Record<string, ParameterValue>>,
): FilterRecipe {
  const recipe = structuredClone(model.recipe);
  recipe.presets = {
    ...recipe.presets,
    'atelier-candidate': {
      name: 'Atelier Candidate',
      description:
        'Unapproved browser-local candidate used only for validation.',
      values: { ...values },
    },
  };
  return recipe;
}

export function validateDraft(
  model: AuthoringModel,
  values: Readonly<Record<string, ParameterValue>>,
): DraftValidation {
  const issues: DraftIssue[] = [];
  const expectedKeys = new Set(
    model.controls.map((parameter) => parameter.key),
  );

  for (const key of Object.keys(values)) {
    if (!expectedKeys.has(key)) {
      issues.push({
        path: `values.${key}`,
        message: 'is not declared by the canonical recipe',
      });
    }
  }

  for (const parameter of model.controls) {
    const value = values[parameter.key];

    if (value === undefined) {
      issues.push({
        path: `values.${parameter.key}`,
        message: 'is required',
      });
      continue;
    }

    if (
      (parameter.type === 'number' ||
        parameter.type === 'integer') &&
      typeof value === 'number' &&
      !isStepAligned(value, parameter)
    ) {
      issues.push({
        path: `values.${parameter.key}`,
        message: `must align to step ${parameter.step}`,
      });
    }
  }

  try {
    resolveParameters(model.recipe, undefined, { ...values });
  } catch (error) {
    issues.push({
      path: 'values',
      message: error instanceof Error ? error.message : String(error),
    });
  }

  for (const issue of validateRecipe(candidateRecipe(model, values))) {
    issues.push(issue);
  }

  return Object.freeze({
    valid: issues.length === 0,
    issues: Object.freeze(issues),
  });
}
