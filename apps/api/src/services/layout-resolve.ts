import { getRegistry, getLayout } from './layout-registry';

/** Map AI-returned layout IDs to valid registry IDs. */
export function resolveLayoutId(rawId: string): string {
  const registry = getRegistry();
  const ids = registry.map((l) => l.id);

  if (ids.includes(rawId)) return rawId;

  const normalized = rawId.toLowerCase().replace(/_/g, '-').trim();
  if (ids.includes(normalized)) return normalized;

  const fuzzy = ids.find(
    (id) => id.includes(normalized) || normalized.includes(id.replace(/-/g, '')),
  );
  if (fuzzy) return fuzzy;

  const byCategory = registry.find((l) => l.category === normalized);
  if (byCategory) return byCategory.id;

  return ids[0] ?? rawId;
}

export function resolveSlideLayout(layoutId: string) {
  const id = resolveLayoutId(layoutId);
  return { id, layout: getLayout(id) };
}
