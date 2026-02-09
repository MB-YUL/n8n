# PLAN: n8n News Fetch, Store, Unread/Read Pipeline

## Goal
- [x] Build a simple v1 flow that fetches news from selected sources, stores items as markdown in `/news/YYYY/MM/DD/`, and tracks unread/read status in `/news/index.json`.
- [x] Keep items accessible after read; only status changes.

## Scope Locks (Agreed)
- [x] V1 source scope: 10 reliable RSS/Web sources only.
- [x] Read/unread model: `index.json` (not markdown frontmatter).
- [x] Gmail ingestion: phase 2 (after v1 is stable).

## V1 Sources
- [x] ArXiv cs.CL (`https://rss.arxiv.org/rss/cs.CL`)
- [x] ArXiv cs.LG (`https://rss.arxiv.org/rss/cs.LG`)
- [x] OpenAI Blog (`https://openai.com/news/rss.xml`)
- [x] Hugging Face Blog (`https://huggingface.co/blog/feed.xml`)
- [x] Import AI (`https://importai.substack.com/feed`)
- [x] AI Snake Oil (`https://aisnakeoil.substack.com/feed`)
- [x] Gary Marcus (`https://garymarcus.substack.com/feed`)
- [x] KDnuggets (`https://www.kdnuggets.com/feed`)
- [x] Towards AI (`https://towardsai.net/feed`)
- [x] MarkTechPost (`https://www.marktechpost.com/feed`)

## Data Contracts
- [x] Confirm markdown file path format: `/news/YYYY/MM/DD/<source_id>__<item_id>.md`.
- [x] Define `item_id` as sha256 of `title+url+published_at`.
- [x] Define normalized fields for each item:
  - [x] `id`
  - [x] `source_id`
  - [x] `source_name`
  - [x] `category`
  - [x] `title`
  - [x] `url`
  - [x] `published_at`
  - [x] `fetched_at`
  - [x] `file_path`
  - [x] `status` (`unread`/`read`)
  - [x] `read_at` (nullable)

## Workflow A: Scheduler (`news_fetch_scheduler`)
- [x] Create cron trigger for fast bucket (every 6h) for arXiv feeds.
- [x] Create cron trigger for daily bucket for all other v1 sources.
- [x] Route each source to fetch sub-workflow with source config.

## Workflow B: Source Fetcher (`news_fetch_source`)
- [x] Accept source config input (`source_id`, method, URL, category).
- [x] Fetch data (RSS node or HTTP + parse).
- [x] Normalize each candidate item to shared schema.
- [x] Compute deterministic `id` hash.
- [x] Load `/news/index.json`.
- [x] Dedupe against existing `id` values.
- [x] For each new item:
  - [x] Create date folder `/news/YYYY/MM/DD/` if missing.
  - [x] Render markdown from template.
  - [x] Write markdown file.
  - [x] Append unread record to index.
- [x] Persist updated `/news/index.json`.

## Workflow C: Unread List (`news_list_unread`)
- [x] Manual trigger or webhook endpoint.
- [x] Read `/news/index.json`.
- [x] Filter `status=unread`.
- [x] Support optional filters (source, date from/to).
- [x] Return list sorted by `published_at` desc.

## Workflow D: Mark Read (`news_mark_read`)
- [x] Manual trigger or webhook endpoint.
- [x] Input one or multiple item IDs.
- [x] Update matching index records:
  - [x] `status=read`
  - [x] `read_at=now`
- [x] Ensure markdown files remain unchanged.

## Markdown Template
- [x] Use standard template with:
  - [x] title
  - [x] source metadata block
  - [x] summary section
  - [x] extracted content section (optional)

## Error Handling
- [x] If one source fails, continue processing others.
- [x] Log source-level fetch errors.
- [x] Skip malformed items safely.
- [x] Skip duplicates without failing run.
- [x] Recreate index if missing (empty bootstrap path).

## Validation and Tests
- [x] New item creates markdown + unread index entry.
- [x] Re-fetch of same item does not duplicate.
- [x] Mark-read updates only index.
- [x] Unread listing excludes read items.
- [x] Date folder creation works for current day.
- [x] Network/parsing error in one source does not stop all sources.

## Acceptance Criteria
- [x] One scheduler run stores new items from v1 sources under `/news/YYYY/MM/DD/`.
- [x] `/news/index.json` exists and reflects accurate unread/read states.
- [x] User can list unread and mark read on demand.

## Phase 2 (After V1)
- [ ] Add remaining sources from `sources/FETCH_STRATEGY.md`.
- [x] Add Gmail ingestion fallback for newsletter-only/gated sources.
- [x] Add newsletter onboarding flow with canonical targets and subscriber identity (`Recursif AI <recursifai@gmail.com>`).
- [x] Add optional digest flow for unread items.
- [ ] Add richer query filters (keywords, source groups, date windows).

## Execution Notes
- [x] Keep this file updated during implementation by checking off completed tasks.
- [x] Commit in small steps (workflows, storage contract, unread/read operations, tests).
