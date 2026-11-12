import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/core/theme';
import { TextField } from '@/core/ui/TextField';

describe('TextField', () => {
  it('labels the input and reports typed text', async () => {
    const onChangeText = jest.fn();
    await render(
      <ThemeProvider appearance="light">
        <TextField label="Correo electrónico" icon="mail-outline" onChangeText={onChangeText} />
      </ThemeProvider>,
    );
    await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'ana@correo.ec');
    expect(onChangeText).toHaveBeenCalledWith('ana@correo.ec');
  });

  it('toggles password visibility with an accessible button', async () => {
    await render(
      <ThemeProvider appearance="light">
        <TextField label="Contraseña" icon="lock-closed-outline" secureTextEntry />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('Contraseña')).toHaveProp('secureTextEntry', true);
    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(screen.getByLabelText('Contraseña')).toHaveProp('secureTextEntry', false);
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeOnTheScreen();
  });

  it('shows the error instead of the hint', async () => {
    await render(
      <ThemeProvider appearance="light">
        <TextField label="Correo" hint="Tu correo" error="Correo inválido" />
      </ThemeProvider>,
    );
    expect(screen.getByText('Correo inválido')).toBeOnTheScreen();
    expect(screen.queryByText('Tu correo')).toBeNull();
  });
});
