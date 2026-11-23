import { CatalogItem } from '../../../../core/catalogs/catalog';

export const MAX_ITEMS = 30;
const MAX_LABEL = 60;
const MAX_CODE = 40;
const CODE_PATTERN = /^[a-z][a-zA-Z0-9_-]{0,39}$/;

/** One line of the editor. `key` identifies it while it is moved around; the order is the position. */
export interface CatalogRow {
  key: number;
  code: string;
  label: string;
  active: boolean;
  /** Saved before: its code is fixed and the API refuses to drop it. */
  existing: boolean;
  /** The admin typed the code, so it stops following the label. */
  codeEdited: boolean;
}

export interface RowErrors {
  code?: string;
  label?: string;
  other?: string;
}

/** `rows` by position in the list; `list` for what concerns the catalog as a whole. */
export interface CatalogErrors {
  rows: Record<number, RowErrors>;
  list?: string;
}

/** "Bajar de peso" → "bajarDePeso": camelCase ASCII that starts with a letter, at most 40 characters. */
export function slugifyCode(label: string): string {
  const words = label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
  const joined = words
    .map((word, i) => (i === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase()))
    .join('');
  return joined.replace(/^[^a-zA-Z]+/, '').slice(0, MAX_CODE);
}

export const toRows = (items: readonly CatalogItem[]): CatalogRow[] =>
  items.map((item, key) => ({
    key,
    code: item.code,
    label: item.label,
    active: item.active,
    existing: true,
    codeEdited: true,
  }));

export const newRow = (key: number): CatalogRow => ({
  key,
  code: '',
  label: '',
  active: true,
  existing: false,
  codeEdited: false,
});

/** What `PUT /catalogs/<id>` gets: the order is the position, starting at 1. */
export const toItems = (rows: readonly CatalogRow[]): CatalogItem[] =>
  rows.map((row, index) => ({
    code: row.code.trim(),
    label: row.label.trim(),
    order: index + 1,
    active: row.active,
  }));

export function rowsChanged(stored: readonly CatalogItem[], rows: readonly CatalogRow[]): boolean {
  return JSON.stringify(toItems(toRows(stored))) !== JSON.stringify(toItems(rows));
}

const NO_ACTIVE = 'Deja al menos una opción activa.';
const TOO_MANY = `Máximo ${MAX_ITEMS} opciones.`;
const INVALID = 'El valor no es válido.';

const CODE_MESSAGES: Record<string, string> = {
  required: 'Ingresa un código.',
  'invalid-format':
    'Usa letras, números, guion o guion bajo, empezando con una letra minúscula.',
  duplicate: 'Este código ya existe.',
  'max-length': `Máximo ${MAX_CODE} caracteres.`,
  'code-removed': 'No se puede quitar un código que ya existía.',
};
const LABEL_MESSAGES: Record<string, string> = {
  required: 'Ingresa un nombre.',
  'max-length': `Máximo ${MAX_LABEL} caracteres.`,
};
const LIST_MESSAGES: Record<string, string> = {
  required: 'Agrega al menos una opción.',
  'no-active-item': NO_ACTIVE,
  'max-length': TOO_MANY,
  'code-removed': 'No se puede quitar una opción que ya existía: desactívala.',
};

/** The same rules as the API, so a mistake is explained before the request. */
export function validateRows(rows: readonly CatalogRow[]): CatalogErrors {
  const errors: CatalogErrors = { rows: {} };
  const codes = rows.map((row) => row.code.trim());

  rows.forEach((row, index) => {
    const found: RowErrors = {};
    const label = row.label.trim();
    if (!label) found.label = LABEL_MESSAGES['required'];
    else if (label.length > MAX_LABEL) found.label = LABEL_MESSAGES['max-length'];

    if (!codes[index]) found.code = CODE_MESSAGES['required'];
    else if (!CODE_PATTERN.test(codes[index])) found.code = CODE_MESSAGES['invalid-format'];
    else if (codes.indexOf(codes[index]) !== index || codes.lastIndexOf(codes[index]) !== index) {
      found.code = CODE_MESSAGES['duplicate'];
    }
    if (found.code || found.label) errors.rows[index] = found;
  });

  if (rows.length > MAX_ITEMS) errors.list = TOO_MANY;
  else if (!rows.some((row) => row.active)) errors.list = NO_ACTIVE;
  return errors;
}

export const hasErrors = (errors: CatalogErrors): boolean =>
  Object.keys(errors.rows).length > 0 || errors.list !== undefined;

/** The per-field reasons of a rejected `PUT /catalogs/<id>`, as Spanish messages by row position. */
export function serverErrors(fields: Readonly<Record<string, string>>): CatalogErrors {
  const errors: CatalogErrors = { rows: {} };
  for (const [name, reason] of Object.entries(fields)) {
    const match = /^items\.(\d+)\.(\w+)$/.exec(name);
    if (match) {
      const [index, field] = [Number(match[1]), match[2]];
      const row = (errors.rows[index] ??= {});
      if (field === 'code') row.code = CODE_MESSAGES[reason] ?? INVALID;
      else if (field === 'label') row.label = LABEL_MESSAGES[reason] ?? INVALID;
      else row.other = INVALID;
    } else {
      errors.list = name === 'items' ? (LIST_MESSAGES[reason] ?? INVALID) : INVALID;
    }
  }
  return errors;
}
