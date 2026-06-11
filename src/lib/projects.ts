import { getCollection } from 'astro:content';
import { fetchPortfolioRepos, type GitHubProject } from './github';
import { canonicalKey } from './tags';

export type ProjectCard = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  source: 'curated' | 'auto';
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  language: string | null;
  stars: number;
  repoUrl?: string;
  demoUrl?: string;
};

const normalizeUrl = (u?: string | null) =>
  u ? u.toLowerCase().replace(/\/$/, '') : '';

function unionTags(...lists: (string[] | undefined)[]): string[] {
  const seen = new Map<string, string>();
  for (const list of lists) {
    if (!list) continue;
    for (const t of list) {
      const key = canonicalKey(t);
      if (!seen.has(key)) seen.set(key, t);
    }
  }
  return Array.from(seen.values());
}

function sortProjects(items: ProjectCard[]): ProjectCard[] {
  return [...items].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function getAllProjects(githubUser = 'aimanalhazmi'): Promise<ProjectCard[]> {
  const curatedEntries = await getCollection('projects');
  const portfolioRepos = await fetchPortfolioRepos(githubUser);

  const repoByUrl = new Map<string, GitHubProject>();
  for (const r of portfolioRepos) repoByUrl.set(normalizeUrl(r.repoUrl), r);

  const usedAutoUrls = new Set<string>();

  const curated: ProjectCard[] = curatedEntries.map((p) => {
    const matchUrl = normalizeUrl(p.data.repo);
    const match = matchUrl ? repoByUrl.get(matchUrl) : undefined;
    if (match) usedAutoUrls.add(matchUrl);
    return {
      slug: p.id,
      title: p.data.title,
      description: p.data.description,
      tags: unionTags(p.data.tags, match?.tags),
      source: 'curated',
      featured: match?.featured ?? false,
      order: p.data.order ?? 0,
      createdAt: p.data.started
        ? p.data.started.toISOString()
        : match?.createdAt ?? '',
      updatedAt: match?.updatedAt ?? '',
      language: match?.language ?? null,
      stars: match?.stars ?? 0,
      repoUrl: p.data.repo,
      demoUrl: p.data.demo ?? match?.homepage ?? undefined,
    };
  });

  const autoOnly: ProjectCard[] = portfolioRepos
    .filter((r) => !usedAutoUrls.has(normalizeUrl(r.repoUrl)))
    .map((r) => ({
      slug: r.slug,
      title: r.title,
      description: r.description,
      tags: r.tags,
      source: 'auto',
      featured: r.featured,
      order: 0,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      language: r.language,
      stars: r.stars,
      repoUrl: r.repoUrl,
      demoUrl: r.homepage ?? undefined,
    }));

  return sortProjects([...curated, ...autoOnly]);
}

export async function getFeaturedProjects(githubUser = 'aimanalhazmi'): Promise<ProjectCard[]> {
  return (await getAllProjects(githubUser)).filter((p) => p.featured);
}
