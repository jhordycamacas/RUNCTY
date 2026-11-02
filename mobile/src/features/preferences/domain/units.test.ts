import { formatDistance } from './units';

describe('formatDistance', () => {
  it('formats kilometers with one decimal and a comma (es)', () => {
    expect(formatDistance(5, 'metric')).toBe('5,0 km');
    expect(formatDistance(10.26, 'metric')).toBe('10,3 km');
  });

  it('converts to miles for imperial units', () => {
    expect(formatDistance(1.609344, 'imperial')).toBe('1,0 mi');
    expect(formatDistance(10, 'imperial')).toBe('6,2 mi');
  });

  it('handles zero and rejects invalid distances', () => {
    expect(formatDistance(0, 'metric')).toBe('0,0 km');
    expect(() => formatDistance(-1, 'metric')).toThrow();
    expect(() => formatDistance(Number.NaN, 'imperial')).toThrow();
  });
});
