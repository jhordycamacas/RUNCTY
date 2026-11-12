import { fireEvent, render, screen } from '@testing-library/react-native';

import { useRouteDetail, useRouteSegments } from '../../application/useRoutes';
import { TestProviders, makeRoute, makeSegment, queryResult } from '../testing/fixtures';
import { RouteDetailScreen } from './RouteDetailScreen';

jest.mock('../../application/useRoutes', () => ({ useRouteDetail: jest.fn(), useRouteSegments: jest.fn() }));

const mockedRoute = jest.mocked(useRouteDetail);
const mockedSegments = jest.mocked(useRouteSegments);

const segments = [
  makeSegment(),
  makeSegment({
    id: 's2',
    name: 'Orilla del río',
    order: 1,
    lengthM: 2350,
    safety: {
      morning: { level: 'high', score: 90, factors: [] },
      evening: {
        level: 'low',
        score: 30,
        factors: [{ type: 'poor_lighting', severity: 'high', description: 'Postes apagados' }],
      },
    },
  }),
];

async function renderDetail(initialSlotKey?: string) {
  await render(<RouteDetailScreen routeId="jipiro" initialSlotKey={initialSlotKey} />, {
    wrapper: TestProviders,
  });
}

beforeEach(() => {
  mockedRoute.mockReturnValue(queryResult({ data: makeRoute() }) as never);
  mockedSegments.mockReturnValue(queryResult({ data: segments }) as never);
});

describe('RouteDetailScreen', () => {
  it('shows the key stats, start and end and the disclaimer', async () => {
    await renderDetail('05:00-07:00');
    expect(await screen.findByText('Parque Jipiro')).toBeOnTheScreen();
    expect(screen.getByLabelText('Distancia: 3,2 km')).toBeOnTheScreen();
    expect(screen.getByLabelText('Desnivel: 15 m')).toBeOnTheScreen();
    expect(screen.getByLabelText('Dificultad: Principiante')).toBeOnTheScreen();
    expect(screen.getByLabelText('Superficie: Asfalto')).toBeOnTheScreen();
    expect(screen.getByText('Entrada principal')).toBeOnTheScreen();
    expect(screen.getByText('Puente sur')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'El nivel de seguridad es una estimación según los factores registrados. No garantiza seguridad absoluta.',
      ),
    ).toBeOnTheScreen();
  });

  it('summarizes a slot without factors', async () => {
    await renderDetail('05:00-07:00');
    expect(await screen.findByText('Puntaje 90 de 100')).toBeOnTheScreen();
    expect(screen.getByText('No hay factores de riesgo registrados para esta franja')).toBeOnTheScreen();
  });

  it('explains the level with its factors when switching slots', async () => {
    await renderDetail('05:00-07:00');
    await fireEvent.press(await screen.findByRole('radio', { name: '18:00 – 20:00' }));
    expect(screen.getByText('Puntaje 30 de 100')).toBeOnTheScreen();
    expect(screen.getByText('Por qué este nivel')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Iluminación deficiente. Severidad alta. Postes apagados. Tramo: Orilla del río'),
    ).toBeOnTheScreen();
  });

  it('lists the segments in order with their level for the slot', async () => {
    await renderDetail('18:00-20:00');
    expect(await screen.findByText('1. Entrada al lago')).toBeOnTheScreen();
    expect(screen.getByText('2. Orilla del río')).toBeOnTheScreen();
    expect(screen.getByText('850 m · 2 puntos')).toBeOnTheScreen();
    expect(screen.getByText('2,4 km · 2 puntos')).toBeOnTheScreen();
    expect(screen.getByLabelText('Tráfico. Severidad media. Cruce de avenida')).toBeOnTheScreen();
    expect(screen.getAllByLabelText('Seguridad media').length).toBeGreaterThan(0);
  });

  it('shows an error with retry when the route cannot load', async () => {
    const result = queryResult({ isError: true });
    mockedRoute.mockReturnValue(result as never);
    await renderDetail();
    expect(await screen.findByText('No pudimos cargar la ruta')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(result.refetch).toHaveBeenCalled();
  });

  it('marks a slot without evaluation', async () => {
    mockedRoute.mockReturnValue(queryResult({ data: makeRoute({ safety: [] }) }) as never);
    await renderDetail();
    expect(await screen.findByText('Esta ruta aún no tiene una evaluación de seguridad.')).toBeOnTheScreen();
  });
});
