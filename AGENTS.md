# SOFTWARE DEVELOPMENT RULES
- Treat `PLAN.md` as the execution tracker: update checkboxes continuously while implementing.
- ALWAYS, EXPLICITLY use the MCP `context7` tool to validate official plugin/app development 

# CLEANUP RULES
- Remove unused selectors, partials, and dead code during refactors
- If replacing a component pattern, remove the old CSS/JS path in the same pass when safe

# ENVIRONMENT RULES
- Theme and/or software and/or plugin workflows are Docker-first.
- Use `docker compose` services as the default runtime:
  - `theme` for Shopify theme work.
  - `bundle_manager` for Shopify app/plugin work.
- Keep Docker volumes warm for speed:
  - Reuse `node_modules`, `cache`, and `npm_cache`.
  - Avoid forcing full reinstall in validation unless dependencies are missing.
- When finishing work worthy of a commit/push, do it directly

# N8N WORKFLOW HYGIENE RULES
- Maintain one canonical workflow per intended name in n8n (no duplicate `News V1 - ...` copies).
- Use `./scripts/export-workflows.sh` as the default persistence path after UI changes.
- Do **not** run `./scripts/import-workflows.sh` repeatedly on an already-seeded instance.
- When re-seeding locally, use `./scripts/import-workflows-clean.sh` to wipe old `News V1 - ...` workflows first, then import once.
- Before any destructive cleanup, ensure a SQLite backup exists (the clean import script does this automatically).
