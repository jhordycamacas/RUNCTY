import { topCounts } from './top-counts';

describe('topCounts', () => {
  it('sorts by count, then by name', () => {
    expect(topCounts({ Media: 1, Alta: 1, Baja: 3 }, 5)).toEqual([
      ['Baja', 3],
      ['Alta', 1],
      ['Media', 1],
    ]);
  });

  it('adds the tail up as Otras when there are more entries than the cap', () => {
    const counts = { a: 5, b: 4, c: 3, d: 2, e: 1, f: 1 };

    expect(topCounts(counts, 4)).toEqual([
      ['a', 5],
      ['b', 4],
      ['c', 3],
      ['Otras', 4],
    ]);
  });

  it('keeps every entry when they fit the cap', () => {
    expect(topCounts({ a: 1, b: 2 }, 2)).toEqual([
      ['b', 2],
      ['a', 1],
    ]);
  });
});
