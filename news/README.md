# News Pipeline Guide

This folder stores fetched news files and the unread/read index used by the n8n flows.

## Are all sources active now?

Short answer: not all possible sources from `sources/FETCH_STRATEGY.md`, but all currently configured V1 sources are active.

Configured + active V1 sources are in `sources/v1_sources.json`:

- arXiv cs.CL
- arXiv cs.LG
- OpenAI Blog
- Hugging Face Blog
- Import AI
- AI Snake Oil
- Marcus on AI
- KDnuggets
- Towards AI
- MarkTechPost
- Google AI Blog
- Microsoft AI Blog
- BAIR Blog
- The Gradient
- VentureBeat AI
- MIT Technology Review (AI)

## How do newsletter subscriptions work?

There are two modes:

1. Public feed already available:
- No manual subscription needed.
- Example: Import AI, AI Snake Oil, Marcus on AI.

2. No reliable public feed:
- Subscribe once manually with `recursifai@gmail.com`.
- New issues then arrive via Gmail and are ingested by `News V1 - Ingest Gmail (Trigger)`.

Use `News V1 - Newsletter Onboarding (Manual)` to get the target signup URLs and follow them.

Typical manual-signup newsletters:
- The Rundown AI
- Ben's Bites
- Superhuman AI
- TLDR AI
- AlphaSignal
- Chain of Thought (Every)
- The Batch (if no stable feed endpoint)

## How the flow works

### Fetch and ingest

1. `News V1 - Fetch Scheduler`
- Runs arXiv every 6h.
- Runs daily batch once/day.

2. `News V1 - Ingest Gmail (Trigger)`
- Ingests newsletter emails.
- Stores to markdown.
- Marks Gmail message as read.

### Storage

- Item files: `news/YYYY/MM/DD/<source_id>__<slug>-<hash12>.md`
- Unread/read index: `news/index.json`

### Read workflow

1. `News V1 - List Unread (Manual/Webhook)` to view unread.
2. `News V1 - Mark Read (Webhook)` to mark read.

### Digest workflow

1. `News V1 - Digest (Manual)` builds and sends digest now.
2. `News V1 - Digest (Scheduler)` sends daily digest email.

## Useful commands

```sh
# fetch all configured RSS/web sources
node scripts/news_pipeline.mjs fetch

# list unread
node scripts/news_pipeline.mjs list-unread

# mark one or more items read
node scripts/news_pipeline.mjs mark-read --id <id[,id2]>

# build digest payload (markdown + html)
node scripts/news_pipeline.mjs build-digest --max-items 40
```
