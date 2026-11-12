import { TRAINING_SLOTS, getNextTrainingSlot } from './trainingSlots';

// Local time on purpose: slots follow the runner's wall clock.
const at = (hours: number, minutes = 0) => new Date(2026, 10, 2, hours, minutes);

describe('TRAINING_SLOTS', () => {
  it('are the fixed morning and evening windows', () => {
    expect(TRAINING_SLOTS).toEqual([
      { startHour: 5, endHour: 7 },
      { startHour: 18, endHour: 20 },
    ]);
  });
});

describe('getNextTrainingSlot', () => {
  it.each([
    [at(0, 30), 'Hoy 05:00', false, '05:00 – 07:00'],
    [at(4, 59), 'Hoy 05:00', false, '05:00 – 07:00'],
    [at(5, 0), 'Ahora', true, '05:00 – 07:00'],
    [at(6, 59), 'Ahora', true, '05:00 – 07:00'],
    [at(7, 0), 'Hoy 18:00', false, '18:00 – 20:00'],
    [at(12, 15), 'Hoy 18:00', false, '18:00 – 20:00'],
    [at(18, 0), 'Ahora', true, '18:00 – 20:00'],
    [at(19, 45), 'Ahora', true, '18:00 – 20:00'],
    [at(20, 0), 'Mañana 05:00', false, '05:00 – 07:00'],
    [at(23, 59), 'Mañana 05:00', false, '05:00 – 07:00'],
  ])('at %p it is %p', (now, label, isNow, rangeLabel) => {
    const next = getNextTrainingSlot(now);
    expect(next.label).toBe(label);
    expect(next.isNow).toBe(isNow);
    expect(next.rangeLabel).toBe(rangeLabel);
  });

  it('returns the concrete start and end of the slot', () => {
    const next = getNextTrainingSlot(at(21));
    expect(next.start).toEqual(new Date(2026, 10, 3, 5, 0));
    expect(next.end).toEqual(new Date(2026, 10, 3, 7, 0));
  });

  it('rolls over month boundaries for tomorrow', () => {
    const next = getNextTrainingSlot(new Date(2026, 10, 30, 22, 0));
    expect(next.start).toEqual(new Date(2026, 11, 1, 5, 0));
    expect(next.label).toBe('Mañana 05:00');
  });

  it('does not mutate the given date', () => {
    const now = at(21);
    getNextTrainingSlot(now);
    expect(now).toEqual(at(21));
  });
});
