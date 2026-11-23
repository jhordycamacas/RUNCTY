import {
  EMPTY_RISK_FACTOR_FORM,
  RiskFactorForm,
  parseRiskFactorForm,
  toRiskFactorForm,
} from './risk-factor-form';

const VALID: RiskFactorForm = {
  type: ' Iluminación deficiente ',
  severity: 'high',
  description: ' Postes apagados ',
  startTime: '',
  endTime: '',
};

describe('parseRiskFactorForm', () => {
  it('builds an all-day factor when no window is given', () => {
    expect(parseRiskFactorForm(VALID).input).toEqual({
      type: 'Iluminación deficiente',
      severity: 'high',
      description: 'Postes apagados',
    });
  });

  it('sends the window when both times are set, reading 00:00 as midnight', () => {
    expect(
      parseRiskFactorForm({ ...VALID, startTime: '18:00', endTime: '00:00' }).input,
    ).toMatchObject({ startTime: '18:00', endTime: '24:00' });
  });

  it('explains an empty form', () => {
    expect(parseRiskFactorForm(EMPTY_RISK_FACTOR_FORM).errors).toEqual({
      type: 'Escribe el tipo de factor, por ejemplo Iluminación deficiente.',
      severity: 'Elige la severidad.',
      description: 'La descripción es obligatoria.',
    });
  });

  it('asks for both times or none', () => {
    const message = 'Completa ambas horas o deja las dos vacías (todo el día).';

    expect(parseRiskFactorForm({ ...VALID, startTime: '18:00' }).errors).toEqual({
      endTime: message,
    });
    expect(parseRiskFactorForm({ ...VALID, endTime: '20:00' }).errors).toEqual({
      startTime: message,
    });
  });

  it('requires the window to start before it ends', () => {
    expect(parseRiskFactorForm({ ...VALID, startTime: '20:00', endTime: '18:00' }).errors).toEqual({
      endTime: 'La hora de fin debe ser posterior a la de inicio (mismo día).',
    });
  });

  it('applies the type and description limits and rejects an unknown severity', () => {
    expect(
      parseRiskFactorForm({
        ...VALID,
        type: 'a'.repeat(41),
        severity: 'extreme',
        description: 'a'.repeat(201),
      }).errors,
    ).toEqual({
      type: 'El tipo admite máximo 40 caracteres.',
      severity: 'Elige la severidad.',
      description: 'La descripción admite máximo 200 caracteres.',
    });
  });
});

describe('toRiskFactorForm', () => {

  it('preloads a factor with its window', () => {
    expect(
      toRiskFactorForm({
        id: 'f1',
        type: 'Tráfico',
        severity: 'medium',
        description: 'Cruce',
        startTime: '18:00',
        endTime: '24:00',
      }),
    ).toEqual({
      type: 'Tráfico',
      severity: 'medium',
      description: 'Cruce',
      startTime: '18:00',
      endTime: '00:00',
    });
  });

  it('keeps the stored type text as it is', () => {
    const form = toRiskFactorForm({
      id: 'f1',
      type: 'Perros sueltos',
      severity: 'low',
      description: 'x',
      startTime: null,
      endTime: null,
    });

    expect(form).toMatchObject({ type: 'Perros sueltos', startTime: '', endTime: '' });
  });
});
