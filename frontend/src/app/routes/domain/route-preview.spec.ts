import { previewPath, projectPreview } from './route-preview';

const BOX = { width: 120, height: 80, padding: 10 };

describe('projectPreview', () => {
  it('draws nothing without points', () => {
    expect(projectPreview([], BOX)).toEqual([]);
  });

  it('centers a single point and any set of identical points', () => {
    const center = { x: 60, y: 40 };

    expect(projectPreview([{ lat: -3.99, lng: -79.2 }], BOX)).toEqual([center]);
    expect(
      projectPreview(
        [
          { lat: 1, lng: 1 },
          { lat: 1, lng: 1 },
        ],
        BOX,
      ),
    ).toEqual([center, center]);
  });

  it('stretches a horizontal line across the padded width, centered vertically', () => {
    const points = projectPreview(
      [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 1 },
      ],
      BOX,
    );

    expect(points).toEqual([
      { x: 10, y: 40 },
      { x: 110, y: 40 },
    ]);
  });

  it('draws north up: a vertical line goes from the bottom (south) to the top (north)', () => {
    const points = projectPreview(
      [
        { lat: 0, lng: 0 },
        { lat: 1, lng: 0 },
      ],
      BOX,
    );

    expect(points).toEqual([
      { x: 60, y: 70 },
      { x: 60, y: 10 },
    ]);
  });

  it('keeps the aspect ratio and centers the shape in the free axis', () => {
    // A square (at the equator) in a wide box: limited by the height, centered in x.
    const [sw, ne] = projectPreview(
      [
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 },
      ],
      BOX,
    );

    expect(sw).toEqual({ x: 30, y: 70 });
    expect(ne).toEqual({ x: 90, y: 10 });
  });

  it('shrinks longitudes by the cosine of the latitude so the shape is not stretched', () => {
    // At 60 degrees one degree of longitude is half as long as one of latitude.
    const [west, east] = projectPreview(
      [
        { lat: 60, lng: 0 },
        { lat: 61, lng: 1 },
      ],
      { width: 100, height: 100, padding: 0 },
    );

    // The shape is 1 degree tall and cos(60.5) = 0.49 degrees wide, so it is half as wide as tall.
    expect(east.x - west.x).toBeCloseTo(100 * Math.cos((60.5 * Math.PI) / 180), 1);
    expect(west.y - east.y).toBeCloseTo(100, 5);
  });
});

describe('previewPath', () => {
  it('writes a polyline path with rounded coordinates', () => {
    expect(
      previewPath([
        { x: 10, y: 70.123 },
        { x: 60, y: 40 },
        { x: 110, y: 10 },
      ]),
    ).toBe('M10 70.12L60 40L110 10');
  });

  it('is empty without points and a dot-sized stub for one point', () => {
    expect(previewPath([])).toBe('');
    expect(previewPath([{ x: 5, y: 6 }])).toBe('M5 6L5 6');
  });
});
