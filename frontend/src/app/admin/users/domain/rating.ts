export const MAX_STARS = 5;

/** How much of each of the five stars is filled (0 to 1) for an average out of five. */
export function starFills(average: number): number[] {
  const value = Number.isFinite(average) ? Math.min(Math.max(average, 0), MAX_STARS) : 0;
  return Array.from({ length: MAX_STARS }, (_, index) => Math.min(Math.max(value - index, 0), 1));
}

/** The text alternative of the stars: "4,3 de 5 estrellas, 12 valoraciones". */
export function ratingText(average: number, count: number): string {
  const shown = average.toFixed(1).replace('.', ',');
  return `${shown} de ${MAX_STARS} estrellas, ${count} ${count === 1 ? 'valoración' : 'valoraciones'}`;
}
