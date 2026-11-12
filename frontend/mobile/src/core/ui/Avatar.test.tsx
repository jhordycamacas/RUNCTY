import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/core/theme';
import { Avatar, getInitials } from '@/core/ui/Avatar';

describe('getInitials', () => {
  it.each([
    ['Ana Torres', 'AT'],
    ['maría josé pérez lópez', 'ML'],
    ['  Lucía  ', 'L'],
    ['', '?'],
  ])('%p gives %p', (name, initials) => {
    expect(getInitials(name)).toBe(initials);
  });
});

describe('Avatar', () => {
  it('shows the initials but stays hidden from screen readers', async () => {
    await render(
      <ThemeProvider appearance="light">
        <Avatar name="Ana Torres" />
      </ThemeProvider>,
    );
    expect(screen.getByText('AT', { includeHiddenElements: true })).toBeOnTheScreen();
    // The name is shown next to it; announcing the initials would be noise.
    expect(screen.queryByText('AT')).toBeNull();
  });
});
