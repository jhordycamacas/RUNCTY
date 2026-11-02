import { contrastRatio } from '@/core/theme/contrast';
import { darkTheme, lightTheme } from '@/core/theme/themes';

const AA_NORMAL_TEXT = 4.5;

describe('contrastRatio', () => {
  it('returns 21 for black on white and 1 for identical colors', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('is symmetric and accepts shorthand hex', () => {
    expect(contrastRatio('#fff', '#111111')).toBeCloseTo(contrastRatio('#111111', '#FFFFFF'), 5);
  });

  it('throws on invalid colors', () => {
    expect(() => contrastRatio('red', '#FFFFFF')).toThrow();
  });
});

describe.each([
  ['light', lightTheme],
  ['dark', darkTheme],
])('%s theme text contrast (WCAG AA >= 4.5:1)', (_name, theme) => {
  const { colors } = theme;

  it.each([
    ['text on background', colors.text, colors.background],
    ['text on surface', colors.text, colors.surface],
    ['muted text on background', colors.textMuted, colors.background],
    ['muted text on surface', colors.textMuted, colors.surface],
    ['primary text on background', colors.primaryText, colors.background],
    ['on-primary on primary', colors.onPrimary, colors.primary],
    ['on-primary on primary pressed', colors.onPrimary, colors.primaryPressed],
    ['danger text on background', colors.danger, colors.background],
    ['text on elevated surface', colors.text, colors.surfaceElevated],
    ['muted text on elevated surface', colors.textMuted, colors.surfaceElevated],
    ['primary text on elevated surface', colors.primaryText, colors.surfaceElevated],
    ['danger text on elevated surface', colors.danger, colors.surfaceElevated],
    ['primary text on primary tint', colors.primaryText, colors.primaryTint],
    ['success text on success tint', colors.success, colors.successTint],
    ['warning text on warning tint', colors.warning, colors.warningTint],
    ['danger text on danger tint', colors.danger, colors.dangerTint],
    ['text on warning tint', colors.text, colors.warningTint],
    ['safety high on its tint', colors.safetyHigh, colors.successTint],
    ['safety medium on its tint', colors.safetyMedium, colors.warningTint],
    ['safety low on its tint', colors.safetyLow, colors.dangerTint],
  ])('%s', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });
});
