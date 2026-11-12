import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/core/theme';

import type { Ruta, IndiceSeguridadRuta, Tramo } from '../../domain/route';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export function TestProviders({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <ThemeProvider appearance="light">{children}</ThemeProvider>
    </SafeAreaProvider>
  );
}

export const morning = (overrides: Partial<IndiceSeguridadRuta> = {}): IndiceSeguridadRuta => ({
  slotId: 'morning',
  level: 'high',
  score: 90,
  startTime: '05:00',
  endTime: '07:00',
  worstSegmentId: 's1',
  factors: [],
  ...overrides,
});

export const evening = (overrides: Partial<IndiceSeguridadRuta> = {}): IndiceSeguridadRuta => ({
  slotId: 'evening',
  level: 'low',
  score: 30,
  startTime: '18:00',
  endTime: '20:00',
  worstSegmentId: 's2',
  factors: [
    {
      segmentId: 's2',
      segmentName: 'Orilla del río',
      type: 'poor_lighting',
      severity: 'high',
      description: 'Postes apagados',
    },
  ],
  ...overrides,
});

export const makeRoute = (overrides: Partial<Ruta> = {}): Ruta => ({
  id: 'jipiro',
  name: 'Parque Jipiro',
  cityId: 'loja',
  description: 'Circuito plano alrededor del lago',
  start: { lat: -3.97, lng: -79.2, label: 'Entrada principal' },
  end: { lat: -3.98, lng: -79.2, label: 'Puente sur' },
  distanceKm: 3.2,
  elevationGainM: 15,
  surface: 'asphalt',
  difficulty: 'beginner',
  segmentCount: 2,
  safety: [morning(), evening()],
  ...overrides,
});

export const makeSegment = (overrides: Partial<Tramo> = {}): Tramo => ({
  id: 's1',
  name: 'Entrada al lago',
  order: 0,
  coordinates: [
    { lat: -3.97, lng: -79.2 },
    { lat: -3.975, lng: -79.2 },
  ],
  lengthM: 850,
  safety: {
    morning: { level: 'high', score: 100, factors: [] },
    evening: {
      level: 'medium',
      score: 65,
      factors: [{ type: 'traffic', severity: 'medium', description: 'Cruce de avenida' }],
    },
  },
  ...overrides,
});

/** Minimal React Query result shape used by the screens. */
export function queryResult<T>(overrides: { data?: T; isPending?: boolean; isError?: boolean } = {}) {
  return {
    data: overrides.data,
    isPending: overrides.isPending ?? false,
    isError: overrides.isError ?? false,
    isRefetching: false,
    refetch: jest.fn(),
  };
}
