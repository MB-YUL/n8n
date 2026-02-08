# n8n Local Project

This repo runs n8n locally with Docker and keeps workflow JSON files in Git.

## Setup

1. Create your local env file:

```sh
cp .env.example .env
```

2. Set a stable encryption key in `.env`:

```sh
N8N_ENCRYPTION_KEY=your_long_random_secret
```

Generate one if needed:

```sh
openssl rand -hex 32
```

Important: keep this key unchanged for the same n8n instance, or saved credentials may become unreadable.

## Run n8n

From this folder:

```sh
docker compose up -d
```

Open:

- http://localhost:5678

Useful commands:

```sh
docker compose ps
docker compose logs -f n8n
docker compose down
```

## Volumes and Folders

- `./data` -> `/home/node/.n8n` (runtime state, not committed)
- `./workflows` -> `/files/workflows` (workflow exports, committed)
- `./sources` -> `/sources` (your source files)
- `./news` -> `/news` (your news files)

## Workflow Export and Import

Export all workflows to version-controlled JSON files:

```sh
./scripts/export-workflows.sh
```

Import tracked workflow files into a running n8n instance:

```sh
./scripts/import-workflows.sh
```

## News Pipeline (V1, Implemented)

V1 ingestion and unread/read state management are implemented via:

- `scripts/news_pipeline.mjs`
- `sources/v1_sources.json`
- `news/index.json`

Commands:

```sh
# fetch new items from all v1 sources
node scripts/news_pipeline.mjs fetch

# fetch specific sources
node scripts/news_pipeline.mjs fetch --source arxiv-cscl,arxiv-cslg

# list unread items
node scripts/news_pipeline.mjs list-unread

# filter unread by source/date
node scripts/news_pipeline.mjs list-unread --source openai-blog --date-from 2026-02-01 --date-to 2026-02-08

# mark items as read
node scripts/news_pipeline.mjs mark-read --id <item_id>
```

Wrapper scripts:

```sh
./scripts/news-fetch.sh
./scripts/news-list-unread.sh
./scripts/news-mark-read.sh --id <item_id>
```

Stored files:

- Markdown content: `/news/YYYY/MM/DD/<source_id>__<slug>-<hash12>.md`
- Status index: `/news/index.json`

## Clean Workflow Import

To avoid duplicate `News V1 - ...` workflows in n8n:

```sh
./scripts/import-workflows-clean.sh
```

This script:

- backs up `data/database.sqlite`
- removes existing `News V1 - ...` workflows
- imports the canonical workflow files once

Use this for re-seeding. For normal day-to-day changes, edit existing workflows in UI, then export.

## Gmail Ingestion Fallback (Phase 2)

Workflow added:

- `News V1 - Ingest Gmail (Trigger)`

It uses:

1. `Gmail Trigger` node (configure Gmail OAuth credential in n8n UI)
2. `Build Payload` (Code node)
3. `Ingest Item` (`Execute Command`) calling:
   - `node /scripts/news_pipeline.mjs ingest-item --payload-b64 ...`

Result:

- New newsletter items from Gmail are stored in `/news/YYYY/MM/DD/*.md`
- They are added to `/news/index.json` as `status: unread`

## Troubleshooting

- If `http://localhost:5678` does not load, check:
  - `docker compose logs -f n8n`
  - port `5678` is free
  - `.env` values are valid
