import { formatDistance } from './units';

describe('formatDistance', () => {
  it('shows kilometres as they are, with a Spanish decimal comma', () => {
    expect(formatDistance(10, 'metric')).toBe('10 km');
    expect(formatDistance(10.5, 'metric')).toBe('10,5 km');
  });

  it('converts to miles for the imperial system', () => {
    expect(formatDistance(10, 'imperial')).toBe('6,2 mi');
    expect(formatDistance(1.609344, 'imperial')).toBe('1 mi');
  });

  it('rounds to one decimal', () => {
    expect(formatDistance(5.04, 'metric')).toBe('5 km');
    expect(formatDistance(21.0975, 'metric')).toBe('21,1 km');
  });
});
