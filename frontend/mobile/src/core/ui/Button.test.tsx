import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { darkTheme, ThemeProvider } from '@/core/theme';
import { Button } from '@/core/ui/Button';

async function renderButton(props: Partial<ComponentProps<typeof Button>> = {}) {
  const onPress = jest.fn();
  await render(
    <ThemeProvider appearance="light">
      <Button label="Iniciar sesión" onPress={onPress} {...props} />
    </ThemeProvider>,
  );
  return { onPress };
}

describe('Button', () => {
  it('renders its label as an accessible button', async () => {
    await renderButton();
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeOnTheScreen();
  });

  it('calls onPress when pressed', async () => {
    const { onPress } = await renderButton();
    await fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress and reports busy while loading', async () => {
    const { onPress } = await renderButton({ loading: true });
    const button = screen.getByRole('button', { name: 'Iniciar sesión' });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
  });

  it('keeps the label as accessible name when a leading icon is shown', async () => {
    const { onPress } = await renderButton({ icon: 'log-out-outline', label: 'Cerrar sesión' });
    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the danger variant with the danger text color', async () => {
    // Dark theme: there danger and primary text differ, so the assertion is meaningful.
    await render(
      <ThemeProvider appearance="dark">
        <Button label="Eliminar mi cuenta" variant="danger" onPress={jest.fn()} />
      </ThemeProvider>,
    );
    expect(screen.getByText('Eliminar mi cuenta')).toHaveStyle({ color: darkTheme.colors.danger });
  });
});
