import {
  SettingsForm,
  changedSettings,
  levelsReadout,
  parseSettingsForm,
  reasonMessage,
  serverErrors,
  toSettingsForm,
} from './settings-form';
import { DEFAULT_SETTINGS } from '../../../core/settings/system-settings';

const defaults = (): SettingsForm => toSettingsForm(DEFAULT_SETTINGS);
const errorsOf = (changes: Partial<SettingsForm>) => parseSettingsForm({ ...defaults(), ...changes }).errors;

describe('settings form', () => {
  it('shows the defaults as text, the tolerance as a percentage', () => {
    const form = defaults();

    expect(form.penaltyHigh).toBe('35');
    expect(form.timeZone).toBe('America/Guayaquil');
    expect(form.safeRouteDistanceTolerance).toBe('20');
  });

  it('parses the defaults back into the same settings', () => {
    expect(parseSettingsForm(defaults()).settings).toEqual(DEFAULT_SETTINGS);
  });

  it('stores the tolerance as a fraction and reads decimals with a comma', () => {
    const { settings } = parseSettingsForm({
      ...defaults(),
      safeRouteDistanceTolerance: '12,5',
      distanceMinKm: ' 0,5 ',
      countryCode: ' pe ',
    });

    expect(settings?.safeRouteDistanceTolerance).toBe(0.125);
    expect(settings?.distanceMinKm).toBe(0.5);
    expect(settings?.countryCode).toBe('PE');
  });

  it('rejects an empty value and text where a number is expected', () => {
    expect(errorsOf({ penaltyLow: ' ' })?.penaltyLow).toBe('Ingresa un valor.');
    expect(errorsOf({ penaltyLow: 'abc' })?.penaltyLow).toBe('Ingresa un número entero, sin decimales.');
    expect(errorsOf({ penaltyLow: '1.5' })?.penaltyLow).toBe('Ingresa un número entero, sin decimales.');
    expect(errorsOf({ distanceMaxKm: '1,2,3' })?.distanceMaxKm).toBe('Ingresa un número, por ejemplo 0,5.');
    expect(errorsOf({ timeZone: '' })?.timeZone).toBe('Ingresa un valor.');
  });

  it('rejects values outside the bounds of the API', () => {
    expect(errorsOf({ penaltyHigh: '101' })?.penaltyHigh).toBe('Debe estar entre 0 y 100.');
    expect(errorsOf({ thresholdHigh: '0' })?.thresholdHigh).toBe('Debe estar entre 1 y 100.');
    expect(errorsOf({ segmentMaxPoints: '1' })?.segmentMaxPoints).toBe('Debe estar entre 2 y 2000.');
    expect(errorsOf({ distanceMinKm: '0' })?.distanceMinKm).toBe('Debe estar entre 0,1 y 500.');
    expect(errorsOf({ safeRouteDistanceTolerance: '0' })?.safeRouteDistanceTolerance).toBe(
      'Debe estar entre 1 y 100.',
    );
  });

  it('bounds the profile photo limits to 20-500 KB and 64-1024 px', () => {
    expect(errorsOf({ profilePhotoMaxKb: '19' })?.profilePhotoMaxKb).toBe('Debe estar entre 20 y 500.');
    expect(errorsOf({ profilePhotoMaxKb: '501' })?.profilePhotoMaxKb).toBe('Debe estar entre 20 y 500.');
    expect(errorsOf({ profilePhotoMaxPx: '63' })?.profilePhotoMaxPx).toBe('Debe estar entre 64 y 1024.');
    expect(errorsOf({ profilePhotoMaxPx: '1025' })?.profilePhotoMaxPx).toBe('Debe estar entre 64 y 1024.');
    expect(errorsOf({ profilePhotoMaxKb: '20', profilePhotoMaxPx: '1024' })).toBeUndefined();
  });

  it('accepts the bounds themselves', () => {
    expect(
      parseSettingsForm({ ...defaults(), segmentMaxPoints: '2', penaltyLow: '0', routeMaxDistanceKm: '1000' })
        .errors,
    ).toBeUndefined();
  });

  it('checks the order of penalties, thresholds, pace and distance', () => {
    expect(errorsOf({ penaltyMedium: '5' })?.penaltyMedium).toBe(
      'No puede ser menor que la penalización baja.',
    );
    expect(errorsOf({ penaltyHigh: '15' })?.penaltyHigh).toBe(
      'No puede ser menor que la penalización media.',
    );
    expect(errorsOf({ thresholdMedium: '70' })?.thresholdMedium).toBe(
      'Debe ser menor que el umbral del nivel Alto.',
    );
    expect(errorsOf({ paceMaxSecPerKm: '150' })?.paceMaxSecPerKm).toBe(
      'Debe ser mayor que el ritmo mínimo.',
    );
    expect(errorsOf({ distanceMaxKm: '1' })?.distanceMaxKm).toBe(
      'Debe ser mayor que la distancia mínima.',
    );
    expect(parseSettingsForm({ ...defaults(), penaltyMedium: '10' }).errors).toBeUndefined();
  });

  it('requires a country of two letters', () => {
    expect(errorsOf({ countryCode: 'ECU' })?.countryCode).toBe('Usa dos letras mayúsculas, por ejemplo EC.');
    expect(errorsOf({ countryCode: '1a' })?.countryCode).toBe('Usa dos letras mayúsculas, por ejemplo EC.');
  });

  it('maps every reason of the API to Spanish and ignores unknown fields', () => {
    expect(
      serverErrors({
        timeZone: 'invalid-time-zone',
        countryCode: 'invalid-country-code',
        penaltyMedium: 'must-not-be-below-previous',
        thresholdMedium: 'must-be-below-high',
        paceMaxSecPerKm: 'must-exceed-min',
        nearbyRadiusM: 'out-of-range',
        incidentWindowDays: 'required',
        segmentMaxPoints: 'invalid',
        ghost: 'invalid',
      }),
    ).toEqual({
      timeZone: 'No es una zona horaria válida. Ejemplo: America/Guayaquil.',
      countryCode: 'Usa dos letras mayúsculas, por ejemplo EC.',
      penaltyMedium: 'No puede ser menor que la penalización baja.',
      thresholdMedium: 'Debe ser menor que el umbral del nivel Alto.',
      paceMaxSecPerKm: 'Debe ser mayor que el ritmo mínimo.',
      nearbyRadiusM: 'Debe estar entre 1 y 10000.',
      incidentWindowDays: 'Ingresa un valor.',
      segmentMaxPoints: 'Ingresa un número entero, sin decimales.',
    });
    expect(reasonMessage('timeZone', 'something-new')).toBe('El valor no es válido.');
  });

  it('lists only what changed', () => {
    expect(changedSettings(DEFAULT_SETTINGS, DEFAULT_SETTINGS)).toEqual({});
    expect(
      changedSettings(DEFAULT_SETTINGS, { ...DEFAULT_SETTINGS, penaltyHigh: 50, countryCode: 'PE' }),
    ).toEqual({ penaltyHigh: 50, countryCode: 'PE' });
  });

  it('reads out the levels the thresholds give, or nothing while they are invalid', () => {
    expect(levelsReadout(defaults())).toBe('Alto desde 70, Medio desde 40, Bajo por debajo de 40');
    expect(levelsReadout({ ...defaults(), thresholdHigh: '80', thresholdMedium: '55' })).toBe(
      'Alto desde 80, Medio desde 55, Bajo por debajo de 55',
    );
    expect(levelsReadout({ ...defaults(), thresholdMedium: '' })).toBeNull();
    expect(levelsReadout({ ...defaults(), thresholdMedium: '70' })).toBeNull();
    expect(levelsReadout({ ...defaults(), thresholdHigh: '101' })).toBeNull();
  });
});
