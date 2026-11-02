import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '@/core/theme';
import { Checkbox } from '@/core/ui/Checkbox';
import { ChoiceGroup } from '@/core/ui/ChoiceGroup';

const withTheme = (ui: ReactElement) => render(<ThemeProvider appearance="light">{ui}</ThemeProvider>);

describe('Checkbox', () => {
  it('exposes its checked state and toggles', async () => {
    const onChange = jest.fn();
    await withTheme(<Checkbox label="Acepto" checked={false} onChange={onChange} />);
    const box = screen.getByRole('checkbox', { name: 'Acepto' });
    expect(box).not.toBeChecked();
    await fireEvent.press(box);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('ChoiceGroup', () => {
  const options = [
    { value: 'a', label: 'Uno' },
    { value: 'b', label: 'Dos' },
  ];

  it('replaces the selection in single mode', async () => {
    const onChange = jest.fn();
    await withTheme(<ChoiceGroup label="Nivel" options={options} value={['a']} onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'Uno' })).toBeChecked();
    await fireEvent.press(screen.getByRole('radio', { name: 'Dos' }));
    expect(onChange).toHaveBeenCalledWith(['b']);
  });

  it('toggles values in multiple mode', async () => {
    const onChange = jest.fn();
    await withTheme(
      <ChoiceGroup label="Objetivos" multiple options={options} value={['a']} onChange={onChange} />,
    );
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Uno' }));
    expect(onChange).toHaveBeenCalledWith([]);
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Dos' }));
    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it('shows a disabled option that cannot be selected', async () => {
    const onChange = jest.fn();
    await withTheme(
      <ChoiceGroup
        label="Idioma"
        options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English', disabled: true }]}
        value={['es']}
        onChange={onChange}
      />,
    );
    const english = screen.getByRole('radio', { name: 'English' });
    expect(english).toBeDisabled();
    await fireEvent.press(english);
    expect(onChange).not.toHaveBeenCalled();
  });
});
