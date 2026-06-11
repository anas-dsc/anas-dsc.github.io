#!/usr/bin/env node
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PROJECTS_DIR = join(ROOT, 'src/content/projects');
const USER = 'aimanalhazmi';
const PORTFOLIO_TOPIC = 'y-pub';
const FEATURED_TOPIC = 'y-feat';

const canonical = JSON.parse(
  await readFile(join(__dirname, '..', 'src/data/tag-canonical.json'), 'utf8')
);
const TAG_CASING = canonical.casing;
const ACRONYMS = new Set(canonical.acronyms.map((a) => a.toUpperCase()));

function normalizeTag(t) {
  const k = t.trim().toLowerCase();
  if (TAG_CASING[k]) return TAG_CASING[k];
  return k.split('-').map((w) => {
    if (!w) return w;
    if (ACRONYMS.has(w.toUpperCase())) return w.toUpperCase();
    return w[0].toUpperCase() + w.slice(1);
  }).join(' ');
}

function prettify(name) {
  return name.split(/[-_]/).filter(Boolean).map((w) => {
    const u = w.toUpperCase();
    if (ACRONYMS.has(u)) return u;
    return w[0].toUpperCase() + w.slice(1);
  }).join(' ');
}

function normalizeUrl(u) {
  return u ? u.toLowerCase().replace(/\/$/, '') : '';
}

async function loadEnvToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const txt = await readFile(join(ROOT, '.env'), 'utf8');
    const m = txt.match(/^GITHUB_TOKEN=(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  } catch {}
  return null;
}

async function readExistingRepoUrls() {
  if (!existsSync(PROJECTS_DIR)) return new Set();
  const files = (await readdir(PROJECTS_DIR)).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  const urls = new Set();
  for (const f of files) {
    const txt = await readFile(join(PROJECTS_DIR, f), 'utf8');
    const fm = txt.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) continue;
    const repoMatch = fm[1].match(/^repo:\s*(.+)$/m);
    if (repoMatch) urls.add(normalizeUrl(repoMatch[1].trim().replace(/^["']|["']$/g, '')));
  }
  return urls;
}

function escapeYaml(s) {
  if (s == null) return '';
  if (/[:#"'\n]/.test(s)) return JSON.stringify(s);
  return s;
}

function buildMarkdown(repo) {
  const tags = Array.from(
    new Set(
      (repo.topics ?? [])
        .filter((t) => t !== PORTFOLIO_TOPIC && t !== FEATURED_TOPIC)
        .map(normalizeTag)
    )
  );
  const featured = (repo.topics ?? []).includes(FEATURED_TOPIC);
  const lines = [
    '---',
    `title: ${escapeYaml(prettify(repo.name))}`,
    `description: ${escapeYaml(repo.description ?? '')}`,
    `repo: ${repo.html_url}`,
  ];
  if (repo.homepage && repo.homepage.trim()) lines.push(`demo: ${repo.homepage}`);
  lines.push(`tags: [${tags.map((t) => escapeYaml(t)).join(', ')}]`);
  if (featured) lines.push('featured: true');
  lines.push(`started: ${repo.created_at.slice(0, 10)}`);
  lines.push('---', '');
  lines.push(`${repo.description ?? ''}`.trim() || '_Imported from GitHub. Edit this body to add details._');
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const token = await loadEnvToken();
  if (!token) {
    console.error('No GITHUB_TOKEN found (env or .env). Aborting — would hit unauthenticated rate limit.');
    process.exit(1);
  }

  console.log('Fetching repos…');
  const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'import-repos-script',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    console.error(`GitHub API ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const repos = await res.json();
  const eligible = repos.filter(
    (r) => !r.archived && !r.private && Array.isArray(r.topics) && r.topics.includes(PORTFOLIO_TOPIC)
  );
  console.log(`Found ${eligible.length} y-pub repos.`);

  const existing = await readExistingRepoUrls();
  await mkdir(PROJECTS_DIR, { recursive: true });

  let created = 0;
  let skipped = 0;
  for (const r of eligible) {
    const url = normalizeUrl(r.html_url);
    if (existing.has(url)) {
      console.log(`  skip  ${r.name} (already curated)`);
      skipped++;
      continue;
    }
    const slug = r.name.toLowerCase();
    const path = join(PROJECTS_DIR, `${slug}.md`);
    if (existsSync(path)) {
      console.log(`  skip  ${r.name} (file exists at ${slug}.md)`);
      skipped++;
      continue;
    }
    await writeFile(path, buildMarkdown(r), 'utf8');
    console.log(`  +     ${slug}.md`);
    created++;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
  if (created > 0) {
    console.log('Review with `git status`, edit titles/descriptions in /admin or directly, then commit.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
