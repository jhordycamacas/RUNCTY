import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/core/theme';
import { SectionHeader } from '@/core/ui/SectionHeader';

describe('SectionHeader', () => {
  it('exposes its title as a header', async () => {
    await render(
      <ThemeProvider appearance="light">
        <SectionHeader title="Rutas recomendadas" />
      </ThemeProvider>,
    );
    expect(screen.getByRole('header', { name: 'Rutas recomendadas' })).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders an optional action button', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider appearance="light">
        <SectionHeader title="Rutas" action={{ label: 'Ver todas', onPress }} />
      </ThemeProvider>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Ver todas' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
