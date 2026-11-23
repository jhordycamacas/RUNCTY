import { CatalogItem, activeItems, catalogLabel, toCatalogItems } from './catalog';

const ITEMS: CatalogItem[] = [
  { code: 'beginner', label: 'Principiante', order: 1, active: true },
  { code: 'legacy', label: 'Antiguo', order: 2, active: false },
  { code: 'advanced', label: 'Avanzado', order: 3, active: true },
];

describe('catalog domain', () => {
  it('keeps only the active options', () => {
    expect(activeItems(ITEMS).map((item) => item.code)).toEqual(['beginner', 'advanced']);
  });

  it('labels a code with the catalog, inactive options included, and falls back to the code', () => {
    expect(catalogLabel(ITEMS, 'legacy')).toBe('Antiguo');
    expect(catalogLabel(ITEMS, 'gone')).toBe('gone');
    expect(catalogLabel([], 'gone')).toBe('gone');
  });

  it('reads a body tolerantly, dropping malformed entries and sorting by order', () => {
    const read = toCatalogItems({
      items: [
        { code: 'b', label: 'B', order: 2, active: true },
        { code: 'a', label: 'A', order: 1, active: false },
        { code: 5, label: 'bad', order: 3, active: true },
        { code: 'c', label: 'C', order: 'x', active: true },
        null,
      ],
    });

    expect(read).toEqual([
      { code: 'a', label: 'A', order: 1, active: false },
      { code: 'b', label: 'B', order: 2, active: true },
    ]);
    expect(toCatalogItems(undefined)).toEqual([]);
    expect(toCatalogItems({ items: 'x' })).toEqual([]);
  });
});
