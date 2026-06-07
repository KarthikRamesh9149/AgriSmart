# AgriSmart

AgriSmart is a full-stack agricultural intelligence dashboard for Indian districts. The app combines map-based district exploration, crop recommendations, policy analysis, and Mistral-powered explanations for climate-aware farming decisions.

## Stack

- Client: React 18, Vite, Deck.gl, MapLibre GL, Vitest
- Server: Node.js, Fastify, TypeScript, Zod, Pino, Vitest
- Workspace: npm workspaces with separate `client` and `server` packages

## Requirements

- Node.js 20.19 or newer
- npm 11 or newer

The expected Node version is recorded in `.nvmrc`.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` requests to the Fastify server on `http://localhost:8787`.

## Environment

Server-side configuration is loaded from `.env`.

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

For production, set `CLIENT_ORIGINS` to the allowed browser origins as a comma-separated list.

## Scripts

```bash
npm run dev       # run client and server together
npm run lint      # run ESLint across client and server sources
npm test          # run all workspace tests
npm run build     # compile server and build client assets
npm run audit     # run npm audit
npm run ci        # lint, test, and build
npm run clean     # remove installed dependencies and build outputs
```

Workspace-specific commands are also available:

```bash
npm run dev --workspace=client
npm run dev --workspace=server
npm test --workspace=client
npm test --workspace=server
```

## Features

- District map exploration across India
- Land health, water, climate, crop viability, and overall district scores
- Time horizon snapshots for baseline, current, and projected climate conditions
- Crop recommendations with companion planting context
- Policy CSV/XLSX upload, deterministic checks for structured schemas, and AI-generated cabinet briefs
- PDF export for policy briefs

## Data And Security Notes

- Mistral API keys are server-side only and must not be exposed to the client bundle.
- Local `.env` files are ignored by git. Keep `.env.example` free of secrets.
- Policy uploads are parsed in the browser and sent to the server only when generating AI analysis.
- XLSX parsing uses a maintained reader package instead of the deprecated vulnerable `xlsx` package.

## CI

GitHub Actions runs `npm ci` and `npm run ci` for pushes and pull requests targeting `main`.
