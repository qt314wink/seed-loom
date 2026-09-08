import { access, constants } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const rootTsc = fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url));
const localTsc = fileURLToPath(new URL("../node_modules/.bin/tsc", import.meta.url));

async function resolveTsc() {
  for (const candidate of [rootTsc, localTsc]) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // try the next candidate
    }
  }
  throw new Error("Unable to locate a tsc binary in the root or package node_modules.");
}

const tsc = await resolveTsc();
const result = spawnSync(tsc, process.argv.slice(2), { stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
