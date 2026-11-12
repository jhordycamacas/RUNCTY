import { render, screen } from '@testing-library/react-native';

import { CustomFontsProvider, ThemeProvider } from '@/core/theme';
import { AppText } from '@/core/ui/AppText';

describe('AppText', () => {
  it('uses the Inter family that matches the requested weight', async () => {
    await render(
      <ThemeProvider appearance="light">
        <AppText weight="semibold">Hola</AppText>
      </ThemeProvider>,
    );
    expect(screen.getByText('Hola')).toHaveStyle({ fontFamily: 'Inter_600SemiBold' });
  });

  it('renders headings bold and exposes them as headers', async () => {
    await render(
      <ThemeProvider appearance="light">
        <AppText variant="title">Inicio</AppText>
      </ThemeProvider>,
    );
    const heading = screen.getByRole('header', { name: 'Inicio' });
    expect(heading).toHaveStyle({ fontFamily: 'Inter_700Bold' });
  });

  it('falls back to the system font weight when custom fonts are unavailable', async () => {
    await render(
      <ThemeProvider appearance="light">
        <CustomFontsProvider enabled={false}>
          <AppText weight="bold">Sin fuente</AppText>
        </CustomFontsProvider>
      </ThemeProvider>,
    );
    const text = screen.getByText('Sin fuente');
    expect(text).toHaveStyle({ fontWeight: '700' });
    expect(text).not.toHaveStyle({ fontFamily: 'Inter_700Bold' });
  });

  it('scales the font size with the user preference', async () => {
    await render(
      <ThemeProvider appearance="light" fontScale={1.5}>
        <AppText variant="body">Grande</AppText>
      </ThemeProvider>,
    );
    expect(screen.getByText('Grande')).toHaveStyle({ fontSize: 24 });
  });
});
