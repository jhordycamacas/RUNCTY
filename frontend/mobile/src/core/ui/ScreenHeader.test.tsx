import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/core/theme';
import { IconButton } from '@/core/ui/IconButton';
import { ScreenHeader } from '@/core/ui/ScreenHeader';

describe('ScreenHeader', () => {
  it('shows a large title as header plus its subtitle', async () => {
    await render(
      <ThemeProvider appearance="light">
        <ScreenHeader title="Rutas" subtitle="Elige por dónde correr" />
      </ThemeProvider>,
    );
    expect(screen.getByRole('header', { name: 'Rutas' })).toBeOnTheScreen();
    expect(screen.getByText('Elige por dónde correr')).toBeOnTheScreen();
  });

  it('renders an optional right action', async () => {
    await render(
      <ThemeProvider appearance="light">
        <ScreenHeader
          title="Inicio"
          right={<IconButton icon="settings-outline" accessibilityLabel="Ajustes" onPress={jest.fn()} />}
        />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Ajustes' })).toBeOnTheScreen();
  });
});
