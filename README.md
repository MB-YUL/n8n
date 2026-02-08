# n8n Project

This repository runs n8n locally via Docker and version-controls workflow JSON exports.

## Project Structure

- `docker-compose.yml`: local n8n runtime
- `data/`: n8n runtime state (not committed)
- `workflows/`: committed workflow exports (`.json`)
- `sources/`: local source files mounted to `/sources` in container
- `news/`: local news files mounted to `/news` in container
- `scripts/export-workflows.sh`: export workflows from running n8n
- `scripts/import-workflows.sh`: import workflows into running n8n

## Quick Start

1. Create local env file:

```sh
cp .env.example .env
```

2. Set a strong `N8N_ENCRYPTION_KEY` in `.env`.

3. Start n8n:

```sh
docker compose up -d
```

4. Open:

- http://localhost:5678

## Workflow Versioning

After creating or updating workflows in UI:

```sh
./scripts/export-workflows.sh
git add workflows
git commit -m "chore(workflows): export latest flows"
```

To load tracked workflows into a fresh local instance:

```sh
./scripts/import-workflows.sh
```
