import {
  EMPTY_RISK_FACTOR_FORM,
  RiskFactorForm,
  parseRiskFactorForm,
  toRiskFactorForm,
} from './risk-factor-form';

const VALID: RiskFactorForm = {
  type: 'poor_lighting',
  severity: 'high',
  description: ' Postes apagados ',
  startTime: '',
  endTime: '',
};

describe('parseRiskFactorForm', () => {
  it('builds an all-day factor when no window is given', () => {
    expect(parseRiskFactorForm(VALID).input).toEqual({
      type: 'poor_lighting',
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
      type: 'Elige el tipo de factor.',
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

  it('applies the description limit and rejects unknown values', () => {
    expect(
      parseRiskFactorForm({
        ...VALID,
        type: 'ufo',
        severity: 'extreme',
        description: 'a'.repeat(201),
      }).errors,
    ).toEqual({
      type: 'Elige el tipo de factor.',
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
        type: 'traffic',
        severity: 'medium',
        description: 'Cruce',
        startTime: '18:00',
        endTime: '24:00',
      }),
    ).toEqual({
      type: 'traffic',
      severity: 'medium',
      description: 'Cruce',
      startTime: '18:00',
      endTime: '00:00',
    });
  });

  it('reads a type the app does not know as "other", so it can still be saved', () => {
    const form = toRiskFactorForm({
      id: 'f1',
      type: 'meteor',
      severity: 'low',
      description: 'x',
      startTime: null,
      endTime: null,
    });

    expect(form).toMatchObject({ type: 'other', startTime: '', endTime: '' });
  });
});
