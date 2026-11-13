import { toRoute, toRouteDetail, toSegment } from './mappers';

const fullRoute = {
  id: 'jipiro',
  name: 'Parque Jipiro',
  cityId: 'loja',
  description: 'Circuito plano',
  start: { lat: -3.97, lng: -79.2, label: 'Entrada norte' },
  end: { lat: -3.98, lng: -79.2, label: 'Entrada sur' },
  distanceKm: 3.2,
  elevationGainM: 15,
  surface: 'asphalt',
  difficulty: 'beginner',
  active: true,
  segmentCount: 2,
  safety: {
    evening: {
      level: 'medium',
      score: 65,
      startTime: '18:00',
      endTime: '20:00',
      worstSegmentId: 's2',
      factors: [
        {
          segmentId: 's2',
          segmentName: 'Orilla',
          type: 'poor_lighting',
          severity: 'medium',
          description: 'Poca luz',
        },
      ],
    },
    morning: {
      level: 'high',
      score: 100,
      startTime: '05:00',
      endTime: '07:00',
      worstSegmentId: 's1',
      factors: [],
    },
  },
};

describe('toRoute', () => {
  it('maps a complete route and sorts slot safety by start time', () => {
    const route = toRoute(fullRoute);
    expect(route).toMatchObject({
      id: 'jipiro',
      name: 'Parque Jipiro',
      cityId: 'loja',
      distanceKm: 3.2,
      elevationGainM: 15,
      surface: 'asphalt',
      difficulty: 'beginner',
      segmentCount: 2,
      start: { lat: -3.97, lng: -79.2, label: 'Entrada norte' },
    });
    expect(route.safety.map((s) => s.slotId)).toEqual(['morning', 'evening']);
    expect(route.safety[1]).toEqual({
      slotId: 'evening',
      level: 'medium',
      score: 65,
      startTime: '18:00',
      endTime: '20:00',
      worstSegmentId: 's2',
      factors: [
        {
          segmentId: 's2',
          segmentName: 'Orilla',
          type: 'poor_lighting',
          severity: 'medium',
          description: 'Poca luz',
        },
      ],
    });
  });

  it('does not crash on missing or malformed fields', () => {
    const route = toRoute({
      id: 'x',
      distanceKm: 'far',
      surface: 'lava',
      difficulty: 3,
      start: { lat: 'a' },
      safety: {
        broken: { level: 'unknown', score: 10, startTime: '05:00', endTime: '07:00' },
        noTimes: { level: 'high', score: 90 },
        ok: {
          level: 'low',
          score: 20,
          startTime: '06:00',
          endTime: '08:00',
          factors: [{ severity: 'x' }, 'bad'],
        },
      },
    });
    expect(route).toMatchObject({
      name: 'x',
      cityId: '',
      description: '',
      distanceKm: 0,
      elevationGainM: 0,
      surface: null,
      difficulty: null,
      start: null,
      end: null,
      segmentCount: 0,
    });
    expect(route.safety).toEqual([
      {
        slotId: 'ok',
        level: 'low',
        score: 20,
        startTime: '06:00',
        endTime: '08:00',
        worstSegmentId: '',
        factors: [],
      },
    ]);
  });

  it('tolerates a missing document', () => {
    expect(toRoute(undefined).safety).toEqual([]);
  });
});

describe('toSegment', () => {
  it('maps coordinates, length and slot safety, keeping only valid points', () => {
    const segment = toSegment({
      id: 's1',
      name: 'Tramo 1',
      order: 2,
      lengthM: 850,
      coordinates: [{ lat: -3.9, lng: -79.2 }, { lat: 'bad' }, { lat: -3.91, lng: -79.21 }],
      safety: {
        evening: {
          level: 'medium',
          score: 60,
          factors: [{ type: 'traffic', severity: 'high', description: 'Hora pico' }],
        },
        bad: 'nope',
      },
    });
    expect(segment).toEqual({
      id: 's1',
      name: 'Tramo 1',
      order: 2,
      lengthM: 850,
      coordinates: [
        { lat: -3.9, lng: -79.2 },
        { lat: -3.91, lng: -79.21 },
      ],
      safety: {
        evening: {
          level: 'medium',
          score: 60,
          factors: [{ type: 'traffic', severity: 'high', description: 'Hora pico' }],
        },
      },
    });
  });

  it('defaults missing fields', () => {
    expect(toSegment({ id: 's9' })).toEqual({
      id: 's9',
      name: 's9',
      order: 0,
      lengthM: 0,
      coordinates: [],
      safety: {},
    });
  });
});

describe('toRouteDetail', () => {
  it('returns the route with its segments sorted by order, ignoring malformed ones', () => {
    const detail = toRouteDetail({
      ...fullRoute,
      segments: [
        { id: 'b', order: 1 },
        { id: 'a', order: 0 },
      ],
    });
    expect(detail.route.id).toBe('jipiro');
    expect(detail.segments.map((s) => s.id)).toEqual(['a', 'b']);
    expect(toRouteDetail({ id: 'z', segments: 'nope' }).segments).toEqual([]);
  });
});
