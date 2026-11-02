import { describe, expect, it } from 'vitest';

import {
  emptyRiskFactorForm,
  emptyTimeSlotForm,
  factorTypeLabel,
  findOverlappingSlot,
  formatWindow,
  parseRiskFactorForm,
  parseTimeSlotForm,
  severityLabel,
  type RiskFactorFormValues,
} from './schedule';

describe('parseTimeSlotForm', () => {
  it('builds the payload omitting empty optional fields', () => {
    expect(parseTimeSlotForm({ ...emptyTimeSlotForm(), startTime: '06:00', endTime: '09:00' })).toEqual({
      ok: true,
      value: { startTime: '06:00', endTime: '09:00' },
    });
    expect(
      parseTimeSlotForm({ label: ' Noche ', startTime: '19:00', endTime: '24:00', validFrom: '2026-01-01', validTo: '2026-12-31' }),
    ).toEqual({
      ok: true,
      value: { label: 'Noche', startTime: '19:00', endTime: '24:00', validFrom: '2026-01-01', validTo: '2026-12-31' },
    });
  });

  it('rejects malformed times and a start that is not before the end', () => {
    const bad = parseTimeSlotForm({ ...emptyTimeSlotForm(), startTime: '24:00', endTime: '7:00' });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.errors.startTime).toMatch(/HH:MM/);
      expect(bad.errors.endTime).toMatch(/HH:MM/);
    }
    const reversed = parseTimeSlotForm({ ...emptyTimeSlotForm(), startTime: '10:00', endTime: '09:00' });
    expect(!reversed.ok && reversed.errors.endTime).toMatch(/después/);
  });

  it('validates the label length and the dates', () => {
    const result = parseTimeSlotForm({
      label: 'x'.repeat(41),
      startTime: '06:00',
      endTime: '09:00',
      validFrom: '2026-02-30',
      validTo: '',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.label).toMatch(/40/);
      expect(result.errors.validFrom).toMatch(/AAAA-MM-DD/);
    }
    const range = parseTimeSlotForm({ label: '', startTime: '06:00', endTime: '09:00', validFrom: '2026-05-01', validTo: '2026-01-01' });
    expect(!range.ok && range.errors.validTo).toMatch(/anterior/);
  });
});

describe('findOverlappingSlot', () => {
  const slots = [
    { id: 'a', label: 'Mañana', startTime: '06:00', endTime: '09:00' },
    { id: 'b', startTime: '18:00', endTime: '21:00' },
  ];

  it('treats windows as half-open', () => {
    expect(findOverlappingSlot(slots, { startTime: '09:00', endTime: '12:00' })).toBeUndefined();
    expect(findOverlappingSlot(slots, { startTime: '08:00', endTime: '10:00' })?.id).toBe('a');
  });

  it('ignores the slot being edited', () => {
    expect(findOverlappingSlot(slots, { startTime: '05:00', endTime: '09:30' }, 'a')).toBeUndefined();
  });
});

describe('parseRiskFactorForm', () => {
  const base: RiskFactorFormValues = {
    ...emptyRiskFactorForm(),
    type: 'poor_lighting',
    severity: 'high',
    description: ' Sin postes ',
  };

  it('builds the payload without a window', () => {
    expect(parseRiskFactorForm(base)).toEqual({
      ok: true,
      value: { type: 'poor_lighting', severity: 'high', description: 'Sin postes' },
    });
  });

  it('includes a complete window', () => {
    expect(parseRiskFactorForm({ ...base, startTime: '18:00', endTime: '24:00' })).toEqual({
      ok: true,
      value: { type: 'poor_lighting', severity: 'high', description: 'Sin postes', startTime: '18:00', endTime: '24:00' },
    });
  });

  it('requires both window bounds or none, and a description', () => {
    const result = parseRiskFactorForm({ ...base, description: '', startTime: '18:00' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.description).toBeDefined();
      expect(result.errors.endTime).toMatch(/ambas/);
    }
    const long = parseRiskFactorForm({ ...base, description: 'a'.repeat(201) });
    expect(!long.ok && long.errors.description).toMatch(/200/);
  });
});

describe('schedule labels', () => {
  it('labels factor types and severities in Spanish', () => {
    expect(factorTypeLabel('isolated_area')).toBe('Zona solitaria');
    expect(factorTypeLabel('unknown')).toBe('Otro');
    expect(severityLabel('medium')).toBe('Media');
  });

  it('formats a window', () => {
    expect(formatWindow('06:00', '09:00')).toBe('06:00–09:00');
    expect(formatWindow(undefined, undefined)).toBe('Todo el día');
  });
});
