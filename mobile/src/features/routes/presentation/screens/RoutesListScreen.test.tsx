import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { useCityRoutes } from '../../application/useRoutes';
import { useRunnerCity } from '../hooks/useRunnerCity';
import { TestProviders, evening, makeRoute, morning, queryResult } from '../testing/fixtures';
import { RoutesListScreen } from './RoutesListScreen';

jest.mock('../../application/useRoutes', () => ({ useCityRoutes: jest.fn() }));
jest.mock('../hooks/useRunnerCity', () => ({ useRunnerCity: jest.fn() }));

const mockedCity = jest.mocked(useRunnerCity);
const mockedRoutes = jest.mocked(useCityRoutes);

const loja = { cityId: 'loja', cityName: 'Loja', isLoading: false, isError: false, refetch: jest.fn() };

const routes = [
  makeRoute(),
  makeRoute({
    id: 'tebaida',
    name: 'Parque Lineal La Tebaida',
    distanceKm: 7.5,
    difficulty: 'intermediate',
    surface: 'mixed',
    safety: [
      morning({ level: 'medium', score: 55 }),
      evening({ level: 'high', score: 80, factors: [] }),
    ],
  }),
  makeRoute({ id: 'nueva', name: 'Ruta nueva', distanceKm: 12, difficulty: 'advanced', safety: [] }),
];

async function renderList(overrides: { onOpenRoute?: jest.Mock; onCompleteProfile?: jest.Mock } = {}) {
  const props = { onOpenRoute: jest.fn(), onCompleteProfile: jest.fn(), ...overrides };
  await render(<RoutesListScreen {...props} />, { wrapper: TestProviders });
  return { props };
}

const cards = () => screen.getAllByRole('button').filter((b) => b.props.accessibilityLabel?.includes(' km'));

beforeEach(() => {
  mockedCity.mockReturnValue(loja);
  mockedRoutes.mockReturnValue(queryResult({ data: routes }) as never);
});

describe('RoutesListScreen', () => {
  it('asks to complete the profile when the runner has no city', async () => {
    mockedCity.mockReturnValue({ ...loja, cityId: null, cityName: null });
    const { props } = await renderList();
    expect(await screen.findByText('Elige tu ciudad')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Completar perfil' }));
    expect(props.onCompleteProfile).toHaveBeenCalled();
  });

  it('shows a loading state while routes load', async () => {
    mockedRoutes.mockReturnValue(queryResult({ isPending: true }) as never);
    await renderList();
    expect(await screen.findByLabelText('Cargando rutas…')).toBeOnTheScreen();
  });

  it('shows an error with a retry action', async () => {
    const result = queryResult({ isError: true });
    mockedRoutes.mockReturnValue(result as never);
    await renderList();
    expect(await screen.findByText('No pudimos cargar las rutas')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(result.refetch).toHaveBeenCalled();
  });

  it('shows an empty state when the city has no routes', async () => {
    mockedRoutes.mockReturnValue(queryResult({ data: [] }) as never);
    await renderList();
    expect(await screen.findByText('Aún no hay rutas en Loja')).toBeOnTheScreen();
  });

  it('lists routes with their safety level for the selected slot, best first', async () => {
    await renderList();
    expect(await screen.findByText('Loja')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: '05:00 – 07:00' }));
    let list = cards();
    expect(list.map((c) => c.props.accessibilityLabel.split('.')[0])).toEqual([
      'Parque Jipiro',
      'Parque Lineal La Tebaida',
      'Ruta nueva',
    ]);
    expect(within(list[0]).getByLabelText('Seguridad alta')).toBeOnTheScreen();
    expect(within(list[2]).getByText('Sin evaluar')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: '18:00 – 20:00' }));
    list = cards();
    expect(list[0].props.accessibilityLabel).toContain('Parque Lineal La Tebaida');
    expect(within(list[1]).getByLabelText('Seguridad baja')).toBeOnTheScreen();
    expect(within(list[1]).getByText('Iluminación deficiente en Orilla del río')).toBeOnTheScreen();
  });

  it('filters by distance and difficulty, and clears the filters', async () => {
    await renderList();
    await fireEvent.press(await screen.findByRole('radio', { name: 'Hasta 5 km' }));
    expect(cards()).toHaveLength(1);
    expect(screen.getByText('Parque Jipiro')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: 'Avanzado' }));
    expect(screen.getByText('Ninguna ruta coincide con los filtros')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Quitar filtros' }));
    expect(cards()).toHaveLength(3);
  });

  it('opens a route with the selected slot', async () => {
    const { props } = await renderList();
    await fireEvent.press(await screen.findByRole('radio', { name: '18:00 – 20:00' }));
    await fireEvent.press(screen.getByRole('button', { name: /^Parque Jipiro/ }));
    expect(props.onOpenRoute).toHaveBeenCalledWith('jipiro', '18:00-20:00');
  });
});
