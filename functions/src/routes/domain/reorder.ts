/**
 * RF-05: segment order helpers. Segment `order` is always contiguous
 * (0..n-1); these work on ordered id lists and report the changed orders.
 */
export interface Ordered {
  id: string;
  order: number;
}

export function orderedIds(items: readonly Ordered[]): string[] {
  return [...items].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)).map((item) => item.id);
}

/** Inserts `id` at `index` (clamped); undefined appends. */
export function insertAt(ids: readonly string[], id: string, index: number | undefined): string[] {
  const at = index === undefined ? ids.length : Math.min(Math.max(index, 0), ids.length);
  return [...ids.slice(0, at), id, ...ids.slice(at)];
}

export function removeId(ids: readonly string[], id: string): string[] {
  return ids.filter((other) => other !== id);
}

/** Moves `id` so it ends up at `index` (clamped). */
export function moveTo(ids: readonly string[], id: string, index: number): string[] {
  return insertAt(removeId(ids, id), id, index);
}

/** New `order` for each item whose position in `ids` differs from before. */
export function orderUpdates(before: readonly Ordered[], ids: readonly string[]): Record<string, number> {
  const current = new Map(before.map((item) => [item.id, item.order]));
  const updates: Record<string, number> = {};
  ids.forEach((id, index) => {
    if (current.get(id) !== index) updates[id] = index;
  });
  return updates;
}
