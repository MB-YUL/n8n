# Source Fetch Strategy for n8n

Goal: define how to fetch each source as queryable items, at the right cadence, and store normalized markdown files under:

`/news/YYYY/MM/DD/<source>__<item-id>.md`

Example:

`/news/2026/02/08/arxiv-cscl__2502.12345.md`

## Core Principles

- Prefer machine-readable feeds first (`RSS` / official API / official sitemap).
- Avoid scraping when a feed exists.
- For newsletter-style sources, use public web archives when available.
- If no public archive exists, use email ingestion (forward to an n8n mailbox/IMAP) for your own subscription copy.
- Keep one normalized schema for all fetched items.

## Normalized Item Schema

Store these fields for every item before writing markdown:

- `source_id`
- `source_name`
- `category`
- `title`
- `url`
- `published_at`
- `fetched_at`
- `author` (optional)
- `summary_raw`
- `content_raw` (optional)
- `hash` (sha256 of `title+url+published_at` for dedupe)

## Newsletter Subscription Question

Can newsletters be read without subscribing?

- Sometimes yes: many newsletters publish public web archives or mirrored posts.
- Sometimes partially: some posts are public, some are gated.
- Sometimes no: email-only delivery requires subscription.

So the safe design is:

1. Try public page/feed first.
2. If unavailable, subscribe once and ingest from email automatically.

## Fetch Method Per Source

Legend:

- `Method`: `RSS`, `API`, `Web`, `Email`
- `Subscription`: `No`, `Optional`, `Yes/Maybe`

### Academic

| Source | Method | Subscription | Recommended Cadence | n8n Notes |
|---|---|---|---|---|
| ArXiv (cs.CL) | RSS | No | Every 6h | Use RSS Read node on `https://rss.arxiv.org/rss/cs.CL` |
| ArXiv (cs.LG) | RSS | No | Every 6h | Use RSS Read node on `https://rss.arxiv.org/rss/cs.LG` |
| ArXiv Sanity | Web | No | Daily | Prefer arXiv feeds as primary, sanity as secondary discovery |
| Papers with Code | Web/RSS | No | Daily | Use official feeds/pages where available; parse item URL + title |

### Newsletters

| Source | Method | Subscription | Recommended Cadence | n8n Notes |
|---|---|---|---|---|
| The Rundown AI | Web/Email | Optional | Daily | Use public archive if available; fallback email ingest |
| Ben's Bites | Web/Email | Optional | Daily | Public archive when available; fallback email ingest |
| Superhuman AI | Web/Email | Optional | Daily | Public posts first; fallback email ingest |
| The Batch | Web | No | Daily | Crawl official page weekly but check daily for new issue |
| Import AI | RSS/Web | No | Daily | Substack supports feed patterns; fallback page parsing |
| TLDR AI | Web/Email | Optional | Weekdays daily | Use public web issue pages; fallback email ingest |
| AlphaSignal | Web/Email | Optional | Daily | Public posts if available; fallback email |
| Chain of Thought (Every) | Web/Email | Yes/Maybe | Daily | May be partially gated; use public pages + email fallback |

### Blogs and Websites

| Source | Method | Subscription | Recommended Cadence | n8n Notes |
|---|---|---|---|---|
| MarkTechPost | Web/RSS | No | Every 12h | Prefer RSS if exposed; else HTML list parse |
| Hugging Face Blog | RSS/Web | No | Every 12h | Prefer RSS if available; else blog index parse |
| BAIR Blog | Web/RSS | No | Daily | Parse post listing page + date/title/url |
| The Gradient | RSS/Web | No | Daily | Prefer feed; fallback listing parse |
| KDnuggets | RSS/Web | No | Daily | Prefer feed |
| Towards AI | RSS/Web | No | Daily | Prefer feed |
| Analytics Vidhya | RSS/Web | No | Daily | Prefer feed |

### Company Sources

| Source | Method | Subscription | Recommended Cadence | n8n Notes |
|---|---|---|---|---|
| OpenAI Blog | RSS/Web | No | Every 12h | Poll blog index/feed |
| Google AI Blog | RSS/Web | No | Daily | Poll official blog |
| DeepMind Blog | Web | No | Daily | Parse listing page |
| Meta AI Blog | Web | No | Daily | Parse listing page |
| Microsoft AI Blog | RSS/Web | No | Daily | Parse official posts listing |
| Anthropic Blog | Web | No | Daily | Parse posts listing |
| Stability AI Blog | Web | No | Daily | Parse posts listing |
| EleutherAI | Web | No | Daily | Parse updates/posts page |
| NVIDIA Technical Blog | RSS/Web | No | Every 12h | Prefer category feed if available |

### Industry Reports

| Source | Method | Subscription | Recommended Cadence | n8n Notes |
|---|---|---|---|---|
| State of AI Report | Web | No | Weekly | Mostly annual; poll weekly for new release |
| Stanford AI Index | Web | No | Weekly | Mostly annual; poll weekly |
| McKinsey State of AI | Web | No | Weekly | Annual report page check |
| Gartner Hype Cycle | Web | Yes/Maybe | Monthly | Some content gated; metadata only if gated |
| Deloitte State of AI | Web | No | Monthly | Poll report landing page |
| MIT Tech Review AI topic | Web/RSS | Optional | Daily | Parse topic page; keep as news stream |

### Expert and Analyst Sources

| Source | Method | Subscription | Recommended Cadence | n8n Notes |
|---|---|---|---|---|
| Gary Marcus Substack | RSS/Web | No | Daily | Prefer Substack feed or posts page |
| SemiAnalysis | Web/Email | Yes/Maybe | Daily | Some content paywalled; capture public metadata + optional email |
| Stratechery | Web/Email | Yes/Maybe | Daily | Often partially paywalled; use public summary + email if subscribed |
| Chip Huyen | RSS/Web | No | Weekly | Lower cadence is usually enough |
| AI Snake Oil | RSS/Web | No | Daily | Prefer Substack feed |

## Recommended n8n Flow Topology

1. `Cron` triggers by cadence bucket:
- Fast bucket: every 6h
- Daily bucket: once/day
- Weekly bucket: once/week
- Monthly bucket: first day/month

2. `Source Router` (`Switch` node):
- routes to source-specific fetcher sub-workflow

3. `Fetcher` sub-workflow (per source):
- RSS/API/Web/Email fetch
- normalize to schema
- compute `hash`

4. `Dedupe`:
- check if `hash` already exists (SQLite/JSON index/local DB)
- continue only new items

5. `Store`:
- write markdown file to `/news/YYYY/MM/DD/<source>__<id>.md`
- update index file (`/news/index.json`)

6. `On-demand summary flow`:
- input date or date range
- read files from `/news/...`
- summarize by source/topic

## Markdown File Template for Stored Items

```md
# {{title}}

- Source: {{source_name}}
- Source ID: {{source_id}}
- Category: {{category}}
- Published: {{published_at}}
- Fetched: {{fetched_at}}
- URL: {{url}}
- Hash: {{hash}}

## Summary

{{summary_raw}}

## Extracted Content

{{content_raw}}
```

## Practical First Implementation Order

1. ArXiv feeds (`cs.CL`, `cs.LG`)
2. OpenAI, Anthropic, Hugging Face, DeepMind, Meta blogs
3. Substack-style expert sources (Import AI, AI Snake Oil, Gary Marcus)
4. Remaining newsletters via public archive
5. Email-ingest fallback for gated/newsletter-only sources
