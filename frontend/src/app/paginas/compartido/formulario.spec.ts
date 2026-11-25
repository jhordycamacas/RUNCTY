import { ENTIDADES } from '../../core/entidades';
import { construirCuerpo, crearFormulario, mensajeValidacion, valorInicial } from './formulario';

describe('formulario genérico', () => {
  const campos = ENTIDADES.entrenamientos.campos.filter((c) => !c.soloLectura);

  it('convierte números, FK y JSON; vacíos opcionales a null u omitidos', () => {
    const cuerpo = construirCuerpo(campos, {
      usuario: '3', ruta: '', fecha_inicio: '2026-11-20T06:00', fecha_fin: '2026-11-20T06:40',
      distancia_km: '5.5', calorias: '', puntos_gps: '[{"lat": -3.99}]', notas: '',
    });
    expect(cuerpo).toEqual({
      usuario: 3, ruta: null, fecha_inicio: '2026-11-20T06:00', fecha_fin: '2026-11-20T06:40',
      distancia_km: 5.5, puntos_gps: [{ lat: -3.99 }], notas: '',
    });
  });

  it('al editar adapta fecha-hora, hora y JSON del backend a los controles', () => {
    const fechaHora = campos.find((c) => c.nombre === 'fecha_inicio')!;
    expect(valorInicial(fechaHora, '2026-11-20T06:00:00-05:00')).toBe('2026-11-20T06:00');
    expect(valorInicial(campos.find((c) => c.nombre === 'puntos_gps')!, [1])).toBe('[\n  1\n]');
  });

  it('valida obligatorios, rangos y JSON en el cliente', () => {
    const form = crearFormulario(campos);
    form.patchValue({ distancia_km: '0', puntos_gps: '{mal' });
    const distancia = campos.find((c) => c.nombre === 'distancia_km')!;
    expect(mensajeValidacion(distancia, form.get('distancia_km')!.errors)).toBe('Debe ser mayor o igual a 0.01.');
    expect(form.get('puntos_gps')!.hasError('json')).toBe(true);
    expect(form.get('usuario')!.hasError('required')).toBe(true);
  });
});
