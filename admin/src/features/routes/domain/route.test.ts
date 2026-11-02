import { describe, expect, it } from 'vitest';

import {
  difficultyLabel,
  emptyRouteForm,
  filterRoutes,
  levelLabel,
  parseRouteForm,
  routeToForm,
  safetyBySlot,
  surfaceLabel,
  type Route,
  type RouteFormValues,
} from './route';

const form: RouteFormValues = {
  ...emptyRouteForm(),
  name: ' Circuito Jipiro ',
  cityId: 'loja',
  description: 'Vuelta al parque',
  startLabel: 'Entrada norte',
  startLat: '-3.9800',
  startLng: '-79.2000',
  endLabel: 'Entrada sur',
  endLat: '-3,9850',
  endLng: '-79,2050',
  distanceKm: '5,2',
  elevationGainM: '40',
  surface: 'asphalt',
  difficulty: 'beginner',
  active: true,
};

const route: Route = {
  id: 'r1',
  name: 'Circuito Jipiro',
  cityId: 'loja',
  description: 'Vuelta al parque',
  start: { label: 'Entrada norte', lat: -3.98, lng: -79.2 },
  end: { label: 'Entrada sur', lat: -3.985, lng: -79.205 },
  distanceKm: 5.2,
  elevationGainM: 40,
  surface: 'asphalt',
  difficulty: 'beginner',
  active: true,
  segmentCount: 2,
  safety: {
    night: { level: 'low', score: 30, startTime: '19:00', endTime: '22:00', worstSegmentId: 's1', factors: [] },
    morning: { level: 'high', score: 100, startTime: '06:00', endTime: '09:00', worstSegmentId: 's1', factors: [] },
  },
};

describe('parseRouteForm', () => {
  it('converts a valid form into the callable payload', () => {
    expect(parseRouteForm(form)).toEqual({
      ok: true,
      value: {
        name: 'Circuito Jipiro',
        cityId: 'loja',
        description: 'Vuelta al parque',
        start: { label: 'Entrada norte', lat: -3.98, lng: -79.2 },
        end: { label: 'Entrada sur', lat: -3.985, lng: -79.205 },
        distanceKm: 5.2,
        elevationGainM: 40,
        surface: 'asphalt',
        difficulty: 'beginner',
        active: true,
      },
    });
  });

  it('requires name, city and point labels', () => {
    const result = parseRouteForm({ ...form, name: ' ', cityId: '', startLabel: '', endLabel: 'x'.repeat(81) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.cityId).toMatch(/ciudad/);
      expect(result.errors.startLabel).toBeDefined();
      expect(result.errors.endLabel).toMatch(/80/);
    }
  });

  it('mirrors the backend numeric limits', () => {
    const result = parseRouteForm({ ...form, distanceKm: '0', elevationGainM: '10001', startLat: '91', endLng: 'abc' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.distanceKm).toMatch(/500/);
      expect(result.errors.elevationGainM).toMatch(/10000/);
      expect(result.errors.startLat).toMatch(/-90 y 90/);
      expect(result.errors.endLng).toBeDefined();
    }
    expect(parseRouteForm({ ...form, distanceKm: '500', elevationGainM: '0' }).ok).toBe(true);
    expect(parseRouteForm({ ...form, distanceKm: '500.1' }).ok).toBe(false);
  });

  it('limits the description to 500 characters', () => {
    const result = parseRouteForm({ ...form, description: 'a'.repeat(501) });
    expect(!result.ok && result.errors.description).toMatch(/500/);
  });

  it('round-trips an existing route through the form', () => {
    expect(parseRouteForm(routeToForm(route))).toEqual({
      ok: true,
      value: {
        name: route.name,
        cityId: route.cityId,
        description: route.description,
        start: route.start,
        end: route.end,
        distanceKm: route.distanceKm,
        elevationGainM: route.elevationGainM,
        surface: route.surface,
        difficulty: route.difficulty,
        active: route.active,
      },
    });
  });
});

describe('filterRoutes', () => {
  const other: Route = { ...route, id: 'r2', name: 'Sendero Podocarpus', cityId: 'zamora', difficulty: 'advanced' };

  it('filters by city, difficulty and accent-insensitive text', () => {
    expect(filterRoutes([route, other], { cityId: 'loja', difficulty: '', text: '' })).toEqual([route]);
    expect(filterRoutes([route, other], { cityId: '', difficulty: 'advanced', text: '' })).toEqual([other]);
    expect(filterRoutes([route, other], { cityId: '', difficulty: '', text: 'jipíro' })).toEqual([route]);
    expect(filterRoutes([route, other], { cityId: '', difficulty: '', text: '' })).toHaveLength(2);
  });
});

describe('labels', () => {
  it('shows levels as Alto/Medio/Bajo', () => {
    expect(levelLabel('high')).toBe('Alto');
    expect(levelLabel('medium')).toBe('Medio');
    expect(levelLabel('low')).toBe('Bajo');
  });

  it('labels surface and difficulty in Spanish', () => {
    expect(surfaceLabel('trail')).toBe('Sendero');
    expect(difficultyLabel('intermediate')).toBe('Intermedio');
  });
});

describe('safetyBySlot', () => {
  it('lists the route safety ordered by start time', () => {
    expect(safetyBySlot(route.safety).map((s) => s.slotId)).toEqual(['morning', 'night']);
  });
});
