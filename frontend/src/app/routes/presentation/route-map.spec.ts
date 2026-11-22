import { routeMapScene } from './route-map';

describe('routeMapScene', () => {
  const a = { lat: -2.9, lng: -79.0 };
  const b = { lat: -2.91, lng: -79.01 };
  const c = { lat: -2.92, lng: -79.02 };

  it('draws each segment in order, colored by its level and neon when unrated', () => {
    const scene = routeMapScene([
      { coordinates: [a, b], level: 'high' },
      { coordinates: [b, c], level: 'low' },
      { coordinates: [c, a], level: null },
    ]);

    expect(scene.lines.map((line) => line.tone)).toEqual(['safe', 'danger', 'route']);
    expect(scene.lines[1].points).toEqual([b, c]);
  });

  it('marks the start and the end of the whole route', () => {
    const scene = routeMapScene([
      { coordinates: [a, b], level: 'medium' },
      { coordinates: [], level: null },
      { coordinates: [b, c], level: 'medium' },
    ]);

    expect(scene.lines).toHaveLength(2);
    expect(scene.markers).toEqual([
      { kind: 'start', at: a },
      { kind: 'end', at: c },
    ]);
  });

  it('draws nothing for a route without points', () => {
    expect(routeMapScene([{ coordinates: [], level: null }])).toEqual({ lines: [], markers: [] });
  });
});
