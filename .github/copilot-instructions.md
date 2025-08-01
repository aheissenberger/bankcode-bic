# Copilot Instructions for bankcode-bic

## Project Purpose & Architecture

- **Goal:** Convert EU bank codes to BICs and vice versa using official datasets (ECB and national sources). Provides both CLI and API for lookups.
- **Major Components:**
  - `src/cli.ts`: CLI entry point, parses commands and options, dispatches to lookup/download/generate logic. Testable via injected command handlers.
  - `src/commands/`: Implements CLI commands (`download`, `generate`, `lookup`, `help`). Each command is modular and testable.
  - `src/download/`: Per-country data fetch/parse logic. To add a country, copy an existing file, update URLs/parsing, and add to CLI/config.
  - `src/libs/`: Core utilities for caching (Node: `.cache/`, Browser: `localStorage`), data fetching, packing, and query helpers. Node cache uses SHA256 keys and v8 serialization.
  - `tests/`: Vitest-based unit tests for all major components, including cache, data packing, and CLI (with process.exit mocking).
  - `data/`: Example CSV datasets for dev/testing.

## Developer Workflows

- **Install:** `pnpm install`
- **Build:** `pnpm build` (uses tsdown)
- **Test:** `pnpm test` (Vitest)
- **Lint:** `pnpm lint` / `pnpm lint:fix`
- **Typecheck:** `pnpm typecheck`
- **Format:** `pnpm format`
- **Release:** `pnpm release` (bumpp + publish, see README for tagging)

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
  - Commands: `download`, `generate`, `lookup`, `help`.
  - Options: `--countries`, `--clear-cache`, `--debug`, `--no-cache`, `--cache-ttl <ms>`, `--field-names`, `--key-names`, `--format`, `-h/--help`.
  - See `src/cli.ts` for argument parsing and dispatch. CLI is testable by injecting mocks for command handlers and process.exit.
- **Testing:**
  - All cache logic is covered by unit tests with custom FS/v8 mocks.
  - CLI tests mock process.exit and inject command handlers.
- **TypeScript:**
  - Strict mode, emits declarations, uses generics for cache/fetch utilities. All public types are exported in the main entrypoint.

## Integration Points & Data Flows

- **ECB & National Datasets:** Fetched from official URLs, parsed and cached for lookups. See `src/download/` for per-country logic and field mapping.
- **Exports:**
  - Main API: `dist/index.js`
  - CLI: `dist/cli.js` (binary in `package.json`)
  - Platform-specific cache/fetch: see `exports` in `package.json`.
- **Data Flow:** fetch → parse → index → cache → lookup. All logic is environment-agnostic and testable with mocks.

## Datasets & Field Mapping

- See the `README.md` table for supported countries, data formats, and field mappings (output field → original column).
- For France/Spain, `bankcode` is derived from `RIAD_CODE` (see README footnote).

## Adding a Country

- Copy an existing file in `src/download/`, update URLs/parsing, and add to CLI/config.
- Update the datasets table in `README.md` with the new country, format, and field mapping.

---

If any section is unclear or missing, please provide feedback so instructions can be improved for future AI agents.
