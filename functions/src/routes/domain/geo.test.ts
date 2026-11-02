import { describe, expect, it } from 'vitest';

import { pathLengthM } from './geo';

describe('pathLengthM', () => {
  it('sums the haversine distance between consecutive points, rounded to meters', () => {
    // 0.001° of latitude ≈ 111.2 m
    expect(pathLengthM([{ lat: 0, lng: 0 }, { lat: 0.001, lng: 0 }])).toBe(111);
    expect(
      pathLengthM([
        { lat: 0, lng: 0 },
        { lat: 0.001, lng: 0 },
        { lat: 0.002, lng: 0 },
      ]),
    ).toBe(222);
  });

  it('is 0 for a single point or repeated points', () => {
    expect(pathLengthM([{ lat: -4, lng: -79 }])).toBe(0);
    expect(pathLengthM([{ lat: -4, lng: -79 }, { lat: -4, lng: -79 }])).toBe(0);
  });
});
