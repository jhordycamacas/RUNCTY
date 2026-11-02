'use client';

import { useState, type FormEvent } from 'react';

import { callableErrorMessage } from '@/core/errors/errorMessages';
import { Button } from '@/core/ui/Button';
import { ConfirmDialog } from '@/core/ui/ConfirmDialog';
import { Alert, LoadingText } from '@/core/ui/feedback';
import { TextField } from '@/core/ui/fields';

import { useDeleteTimeSlot, useSaveTimeSlot } from '../application/useRoutes';
import {
  MAX_SLOT_LABEL,
  emptyTimeSlotForm,
  findOverlappingSlot,
  formatWindow,
  parseTimeSlotForm,
  timeSlotToForm,
  type TimeSlot,
  type TimeSlotFormErrors,
  type TimeSlotFormValues,
} from '../domain/schedule';

interface TimeSlotFormProps {
  routeId: string;
  slot?: TimeSlot;
  slots: TimeSlot[];
  onDone(message: string): void;
  onCancel(): void;
}

const slotName = (slot: TimeSlot) => slot.label ?? formatWindow(slot.startTime, slot.endTime);

function TimeSlotForm({ routeId, slot, slots, onDone, onCancel }: TimeSlotFormProps) {
  const [values, setValues] = useState<TimeSlotFormValues>(slot ? timeSlotToForm(slot) : emptyTimeSlotForm());
  const [errors, setErrors] = useState<TimeSlotFormErrors>({});
  const [overlap, setOverlap] = useState<string | null>(null);
  const save = useSaveTimeSlot();
  const update = (patch: Partial<TimeSlotFormValues>) => setValues((v) => ({ ...v, ...patch }));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseTimeSlotForm(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      setOverlap(null);
      return;
    }
    setErrors({});
    const clash = findOverlappingSlot(slots, parsed.value, slot?.id);
    if (clash) {
      setOverlap(
        `La franja ${formatWindow(parsed.value.startTime, parsed.value.endTime)} se cruza con "${slotName(clash)}" (${formatWindow(clash.startTime, clash.endTime)}). Las franjas no pueden solaparse; una puede empezar justo cuando termina la otra.`,
      );
      return;
    }
    setOverlap(null);
    try {
      await save.mutateAsync({ routeId, slotId: slot?.id, input: parsed.value });
      onDone(slot ? 'Franja actualizada.' : 'Franja creada.');
    } catch {
      // Rendered below.
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4">
      <h3 className="font-semibold text-ink">{slot ? `Editar franja ${slotName(slot)}` : 'Nueva franja horaria'}</h3>
      {overlap ? <Alert>{overlap}</Alert> : null}
      {save.isError ? <Alert>{callableErrorMessage(save.error)}</Alert> : null}
      <div className="grid gap-4 md:grid-cols-3">
        <TextField
          label="Nombre (opcional)"
          placeholder="Mañana"
          value={values.label}
          maxLength={MAX_SLOT_LABEL}
          error={errors.label}
          onChange={(e) => update({ label: e.target.value })}
        />
        <TextField
          label="Hora de inicio"
          placeholder="06:00"
          inputMode="numeric"
          value={values.startTime}
          error={errors.startTime}
          hint="Formato HH:MM."
          onChange={(e) => update({ startTime: e.target.value })}
        />
        <TextField
          label="Hora de fin"
          placeholder="09:00"
          inputMode="numeric"
          value={values.endTime}
          error={errors.endTime}
          hint="Formato HH:MM; usa 24:00 para medianoche."
          onChange={(e) => update({ endTime: e.target.value })}
        />
        <TextField
          label="Vigente desde (opcional)"
          placeholder="2026-01-01"
          value={values.validFrom}
          error={errors.validFrom}
          hint="AAAA-MM-DD"
          onChange={(e) => update({ validFrom: e.target.value })}
        />
        <TextField
          label="Vigente hasta (opcional)"
          placeholder="2026-12-31"
          value={values.validTo}
          error={errors.validTo}
          hint="AAAA-MM-DD"
          onChange={(e) => update({ validTo: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={save.isPending}>
          {slot ? 'Guardar franja' : 'Crear franja'}
        </Button>
      </div>
    </form>
  );
}

type Editing = { mode: 'create' } | { mode: 'edit'; slot: TimeSlot } | null;

/** RF-07: time slots of a route; every change recalculates the safety index. */
export function TimeSlotsSection({ routeId, slots, loading, error }: { routeId: string; slots: TimeSlot[]; loading: boolean; error: unknown }) {
  const remove = useDeleteTimeSlot();
  const [editing, setEditing] = useState<Editing>(null);
  const [toDelete, setToDelete] = useState<TimeSlot | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await remove.mutateAsync({ routeId, slotId: toDelete.id });
      setNotice('Franja eliminada.');
      setToDelete(null);
    } catch {
      // Shown in the dialog.
    }
  }

  return (
    <section aria-labelledby="slots-title" className="rounded-lg border border-line bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="slots-title" className="text-lg font-bold text-ink">
            Franjas horarias
          </h2>
          <p className="text-sm text-muted">El nivel de la ruta se calcula por cada franja. No pueden solaparse.</p>
        </div>
        {editing ? null : (
          <Button
            onClick={() => {
              setNotice(null);
              setEditing({ mode: 'create' });
            }}
          >
            Nueva franja
          </Button>
        )}
      </div>

      {notice ? (
        <div className="mb-4">
          <Alert tone="success">{notice}</Alert>
        </div>
      ) : null}

      {editing ? (
        <div className="mb-4">
          <TimeSlotForm
            key={editing.mode === 'edit' ? editing.slot.id : 'new'}
            routeId={routeId}
            slot={editing.mode === 'edit' ? editing.slot : undefined}
            slots={slots}
            onCancel={() => setEditing(null)}
            onDone={(message) => {
              setEditing(null);
              setNotice(message);
            }}
          />
        </div>
      ) : null}

      {loading ? <LoadingText /> : null}
      {error ? <Alert>{callableErrorMessage(error)}</Alert> : null}
      {!loading && !error && slots.length === 0 ? (
        <p className="text-sm text-muted">Aún no hay franjas. Sin franjas no se calcula el nivel de la ruta.</p>
      ) : null}

      {slots.length > 0 ? (
        <ul className="divide-y divide-line">
          {slots.map((slot) => (
            <li key={slot.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium tabular-nums text-ink">
                  {formatWindow(slot.startTime, slot.endTime)}
                  {slot.label ? <span className="ml-2 font-normal text-muted">{slot.label}</span> : null}
                </p>
                {slot.validFrom || slot.validTo ? (
                  <p className="text-xs text-muted">
                    Vigente {slot.validFrom ? `desde ${slot.validFrom}` : ''} {slot.validTo ? `hasta ${slot.validTo}` : ''}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  aria-label={`Editar franja ${slotName(slot)}`}
                  onClick={() => {
                    setNotice(null);
                    setEditing({ mode: 'edit', slot });
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  aria-label={`Eliminar franja ${slotName(slot)}`}
                  onClick={() => {
                    remove.reset();
                    setToDelete(slot);
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar franja"
        confirmLabel="Eliminar"
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
      >
        <p>
          ¿Eliminar la franja <strong>{toDelete ? slotName(toDelete) : ''}</strong>? Se recalculará el nivel de la ruta.
        </p>
        {remove.isError ? (
          <div className="mt-3">
            <Alert>{callableErrorMessage(remove.error)}</Alert>
          </div>
        ) : null}
      </ConfirmDialog>
    </section>
  );
}
