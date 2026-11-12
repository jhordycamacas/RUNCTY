import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/core/theme';
import { EmptyState } from '@/core/ui/EmptyState';

describe('EmptyState', () => {
  it('shows title and description', async () => {
    await render(
      <ThemeProvider appearance="light">
        <EmptyState icon="map-outline" title="Sin rutas" description="Pronto habrá rutas." />
      </ThemeProvider>,
    );
    expect(screen.getByRole('header', { name: 'Sin rutas' })).toBeOnTheScreen();
    expect(screen.getByText('Pronto habrá rutas.')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders an optional action', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider appearance="light">
        <EmptyState icon="map-outline" title="Sin rutas" action={{ label: 'Reintentar', onPress }} />
      </ThemeProvider>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
