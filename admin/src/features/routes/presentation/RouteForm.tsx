'use client';

import { useState, type FormEvent } from 'react';

import { callableErrorMessage } from '@/core/errors/errorMessages';
import { Button } from '@/core/ui/Button';
import { Alert } from '@/core/ui/feedback';
import { CheckboxField, SelectField, TextAreaField, TextField } from '@/core/ui/fields';
import { useCityOptions } from '@/features/cities/application/useCities';

import { useSaveRoute } from '../application/useRoutes';
import {
  DIFFICULTIES,
  MAX_POINT_LABEL,
  MAX_ROUTE_DESCRIPTION,
  MAX_ROUTE_NAME,
  SURFACES,
  difficultyLabel,
  emptyRouteForm,
  parseRouteForm,
  routeToForm,
  surfaceLabel,
  type Difficulty,
  type Ruta,
  type RouteFormErrors,
  type RouteFormValues,
  type Surface,
} from '../domain/route';

interface RouteFormProps {
  route?: Ruta;
  onDone(message: string, createdId?: string): void;
  onCancel(): void;
}

/** RF-05-1/2: create or edit a route. Coordinates are typed (no map yet). */
export function RouteForm({ route, onDone, onCancel }: RouteFormProps) {
  const isNew = !route;
  const [values, setValues] = useState<RouteFormValues>(route ? routeToForm(route) : emptyRouteForm());
  const [errors, setErrors] = useState<RouteFormErrors>({});
  const cities = useCityOptions();
  const save = useSaveRoute();

  const update = (patch: Partial<RouteFormValues>) => setValues((v) => ({ ...v, ...patch }));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseRouteForm(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    try {
      const result = await save.mutateAsync({ id: route?.id, input: parsed.value });
      const createdId = isNew ? result.id : undefined;
      onDone(isNew ? `"${parsed.value.name}" creada.` : `"${parsed.value.name}" actualizada.`, createdId);
    } catch {
      // Rendered below.
    }
  }

  const cityOptions = cities.data ?? [];
  // Keep the current city selectable even if the options have not loaded or it was removed.
  const knownCity = values.cityId === '' || cityOptions.some((c) => c.id === values.cityId);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-lg border border-line bg-white p-6">
      <h2 className="text-lg font-bold text-ink">{isNew ? 'Nueva ruta' : `Editar: ${route.name}`}</h2>
      {save.isError ? <Alert>{callableErrorMessage(save.error)}</Alert> : null}
      {cities.isError ? <Alert>No se pudieron cargar las ciudades: {callableErrorMessage(cities.error)}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Nombre"
          value={values.name}
          maxLength={MAX_ROUTE_NAME}
          error={errors.name}
          onChange={(e) => update({ name: e.target.value })}
        />
        <SelectField
          label="Ciudad o zona"
          value={values.cityId}
          error={errors.cityId}
          onChange={(e) => update({ cityId: e.target.value })}
          options={[
            { value: '', label: cities.isPending ? 'Cargando ciudades…' : 'Elige una ciudad o zona' },
            ...(knownCity ? [] : [{ value: values.cityId, label: values.cityId }]),
            ...cityOptions.map((c) => ({ value: c.id, label: c.label })),
          ]}
        />
        <div className="md:col-span-2">
          <TextAreaField
            label="Descripción (opcional)"
            rows={3}
            value={values.description}
            maxLength={MAX_ROUTE_DESCRIPTION}
            error={errors.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        </div>

        <fieldset className="flex flex-col gap-3 rounded-md border border-line p-4">
          <legend className="px-1 text-sm font-semibold text-ink">Punto de inicio</legend>
          <TextField
            label="Nombre del punto de inicio"
            value={values.startLabel}
            maxLength={MAX_POINT_LABEL}
            error={errors.startLabel}
            onChange={(e) => update({ startLabel: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Latitud de inicio" inputMode="decimal" placeholder="-3.99313" value={values.startLat} error={errors.startLat} onChange={(e) => update({ startLat: e.target.value })} />
            <TextField label="Longitud de inicio" inputMode="decimal" placeholder="-79.20422" value={values.startLng} error={errors.startLng} onChange={(e) => update({ startLng: e.target.value })} />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded-md border border-line p-4">
          <legend className="px-1 text-sm font-semibold text-ink">Punto de llegada</legend>
          <TextField
            label="Nombre del punto de llegada"
            value={values.endLabel}
            maxLength={MAX_POINT_LABEL}
            error={errors.endLabel}
            onChange={(e) => update({ endLabel: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Latitud de llegada" inputMode="decimal" placeholder="-3.99313" value={values.endLat} error={errors.endLat} onChange={(e) => update({ endLat: e.target.value })} />
            <TextField label="Longitud de llegada" inputMode="decimal" placeholder="-79.20422" value={values.endLng} error={errors.endLng} onChange={(e) => update({ endLng: e.target.value })} />
          </div>
        </fieldset>

        <TextField
          label="Distancia (km)"
          inputMode="decimal"
          placeholder="5.2"
          value={values.distanceKm}
          error={errors.distanceKm}
          onChange={(e) => update({ distanceKm: e.target.value })}
        />
        <TextField
          label="Desnivel positivo (m)"
          inputMode="decimal"
          value={values.elevationGainM}
          error={errors.elevationGainM}
          onChange={(e) => update({ elevationGainM: e.target.value })}
        />
        <SelectField
          label="Superficie"
          value={values.surface}
          onChange={(e) => update({ surface: e.target.value as Surface })}
          options={SURFACES.map((s) => ({ value: s, label: surfaceLabel(s) }))}
        />
        <SelectField
          label="Dificultad"
          value={values.difficulty}
          onChange={(e) => update({ difficulty: e.target.value as Difficulty })}
          options={DIFFICULTIES.map((d) => ({ value: d, label: difficultyLabel(d) }))}
        />
        <CheckboxField
          label="Ruta activa"
          hint="Solo las rutas activas se recomiendan en la app."
          checked={values.active}
          onChange={(e) => update({ active: e.target.checked })}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={save.isPending}>
          {isNew ? 'Crear ruta' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
