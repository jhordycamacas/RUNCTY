import { render, screen } from '@testing-library/react-native';

import { lightTheme, ThemeProvider } from '@/core/theme';
import { Icon } from '@/core/ui/Icon';

describe('Icon', () => {
  it('is decorative: hidden from screen readers', async () => {
    await render(
      <ThemeProvider appearance="light">
        <Icon name="home-outline" testID="icon" />
      </ThemeProvider>,
    );
    expect(screen.queryByTestId('icon')).toBeNull();
    expect(screen.getByTestId('icon', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('paints with a theme color token and size', async () => {
    await render(
      <ThemeProvider appearance="light">
        <Icon name="home-outline" color="primaryText" size={20} testID="icon" />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('icon', { includeHiddenElements: true })).toHaveStyle({
      color: lightTheme.colors.primaryText,
      fontSize: 20,
    });
  });
});
