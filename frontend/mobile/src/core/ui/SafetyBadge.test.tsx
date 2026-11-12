import { render, screen } from '@testing-library/react-native';

import { lightTheme, ThemeProvider } from '@/core/theme';
import { SafetyBadge, type SafetyLevel } from '@/core/ui/SafetyBadge';

async function renderBadge(level: SafetyLevel, compact?: boolean) {
  await render(
    <ThemeProvider appearance="light">
      <SafetyBadge level={level} compact={compact} />
    </ThemeProvider>,
  );
}

describe('SafetyBadge', () => {
  it.each([
    ['high', 'Seguridad alta', lightTheme.colors.safetyHigh],
    ['medium', 'Seguridad media', lightTheme.colors.safetyMedium],
    ['low', 'Seguridad baja', lightTheme.colors.safetyLow],
  ] as const)('labels the %s level with its text and safety color', async (level, text, color) => {
    await renderBadge(level);
    expect(screen.getByLabelText(text)).toBeOnTheScreen();
    expect(screen.getByText(text, { includeHiddenElements: true })).toHaveStyle({ color });
  });

  it.each([
    ['high', 'Alto', 'Seguridad alta'],
    ['medium', 'Medio', 'Seguridad media'],
    ['low', 'Bajo', 'Seguridad baja'],
  ] as const)('shows the short %s text when compact but keeps the full label', async (level, text, label) => {
    await renderBadge(level, true);
    expect(screen.getByText(text, { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.getByLabelText(label)).toBeOnTheScreen();
  });

  it.each(['high', 'medium', 'low'] as const)('never calls the %s level safe or unsafe', async (level) => {
    await renderBadge(level);
    expect(screen.queryByText(/segura|insegura/i, { includeHiddenElements: true })).toBeNull();
    expect(screen.queryByLabelText(/segura|insegura/i)).toBeNull();
  });
});
