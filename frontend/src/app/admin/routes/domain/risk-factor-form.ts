import { SEVERITIES, Severity } from '../../../routes/domain/route';
import { SAME_DAY_MESSAGE, endFromInput, endToInput, isTimeInput, minutesOf } from './form-parsing';
import { RISK_FACTOR_TYPES, RiskFactor, RiskFactorInput, RiskFactorType } from './managed-route';

const MAX_DESCRIPTION = 200;
const BOTH_OR_NONE = 'Completa ambas horas o deja las dos vacías (todo el día).';
const INVALID_TIME = 'Elige una hora válida.';

/** The risk factor form. Blank times mean the factor applies all day. */
export interface RiskFactorForm {
  type: string;
  severity: string;
  description: string;
  startTime: string;
  endTime: string;
}

export type RiskFactorFormField = keyof RiskFactorForm;
export type RiskFactorFormErrors = Partial<Record<RiskFactorFormField, string>>;

export const EMPTY_RISK_FACTOR_FORM: RiskFactorForm = {
  type: '',
  severity: '',
  description: '',
  startTime: '',
  endTime: '',
};

export type RiskFactorFormResult =
  | { input: RiskFactorInput; errors?: undefined }
  | { input?: undefined; errors: RiskFactorFormErrors };

const isFactorType = (value: string): value is RiskFactorType =>
  (RISK_FACTOR_TYPES as readonly string[]).includes(value);
const isSeverity = (value: string): value is Severity =>
  (SEVERITIES as readonly string[]).includes(value);

/** Validates the form with the rules of the API and converts it into the body it expects. */
export function parseRiskFactorForm(form: RiskFactorForm): RiskFactorFormResult {
  const errors: RiskFactorFormErrors = {};
  if (!isFactorType(form.type)) errors.type = 'Elige el tipo de factor.';
  if (!isSeverity(form.severity)) errors.severity = 'Elige la severidad.';
  const description = form.description.trim();
  if (!description) errors.description = 'La descripción es obligatoria.';
  else if (description.length > MAX_DESCRIPTION) {
    errors.description = `La descripción admite máximo ${MAX_DESCRIPTION} caracteres.`;
  }

  const { startTime } = form;
  const endTime = endFromInput(form.endTime);
  if (startTime && !isTimeInput(startTime)) errors.startTime = INVALID_TIME;
  if (form.endTime && !isTimeInput(form.endTime)) errors.endTime = INVALID_TIME;
  if (!startTime && form.endTime) errors.startTime = BOTH_OR_NONE;
  if (startTime && !form.endTime) errors.endTime = BOTH_OR_NONE;
  if (
    !errors.startTime &&
    !errors.endTime &&
    startTime &&
    minutesOf(startTime) >= minutesOf(endTime)
  ) {
    errors.endTime = SAME_DAY_MESSAGE;
  }

  if (Object.keys(errors).length > 0 || !isFactorType(form.type) || !isSeverity(form.severity)) {
    return { errors };
  }
  const input: RiskFactorInput = { type: form.type, severity: form.severity, description };
  if (startTime) {
    input.startTime = startTime;
    input.endTime = endTime;
  }
  return { input };
}

/** The current values of a factor; a type the app does not know is shown as "other". */
export function toRiskFactorForm(factor: RiskFactor): RiskFactorForm {
  return {
    type: isFactorType(factor.type) ? factor.type : 'other',
    severity: factor.severity,
    description: factor.description,
    startTime: factor.startTime ?? '',
    endTime: factor.endTime ? endToInput(factor.endTime) : '',
  };
}
