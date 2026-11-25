import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import { Campo } from '../../core/entidades';

/** Casillas que el backend crea activas por omisión. */
const CASILLAS_ACTIVAS = new Set(['activo', 'activa', 'notificaciones']);

const validarJson: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = String(control.value ?? '').trim();
  if (!valor) {
    return null;
  }
  try {
    JSON.parse(valor);
    return null;
  } catch {
    return { json: true };
  }
};

const validarUrl: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = String(control.value ?? '').trim();
  return !valor || /^https?:\/\/\S+$/i.test(valor) ? null : { url: true };
};

const validarEntero: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = String(control.value ?? '').trim();
  return !valor || /^-?\d+$/.test(valor) ? null : { entero: true };
};

/** Validaciones del lado del cliente (el backend sigue siendo la fuente de verdad). */
export function validadores(campo: Campo): ValidatorFn[] {
  const lista: ValidatorFn[] = [];
  if (campo.requerido && campo.tipo !== 'checkbox') {
    lista.push(Validators.required);
  }
  if (campo.maxLength) {
    lista.push(Validators.maxLength(campo.maxLength));
  }
  if (campo.min !== undefined) {
    lista.push(Validators.min(campo.min));
  }
  if (campo.max !== undefined) {
    lista.push(Validators.max(campo.max));
  }
  if (campo.tipo === 'email') {
    lista.push(Validators.email);
  }
  if (campo.tipo === 'url') {
    lista.push(validarUrl);
  }
  if (campo.tipo === 'integer') {
    lista.push(validarEntero);
  }
  if (campo.tipo === 'json') {
    lista.push(validarJson);
  }
  return lista;
}

/** Valor del control a partir del dato del backend (o vacío al crear). */
export function valorInicial(campo: Campo, valor: unknown): string | boolean {
  if (campo.tipo === 'checkbox') {
    return valor === undefined ? CASILLAS_ACTIVAS.has(campo.nombre) : !!valor;
  }
  if (valor === null || valor === undefined) {
    return '';
  }
  switch (campo.tipo) {
    case 'datetime':
      return String(valor).slice(0, 16); // datetime-local: AAAA-MM-DDTHH:MM
    case 'time':
      return String(valor).slice(0, 5);
    case 'json':
      return JSON.stringify(valor, null, 2);
    default:
      return String(valor);
  }
}

export function crearFormulario(campos: Campo[], registro: Record<string, unknown> = {}): FormGroup {
  const controles: Record<string, FormControl> = {};
  for (const campo of campos) {
    controles[campo.nombre] = new FormControl(valorInicial(campo, registro[campo.nombre]), {
      nonNullable: true,
      validators: validadores(campo),
    });
  }
  return new FormGroup(controles);
}

/**
 * Convierte los valores del formulario al cuerpo JSON que espera Django REST.
 * Vacíos: FK y fechas opcionales → null; números y choices opcionales se omiten (usa el valor por
 * omisión del backend); textos opcionales → ''.
 */
export function construirCuerpo(campos: Campo[], valores: Record<string, unknown>): Record<string, unknown> {
  const cuerpo: Record<string, unknown> = {};
  for (const campo of campos) {
    const valor = valores[campo.nombre];
    if (campo.tipo === 'checkbox') {
      cuerpo[campo.nombre] = !!valor;
      continue;
    }
    const texto = String(valor ?? '').trim();
    if (!texto) {
      if (['fk', 'date', 'datetime'].includes(campo.tipo)) {
        cuerpo[campo.nombre] = null;
      } else if (['text', 'textarea', 'email', 'url'].includes(campo.tipo)) {
        cuerpo[campo.nombre] = '';
      }
      continue;
    }
    switch (campo.tipo) {
      case 'fk':
      case 'number':
      case 'integer':
        cuerpo[campo.nombre] = Number(texto);
        break;
      case 'json':
        cuerpo[campo.nombre] = JSON.parse(texto);
        break;
      default:
        cuerpo[campo.nombre] = texto;
    }
  }
  return cuerpo;
}

/** Mensaje en español para el primer error de validación del cliente. */
export function mensajeValidacion(campo: Campo, errores: ValidationErrors | null): string {
  if (!errores) {
    return '';
  }
  if (errores['required']) return 'Este campo es obligatorio.';
  if (errores['maxlength']) return `Máximo ${campo.maxLength} caracteres.`;
  if (errores['min']) return `Debe ser mayor o igual a ${campo.min}.`;
  if (errores['max']) return `Debe ser menor o igual a ${campo.max}.`;
  if (errores['email']) return 'Correo electrónico no válido.';
  if (errores['url']) return 'La URL debe empezar con http:// o https://.';
  if (errores['entero']) return 'Debe ser un número entero.';
  if (errores['json']) return 'JSON no válido.';
  return 'Valor no válido.';
}
