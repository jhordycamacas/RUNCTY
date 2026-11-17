import { EMPTY_USER_SEARCH, parseUserSearch } from './user-search';

describe('user search', () => {
  it('sends only the filters that have a value, trimmed', () => {
    const { filters } = parseUserSearch({
      ...EMPTY_USER_SEARCH,
      firstName: ' Ana ',
      email: ' ANA@mail.com ',
      cityId: 'loja',
    });

    expect(filters).toEqual({ firstName: 'Ana', email: 'ANA@mail.com', cityId: 'loja' });
  });

  it('sends no filter at all for an empty form', () => {
    expect(parseUserSearch({ ...EMPTY_USER_SEARCH, lastName: '   ' }).filters).toEqual({});
  });

  it('accepts a 10-digit id number and an ISO birth date', () => {
    const result = parseUserSearch({
      ...EMPTY_USER_SEARCH,
      idNumber: '1104567890',
      birthDate: '1995-04-23',
    });

    expect(result.errors).toBeUndefined();
    expect(result.filters).toEqual({ idNumber: '1104567890', birthDate: '1995-04-23' });
  });

  it.each(['123', '11045678901', 'abcdefghij'])('rejects the id number "%s"', (idNumber) => {
    const { filters, errors } = parseUserSearch({ ...EMPTY_USER_SEARCH, idNumber });

    expect(filters).toBeUndefined();
    expect(errors?.idNumber).toBe('La identificación debe tener 10 dígitos.');
  });

  it.each(['23/04/1995', '1995-4-23', '1995-02-30', '1995-13-01'])(
    'rejects the birth date "%s"',
    (birthDate) => {
      expect(parseUserSearch({ ...EMPTY_USER_SEARCH, birthDate }).errors?.birthDate).toContain(
        'AAAA-MM-DD',
      );
    },
  );
});
