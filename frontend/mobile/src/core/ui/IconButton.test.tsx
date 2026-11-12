import { fireEvent, render, screen } from '@testing-library/react-native';

import { MIN_TOUCH_TARGET, ThemeProvider } from '@/core/theme';
import { IconButton } from '@/core/ui/IconButton';

describe('IconButton', () => {
  it('is an accessible button named by its label and reacts to presses', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider appearance="light">
        <IconButton icon="settings-outline" accessibilityLabel="Abrir ajustes" onPress={onPress} />
      </ThemeProvider>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Abrir ajustes' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('keeps a 48 dp minimum touch target', async () => {
    await render(
      <ThemeProvider appearance="light">
        <IconButton icon="close" accessibilityLabel="Cerrar" onPress={jest.fn()} />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveStyle({
      minWidth: MIN_TOUCH_TARGET,
      minHeight: MIN_TOUCH_TARGET,
    });
  });

  it('does not react while disabled', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider appearance="light">
        <IconButton icon="close" accessibilityLabel="Cerrar" onPress={onPress} disabled />
      </ThemeProvider>,
    );
    const button = screen.getByRole('button', { name: 'Cerrar' });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });
});
