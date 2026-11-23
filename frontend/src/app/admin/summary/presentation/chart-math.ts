export type ChartColor =
  'fuchsia' | 'ink' | 'slate' | 'silver' | 'indigo' | 'success' | 'warning' | 'danger';

/** The design token behind each chart color. */
export const CHART_COLOR_VARS: Record<ChartColor, string> = {
  fuchsia: '--rc-primary',
  ink: '--rc-chart-ink',
  slate: '--rc-chart-slate',
  silver: '--rc-chart-silver',
  indigo: '--rc-chart-indigo',
  success: '--rc-success',
  warning: '--rc-warning',
  danger: '--rc-danger',
};

/** Categories take these colors in this order; the semantic ones are only for safety levels. */
export const CATEGORICAL: readonly ChartColor[] = ['fuchsia', 'ink', 'silver', 'slate', 'indigo'];

export const colorVar = (color: ChartColor): string => `var(${CHART_COLOR_VARS[color]})`;

/** Whole percentages of `values` that add up to 100 (largest remainder), all zero without a total. */
export function sharePercentages(values: readonly number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total === 0) return values.map(() => 0);
  const exact = values.map((value) => (value / total) * 100);
  const result = exact.map(Math.floor);
  let left = 100 - result.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of order) {
    if (left <= 0) break;
    result[index] += 1;
    left -= 1;
  }
  return result;
}

/** The top of a bar chart axis: the tallest value rounded up to 1, 2 or 5 times a power of ten. */
export function niceMax(max: number): number {
  if (max <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 5, 10].find((candidate) => max <= candidate * power) ?? 10;
  return step * power;
}

/**
 * The top of an axis with three ticks (0, half, top): the smallest 2, 4, 6 or 10 times a power
 * of ten that holds `max`, so the middle tick is always a whole number.
 */
export function niceAxisTop(max: number): number {
  for (let power = 1; ; power *= 10) {
    const top = [2, 4, 6, 10].map((step) => step * power).find((candidate) => max <= candidate);
    if (top !== undefined) return top;
  }
}
