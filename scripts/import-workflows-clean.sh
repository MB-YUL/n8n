#!/usr/bin/env sh
set -eu

# Cleanly re-import News V1 workflows without creating duplicates.
# Keeps non-News workflows untouched.

DB_PATH="data/database.sqlite"
BACKUP_PATH="${DB_PATH}.bak.$(date +%Y%m%d_%H%M%S)"

cp "$DB_PATH" "$BACKUP_PATH"
echo "Backup created: $BACKUP_PATH"

sqlite3 "$DB_PATH" <<'SQL'
PRAGMA foreign_keys=ON;
BEGIN TRANSACTION;
DROP TABLE IF EXISTS __wf_ids;
CREATE TEMP TABLE __wf_ids AS
SELECT id FROM workflow_entity WHERE name LIKE 'News V1 - %';

DELETE FROM shared_workflow WHERE workflowId IN (SELECT id FROM __wf_ids);
DELETE FROM workflow_statistics WHERE workflowId IN (SELECT id FROM __wf_ids);
DELETE FROM workflow_publish_history WHERE workflowId IN (SELECT id FROM __wf_ids);
DELETE FROM workflow_history WHERE workflowId IN (SELECT id FROM __wf_ids);
DELETE FROM workflow_entity WHERE id IN (SELECT id FROM __wf_ids);

DROP TABLE __wf_ids;
COMMIT;
SQL

docker compose restart n8n >/dev/null
sleep 2

# Import canonical workflow set from ./workflows
./scripts/import-workflows.sh

echo "Clean import completed."
