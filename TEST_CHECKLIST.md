# n8n News Pipeline Test Checklist

Use this checklist whenever you want to validate the setup quickly.

## Pre-checks

- [ ] `docker compose ps` shows `n8n` as `Up`.
- [ ] In n8n UI, `News V1 - Fetch Scheduler` is active.
- [ ] In n8n UI, `News V1 - Ingest Gmail (Trigger)` is active and uses `recursifai@gmail.com` credential.

## Fetch Pipeline (RSS/Web)

- [ ] Run `News V1 - Fetch (Manual)` once from n8n UI.
- [ ] Confirm workflow execution is successful.
- [ ] Confirm new markdown files exist under `news/YYYY/MM/DD/`.
- [ ] Confirm records exist in `news/index.json` with `status: "unread"`.

## Gmail Ingestion Fallback

- [ ] Send a test email to `recursifai@gmail.com` (subject includes a unique keyword).
- [ ] Wait for `News V1 - Ingest Gmail (Trigger)` to execute.
- [ ] Confirm execution is successful.
- [ ] Confirm a new `gmail-newsletters__*.md` file appears under `news/YYYY/MM/DD/`.
- [ ] Confirm matching item is present in `news/index.json` with `source_id: "gmail-newsletters"` and `status: "unread"`.

## Unread / Read Operations

- [ ] Run `News V1 - List Unread (Manual)` and verify unread items are returned.
- [ ] Copy one `id` from `news/index.json` and mark it read:
  - `node scripts/news_pipeline.mjs mark-read --id <item_id>`
- [ ] Verify item status changed to `read` in `news/index.json`.
- [ ] Verify markdown file is still present and unchanged.

## Duplicate Safety

- [ ] Re-run `News V1 - Fetch (Manual)`.
- [ ] Confirm no duplicate entries are created for existing items.

## Clean Re-seed (Only if needed)

- [ ] Run `./scripts/import-workflows-clean.sh`.
- [ ] Confirm only one workflow per `News V1 - ...` name exists.
- [ ] Re-enable required workflows (`Fetch Scheduler`, `Ingest Gmail Trigger`).
