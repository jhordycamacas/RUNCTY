import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { lightTheme, MIN_TOUCH_TARGET, ThemeProvider } from '@/core/theme';
import { AppText } from '@/core/ui/AppText';
import { ListItem } from '@/core/ui/ListItem';

describe('ListItem', () => {
  it('is a pressable row named by its title, with the subtitle as hint', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider appearance="light">
        <ListItem
          icon="person-outline"
          title="Datos personales"
          subtitle="Nombre y ciudad"
          onPress={onPress}
        />
      </ThemeProvider>,
    );
    const row = screen.getByRole('button', { name: 'Datos personales' });
    expect(row).toHaveProp('accessibilityHint', 'Nombre y ciudad');
    expect(StyleSheet.flatten(row.props.style).minHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    await fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not react while disabled', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider appearance="light">
        <ListItem title="Preferencias" onPress={onPress} disabled />
      </ThemeProvider>,
    );
    const row = screen.getByRole('button', { name: 'Preferencias' });
    await fireEvent.press(row);
    expect(onPress).not.toHaveBeenCalled();
    expect(row).toBeDisabled();
  });

  it('renders the danger tone and a custom trailing node', async () => {
    await render(
      <ThemeProvider appearance="light">
        <ListItem
          title="Eliminar cuenta"
          tone="danger"
          onPress={jest.fn()}
          trailing={<AppText>Extra</AppText>}
        />
      </ThemeProvider>,
    );
    expect(screen.getByText('Eliminar cuenta', { includeHiddenElements: true })).toHaveStyle({
      color: lightTheme.colors.danger,
    });
    expect(screen.getByText('Extra', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('is static text (not a button) without onPress', async () => {
    await render(
      <ThemeProvider appearance="light">
        <ListItem title="Ciudad" subtitle="Loja" />
      </ThemeProvider>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Loja')).toBeOnTheScreen();
  });
});
