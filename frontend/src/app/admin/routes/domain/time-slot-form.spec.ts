import { TimeSlot } from './managed-route';
import {
  EMPTY_TIME_SLOT_FORM,
  TimeSlotForm,
  formatValidity,
  formatWindow,
  parseTimeSlotForm,
  slotName,
  toTimeSlotForm,
} from './time-slot-form';

const slot = (id: string, startTime: string, endTime: string, label: string | null = null) =>
  ({ id, label, startTime, endTime, validFrom: null, validTo: null }) satisfies TimeSlot;

const MORNING = slot('morning', '06:00', '09:00', 'Mañana');
const VALID: TimeSlotForm = {
  label: ' Tarde ',
  startTime: '18:00',
  endTime: '20:00',
  validFrom: '',
  validTo: '',
};

describe('parseTimeSlotForm', () => {
  it('builds the input and leaves out the optional fields that are blank', () => {
    expect(parseTimeSlotForm(VALID, []).input).toEqual({
      label: 'Tarde',
      startTime: '18:00',
      endTime: '20:00',
    });
    expect(parseTimeSlotForm({ ...VALID, label: ' ' }, []).input).toEqual({
      startTime: '18:00',
      endTime: '20:00',
    });
  });

  it('sends the validity dates when they are set', () => {
    const { input } = parseTimeSlotForm(
      { ...VALID, validFrom: '2026-01-01', validTo: '2026-12-31' },
      [],
    );

    expect(input).toMatchObject({ validFrom: '2026-01-01', validTo: '2026-12-31' });
  });

  it('reads an end at 00:00 as midnight, the end of the day', () => {
    expect(parseTimeSlotForm({ ...VALID, startTime: '21:00', endTime: '00:00' }, []).input).toEqual(
      { label: 'Tarde', startTime: '21:00', endTime: '24:00' },
    );
  });

  it('requires both times', () => {
    expect(parseTimeSlotForm(EMPTY_TIME_SLOT_FORM, []).errors).toEqual({
      startTime: 'Elige la hora de inicio.',
      endTime: 'Elige la hora de fin.',
    });
  });

  it('requires the start to be before the end on the same day', () => {
    const message = 'La hora de fin debe ser posterior a la de inicio (mismo día).';

    expect(
      parseTimeSlotForm({ ...VALID, startTime: '20:00', endTime: '18:00' }, []).errors,
    ).toEqual({ endTime: message });
    expect(
      parseTimeSlotForm({ ...VALID, startTime: '18:00', endTime: '18:00' }, []).errors,
    ).toEqual({ endTime: message });
  });

  it('rejects a slot that overlaps another one, naming it', () => {
    expect(
      parseTimeSlotForm({ ...VALID, startTime: '08:30', endTime: '10:00' }, [MORNING]).errors,
    ).toEqual({
      startTime: 'Se cruza con la franja 06:00 – 09:00 (Mañana). Ajusta las horas.',
    });
  });

  it('lets a slot start exactly where another one ends', () => {
    expect(
      parseTimeSlotForm({ ...VALID, startTime: '09:00', endTime: '10:00' }, [MORNING]).errors,
    ).toBeUndefined();
    expect(
      parseTimeSlotForm({ ...VALID, startTime: '05:00', endTime: '06:00' }, [MORNING]).errors,
    ).toBeUndefined();
  });

  it('applies the label limit and the date rules', () => {
    expect(
      parseTimeSlotForm(
        { ...VALID, label: 'a'.repeat(41), validFrom: '2026-02-30', validTo: 'mañana' },
        [],
      ).errors,
    ).toEqual({
      label: 'El nombre admite máximo 40 caracteres.',
      validFrom: 'Elige una fecha válida.',
      validTo: 'Elige una fecha válida.',
    });
    expect(
      parseTimeSlotForm({ ...VALID, validFrom: '2026-06-01', validTo: '2026-05-01' }, []).errors,
    ).toEqual({ validTo: 'La fecha final no puede ser anterior a la inicial.' });
  });
});

describe('toTimeSlotForm', () => {
  it('preloads a slot, showing an end at midnight as 00:00', () => {
    expect(
      toTimeSlotForm({
        id: 'night',
        label: null,
        startTime: '21:00',
        endTime: '24:00',
        validFrom: '2026-01-01',
        validTo: null,
      }),
    ).toEqual({
      label: '',
      startTime: '21:00',
      endTime: '00:00',
      validFrom: '2026-01-01',
      validTo: '',
    });
  });
});

describe('time slot texts', () => {
  it('formats a window, or the whole day when there is none', () => {
    expect(formatWindow('06:00', '09:00')).toBe('06:00 – 09:00');
    expect(formatWindow(null, null)).toBe('Todo el día');
  });

  it('names a slot by its window and its label', () => {
    expect(slotName(MORNING)).toBe('06:00 – 09:00 (Mañana)');
    expect(slotName(slot('x', '18:00', '20:00'))).toBe('18:00 – 20:00');
  });

  it('describes the validity dates', () => {
    const base = slot('x', '18:00', '20:00');

    expect(formatValidity(base)).toBeNull();
    expect(formatValidity({ ...base, validFrom: '2026-01-05' })).toBe(
      'Vigente desde el 05/01/2026',
    );
    expect(formatValidity({ ...base, validTo: '2026-12-31' })).toBe('Vigente hasta el 31/12/2026');
    expect(formatValidity({ ...base, validFrom: '2026-01-05', validTo: '2026-12-31' })).toBe(
      'Vigente del 05/01/2026 al 31/12/2026',
    );
  });
});
