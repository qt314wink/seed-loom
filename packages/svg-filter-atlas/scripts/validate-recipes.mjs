import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const recipesRoot = join(root, "recipes");
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.name.endsWith(".json")) files.push(path);
  }
  return files;
}

function flatten(nodes) {
  return nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);
}

function isStepAligned(value, parameter) {
  if (parameter.step === undefined) return true;
  const origin = parameter.min ?? 0;
  const quotient = (value - origin) / parameter.step;
  return Math.abs(quotient - Math.round(quotient)) < 1e-8;
}

function validateNumericValue(errors, file, path, value, parameter) {
  if (typeof value !== "number" || !Number.isFinite(value)) return;
  if (parameter.min !== undefined && value < parameter.min) {
    errors.push(`${file}: ${path} is below min ${parameter.min}`);
  }
  if (parameter.max !== undefined && value > parameter.max) {
    errors.push(`${file}: ${path} is above max ${parameter.max}`);
  }
  if (!isStepAligned(value, parameter)) {
    errors.push(`${file}: ${path} must align to step ${parameter.step} from ${parameter.min ?? 0}`);
  }
}

const errors = [];
const seenRecipeIds = new Set();
for (const file of await walk(recipesRoot)) {
  const recipe = JSON.parse(await readFile(file, "utf8"));
  if (!idPattern.test(recipe.id)) errors.push(`${file}: invalid recipe id`);
  if (seenRecipeIds.has(recipe.id)) errors.push(`${file}: duplicate recipe id ${recipe.id}`);
  seenRecipeIds.add(recipe.id);

  const nodes = flatten(recipe.primitives ?? []);
  const ids = new Set();
  for (const node of nodes) {
    if (ids.has(node.id)) errors.push(`${file}: duplicate primitive id ${node.id}`);
    ids.add(node.id);
  }

  if (recipe.performance?.primitiveCount !== recipe.primitives.length) {
    errors.push(`${file}: performance.primitiveCount must equal top-level primitive count (${recipe.primitives.length})`);
  }

  const parameters = recipe.parameters ?? [];
  const parameterKeys = new Set(parameters.map((parameter) => parameter.key));
  for (const parameter of parameters) {
    const target = nodes.find((node) => node.id === parameter.binding?.primitiveId);
    if (!target) errors.push(`${file}: ${parameter.key} targets unknown primitive`);
    else if (!(parameter.binding.attribute in target.attributes)) errors.push(`${file}: ${parameter.key} targets unknown attribute`);

    if (parameter.step !== undefined && parameter.step <= 0) {
      errors.push(`${file}: ${parameter.key} step must be greater than zero`);
    }
    if (
      parameter.min !== undefined &&
      parameter.max !== undefined &&
      parameter.min > parameter.max
    ) {
      errors.push(`${file}: ${parameter.key} min must not exceed max`);
    }

    validateNumericValue(
      errors,
      file,
      `${parameter.key} default`,
      parameter.default,
      parameter,
    );
  }

  for (const [preset, data] of Object.entries(recipe.presets ?? {})) {
    if (!idPattern.test(preset)) errors.push(`${file}: invalid preset key ${preset}`);
    for (const [key, value] of Object.entries(data.values ?? {})) {
      const parameter = parameters.find((candidate) => candidate.key === key);
      if (!parameterKeys.has(key) || !parameter) {
        errors.push(`${file}: preset ${preset} references unknown parameter ${key}`);
        continue;
      }
      validateNumericValue(
        errors,
        file,
        `preset ${preset}.${key}`,
        value,
        parameter,
      );
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Validated ${seenRecipeIds.size} recipes with no structural errors.`);
