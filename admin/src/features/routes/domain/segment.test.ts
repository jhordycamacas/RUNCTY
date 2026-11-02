import { describe, expect, it } from 'vitest';

import { coordinatesToText, parseCoordinatesText, parseSegmentForm, segmentToForm } from './segment';

describe('parseCoordinatesText', () => {
  it('reads one "lat, lng" pair per line, skipping blank lines', () => {
    expect(parseCoordinatesText('-3.98, -79.20\n\n  -3.99,-79.21  \n')).toEqual({
      ok: true,
      points: [
        { lat: -3.98, lng: -79.2 },
        { lat: -3.99, lng: -79.21 },
      ],
    });
  });

  it('accepts semicolons with decimal commas and spaces as separators', () => {
    expect(parseCoordinatesText('-3,98; -79,2\n-3.99 -79.21')).toEqual({
      ok: true,
      points: [
        { lat: -3.98, lng: -79.2 },
        { lat: -3.99, lng: -79.21 },
      ],
    });
  });

  it('needs at least two points', () => {
    const result = parseCoordinatesText('-3.98, -79.2');
    expect(!result.ok && result.error).toMatch(/al menos 2/);
  });

  it('points at the first invalid line', () => {
    const notNumeric = parseCoordinatesText('-3.98, -79.2\nabc\n-3.99, -79.21');
    expect(!notNumeric.ok && notNumeric.error).toMatch(/Línea 2/);
    const outOfRange = parseCoordinatesText('-3.98, -79.2\n95, -79.21');
    expect(!outOfRange.ok && outOfRange.error).toMatch(/Línea 2/);
    const tooMany = parseCoordinatesText('-3.98, -79.2, 5\n-3.99, -79.21');
    expect(!tooMany.ok && tooMany.error).toMatch(/Línea 1/);
  });

  it('caps the number of points at 500', () => {
    const lines = Array.from({ length: 501 }, () => '-3.9, -79.2').join('\n');
    const result = parseCoordinatesText(lines);
    expect(!result.ok && result.error).toMatch(/500/);
  });

  it('round-trips through coordinatesToText', () => {
    const points = [
      { lat: -3.98, lng: -79.2 },
      { lat: -3.99, lng: -79.21 },
    ];
    expect(parseCoordinatesText(coordinatesToText(points))).toEqual({ ok: true, points });
  });
});

describe('parseSegmentForm', () => {
  const coordinates = '-3.98, -79.2\n-3.99, -79.21';

  it('returns name, points and a 0-based order from a 1-based position', () => {
    expect(parseSegmentForm({ name: ' Tramo 1 ', coordinates, position: '2' })).toEqual({
      ok: true,
      value: {
        name: 'Tramo 1',
        coordinates: [
          { lat: -3.98, lng: -79.2 },
          { lat: -3.99, lng: -79.21 },
        ],
        order: 1,
      },
    });
  });

  it('omits the order when the position is empty', () => {
    const result = parseSegmentForm({ name: 'Tramo', coordinates, position: '' });
    expect(result.ok && 'order' in result.value).toBe(false);
  });

  it('reports name, coordinate and position errors', () => {
    const result = parseSegmentForm({ name: '', coordinates: 'x', position: '0' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.coordinates).toBeDefined();
      expect(result.errors.position).toMatch(/entero/);
    }
  });

  it('fills the form from a segment', () => {
    expect(
      segmentToForm({
        name: 'A',
        order: 2,
        coordinates: [
          { lat: 1, lng: 2 },
          { lat: 3, lng: 4 },
        ],
      }),
    ).toEqual({ name: 'A', coordinates: '1, 2\n3, 4', position: '3' });
  });
});
