import { useMemo, useState } from 'react';

import { listTimeSlots, pickDefaultSlot, type TimeSlotOption } from '../../domain/catalog';
import type { Ruta } from '../../domain/route';

export interface SlotSelection {
  slots: TimeSlotOption[];
  /** Selected window key, or null when the routes have no safety data. */
  slotKey: string | null;
  setSlotKey: (key: string) => void;
}

/**
 * Time slot shown by the catalog: the one the runner picked, else the one
 * matching the current or next recommended training slot.
 */
export function useSlotSelection(routes: readonly Ruta[], initialKey?: string | null): SlotSelection {
  const slots = useMemo(() => listTimeSlots(routes), [routes]);
  const [chosen, setChosen] = useState<string | null>(initialKey ?? null);
  const [now] = useState(() => new Date());
  const slotKey =
    chosen && slots.some((slot) => slot.key === chosen) ? chosen : (pickDefaultSlot(slots, now)?.key ?? null);

  return { slots, slotKey, setSlotKey: setChosen };
}
