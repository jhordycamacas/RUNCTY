import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/core/theme';
import { SwitchRow } from '@/core/ui/SwitchRow';

describe('SwitchRow', () => {
  it('exposes an accessible switch with its state and toggles from the row', async () => {
    const onChange = jest.fn();
    await render(
      <ThemeProvider appearance="light">
        <SwitchRow label="Alertas de seguridad" value={false} onChange={onChange} />
      </ThemeProvider>,
    );
    const row = screen.getByRole('switch', { name: 'Alertas de seguridad' });
    expect(row).not.toBeChecked();
    await fireEvent.press(row);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('ignores presses when disabled', async () => {
    const onChange = jest.fn();
    await render(
      <ThemeProvider appearance="light">
        <SwitchRow label="Eventos" value disabled onChange={onChange} />
      </ThemeProvider>,
    );
    const row = screen.getByRole('switch', { name: 'Eventos' });
    expect(row).toBeChecked();
    expect(row).toBeDisabled();
    await fireEvent.press(row);
    expect(onChange).not.toHaveBeenCalled();
  });
});
