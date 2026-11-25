import { HttpErrorResponse } from '@angular/common/http';

/** Error de la API traducido para la interfaz: un mensaje general y mensajes por campo. */
export interface ErrorApi {
  status: number;
  general: string;
  campos: Record<string, string>;
}

export const MENSAJE_SIN_CONEXION =
  'Sin conexión con el backend. ¿Está en ejecución "python manage.py runserver 0.0.0.0:8000"?';
export const MENSAJE_NO_ENCONTRADO = 'El registro no existe o fue eliminado.';
export const MENSAJE_CONFLICTO = 'No se puede eliminar: hay otros registros que dependen de este.';
export const MENSAJE_REVISAR_CAMPOS = 'Revisa los campos marcados.';

/** Claves de DRF que no pertenecen a un campo concreto. */
const CLAVES_GENERALES = new Set(['non_field_errors', 'detail', '__all__']);

/** Aplana un valor de error de DRF (lista, texto u objeto anidado) a un texto. */
function aTexto(valor: unknown): string {
  if (valor === null || valor === undefined) {
    return '';
  }
  if (Array.isArray(valor)) {
    return valor.map(aTexto).filter(Boolean).join(' ');
  }
  if (typeof valor === 'object') {
    return Object.values(valor as Record<string, unknown>).map(aTexto).filter(Boolean).join(' ');
  }
  return String(valor);
}

/** Mensaje `detail` de una respuesta DRF, si existe. */
function detalle(cuerpo: unknown): string {
  if (cuerpo && typeof cuerpo === 'object' && 'detail' in cuerpo) {
    return aTexto((cuerpo as { detail: unknown }).detail);
  }
  return '';
}

/**
 * Traduce un error HTTP de Django REST a mensajes en español.
 * - 400 `{campo: [mensajes]}` → `campos[campo]`; `non_field_errors`/`detail` → `general`.
 * - 404 / 409 / sin red / 5xx → mensaje general.
 */
export function interpretarError(error: unknown): ErrorApi {
  if (!(error instanceof HttpErrorResponse)) {
    return { status: -1, general: 'Error inesperado.', campos: {} };
  }
  const { status } = error;
  const cuerpo: unknown = error.error;

  if (status === 0) {
    return { status, general: MENSAJE_SIN_CONEXION, campos: {} };
  }
  if (status === 400) {
    const campos: Record<string, string> = {};
    const generales: string[] = [];
    if (cuerpo && typeof cuerpo === 'object' && !Array.isArray(cuerpo)) {
      for (const [clave, valor] of Object.entries(cuerpo as Record<string, unknown>)) {
        const texto = aTexto(valor);
        if (CLAVES_GENERALES.has(clave)) {
          generales.push(texto);
        } else if (texto) {
          campos[clave] = texto;
        }
      }
    } else {
      generales.push(aTexto(cuerpo));
    }
    const general = generales.filter(Boolean).join(' ')
      || (Object.keys(campos).length ? MENSAJE_REVISAR_CAMPOS : 'Datos no válidos.');
    return { status, general, campos };
  }
  if (status === 404) {
    return { status, general: MENSAJE_NO_ENCONTRADO, campos: {} };
  }
  if (status === 409) {
    return { status, general: detalle(cuerpo) || MENSAJE_CONFLICTO, campos: {} };
  }
  if (status >= 500) {
    return { status, general: `Error del servidor (${status}). Intenta más tarde.`, campos: {} };
  }
  return { status, general: detalle(cuerpo) || `Error ${status} del servidor.`, campos: {} };
}

/** Solo el mensaje general (para avisos y estados de error de listados). */
export function mensajeError(error: unknown): string {
  return interpretarError(error).general;
}
