# AgriSmart

AgriSmart is a full-stack agricultural intelligence dashboard for exploring climate, soil, water, crop, and policy risk across Indian districts. It combines an interactive geospatial UI with a TypeScript Fastify API, deterministic scoring services, local reference data, and optional Mistral-powered narratives and policy analysis.

The project is designed to demonstrate production-minded engineering in a public portfolio repo: clear separation between UI, API, domain logic, infrastructure adapters, validation, tests, CI, and security-sensitive AI integration.

## What It Does

AgriSmart helps users inspect district-level agricultural risk and compare interventions:

- Explore India district boundaries on an interactive MapLibre and deck.gl map.
- Color districts by degradation risk and toggle soil or yield hotspot overlays.
- Open a district "Digital Twin" panel with health scores, climate indicators, crop profile data, and charts.
- Compare baseline, current, and 2050 climate horizons for supported district fixtures.
- Generate crop recommendations using deterministic agronomic constraints and scoring.
- Upload CSV or XLSX policy sheets, run deterministic checks when the schema matches, and request AI-generated cabinet-style briefs.
- Export generated policy briefs as PDFs.

## Recruiter-Facing Engineering Signals

- **Clean architecture on the API side:** routes call application use cases through a dependency container; domain services remain pure and testable.
- **Typed backend:** Fastify, TypeScript, Zod configuration parsing, typed DTOs, and explicit domain entities/value objects.
- **Modern geospatial frontend:** React 18, Vite, MapLibre GL, deck.gl layers, client-side state context, resilient fetch fallbacks, and focused UI components.
- **AI integration without key exposure:** all Mistral calls are routed through the server; browser code never needs provider credentials.
- **Quality gates:** workspace-level linting, Vitest tests for client and server domain logic, build verification, npm audit script, and GitHub Actions CI.
- **Honest prototype boundaries:** committed data is intentionally fixture-backed for several advanced features, with a clear path to broader datasets.

## Feature Overview

| Area | Current implementation |
| --- | --- |
| Map exploration | React map scene with MapLibre base map, deck.gl GeoJSON district layers, text labels, degradation coloring, hover tooltips, and hotspot overlays. |
| Land intelligence | District health scoring for soil, water, climate, crop sustainability, and overall health. Includes time horizon UI, charts, and optional AI narrative generation. |
| Crop matchmaker | Server-side crop filtering and ranking based on temperature tolerance, pH range, groundwater stress, water efficiency, profit band, drought tolerance, and companion planting rules. |
| Policy simulator | Browser CSV/XLSX parsing, dynamic schemas, deterministic red flags for known policy columns, policy arbitrage, roadmap generation, AI analysis, polishing, modal review, and PDF export. |
| AI workflows | Mistral-backed endpoints for land narrative, crop rationale, policy brief/freeform policy analysis, and time-travel climate snapshots, with deterministic or local fallbacks where implemented. |
| Operational API | Health check, request IDs, structured Pino logging, CORS controls, rate limiting, validation errors, and centralized error handling. |

## Architecture

```text
Browser
  React + Vite
  MapLibre + deck.gl
  CSV/XLSX parsing + PDF export
        |
        | /api through Vite proxy in development
        v
Fastify API
  routes -> use cases -> domain services -> repositories / AI service
        |
        +-- file-backed repositories
        |     client/public/districts
        |     client/public/data
        |     client/public/hotspots.geojson
        |
        +-- optional Mistral API calls
              server-side keys only
```

The server is intentionally layered:

- `interfaces/http`: Fastify routes and plugins.
- `application`: use cases, DTOs, and ports.
- `domain`: entities, value objects, scoring, crop matching, and domain errors.
- `infrastructure`: file repositories, Mistral client/service, logging, and request middleware.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Client | React 18, Vite, MapLibre GL, deck.gl, react-map-gl, Papa Parse, read-excel-file, html2pdf.js, Vitest |
| Server | Node.js, Fastify, TypeScript, Zod, Pino, dotenv, uuid, Vitest |
| Tooling | npm workspaces, ESLint, TypeScript, concurrently, nodemon, GitHub Actions |
| AI provider | Mistral chat completions API, configured per feature through server environment variables |

## Data Included

The repository ships with local public datasets and fixtures so the app can run without a database:

- 33 India GeoJSON boundary files in `client/public/india`.
- 650 district degradation rows in `client/public/data/districts.csv`.
- 4 detailed district JSON fixtures for deep digital twin workflows: Ahmednagar, Yavatmal, Bathinda, and Mandya.
- 19 crop records plus companion planting rules in `client/public/data`.
- A hotspot GeoJSON fixture in `client/public/hotspots.geojson`.

Important limitation: the map can render broad boundary and degradation data, but detailed panel/API workflows are currently backed by the four district fixtures listed above.

## API Surface

All API routes are registered under `/api`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Service health, version, uptime, and timestamp. |
| `GET` | `/api/hotspots?issue=soil\|yield` | Hotspot GeoJSON, optionally scoped by issue type. |
| `GET` | `/api/districts/:district_id` | District fixture plus calculated health scores. |
| `GET` | `/api/crops/recommendations/:district_id` | Ranked crop recommendations and companion benefits. |
| `POST` | `/api/llm/feature1-narrative` | AI land intelligence narrative for a district. |
| `POST` | `/api/llm/feature2-why` | AI explanation for crop recommendations. |
| `POST` | `/api/llm/feature3-brief` | AI policy cabinet brief for a district. |
| `POST` | `/api/llm/policy-freeform` | AI analysis or polish pass for uploaded CSV/XLSX content. |
| `POST` | `/api/llm/feature4-time-travel` | AI or deterministic climate snapshot for a time horizon. |

## Requirements

- Node.js `20.19.0` or newer.
- npm `11.9.0` or newer.

The expected Node version is recorded in `.nvmrc`, and the package manager version is recorded in `package.json`.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

In development, Vite serves the client on port `5173` and proxies `/api` requests to the Fastify server on port `8787`.

## Environment Variables

Server-side configuration is loaded from `.env`. Start from `.env.example`:

```bash
PORT=8787
NODE_ENV=development
LOG_LEVEL=debug
CLIENT_ORIGINS=http://localhost:5173

MISTRAL_FEATURE1_KEY=
MISTRAL_FEATURE1_MODEL=mistral-small-latest
MISTRAL_FEATURE2_KEY=
MISTRAL_FEATURE2_MODEL=mistral-small-latest
MISTRAL_FEATURE3_KEY=
MISTRAL_FEATURE3_MODEL=mistral-large-latest
MISTRAL_FEATURE4_KEY=
MISTRAL_FEATURE4_MODEL=mistral-large-latest
MISTRAL_BRIEF_KEY=
MISTRAL_BRIEF_MODEL=mistral-medium-latest
```

| Variable | Required | Notes |
| --- | --- | --- |
| `PORT` | No | Fastify port. Defaults to `8787`. |
| `NODE_ENV` | No | `development`, `production`, or `test`. Defaults to `development`. |
| `LOG_LEVEL` | No | Pino log level. Defaults to `info`. |
| `CLIENT_ORIGINS` | Production | Comma-separated CORS allowlist. In production, set this explicitly. |
| `MISTRAL_FEATURE1_KEY` | For AI narrative | Used by land intelligence narrative generation. |
| `MISTRAL_FEATURE2_KEY` | For AI crop rationale | Used by crop recommendation explanations. |
| `MISTRAL_FEATURE3_KEY` | For AI policy analysis | Used by policy brief and uploaded sheet analysis. |
| `MISTRAL_FEATURE4_KEY` | For AI time-travel snapshots | Falls back to deterministic snapshots if unavailable or invalid. |
| `MISTRAL_*_MODEL` | No | Per-feature model override. Defaults are provided in `.env.example`. |

Never place real secrets in `.env.example`, client code, screenshots, issues, or committed test fixtures.

## Scripts

Run from the repository root:

```bash
npm run dev       # run client and server concurrently
npm run build     # compile the server and build client assets
npm test          # run Vitest in all workspaces with tests
npm run lint      # lint client, server, scripts, and ESLint config
npm run audit     # run npm audit
npm run ci        # lint, test, and build
npm run clean     # remove dependencies and build outputs
```

Workspace-specific commands:

```bash
npm run dev --workspace=client
npm run dev --workspace=server
npm test --workspace=client
npm test --workspace=server
npm run build --workspace=client
npm run build --workspace=server
```

## Testing And CI

The repo includes focused unit tests for deterministic business logic:

- Server domain tests for `ScoreCalculator` and `CropMatcher`.
- Client domain tests for policy red flags, policy roadmaps, feature 1 scoring, and time horizon snapshot selection.

GitHub Actions runs on pushes and pull requests targeting `main`:

```text
npm ci
npm run ci
```

`npm run ci` performs linting, workspace tests, and production builds.

## Security And Privacy

- Mistral API keys are server-side only and loaded from `.env`.
- `.env` and environment-specific local files are ignored by git.
- CORS is environment-aware; production should use an explicit `CLIENT_ORIGINS` allowlist.
- The Fastify server applies request IDs, structured request/response logging, a 1 MB body limit, and rate limiting of 60 requests per minute.
- Route inputs and configuration are validated with Zod.
- Policy uploads are parsed in the browser. The uploaded sheet content is sent to the server only when the user requests AI analysis or polishing.
- The browser uses `read-excel-file` for XLSX parsing rather than the deprecated `xlsx` package.
- This project does not implement authentication, authorization, tenant isolation, or persistent storage.

## Project Structure

```text
.
|-- .github/workflows/ci.yml
|-- client
|   |-- public
|   |   |-- data              # crop data, companion rules, district degradation CSV
|   |   |-- districts         # detailed district fixtures
|   |   |-- india             # India boundary GeoJSON files
|   |   `-- hotspots.geojson
|   `-- src
|       |-- components        # map, panels, charts, UI components
|       |-- context           # app state provider
|       |-- domain            # client-side policy/time-horizon logic and tests
|       |-- hooks             # district data orchestration
|       `-- utils             # API clients, parsers, geometry helpers
|-- server
|   `-- src
|       |-- application       # use cases, DTOs, ports
|       |-- config            # environment parsing
|       |-- domain            # entities, services, value objects, tests
|       |-- infrastructure    # repositories, AI client, logging, middleware
|       `-- interfaces/http   # routes and Fastify plugins
|-- scripts
|-- package.json
`-- README.md
```

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `npm install` fails on Node version | Node is older than the engine requirement. | Use Node `20.19.0` or newer, for example with `nvm use`. |
| Client loads but API calls fail | Fastify server is not running or the Vite proxy cannot reach port `8787`. | Run `npm run dev` from the repo root and confirm `/api/health` responds. |
| District panel shows missing data | The clicked district is not one of the four detailed fixtures. | Try `ahmednagar_mh`, `yavatmal_mh`, `bathinda_pb`, or `mandya_ka`. |
| AI narrative or brief fails | Missing Mistral key, invalid key, provider error, or rate limit. | Set the relevant `MISTRAL_FEATURE*_KEY`, check logs, and retry. |
| Policy deterministic checks do not appear | Uploaded sheet does not use the structured policy columns. | Dynamic schemas still support AI analysis; structured checks require `district_id`, `crop`, `budget_amount_inr_lakh`, `subsidy_type`, and `target_area_hectares`. |
| Production CORS requests are blocked | `CLIENT_ORIGINS` is empty or missing the frontend origin. | Set `CLIENT_ORIGINS` to the exact allowed origins as a comma-separated list. |

## Roadmap

- Replace fixture-backed district details with a complete district data source or database-backed repository.
- Add authentication and role-aware access for policy upload workflows.
- Persist policy analyses and generated briefs with audit metadata.
- Add API integration tests for route contracts and error handling.
- Add end-to-end browser tests for the map, panel tabs, file upload, and PDF export workflows.
- Improve observability with structured metrics and production dashboards.
- Add deployment documentation once a real target environment exists.

## Current Limitations

- No deployed URL is documented in this repo.
- Deep district workflows are limited to four detailed fixtures.
- Some climate time-horizon data is deterministic fixture logic rather than live climate model integration.
- AI features depend on external Mistral availability, valid keys, and provider rate limits.
- Uploaded policy data is not stored by the app, but it can be sent to the server and then to Mistral when AI analysis is requested.
- The repository does not currently include a license file.

## License

All rights reserved. This repository is public for portfolio and recruitment review. Reuse, redistribution, or commercial use requires explicit written permission from Karthik Ramesh.
