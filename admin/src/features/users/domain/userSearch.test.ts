import { describe, expect, it } from 'vitest';

import { EMPTY_FILTERS, fullName, parseUserFilters } from './userSearch';

describe('parseUserFilters', () => {
  it('drops empty fields and trims the rest', () => {
    const result = parseUserFilters({ ...EMPTY_FILTERS, firstName: ' Ana ', cityId: 'loja' });
    expect(result).toEqual({ ok: true, filters: { firstName: 'Ana', cityId: 'loja' } });
  });

  it('accepts no filters (list everyone)', () => {
    expect(parseUserFilters(EMPTY_FILTERS)).toEqual({ ok: true, filters: {} });
  });

  it('validates id number, birth date and email formats in Spanish', () => {
    const result = parseUserFilters({ ...EMPTY_FILTERS, idNumber: '123', birthDate: '2020/01/01', email: 'nope' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.idNumber).toMatch(/10 dígitos/);
      expect(result.errors.birthDate).toBeDefined();
      expect(result.errors.email).toMatch(/correo/);
    }
  });
});

describe('fullName', () => {
  it('joins the names and falls back to a dash', () => {
    expect(fullName({ firstName: 'Ana', lastName: 'Paz' })).toBe('Ana Paz');
    expect(fullName({ firstName: '', lastName: '' })).toBe('—');
  });
});
