import { ChoiceGroup } from '@/core/ui';

import type { TimeSlotOption } from '../../domain/catalog';

interface SlotSelectorProps {
  slots: readonly TimeSlotOption[];
  value: string | null;
  onChange: (key: string) => void;
}

/** Chips to choose the time slot whose safety level is shown. */
export function SlotSelector({ slots, value, onChange }: SlotSelectorProps) {
  if (slots.length === 0) return null;
  return (
    <ChoiceGroup
      label="Franja horaria"
      options={slots.map((slot) => ({ value: slot.key, label: slot.label }))}
      value={value ? [value] : []}
      onChange={([next]) => {
        if (next) onChange(next);
      }}
    />
  );
}
