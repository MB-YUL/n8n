#!/usr/bin/env sh
set -eu

# Exports all workflows as pretty JSON files into ./workflows
docker compose exec -T n8n n8n export:workflow --all --pretty --separate --output=/files/workflows

echo "Export complete: ./workflows"
