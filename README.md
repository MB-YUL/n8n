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

## Troubleshooting

- If `http://localhost:5678` does not load, check:
  - `docker compose logs -f n8n`
  - port `5678` is free
  - `.env` values are valid
