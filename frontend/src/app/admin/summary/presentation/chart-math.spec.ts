import {
  CATEGORICAL,
  CHART_COLOR_VARS,
  niceAxisTop,
  niceMax,
  sharePercentages,
} from './chart-math';

describe('sharePercentages', () => {
  it('always adds up to 100, giving the leftover to the largest remainders', () => {
    expect(sharePercentages([1, 1, 1])).toEqual([34, 33, 33]);
    expect(sharePercentages([2, 2, 1])).toEqual([40, 40, 20]);
    expect(sharePercentages([1, 2, 4, 8, 16, 32, 64]).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('gives one slice the whole ring', () => {
    expect(sharePercentages([5, 0, 0])).toEqual([100, 0, 0]);
  });

  it('is all zeros when there is nothing to share', () => {
    expect(sharePercentages([0, 0])).toEqual([0, 0]);
    expect(sharePercentages([])).toEqual([]);
  });
});

describe('niceMax', () => {
  it('rounds the tallest bar up to 1, 2, 5 or 10 times a power of ten', () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(1)).toBe(1);
    expect(niceMax(3)).toBe(5);
    expect(niceMax(7)).toBe(10);
    expect(niceMax(10.8)).toBe(20);
    expect(niceMax(0.3)).toBe(0.5);
  });
});

describe('chart colors', () => {
  it('maps every color to a design token', () => {
    expect(Object.values(CHART_COLOR_VARS).every((name) => name.startsWith('--rc-'))).toBe(true);
    expect(CATEGORICAL.every((color) => color in CHART_COLOR_VARS)).toBe(true);
  });

  it('keeps the semantic safety colors out of the categorical order', () => {
    expect(CATEGORICAL).not.toContain('success');
    expect(CATEGORICAL).not.toContain('warning');
    expect(CATEGORICAL).not.toContain('danger');
  });
});

describe('niceAxisTop', () => {
  it('gives an even top so the middle tick is a whole number', () => {
    expect([0, 1, 2, 3, 5, 7, 10, 12, 45, 101].map(niceAxisTop)).toEqual([
      2, 2, 2, 4, 6, 10, 10, 20, 60, 200,
    ]);
  });
});
