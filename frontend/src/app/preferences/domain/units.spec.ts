import { distanceParts, formatDistance, paceParts } from './units';

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

describe('distanceParts', () => {
  it('splits the number from the unit and can keep a fixed number of decimals', () => {
    expect(distanceParts(3.2, 'metric')).toEqual({ value: '3,2', unit: 'km' });
    expect(distanceParts(0, 'metric', 2)).toEqual({ value: '0,00', unit: 'km' });
    expect(distanceParts(1.609344, 'imperial', 2)).toEqual({ value: '1,00', unit: 'mi' });
  });
});

describe('paceParts', () => {
  it('shows minutes and seconds per kilometre', () => {
    expect(paceParts(330, 'metric')).toEqual({ value: '5:30', unit: 'min/km' });
    expect(paceParts(305.4, 'metric')).toEqual({ value: '5:05', unit: 'min/km' });
  });

  it('converts to minutes per mile for the imperial system', () => {
    expect(paceParts(300, 'imperial')).toEqual({ value: '8:03', unit: 'min/mi' });
  });

  it('shows dashes while there is no pace yet', () => {
    expect(paceParts(null, 'metric')).toEqual({ value: '--:--', unit: 'min/km' });
  });
});
