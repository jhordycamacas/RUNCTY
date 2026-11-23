/** The catalogs an admin manages; the API answers them at `/catalogs/<id>`. */
export type CatalogId = 'sportLevels' | 'sportGoals';

export interface CatalogItem {
  /** Stable slug stored in documents; it never changes once saved. */
  code: string;
  label: string;
  order: number;
  /** Inactive options are hidden from the choices, but documents that already hold them keep them. */
  active: boolean;
}

export abstract class CatalogRepository {
  /** Every option, inactive ones included, sorted by `order`. */
  abstract list(id: CatalogId): Promise<CatalogItem[]>;
  /** Replaces the whole list (needs `settings.manage`) and answers what the server stored. */
  abstract save(id: CatalogId, items: readonly CatalogItem[]): Promise<CatalogItem[]>;
}

export const activeItems = (items: readonly CatalogItem[]): CatalogItem[] =>
  items.filter((item) => item.active);

/** The label of a code, inactive options included; the raw code when the catalog does not know it. */
export const catalogLabel = (items: readonly CatalogItem[], code: string): string =>
  items.find((item) => item.code === code)?.label ?? code;

const isItem = (value: unknown): value is CatalogItem => {
  const item = value as Partial<Record<keyof CatalogItem, unknown>> | null;
  return (
    !!item &&
    typeof item.code === 'string' &&
    typeof item.label === 'string' &&
    typeof item.order === 'number' &&
    typeof item.active === 'boolean'
  );
};

/** Tolerant read of a `{ items: [...] }` body: malformed entries are dropped, the rest sorted by order. */
export function toCatalogItems(raw: unknown): CatalogItem[] {
  const items = (raw as { items?: unknown } | null | undefined)?.items;
  if (!Array.isArray(items)) return [];
  return items
    .filter(isItem)
    .map(({ code, label, order, active }) => ({ code, label, order, active }))
    .sort((a, b) => a.order - b.order);
}
