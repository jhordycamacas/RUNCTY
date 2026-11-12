import { render, screen } from '@testing-library/react-native';

import { lightTheme, ThemeProvider } from '@/core/theme';
import { Badge } from '@/core/ui/Badge';

describe('Badge', () => {
  it('shows its label', async () => {
    await render(
      <ThemeProvider appearance="light">
        <Badge label="Nuevo" />
      </ThemeProvider>,
    );
    expect(screen.getByText('Nuevo')).toBeOnTheScreen();
  });

  it.each([
    ['neutral', lightTheme.colors.textMuted],
    ['primary', lightTheme.colors.primaryText],
    ['success', lightTheme.colors.success],
    ['warning', lightTheme.colors.warning],
    ['danger', lightTheme.colors.danger],
  ] as const)('uses the %s tone color for its text', async (tone, color) => {
    await render(
      <ThemeProvider appearance="light">
        <Badge label="Estado" tone={tone} icon="ellipse" />
      </ThemeProvider>,
    );
    expect(screen.getByText('Estado')).toHaveStyle({ color });
  });
});
