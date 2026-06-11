import { fetchPortfolioRepos } from './github';
import { skills as curatedSkills } from '~/data/cv';
import { canonicalKey } from './tags';

const DOMAIN_TAGS = new Set([
  'healthcare',
  'finance',
  'fintech',
  'education',
  'open source',
]).add(canonicalKey('open-source'));

export async function getRecentlyLearnedSkills(
  githubUser = 'aimanalhazmi'
): Promise<string[]> {
  const known = new Set<string>();
  for (const g of curatedSkills) {
    for (const s of g.items) known.add(canonicalKey(s.name));
  }

  const repos = await fetchPortfolioRepos(githubUser);
  const found = new Map<string, string>();
  for (const r of repos) {
    for (const t of r.tags) {
      const key = canonicalKey(t);
      if (known.has(key) || DOMAIN_TAGS.has(key)) continue;
      if (!found.has(key)) found.set(key, t);
    }
  }
  return Array.from(found.values()).sort((a, b) => a.localeCompare(b));
}
