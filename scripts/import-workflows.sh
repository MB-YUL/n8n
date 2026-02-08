#!/usr/bin/env sh
set -eu

# Imports all JSON files from ./workflows into n8n
docker compose exec -T n8n n8n import:workflow --separate --input=/files/workflows

echo "Import complete from: ./workflows"
