/**
 * Recommended training time slots. Fixed for now (05:00-07:00 and 18:00-20:00); hours are local
 * wall-clock time, end exclusive.
 */
export interface TrainingSlot {
  startHour: number;
  endHour: number;
}

export const TRAINING_SLOTS: readonly TrainingSlot[] = [
  { startHour: 5, endHour: 7 },
  { startHour: 18, endHour: 20 },
];

export interface UpcomingTrainingSlot {
  slot: TrainingSlot;
  start: Date;
  end: Date;
  /** True when `now` is inside the slot. */
  isNow: boolean;
  /** "Ahora", "Hoy 18:00" or "Mañana 05:00". */
  label: string;
  /** "05:00 – 07:00". */
  rangeLabel: string;
}

const hh = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

function atHour(day: Date, hour: number, dayOffset = 0): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + dayOffset, hour, 0, 0, 0);
}

/** The slot in progress at `now`, or the next one (today or tomorrow). */
export function getNextTrainingSlot(
  now: Date,
  slots: readonly TrainingSlot[] = TRAINING_SLOTS,
): UpcomingTrainingSlot {
  const ordered = [...slots].sort((a, b) => a.startHour - b.startHour);
  const time = now.getTime();

  for (const slot of ordered) {
    const start = atHour(now, slot.startHour);
    const end = atHour(now, slot.endHour);
    if (time < end.getTime()) {
      const isNow = time >= start.getTime();
      return {
        slot,
        start,
        end,
        isNow,
        label: isNow ? 'Ahora' : `Hoy ${hh(slot.startHour)}`,
        rangeLabel: `${hh(slot.startHour)} – ${hh(slot.endHour)}`,
      };
    }
  }

  const first = ordered[0];
  return {
    slot: first,
    start: atHour(now, first.startHour, 1),
    end: atHour(now, first.endHour, 1),
    isNow: false,
    label: `Mañana ${hh(first.startHour)}`,
    rangeLabel: `${hh(first.startHour)} – ${hh(first.endHour)}`,
  };
}
