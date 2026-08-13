# Root reproducibility and deployment boundary

`package-lock.json` is the authoritative root dependency contract. Root automation must use `npm ci`; package-local lockfiles remain package-local and this policy does not migrate workspaces.

The root verification order is a full lifecycle-enabled `npm ci`, lock agreement, TypeScript, build, visual regression, schema validation, and artifact inspection. `npm run verify:root` uses that same order locally. The Root Reproducibility Boundary workflow records those outcomes together with the complete Git state (tracked and untracked files) in a retained Snowflake preflight report.

GitHub remains the canonical home for nightly provenance evidence. Vercel's `ignoreCommand` skips commits that change only nondeployable paths, including `portfolio/evidence/`. It fails open (continues the build) when the comparison cannot be established. Application entry points, root build configuration, the SVG Filter Atlas, and design tokens remain deployable paths.
