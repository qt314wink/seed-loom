import type {
  FilterParameter,
  FilterRecipe,
  ParameterValue,
  PrimitiveNode,
} from "./types.js";

export interface ValidationIssue {
  path: string;
  message: string;
}

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function flatten(nodes: PrimitiveNode[]): PrimitiveNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);
}

function valueIsValid(value: ParameterValue, type: string): boolean {
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "integer") return typeof value === "number" && Number.isInteger(value);
  if (type === "boolean") return typeof value === "boolean";
  if (type === "color") return typeof value === "string" && COLOR_PATTERN.test(value);
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function isStepAligned(value: number, parameter: FilterParameter): boolean {
  if (parameter.step === undefined) return true;
  const origin = parameter.min ?? 0;
  const quotient = (value - origin) / parameter.step;
  return Math.abs(quotient - Math.round(quotient)) < 1e-8;
}

function validateParameterValue(
  issues: ValidationIssue[],
  path: string,
  value: ParameterValue,
  parameter: FilterParameter,
): void {
  if (!valueIsValid(value, parameter.type)) {
    issues.push({ path, message: `is invalid for type ${parameter.type}` });
    return;
  }

  if (typeof value !== "number") return;
  if (parameter.min !== undefined && value < parameter.min) {
    issues.push({ path, message: "is below min" });
  }
  if (parameter.max !== undefined && value > parameter.max) {
    issues.push({ path, message: "is above max" });
  }
  if (parameter.step !== undefined && !isStepAligned(value, parameter)) {
    issues.push({
      path,
      message: `must align to step ${parameter.step} from ${parameter.min ?? 0}`,
    });
  }
}

export function validateRecipe(recipe: FilterRecipe): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!ID_PATTERN.test(recipe.id)) issues.push({ path: "id", message: "must be kebab-case" });
  if (!recipe.name) issues.push({ path: "name", message: "is required" });
  if (!recipe.primitives.length) issues.push({ path: "primitives", message: "must contain at least one primitive" });
  if (!Object.keys(recipe.presets).length) issues.push({ path: "presets", message: "must contain at least one preset" });

  const primitives = flatten(recipe.primitives);
  const primitiveIds = new Set<string>();
  for (const primitive of primitives) {
    if (primitiveIds.has(primitive.id)) issues.push({ path: `primitives.${primitive.id}`, message: "duplicate primitive id" });
    primitiveIds.add(primitive.id);
  }

  const parameterKeys = new Set<string>();
  for (const parameter of recipe.parameters) {
    if (parameterKeys.has(parameter.key)) issues.push({ path: `parameters.${parameter.key}`, message: "duplicate parameter key" });
    parameterKeys.add(parameter.key);

    if (parameter.step !== undefined && parameter.step <= 0) {
      issues.push({ path: `parameters.${parameter.key}.step`, message: "must be greater than zero" });
    }
    if (
      parameter.min !== undefined &&
      parameter.max !== undefined &&
      parameter.min > parameter.max
    ) {
      issues.push({ path: `parameters.${parameter.key}`, message: "min must not exceed max" });
    }

    const primitive = primitives.find((item) => item.id === parameter.binding.primitiveId);
    if (!primitive) {
      issues.push({ path: `parameters.${parameter.key}.binding`, message: "references an unknown primitive" });
      continue;
    }
    if (!(parameter.binding.attribute in primitive.attributes)) {
      issues.push({ path: `parameters.${parameter.key}.binding`, message: "references an unknown attribute" });
    }

    validateParameterValue(
      issues,
      `parameters.${parameter.key}.default`,
      parameter.default,
      parameter,
    );
  }

  for (const [presetKey, preset] of Object.entries(recipe.presets)) {
    if (!ID_PATTERN.test(presetKey)) issues.push({ path: `presets.${presetKey}`, message: "preset key must be kebab-case" });
    for (const [key, value] of Object.entries(preset.values)) {
      const parameter = recipe.parameters.find((item) => item.key === key);
      if (!parameter) {
        issues.push({ path: `presets.${presetKey}.values.${key}`, message: "references an unknown parameter" });
        continue;
      }
      validateParameterValue(
        issues,
        `presets.${presetKey}.values.${key}`,
        value,
        parameter,
      );
    }
  }

  if (recipe.performance.primitiveCount !== recipe.primitives.length) {
    issues.push({ path: "performance.primitiveCount", message: `expected ${recipe.primitives.length} top-level primitives` });
  }
  return issues;
}

export function assertValidRecipe(recipe: FilterRecipe): void {
  const issues = validateRecipe(recipe);
  if (issues.length) {
    throw new Error(`${recipe.id} failed validation:\n${issues.map((issue) => `- ${issue.path}: ${issue.message}`).join("\n")}`);
  }
}
