# Copilot Instructions for bankcode-bic

## Project Overview

- **Purpose:** Convert EU bank codes to BICs and vice versa using official datasets (ECB and national sources). Provides both CLI and API.
- **Architecture:**
  - `src/commands/lookup.ts`: Core lookup logic for bankcode/BIC queries, using cached and indexed data.
  - `src/libs/cache.node.ts` & `src/libs/cache.browser.ts`: Node (file-based) and browser (localStorage) cache implementations. Node cache uses `.cache/` and `nodecache-meta.json` for expiry.
  - `src/libs/cached-fetch.ts`: Generic cached fetch utility, supports transform functions and cache TTL.
  - `src/cli.ts`: CLI entry point, parses commands and options, dispatches to lookup/download logic.
  - `src/download/`: Per-country data fetch/parse logic. Add new countries by copying an existing file and updating URLs/parsing.
  - `data/`: Example CSV datasets for dev/testing.
  - `tests/`: Vitest-based unit tests for all major components, including cache and data packing.

## Developer Workflows

- **Install:** `pnpm install`
- **Build:** `pnpm build` (uses tsdown)
- **Test:** `pnpm test` (Vitest)
- **Lint:** `pnpm lint` / `pnpm lint:fix`
- **Typecheck:** `pnpm typecheck`
- **Format:** `pnpm format`
- **Release:** `pnpm release` (bumpp + publish)

## Key Patterns & Conventions

- **Cache:**
  - Node: `.cache/` dir, meta in `nodecache-meta.json`, keys are SHA256 hashes.
  - Browser: `localStorage`.
  - Serialization: Node uses `v8` module.
- **Data Fetching:**
  - All data fetched via `cachedFetch` with transform and TTL support.
  - Data is parsed and indexed for fast lookups (dual hash maps for RIAD_CODE and BIC).
- **Data Packing:**
  - `packData` supports three formats: `flat` (no key), `keyed` (one key), `serialized` (multi-key). See `src/libs/pack-data.ts` for rules and examples.
- **CLI:**
  - Commands: `download`, `lookup bankcode`, `lookup bic`, `help`.
  - Options: `--details`, `--noCache`, `--cacheTtl <ms>`, `-h/--help`.
  - See `src/cli.ts` for argument parsing and dispatch.
- **Testing:**
  - All cache logic is covered by unit tests with custom FS/v8 mocks.
  - Tests verify file naming, meta expiry, serialization, and data packing.
- **TypeScript:**
  - Strict mode, emits declarations, uses generics for cache/fetch utilities.

## Integration Points

- **ECB & National Datasets:** Fetched from official URLs, parsed and cached for lookups. See `src/download/` for per-country logic.
- **Exports:**
  - Main API: `dist/index.js`
  - CLI: `dist/cli.js` (binary in `package.json`)
  - Platform-specific cache/fetch: see `exports` in `package.json`.

## Examples

- Lookup by bankcode: `bankcode-bic lookup bankcode LT 305156796 --details`
- Lookup by BIC: `bankcode-bic lookup bic FNRKLT22XXX --details`
- Download dataset: `bankcode-bic download data/test.csv`

## Special Notes

- No runtime dependencies; all logic is dependency-free except for dev tooling.
- All cache and fetch logic is environment-agnostic and testable with mocks.
- Data flows: fetch → parse → index → cache → lookup.
- To add a country: copy a file in `src/download/`, update URLs/parsing, and add to CLI/config.

---

If any section is unclear or missing, please provide feedback so instructions can be improved for future AI agents.
