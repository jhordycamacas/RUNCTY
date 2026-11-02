import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/core/theme';
import { StatTile } from '@/core/ui/StatTile';

describe('StatTile', () => {
  it('shows value and label and announces them together', async () => {
    await render(
      <ThemeProvider appearance="light">
        <StatTile value="10 km" label="Distancia preferida" icon="flag-outline" />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('Distancia preferida: 10 km')).toBeOnTheScreen();
    expect(screen.getByText('10 km', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.getByText('Distancia preferida', { includeHiddenElements: true })).toBeOnTheScreen();
  });
});
