import { HttpErrorResponse } from '@angular/common/http';

import {
  MENSAJE_CONFLICTO, MENSAJE_NO_ENCONTRADO, MENSAJE_REVISAR_CAMPOS, MENSAJE_SIN_CONEXION, interpretarError,
  mensajeError,
} from './errores';

const respuesta = (status: number, error: unknown) => new HttpErrorResponse({ status, error });

describe('interpretarError', () => {
  it('un 400 de DRF reparte los mensajes por campo', () => {
    const e = interpretarError(respuesta(400, {
      nombre: ['Este campo es requerido.'],
      distancia_km: ['Asegúrese de que este valor es mayor o igual a 0.1.', 'Otro mensaje.'],
    }));
    expect(e.status).toBe(400);
    expect(e.campos['nombre']).toBe('Este campo es requerido.');
    expect(e.campos['distancia_km']).toBe('Asegúrese de que este valor es mayor o igual a 0.1. Otro mensaje.');
    expect(e.general).toBe(MENSAJE_REVISAR_CAMPOS);
  });

  it('non_field_errors va al mensaje general', () => {
    const e = interpretarError(respuesta(400, { non_field_errors: ['El usuario ya valoró esta ruta.'] }));
    expect(e.general).toBe('El usuario ya valoró esta ruta.');
    expect(e.campos).toEqual({});
  });

  it('un 400 con cuerpo de lista se muestra como mensaje general', () => {
    expect(interpretarError(respuesta(400, ['Datos incompletos.'])).general).toBe('Datos incompletos.');
  });

  it('404 y 409 dan mensajes en español', () => {
    expect(mensajeError(respuesta(404, { detail: 'No Ruta matches the given query.' }))).toBe(MENSAJE_NO_ENCONTRADO);
    expect(mensajeError(respuesta(409, {}))).toBe(MENSAJE_CONFLICTO);
    expect(mensajeError(respuesta(409, { detail: 'Tiene tramos asociados.' }))).toBe('Tiene tramos asociados.');
  });

  it('sin red (status 0) avisa que el backend no responde', () => {
    expect(mensajeError(respuesta(0, null))).toBe(MENSAJE_SIN_CONEXION);
  });

  it('5xx y errores que no son HTTP', () => {
    expect(mensajeError(respuesta(500, 'boom'))).toBe('Error del servidor (500). Intenta más tarde.');
    expect(mensajeError(new Error('x'))).toBe('Error inesperado.');
  });
});
