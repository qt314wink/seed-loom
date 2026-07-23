import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  compileDefinitions,
  compileFilter,
  filterUrl,
  filters,
  recipes,
  resolveParameters,
  validateRecipe,
} from "../dist/index.js";

test("catalog contains the eight signature recipes", () => {
  assert.equal(recipes.length, 8);
  assert.equal(recipes.reduce((sum, recipe) => sum + Object.keys(recipe.presets).length, 0), 24);
});

test("every recipe passes runtime validation", () => {
  for (const recipe of recipes) assert.deepEqual(validateRecipe(recipe), []);
});

test("a named preset resolves over defaults", () => {
  const recipe = filters.get("nacre-laminate");
  const resolved = resolveParameters(recipe, "abalone-ridge");
  assert.equal(resolved["surface-scale"], 6.5);
  assert.equal(resolved["specular-exponent"], 38);
});

test("compiler binds vector components and namespaces the filter", () => {
  const recipe = filters.get("washi-fiber");
  const svg = compileFilter(recipe, { id: "card-7--washi", parameters: { "fiber-x": 0.01 } });
  assert.match(svg, /id="card-7--washi"/);
  assert.match(svg, /baseFrequency="0.01 0.48"/);
});

test("definitions compile multiple recipes", () => {
  const svg = compileDefinitions(recipes, [
    { recipe: "nacre-laminate", preset: "pearl-calm" },
    { recipe: "brass-inlay", preset: "polished-inlay" },
  ]);
  assert.match(svg, /mb--nacre-laminate--pearl-calm/);
  assert.match(svg, /mb--brass-inlay--polished-inlay/);
});

test("runtime filter URLs use stable static IDs", () => {
  assert.equal(filterUrl("marble-vein", "calacatta-bold"), 'url("#mb--marble-vein--calacatta-bold")');
});

test("generated registry and definition bundle are consistent", async () => {
  const registry = JSON.parse(await readFile(new URL("../generated/registry.json", import.meta.url), "utf8"));
  const definitions = await readFile(new URL("../generated/definitions.svg", import.meta.url), "utf8");
  assert.equal(registry.recipeCount, 8);
  assert.equal(registry.presetCount, 24);
  assert.match(definitions, /mb--guanine-crystal--excited-spectrum/);
});
