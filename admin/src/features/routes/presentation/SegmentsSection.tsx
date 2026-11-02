'use client';

import { useState, type FormEvent } from 'react';

import { callableErrorMessage } from '@/core/errors/errorMessages';
import { Button } from '@/core/ui/Button';
import { ConfirmDialog } from '@/core/ui/ConfirmDialog';
import { Alert, LoadingText } from '@/core/ui/feedback';
import { TextAreaField, TextField } from '@/core/ui/fields';

import { useDeleteSegment, useSaveSegment } from '../application/useRoutes';
import { formatWindow, type TimeSlot } from '../domain/schedule';
import {
  MAX_POINTS,
  MAX_SEGMENT_NAME,
  emptySegmentForm,
  parseSegmentForm,
  segmentToForm,
  type Segment,
  type SegmentFormErrors,
  type SegmentFormValues,
} from '../domain/segment';
import { RiskFactorsPanel } from './RiskFactorsPanel';
import { SafetyBadge, formatMeters } from './SafetyBadge';

interface SegmentFormProps {
  routeId: string;
  segment?: Segment;
  count: number;
  onDone(message: string): void;
  onCancel(): void;
}

function SegmentForm({ routeId, segment, count, onDone, onCancel }: SegmentFormProps) {
  const [values, setValues] = useState<SegmentFormValues>(segment ? segmentToForm(segment) : emptySegmentForm());
  const [errors, setErrors] = useState<SegmentFormErrors>({});
  const save = useSaveSegment();
  const update = (patch: Partial<SegmentFormValues>) => setValues((v) => ({ ...v, ...patch }));
  const maxPosition = segment ? count : count + 1;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseSegmentForm(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    try {
      await save.mutateAsync({ routeId, segmentId: segment?.id, input: parsed.value });
      onDone(segment ? `Tramo "${parsed.value.name}" actualizado.` : `Tramo "${parsed.value.name}" creado.`);
    } catch {
      // Rendered below.
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4">
      <h3 className="font-semibold text-ink">{segment ? `Editar tramo ${segment.name}` : 'Nuevo tramo'}</h3>
      {save.isError ? <Alert>{callableErrorMessage(save.error)}</Alert> : null}
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <TextField
          label="Nombre"
          value={values.name}
          maxLength={MAX_SEGMENT_NAME}
          error={errors.name}
          onChange={(e) => update({ name: e.target.value })}
        />
        <TextField
          label="Posición (opcional)"
          inputMode="numeric"
          placeholder={String(maxPosition)}
          value={values.position}
          error={errors.position}
          hint={segment ? `De 1 a ${count}.` : `Vacío lo agrega al final (posición ${maxPosition}).`}
          onChange={(e) => update({ position: e.target.value })}
        />
        <div className="md:col-span-2">
          <TextAreaField
            label="Coordenadas"
            rows={6}
            placeholder={'-3.99313, -79.20422\n-3.99510, -79.20190'}
            value={values.coordinates}
            error={errors.coordinates}
            hint={`Un punto por línea: "latitud, longitud". Mínimo 2 y máximo ${MAX_POINTS} puntos. La longitud del tramo se calcula sola.`}
            className="font-mono"
            onChange={(e) => update({ coordinates: e.target.value })}
          />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={save.isPending}>
          {segment ? 'Guardar tramo' : 'Crear tramo'}
        </Button>
      </div>
    </form>
  );
}

type Editing = { mode: 'create' } | { mode: 'edit'; segment: Segment } | null;

interface SegmentsSectionProps {
  routeId: string;
  segments: Segment[];
  slots: TimeSlot[];
  loading: boolean;
  error: unknown;
}

/** RF-05-4..6: ordered segments; the backend keeps the order contiguous and recalculates the index. */
export function SegmentsSection({ routeId, segments, slots, loading, error }: SegmentsSectionProps) {
  const remove = useDeleteSegment();
  const move = useSaveSegment();
  const [editing, setEditing] = useState<Editing>(null);
  const [toDelete, setToDelete] = useState<Segment | null>(null);
  const [openFactors, setOpenFactors] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function moveSegment(segment: Segment, to: number) {
    setNotice(null);
    try {
      await move.mutateAsync({
        routeId,
        segmentId: segment.id,
        input: { name: segment.name, coordinates: segment.coordinates, order: to },
      });
    } catch {
      // Rendered below.
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await remove.mutateAsync({ routeId, segmentId: toDelete.id });
      setNotice(`Tramo "${toDelete.name}" eliminado. Los demás tramos se reordenaron.`);
      setToDelete(null);
    } catch {
      // Shown in the dialog.
    }
  }

  return (
    <section aria-labelledby="segments-title" className="rounded-lg border border-line bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="segments-title" className="text-lg font-bold text-ink">
            Tramos
          </h2>
          <p className="text-sm text-muted">En orden de recorrido. Cada tramo tiene sus propios factores de riesgo.</p>
        </div>
        {editing ? null : (
          <Button
            onClick={() => {
              setNotice(null);
              setEditing({ mode: 'create' });
            }}
          >
            Nuevo tramo
          </Button>
        )}
      </div>

      {notice ? (
        <div className="mb-4">
          <Alert tone="success">{notice}</Alert>
        </div>
      ) : null}
      {move.isError ? (
        <div className="mb-4">
          <Alert>{callableErrorMessage(move.error)}</Alert>
        </div>
      ) : null}

      {editing ? (
        <div className="mb-4">
          <SegmentForm
            key={editing.mode === 'edit' ? editing.segment.id : 'new'}
            routeId={routeId}
            segment={editing.mode === 'edit' ? editing.segment : undefined}
            count={segments.length}
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
      {!loading && !error && segments.length === 0 ? <p className="text-sm text-muted">Aún no hay tramos.</p> : null}

      {segments.length > 0 ? (
        <ol className="divide-y divide-line">
          {segments.map((segment, index) => (
            <li key={segment.id} className="py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">
                    <span className="mr-2 text-muted tabular-nums">{index + 1}.</span>
                    {segment.name}
                  </p>
                  <p className="text-xs text-muted">
                    {formatMeters(segment.lengthM)} · {segment.coordinates.length} puntos
                  </p>
                  {slots.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-1" aria-label={`Nivel por franja de ${segment.name}`}>
                      {slots.map((slot) => {
                        const safety = segment.safety[slot.id];
                        return safety ? (
                          <li key={slot.id}>
                            <SafetyBadge level={safety.level} window={formatWindow(slot.startTime, slot.endTime)} />
                          </li>
                        ) : null;
                      })}
                    </ul>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    aria-label={`Subir ${segment.name}`}
                    disabled={index === 0 || move.isPending}
                    onClick={() => void moveSegment(segment, index - 1)}
                  >
                    Subir
                  </Button>
                  <Button
                    variant="secondary"
                    aria-label={`Bajar ${segment.name}`}
                    disabled={index === segments.length - 1 || move.isPending}
                    onClick={() => void moveSegment(segment, index + 1)}
                  >
                    Bajar
                  </Button>
                  <Button
                    variant="secondary"
                    aria-expanded={openFactors === segment.id}
                    aria-label={`Factores de riesgo de ${segment.name}`}
                    onClick={() => setOpenFactors((id) => (id === segment.id ? null : segment.id))}
                  >
                    Factores
                  </Button>
                  <Button
                    variant="secondary"
                    aria-label={`Editar ${segment.name}`}
                    onClick={() => {
                      setNotice(null);
                      setEditing({ mode: 'edit', segment });
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    aria-label={`Eliminar ${segment.name}`}
                    onClick={() => {
                      remove.reset();
                      setToDelete(segment);
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
              {openFactors === segment.id ? <RiskFactorsPanel routeId={routeId} segment={segment} /> : null}
            </li>
          ))}
        </ol>
      ) : null}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar tramo"
        confirmLabel="Eliminar"
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
      >
        <p>
          ¿Eliminar el tramo <strong>{toDelete?.name}</strong> y sus factores de riesgo? Los demás tramos se reordenan y se recalcula el
          nivel de la ruta.
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
