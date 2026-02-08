#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

const HOST_ROOT = process.cwd();
const IS_HOST_LAYOUT = fsSync.existsSync(path.join(HOST_ROOT, 'sources', 'v1_sources.json'));
const SOURCES_PATH = IS_HOST_LAYOUT
  ? path.join(HOST_ROOT, 'sources', 'v1_sources.json')
  : '/sources/v1_sources.json';
const NEWS_ROOT = IS_HOST_LAYOUT ? path.join(HOST_ROOT, 'news') : '/news';
const INDEX_PATH = path.join(NEWS_ROOT, 'index.json');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      out._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

function stripCdata(value) {
  return value
    .replaceAll('<![CDATA[', '')
    .replaceAll(']]>', '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeXmlEntities(text) {
  return text
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function extractTag(xml, tag) {
  const rx = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = xml.match(rx);
  if (!m) return '';
  return decodeXmlEntities(stripCdata(m[1]));
}

function parseRssItems(xml) {
  const itemMatches = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)];
  return itemMatches.map((m) => {
    const raw = m[0];
    return {
      title: extractTag(raw, 'title'),
      link: extractTag(raw, 'link'),
      pubDate: extractTag(raw, 'pubDate') || extractTag(raw, 'dc:date') || extractTag(raw, 'published'),
      description: extractTag(raw, 'description') || extractTag(raw, 'content:encoded') || extractTag(raw, 'summary'),
      author: extractTag(raw, 'author') || extractTag(raw, 'dc:creator'),
      guid: extractTag(raw, 'guid'),
    };
  });
}

function stableId(title, url, publishedAt) {
  return createHash('sha256')
    .update(`${title}||${url}||${publishedAt}`)
    .digest('hex');
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'item';
}

function isoOrNow(dateText) {
  const d = dateText ? new Date(dateText) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function ymdParts(iso) {
  return {
    y: iso.slice(0, 4),
    m: iso.slice(5, 7),
    d: iso.slice(8, 10),
  };
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function markdownFor(item) {
  const lines = [
    `# ${item.title}`,
    '',
    `- Source: ${item.source_name}`,
    `- Source ID: ${item.source_id}`,
    `- Category: ${item.category}`,
    `- Published: ${item.published_at}`,
    `- Fetched: ${item.fetched_at}`,
    `- URL: ${item.url}`,
    `- Hash: ${item.id}`,
    '',
    '## Summary',
    '',
    item.summary_raw || 'No summary provided by source.',
    '',
    '## Extracted Content',
    '',
    item.content_raw || '',
    '',
  ];
  return lines.join('\n');
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'n8n-news-fetcher/1.0 (+local project)'
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

async function commandFetch(args) {
  const sources = await readJson(SOURCES_PATH, []);
  const sourceFilter = typeof args.source === 'string' ? args.source.split(',').map((s) => s.trim()) : null;
  const selected = sourceFilter
    ? sources.filter((s) => sourceFilter.includes(s.source_id))
    : sources;

  const index = await readJson(INDEX_PATH, []);
  const existingIds = new Set(index.map((x) => x.id));
  const now = new Date().toISOString();

  let inserted = 0;
  const errors = [];

  for (const source of selected) {
    try {
      if (source.method !== 'rss') {
        throw new Error(`unsupported method ${source.method}`);
      }

      const xml = await fetchText(source.url);
      const rawItems = parseRssItems(xml).slice(0, 25);

      for (const raw of rawItems) {
        const title = raw.title || 'Untitled';
        const url = raw.link || raw.guid || source.url;
        const publishedAt = isoOrNow(raw.pubDate);
        const id = stableId(title, url, publishedAt);

        if (existingIds.has(id)) continue;

        const normalized = {
          id,
          source_id: source.source_id,
          source_name: source.source_name,
          category: source.category,
          title,
          url,
          published_at: publishedAt,
          fetched_at: now,
          author: raw.author || null,
          summary_raw: raw.description || '',
          content_raw: '',
          status: 'unread',
          read_at: null,
        };

        const { y, m, d } = ymdParts(publishedAt);
        const dateDir = path.join(NEWS_ROOT, y, m, d);
        await fs.mkdir(dateDir, { recursive: true });

        const fileName = `${source.source_id}__${slugify(title)}-${id.slice(0, 12)}.md`;
        const absPath = path.join(dateDir, fileName);
        await fs.writeFile(absPath, markdownFor(normalized), 'utf8');

        normalized.file_path = IS_HOST_LAYOUT ? path.relative(HOST_ROOT, absPath) : absPath;
        index.push(normalized);
        existingIds.add(id);
        inserted += 1;
      }
    } catch (err) {
      errors.push({ source_id: source.source_id, error: String(err.message || err) });
    }
  }

  await writeJson(INDEX_PATH, index);
  const out = {
    ok: true,
    inserted,
    scanned_sources: selected.length,
    total_items: index.length,
    errors,
  };
  process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
}

async function commandListUnread(args) {
  const index = await readJson(INDEX_PATH, []);
  const sourceFilter = args.source ? new Set(String(args.source).split(',').map((s) => s.trim())) : null;
  const from = args['date-from'] ? new Date(String(args['date-from'])) : null;
  const to = args['date-to'] ? new Date(String(args['date-to'])) : null;

  const unread = index
    .filter((x) => x.status === 'unread')
    .filter((x) => (sourceFilter ? sourceFilter.has(x.source_id) : true))
    .filter((x) => {
      const d = new Date(x.published_at);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    })
    .sort((a, b) => b.published_at.localeCompare(a.published_at));

  process.stdout.write(`${JSON.stringify({ ok: true, count: unread.length, items: unread }, null, 2)}\n`);
}

async function commandMarkRead(args) {
  const idsArg = args.id ? String(args.id) : '';
  const ids = idsArg.split(',').map((s) => s.trim()).filter(Boolean);
  if (!ids.length) {
    throw new Error('missing required --id <id[,id2]>');
  }

  const now = new Date().toISOString();
  const index = await readJson(INDEX_PATH, []);
  let updated = 0;

  for (const item of index) {
    if (ids.includes(item.id)) {
      item.status = 'read';
      item.read_at = now;
      updated += 1;
    }
  }

  await writeJson(INDEX_PATH, index);
  process.stdout.write(`${JSON.stringify({ ok: true, requested: ids.length, updated }, null, 2)}\n`);
}

async function commandIngestItem(args) {
  const payloadB64 = args['payload-b64'] ? String(args['payload-b64']) : '';
  if (!payloadB64) {
    throw new Error('missing required --payload-b64 <base64_json>');
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
  } catch {
    throw new Error('invalid --payload-b64 value (expected base64 encoded JSON)');
  }

  const sourceId = payload.source_id || 'gmail-newsletters';
  const sourceName = payload.source_name || 'Gmail Newsletters';
  const category = payload.category || 'newsletters';
  const title = (payload.title || 'Untitled').trim();
  const url = (payload.url || '').trim() || 'https://mail.google.com/';
  const publishedAt = isoOrNow(payload.published_at || payload.publishedAt || payload.date);
  const fetchedAt = new Date().toISOString();
  const summaryRaw = payload.summary_raw || payload.summary || payload.snippet || '';
  const contentRaw = payload.content_raw || payload.content || '';
  const author = payload.author || null;
  const id = stableId(title, url, publishedAt);

  const index = await readJson(INDEX_PATH, []);
  if (index.some((item) => item.id === id)) {
    process.stdout.write(`${JSON.stringify({ ok: true, inserted: 0, duplicate: true, id }, null, 2)}\n`);
    return;
  }

  const normalized = {
    id,
    source_id: sourceId,
    source_name: sourceName,
    category,
    title,
    url,
    published_at: publishedAt,
    fetched_at: fetchedAt,
    author,
    summary_raw: summaryRaw,
    content_raw: contentRaw,
    status: 'unread',
    read_at: null,
  };

  const { y, m, d } = ymdParts(publishedAt);
  const dateDir = path.join(NEWS_ROOT, y, m, d);
  await fs.mkdir(dateDir, { recursive: true });

  const fileName = `${sourceId}__${slugify(title)}-${id.slice(0, 12)}.md`;
  const absPath = path.join(dateDir, fileName);
  await fs.writeFile(absPath, markdownFor(normalized), 'utf8');

  normalized.file_path = IS_HOST_LAYOUT ? path.relative(HOST_ROOT, absPath) : absPath;
  index.push(normalized);
  await writeJson(INDEX_PATH, index);

  process.stdout.write(
    `${JSON.stringify({ ok: true, inserted: 1, duplicate: false, id, file_path: normalized.file_path }, null, 2)}\n`,
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  if (!command || args.help) {
    process.stdout.write(
      [
        'Usage:',
        '  node scripts/news_pipeline.mjs fetch [--source source_id,source_id2]',
        '  node scripts/news_pipeline.mjs list-unread [--source source_id] [--date-from YYYY-MM-DD] [--date-to YYYY-MM-DD]',
        '  node scripts/news_pipeline.mjs mark-read --id <id[,id2]>',
        '  node scripts/news_pipeline.mjs ingest-item --payload-b64 <base64_json>',
      ].join('\n') + '\n'
    );
    process.exit(0);
  }

  if (command === 'fetch') return commandFetch(args);
  if (command === 'list-unread') return commandListUnread(args);
  if (command === 'mark-read') return commandMarkRead(args);
  if (command === 'ingest-item') return commandIngestItem(args);

  throw new Error(`unknown command: ${command}`);
}

main().catch((err) => {
  process.stderr.write(`news_pipeline error: ${String(err.message || err)}\n`);
  process.exit(1);
});
