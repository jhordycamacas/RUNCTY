import { DEFAULT_SETTINGS } from '../../../core/settings/system-settings';
import { segment } from '../../../routes/domain/testing/fixtures';
import { EMPTY_SEGMENT_FORM, parseSegmentForm, toSegmentForm } from './segment-form';

const POINTS = '-3.99313, -79.20422\n-3.9951, -79.2019';

describe('parseSegmentForm', () => {
  it('builds the input without order when the position is blank', () => {
    expect(parseSegmentForm({ name: ' Orilla ', position: '', coordinates: POINTS }).input).toEqual(
      {
        name: 'Orilla',
        coordinates: [
          { lat: -3.99313, lng: -79.20422 },
          { lat: -3.9951, lng: -79.2019 },
        ],
      },
    );
  });

  it('turns the 1-based position into the 0-based order of the API', () => {
    const { input } = parseSegmentForm({ name: 'Orilla', position: ' 3 ', coordinates: POINTS });

    expect(input?.order).toBe(2);
  });

  it('accepts spaces, blank lines and "lat; lng" with decimal commas', () => {
    const { input } = parseSegmentForm({
      name: 'Orilla',
      position: '',
      coordinates: '-3,99 ; -79,2\n\n  -3.98 -79.21  \n',
    });

    expect(input?.coordinates).toEqual([
      { lat: -3.99, lng: -79.2 },
      { lat: -3.98, lng: -79.21 },
    ]);
  });

  it('explains an empty form', () => {
    expect(parseSegmentForm(EMPTY_SEGMENT_FORM).errors).toEqual({
      name: 'El nombre es obligatorio.',
      coordinates: 'Ingresa al menos 2 puntos, uno por línea.',
    });
  });

  it('names the line that is not a valid point', () => {
    const lines = ['-3.99, -79.2', 'abc', '-3.98, -79.21'].join('\n');

    expect(parseSegmentForm({ name: 'Orilla', position: '', coordinates: lines }).errors).toEqual({
      coordinates:
        'Línea 2: escribe "latitud, longitud" (latitud entre -90 y 90, longitud entre -180 y 180).',
    });
    expect(
      parseSegmentForm({ name: 'Orilla', position: '', coordinates: '-91, 0\n0, 0' }).errors
        ?.coordinates,
    ).toContain('Línea 1');
  });

  it('applies the limits of the API', () => {
    const tooMany = Array.from({ length: 501 }, () => '0, 0').join('\n');

    expect(
      parseSegmentForm({ name: 'a'.repeat(81), position: '0', coordinates: tooMany }).errors,
    ).toEqual({
      name: 'El nombre admite máximo 80 caracteres.',
      position: 'La posición debe ser un número entero desde 1.',
      coordinates: 'Un tramo admite máximo 500 puntos.',
    });
    expect(
      parseSegmentForm({ name: 'Orilla', position: '1.5', coordinates: POINTS }).errors?.position,
    ).toBe('La posición debe ser un número entero desde 1.');
  });
});

describe('parseSegmentForm with the limits of the system settings', () => {
  const limits = { ...DEFAULT_SETTINGS, routeNameMaxLength: 10, segmentMaxPoints: 3 };

  it('limits the name and the number of points to the configured values', () => {
    const { errors } = parseSegmentForm(
      { name: 'Nombre muy largo', position: '', coordinates: ['1, 1', '2, 2', '3, 3', '4, 4'].join(String.fromCharCode(10)) },
      limits,
    );

    expect(errors).toEqual({
      name: 'El nombre admite máximo 10 caracteres.',
      coordinates: 'Un tramo admite máximo 3 puntos.',
    });
  });

  it('accepts as many points as the setting allows, above the default', () => {
    const lines = Array.from({ length: 600 }, (_, i) => `${i / 100}, ${i / 100}`).join(String.fromCharCode(10));

    expect(
      parseSegmentForm(
        { name: 'Largo', position: '', coordinates: lines },
        { ...DEFAULT_SETTINGS, segmentMaxPoints: 600 },
      ).errors,
    ).toBeUndefined();
  });
});

describe('toSegmentForm', () => {
  it('preloads the name, the 1-based position and one point per line', () => {
    const form = toSegmentForm(
      segment('s1', {
        name: 'Orilla',
        order: 1,
        coordinates: [
          { lat: -3.99, lng: -79.2 },
          { lat: -3.98, lng: -79.21 },
        ],
      }),
    );

    expect(form).toEqual({
      name: 'Orilla',
      position: '2',
      coordinates: '-3.99, -79.2\n-3.98, -79.21',
    });
    expect(parseSegmentForm(form).input?.order).toBe(1);
  });
});
