import canonical from '~/data/tag-canonical.json';

const CASING = canonical.casing as Record<string, string>;
const ACRONYMS = new Set(canonical.acronyms.map((a) => a.toUpperCase()));
const ALIASES = canonical.aliases as Record<string, string>;

export function normalizeTag(topic: string): string {
  const key = topic.trim().toLowerCase();
  if (CASING[key]) return CASING[key];
  return key
    .split('-')
    .map((w) => {
      if (!w) return w;
      if (ACRONYMS.has(w.toUpperCase())) return w.toUpperCase();
      return w[0].toUpperCase() + w.slice(1);
    })
    .join(' ');
}

export function prettifyName(name: string): string {
  return name
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => {
      const upper = w.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      return w[0].toUpperCase() + w.slice(1);
    })
    .join(' ');
}

export function canonicalKey(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '-');
  if (ALIASES[normalized]) return ALIASES[normalized];
  const spaced = value.trim().toLowerCase();
  if (ALIASES[spaced]) return ALIASES[spaced];
  return spaced;
}
