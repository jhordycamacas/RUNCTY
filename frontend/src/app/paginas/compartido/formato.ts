import { Campo } from '../../core/entidades';

/** Color de Ionic para cada nivel del índice de seguridad. */
export function colorNivel(nivel: unknown): string {
  switch (nivel) {
    case 'Alto':
      return 'success';
    case 'Medio':
      return 'warning';
    case 'Bajo':
      return 'danger';
    default:
      return 'medium';
  }
}

/** 'AAAA-MM-DD' → 'DD/MM/AAAA'. */
export function fechaCorta(valor: string): string {
  const [anio, mes, dia] = valor.slice(0, 10).split('-');
  return dia ? `${dia}/${mes}/${anio}` : valor;
}

/** ISO 8601 → 'DD/MM/AAAA HH:MM' (hora de pared tal como la envía el backend). */
export function fechaHoraCorta(valor: string): string {
  return `${fechaCorta(valor)} ${valor.slice(11, 16)}`.trim();
}

/** Valor de un campo como texto legible (choices por etiqueta, FK por nombre, booleanos Sí/No). */
export function textoCampo(campo: Campo, registro: Record<string, unknown>, nombreFk?: string): string {
  const valor = registro[campo.nombre];
  if (valor === null || valor === undefined || valor === '') {
    return '—';
  }
  switch (campo.tipo) {
    case 'checkbox':
      return valor ? 'Sí' : 'No';
    case 'select':
      return campo.opciones?.find((o) => o.valor === valor)?.etiqueta ?? String(valor);
    case 'fk':
      return nombreFk ?? String(registro[`${campo.nombre}_nombre`] ?? `#${valor}`);
    case 'date':
      return fechaCorta(String(valor));
    case 'datetime':
      return fechaHoraCorta(String(valor));
    case 'time':
      return String(valor).slice(0, 5);
    case 'json':
      return JSON.stringify(valor);
    default:
      return String(valor);
  }
}
