export const OTHERS_LABEL = 'Otras';

/**
 * The entries of a count dictionary, most frequent first. When there are more than `max`, the
 * tail is added up into one `Otras` entry so a chart never has more slices than colors.
 */
export function topCounts(
  counts: Record<string, number>,
  max: number,
): [label: string, value: number][] {
  const sorted = Object.entries(counts).sort(
    ([nameA, a], [nameB, b]) => b - a || nameA.localeCompare(nameB, 'es'),
  );
  if (sorted.length <= max) return sorted;
  const rest = sorted.slice(max - 1).reduce((sum, [, value]) => sum + value, 0);
  return [...sorted.slice(0, max - 1), [OTHERS_LABEL, rest]];
}
