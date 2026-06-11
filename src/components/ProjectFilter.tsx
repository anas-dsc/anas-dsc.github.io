import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export type ProjectItem = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  href?: string;
  external?: boolean;
};

/**
 * Canonical tag order — broad categories first, then languages/tools.
 * Anything not listed here falls in alphabetically at the end.
 */
const TAG_ORDER = [
  'AI',
  'ML',
  'Deep Learning',
  'NLP',
  'Computer Vision',
  'Data Science',
  'Software',
  'Backend',
  'Python',
  'Java',
  'PyTorch',
  'Flutter',
  'Healthcare',
  'Finance',
  'Open Source',
];

function sortTags(tags: string[]): string[] {
  return [...tags].sort((a, b) => {
    const ai = TAG_ORDER.indexOf(a);
    const bi = TAG_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function readTagsFromUrl(): string[] {
  if (typeof window === 'undefined') return [];
  const params = new URLSearchParams(window.location.search);
  return params.getAll('tag');
}

function writeTagsToUrl(tags: string[]) {
  const params = new URLSearchParams(window.location.search);
  params.delete('tag');
  tags.forEach((t) => params.append('tag', t));
  const next = params.toString();
  const url = next ? `?${next}` : window.location.pathname;
  window.history.replaceState({}, '', url);
}

export default function ProjectFilter({ projects }: { projects: ProjectItem[] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string[]>([]);

  // Hydrate from URL on mount.
  useEffect(() => {
    setActive(readTagsFromUrl());
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return sortTags(Array.from(set));
  }, [projects]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((p) =>
      p.tags.forEach((t) => map.set(t, (map.get(t) ?? 0) + 1))
    );
    return map;
  }, [projects]);

  // AND filter: project must have every selected tag.
  const filtered = useMemo(() => {
    if (active.length === 0) return projects;
    return projects.filter((p) => active.every((t) => p.tags.includes(t)));
  }, [projects, active]);

  function toggle(tag: string) {
    setActive((prev) => {
      const next = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
      writeTagsToUrl(next);
      return next;
    });
  }

  function clear() {
    setActive([]);
    writeTagsToUrl([]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <button
          onClick={clear}
          className={`pill ${active.length === 0 ? 'pill-active' : ''}`}
        >
          All <span className="pill-count">{projects.length}</span>
        </button>
        {allTags.map((tag) => {
          const isActive = active.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              className={`pill ${isActive ? 'pill-active' : ''}`}
              aria-pressed={isActive}
            >
              {tag} <span className="pill-count">{counts.get(tag)}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-white/65 mb-8 min-h-[1.25rem] tracking-wide">
        {active.length === 0
          ? `Showing all ${projects.length} projects`
          : `${filtered.length} match${filtered.length === 1 ? '' : 'es'} · filtering by ${active.join(' + ')}`}
      </p>

      <div className="grid md:grid-cols-2 gap-5">
        <AnimatePresence mode="popLayout">
          {filtered.map((p, i) => (
            <motion.a
              key={p.slug}
              href={p.href ?? `/projects/${p.slug}/`}
              target={p.external ? '_blank' : undefined}
              rel={p.external ? 'noopener noreferrer' : undefined}
              layout
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="card block p-7 h-full"
            >
              <h2 className="font-semibold text-2xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                {p.title}
              </h2>
              <p className="text-[color:var(--color-fg)]/80 mb-4">{p.description}</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className={`tag ${active.includes(t) ? 'border-[var(--color-accent)] text-white' : ''}`}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <span className="text-sm text-[var(--color-accent-2)]">
                {p.external ? 'View on GitHub ↗' : 'Read more →'}
              </span>
            </motion.a>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="card p-10 text-center text-[var(--color-muted)]">
          No projects match all selected tags. <button onClick={clear} className="underline ml-1 hover:text-white">Clear filters</button>
        </div>
      )}
    </div>
  );
}
