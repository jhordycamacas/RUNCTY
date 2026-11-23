import { ratingText, starFills } from './rating';

describe('starFills', () => {
  it('fills whole stars first and the next one in proportion', () => {
    expect(starFills(4.3)).toEqual([1, 1, 1, 1, expect.closeTo(0.3, 5)]);
    expect(starFills(2.5)).toEqual([1, 1, 0.5, 0, 0]);
  });

  it('is full at 5 and empty at 0', () => {
    expect(starFills(5)).toEqual([1, 1, 1, 1, 1]);
    expect(starFills(0)).toEqual([0, 0, 0, 0, 0]);
  });

  it('keeps out-of-range or broken values inside the scale', () => {
    expect(starFills(9)).toEqual([1, 1, 1, 1, 1]);
    expect(starFills(-2)).toEqual([0, 0, 0, 0, 0]);
    expect(starFills(Number.NaN)).toEqual([0, 0, 0, 0, 0]);
  });
});

describe('ratingText', () => {
  it('reads the average with a decimal comma and the number of ratings', () => {
    expect(ratingText(4.3, 12)).toBe('4,3 de 5 estrellas, 12 valoraciones');
  });

  it('uses the singular for one rating', () => {
    expect(ratingText(5, 1)).toBe('5,0 de 5 estrellas, 1 valoración');
  });
});
