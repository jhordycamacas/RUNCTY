import { CatalogItem } from '../../../../core/catalogs/catalog';
import {
  CatalogRow,
  MAX_ITEMS,
  newRow,
  rowsChanged,
  serverErrors,
  slugifyCode,
  toItems,
  toRows,
  validateRows,
} from './catalog-editor';

const ITEMS: CatalogItem[] = [
  { code: 'beginner', label: 'Principiante', order: 1, active: true },
  { code: 'advanced', label: 'Avanzado', order: 2, active: false },
];

const row = (over: Partial<CatalogRow> = {}): CatalogRow => ({
  key: 1,
  code: 'health',
  label: 'Salud',
  active: true,
  existing: false,
  codeEdited: false,
  ...over,
});

describe('slugifyCode', () => {
  it('turns a label into camelCase ASCII', () => {
    expect(slugifyCode('Bajar de peso')).toBe('bajarDePeso');
    expect(slugifyCode('  Preparar una   carrera ')).toBe('prepararUnaCarrera');
    expect(slugifyCode('Niño ágil')).toBe('ninoAgil');
    expect(slugifyCode('Salud')).toBe('salud');
  });

  it('starts with a letter and fits the code length', () => {
    expect(slugifyCode('5K runner')).toBe('kRunner');
    expect(slugifyCode('¡¡¡')).toBe('');
    expect(slugifyCode('a'.repeat(60))).toHaveLength(40);
  });
});

describe('rows and items', () => {
  it('opens the stored items as existing rows, in order', () => {
    expect(toRows(ITEMS).map((r) => [r.code, r.existing, r.active])).toEqual([
      ['beginner', true, true],
      ['advanced', true, false],
    ]);
  });

  it('builds new rows empty and with the code still suggestable', () => {
    expect(newRow(7)).toEqual({
      key: 7,
      code: '',
      label: '',
      active: true,
      existing: false,
      codeEdited: false,
    });
  });

  it('numbers the order from the position and trims the label', () => {
    const rows = [row({ key: 1, code: 'b', label: ' B ' }), row({ key: 2, code: 'a', label: 'A', active: false })];

    expect(toItems(rows)).toEqual([
      { code: 'b', label: 'B', order: 1, active: true },
      { code: 'a', label: 'A', order: 2, active: false },
    ]);
  });

  it('knows when nothing changed against the stored items', () => {
    expect(rowsChanged(ITEMS, toRows(ITEMS))).toBe(false);
    expect(rowsChanged(ITEMS, toRows(ITEMS).reverse())).toBe(true);
    expect(rowsChanged(ITEMS, toRows(ITEMS).map((r) => ({ ...r, label: `${r.label}!` })))).toBe(true);
    expect(rowsChanged(ITEMS, toRows(ITEMS).map((r) => ({ ...r, active: true })))).toBe(true);
    expect(rowsChanged(ITEMS, [...toRows(ITEMS), newRow(9)])).toBe(true);
  });
});

describe('validateRows', () => {
  it('accepts a well-formed list', () => {
    expect(validateRows(toRows(ITEMS))).toEqual({ rows: {} });
  });

  it('explains each invalid label and code in Spanish', () => {
    const errors = validateRows([
      row({ key: 1, code: '', label: '' }),
      row({ key: 2, code: '9bad', label: 'x'.repeat(61) }),
      row({ key: 3, code: 'Ok', label: 'Ok' }),
    ]);

    expect(errors.rows[0]).toEqual({ code: 'Ingresa un código.', label: 'Ingresa un nombre.' });
    expect(errors.rows[1].code).toBe(
      'Usa letras, números, guion o guion bajo, empezando con una letra minúscula.',
    );
    expect(errors.rows[1].label).toBe('Máximo 60 caracteres.');
    expect(errors.rows[2]).toBeDefined();
  });

  it('flags a repeated code on every row that repeats it', () => {
    const errors = validateRows([
      row({ key: 1, code: 'a' }),
      row({ key: 2, code: 'b' }),
      row({ key: 3, code: 'a' }),
    ]);

    expect(errors.rows[0].code).toBe('Este código ya existe.');
    expect(errors.rows[2].code).toBe('Este código ya existe.');
    expect(errors.rows[1]).toBeUndefined();
  });

  it('needs at least one active option', () => {
    expect(validateRows([row({ active: false })]).list).toBe('Deja al menos una opción activa.');
    expect(validateRows([]).list).toBe('Deja al menos una opción activa.');
  });

  it('limits how many options there can be', () => {
    const many = Array.from({ length: MAX_ITEMS + 1 }, (_, i) => row({ key: i, code: `c${i}` }));

    expect(validateRows(many).list).toBe(`Máximo ${MAX_ITEMS} opciones.`);
  });
});

describe('serverErrors', () => {
  it('maps the field reasons of a rejected save to Spanish, by row position', () => {
    const errors = serverErrors({
      'items.1.code': 'duplicate',
      'items.1.label': 'max-length',
      'items.0.code': 'invalid-format',
      'items.2.order': 'invalid',
      items: 'no-active-item',
    });

    expect(errors.rows[1]).toEqual({ code: 'Este código ya existe.', label: 'Máximo 60 caracteres.' });
    expect(errors.rows[0].code).toContain('Usa letras');
    expect(errors.rows[2].other).toBe('El valor no es válido.');
    expect(errors.list).toBe('Deja al menos una opción activa.');
  });

  it('words the remaining list reasons', () => {
    expect(serverErrors({ items: 'code-removed' }).list).toBe(
      'No se puede quitar una opción que ya existía: desactívala.',
    );
    expect(serverErrors({ items: 'max-length' }).list).toBe(`Máximo ${MAX_ITEMS} opciones.`);
    expect(serverErrors({ items: 'unknown' }).list).toBe('El valor no es válido.');
    expect(serverErrors({ 'items.0.code': 'required' }).rows[0].code).toBe('Ingresa un código.');
    expect(serverErrors({ other: 'x' }).list).toBe('El valor no es válido.');
  });
});
