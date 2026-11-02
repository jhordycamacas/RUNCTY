'use client';

import { useState, type FormEvent } from 'react';

import { callableErrorMessage } from '@/core/errors/errorMessages';
import { Button } from '@/core/ui/Button';
import { ConfirmDialog } from '@/core/ui/ConfirmDialog';
import { Alert, Badge, LoadingText } from '@/core/ui/feedback';
import { SelectField, TextField } from '@/core/ui/fields';

import { useDeleteRiskFactor, useRiskFactors, useSaveRiskFactor } from '../application/useRoutes';
import type { Severity } from '../domain/route';
import {
  MAX_FACTOR_DESCRIPTION,
  RISK_FACTOR_TYPES,
  SEVERITIES,
  emptyRiskFactorForm,
  factorTypeLabel,
  formatWindow,
  parseRiskFactorForm,
  riskFactorToForm,
  severityLabel,
  type RiskFactor,
  type RiskFactorFormErrors,
  type RiskFactorFormValues,
  type RiskFactorType,
} from '../domain/schedule';
import type { Segment } from '../domain/segment';
import { SEVERITY_TONE } from './SafetyBadge';

interface RiskFactorFormProps {
  routeId: string;
  segmentId: string;
  factor?: RiskFactor;
  onDone(message: string): void;
  onCancel(): void;
}

function RiskFactorForm({ routeId, segmentId, factor, onDone, onCancel }: RiskFactorFormProps) {
  const [values, setValues] = useState<RiskFactorFormValues>(factor ? riskFactorToForm(factor) : emptyRiskFactorForm());
  const [errors, setErrors] = useState<RiskFactorFormErrors>({});
  const save = useSaveRiskFactor();
  const update = (patch: Partial<RiskFactorFormValues>) => setValues((v) => ({ ...v, ...patch }));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseRiskFactorForm(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    try {
      await save.mutateAsync({ routeId, segmentId, factorId: factor?.id, input: parsed.value });
      onDone(factor ? 'Factor de riesgo actualizado.' : 'Factor de riesgo creado.');
    } catch {
      // Rendered below.
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-md border border-line bg-white p-4">
      <h4 className="font-semibold text-ink">{factor ? 'Editar factor de riesgo' : 'Nuevo factor de riesgo'}</h4>
      {save.isError ? <Alert>{callableErrorMessage(save.error)}</Alert> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Tipo"
          value={values.type}
          error={errors.type}
          onChange={(e) => update({ type: e.target.value as RiskFactorType })}
          options={RISK_FACTOR_TYPES.map((t) => ({ value: t, label: factorTypeLabel(t) }))}
        />
        <SelectField
          label="Severidad"
          value={values.severity}
          error={errors.severity}
          hint="Baja resta 10 puntos, media 20 y alta 35."
          onChange={(e) => update({ severity: e.target.value as Severity })}
          options={SEVERITIES.map((s) => ({ value: s, label: severityLabel(s) }))}
        />
        <div className="md:col-span-2">
          <TextField
            label="Descripción"
            value={values.description}
            maxLength={MAX_FACTOR_DESCRIPTION}
            error={errors.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        </div>
        <TextField
          label="Desde (opcional)"
          placeholder="18:00"
          inputMode="numeric"
          value={values.startTime}
          error={errors.startTime}
          hint="HH:MM. Vacío = todo el día."
          onChange={(e) => update({ startTime: e.target.value })}
        />
        <TextField
          label="Hasta (opcional)"
          placeholder="24:00"
          inputMode="numeric"
          value={values.endTime}
          error={errors.endTime}
          hint="HH:MM; usa 24:00 para medianoche."
          onChange={(e) => update({ endTime: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={save.isPending}>
          {factor ? 'Guardar factor' : 'Crear factor'}
        </Button>
      </div>
    </form>
  );
}

type Editing = { mode: 'create' } | { mode: 'edit'; factor: RiskFactor } | null;

/** RF-07: risk factors of one segment ("tramo"). */
export function RiskFactorsPanel({ routeId, segment }: { routeId: string; segment: Segment }) {
  const factors = useRiskFactors(routeId, segment.id);
  const remove = useDeleteRiskFactor();
  const [editing, setEditing] = useState<Editing>(null);
  const [toDelete, setToDelete] = useState<RiskFactor | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await remove.mutateAsync({ routeId, segmentId: segment.id, factorId: toDelete.id });
      setNotice('Factor de riesgo eliminado.');
      setToDelete(null);
    } catch {
      // Shown in the dialog.
    }
  }

  return (
    <div className="mt-3 rounded-md border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-ink">Factores de riesgo de {segment.name}</h4>
        {editing ? null : (
          <Button
            variant="secondary"
            onClick={() => {
              setNotice(null);
              setEditing({ mode: 'create' });
            }}
          >
            Nuevo factor
          </Button>
        )}
      </div>

      {notice ? (
        <div className="mb-3">
          <Alert tone="success">{notice}</Alert>
        </div>
      ) : null}

      {editing ? (
        <div className="mb-3">
          <RiskFactorForm
            key={editing.mode === 'edit' ? editing.factor.id : 'new'}
            routeId={routeId}
            segmentId={segment.id}
            factor={editing.mode === 'edit' ? editing.factor : undefined}
            onCancel={() => setEditing(null)}
            onDone={(message) => {
              setEditing(null);
              setNotice(message);
            }}
          />
        </div>
      ) : null}

      {factors.isPending ? <LoadingText /> : null}
      {factors.isError ? <Alert>{callableErrorMessage(factors.error)}</Alert> : null}
      {factors.isSuccess && factors.data.length === 0 ? <p className="text-sm text-muted">Este tramo no tiene factores de riesgo.</p> : null}

      {factors.isSuccess && factors.data.length > 0 ? (
        <ul className="divide-y divide-line">
          {factors.data.map((factor) => (
            <li key={factor.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
              <div>
                <p className="text-sm font-medium text-ink">
                  {factorTypeLabel(factor.type)}{' '}
                  <Badge tone={SEVERITY_TONE[factor.severity]}>Severidad {severityLabel(factor.severity).toLowerCase()}</Badge>{' '}
                  <span className="text-xs font-normal tabular-nums text-muted">{formatWindow(factor.startTime, factor.endTime)}</span>
                </p>
                <p className="text-sm text-muted">{factor.description}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  aria-label={`Editar factor ${factorTypeLabel(factor.type)}`}
                  onClick={() => {
                    setNotice(null);
                    setEditing({ mode: 'edit', factor });
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  aria-label={`Eliminar factor ${factorTypeLabel(factor.type)}`}
                  onClick={() => {
                    remove.reset();
                    setToDelete(factor);
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
        title="Eliminar factor de riesgo"
        confirmLabel="Eliminar"
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
      >
        <p>
          ¿Eliminar el factor <strong>{toDelete ? factorTypeLabel(toDelete.type) : ''}</strong> de {segment.name}? Se recalculará el
          nivel de la ruta.
        </p>
        {remove.isError ? (
          <div className="mt-3">
            <Alert>{callableErrorMessage(remove.error)}</Alert>
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
