This folder stores n8n workflows for the local news pipeline.

Current workflow files:

- `news_v1_fetch_scheduler.json`
- `news_v1_fetch_manual.json`
- `news_v1_digest_scheduler.json`
- `news_v1_digest_manual.json`
- `news_v1_list_unread_manual.json`
- `news_v1_list_unread_webhook.json`
- `news_v1_mark_read_webhook.json`
- `news_v1_ingest_gmail_trigger.json`
- `news_v1_newsletter_onboarding_manual.json`

Import into n8n:

```sh
./scripts/import-workflows.sh
```

Export current n8n workflows:

```sh
./scripts/export-workflows.sh
```
