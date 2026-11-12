import { render, screen } from '@testing-library/react-native';

import { lightTheme, ThemeProvider } from '@/core/theme';
import { Callout } from '@/core/ui/Callout';

describe('Callout', () => {
  it('shows title and message, with the title in the tone color', async () => {
    await render(
      <ThemeProvider appearance="light">
        <Callout tone="warning" title="Verifica tu correo" message="Te enviamos un enlace." />
      </ThemeProvider>,
    );
    expect(screen.getByText('Verifica tu correo')).toHaveStyle({ color: lightTheme.colors.warning });
    expect(screen.getByText('Te enviamos un enlace.')).toBeOnTheScreen();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('announces danger callouts as alerts', async () => {
    await render(
      <ThemeProvider appearance="light">
        <Callout tone="danger" title="Acción permanente" />
      </ThemeProvider>,
    );
    expect(screen.getByRole('alert')).toBeOnTheScreen();
  });
});
