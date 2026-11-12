import { fireEvent, render, screen } from '@testing-library/react-native';

import { useCityRoutes } from '../../application/useRoutes';
import { useRunnerCity } from '../hooks/useRunnerCity';
import { TestProviders, makeRoute, morning, queryResult } from '../testing/fixtures';
import { RecommendedRoutes } from './RecommendedRoutes';

jest.mock('../../application/useRoutes', () => ({ useCityRoutes: jest.fn() }));
jest.mock('../hooks/useRunnerCity', () => ({ useRunnerCity: jest.fn() }));

const loja = { cityId: 'loja', cityName: 'Loja', isLoading: false, isError: false, refetch: jest.fn() };

beforeEach(() => {
  jest.mocked(useRunnerCity).mockReturnValue(loja);
});

describe('RecommendedRoutes', () => {
  it('shows the top three routes and opens one', async () => {
    const routes = [40, 90, 70, 60].map((score, i) =>
      makeRoute({ id: `r${i}`, name: `Ruta ${score}`, safety: [morning({ score, slotId: 'm' })] }),
    );
    jest.mocked(useCityRoutes).mockReturnValue(queryResult({ data: routes }) as never);
    const onOpenRoute = jest.fn();
    await render(<RecommendedRoutes onOpenRoute={onOpenRoute} />, { wrapper: TestProviders });

    expect(screen.getByText('Ruta 90')).toBeOnTheScreen();
    expect(screen.getByText('Ruta 70')).toBeOnTheScreen();
    expect(screen.getByText('Ruta 60')).toBeOnTheScreen();
    expect(screen.queryByText('Ruta 40')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: /^Ruta 90/ }));
    expect(onOpenRoute).toHaveBeenCalledWith('r1', '05:00-07:00');
  });

  it('keeps the empty state when there are no routes', async () => {
    jest.mocked(useCityRoutes).mockReturnValue(queryResult({ data: [] }) as never);
    await render(<RecommendedRoutes onOpenRoute={jest.fn()} />, { wrapper: TestProviders });
    expect(screen.getByText('Aún no hay rutas')).toBeOnTheScreen();
  });
});
