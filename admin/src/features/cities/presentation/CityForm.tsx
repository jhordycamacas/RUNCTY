'use client';

import { useState, type FormEvent } from 'react';

import { callableErrorMessage } from '@/core/errors/errorMessages';
import { Button } from '@/core/ui/Button';
import { Alert } from '@/core/ui/feedback';
import { SelectField, TextField } from '@/core/ui/fields';

import { useSaveCity } from '../application/useCities';
import {
  COVERAGES,
  canBeParent,
  cityToForm,
  coverageLabel,
  emptyCityForm,
  parseCityForm,
  suggestCityId,
  type City,
  type CityFormErrors,
  type CityFormValues,
} from '../domain/city';
import { CityExistsError } from '../infrastructure/citiesRepository';

interface CityFormProps {
  city?: City;
  cities: City[];
  onDone(message: string): void;
  onCancel(): void;
}

/** RF-04-1/3: create or edit a city or zone. Coordinates are typed (no map yet). */
export function CityForm({ city, cities, onDone, onCancel }: CityFormProps) {
  const isNew = !city;
  const [values, setValues] = useState<CityFormValues>(city ? cityToForm(city) : emptyCityForm());
  const [idTouched, setIdTouched] = useState(false);
  const [errors, setErrors] = useState<CityFormErrors>({});
  const save = useSaveCity();
  const parents = cities.filter((c) => canBeParent(c, values.id));

  function update(patch: Partial<CityFormValues>) {
    setValues((v) => {
      const next = { ...v, ...patch };
      if (isNew && !idTouched) next.id = suggestCityId(next.name, next.type, next.parentCityId);
      return next;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseCityForm(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    try {
      await save.mutateAsync({ id: parsed.id, city: parsed.value, isNew });
      onDone(isNew ? `"${parsed.value.name}" creada.` : `"${parsed.value.name}" actualizada.`);
    } catch {
      // Rendered below.
    }
  }

  const saveError = save.error instanceof CityExistsError ? save.error.message : callableErrorMessage(save.error);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-lg border border-line bg-white p-6">
      <h2 className="text-lg font-bold text-ink">{isNew ? 'Nueva ciudad o zona' : `Editar: ${city.name}`}</h2>
      {save.isError ? <Alert>{saveError}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Tipo"
          value={values.type}
          disabled={!isNew}
          hint={isNew ? 'Una zona pertenece a una ciudad.' : 'El tipo no se puede cambiar.'}
          onChange={(e) => update({ type: e.target.value === 'zone' ? 'zone' : 'city', parentCityId: '' })}
          options={[
            { value: 'city', label: 'Ciudad' },
            { value: 'zone', label: 'Zona' },
          ]}
        />
        {values.type === 'zone' ? (
          <SelectField
            label="Ciudad a la que pertenece"
            value={values.parentCityId}
            error={errors.parentCityId}
            onChange={(e) => update({ parentCityId: e.target.value })}
            options={[{ value: '', label: 'Elige una ciudad' }, ...parents.map((c) => ({ value: c.id, label: c.name }))]}
          />
        ) : (
          <div />
        )}
        <TextField label="Nombre" value={values.name} maxLength={80} error={errors.name} onChange={(e) => update({ name: e.target.value })} />
        <TextField label="Provincia" value={values.province} maxLength={80} error={errors.province} onChange={(e) => update({ province: e.target.value })} />
        <TextField
          label="Identificador"
          value={values.id}
          disabled={!isNew}
          error={errors.id}
          hint="Minúsculas, números y guiones. No se puede cambiar después."
          onChange={(e) => {
            setIdTouched(true);
            setValues((v) => ({ ...v, id: e.target.value }));
          }}
        />
        <SelectField
          label="Cobertura"
          value={values.coverage}
          onChange={(e) => update({ coverage: e.target.value as CityFormValues['coverage'] })}
          hint="Solo las ciudades activas aparecen en el registro de la app."
          options={COVERAGES.map((c) => ({ value: c, label: coverageLabel(c) }))}
        />
        <TextField label="Latitud" inputMode="decimal" placeholder="-3.99313" value={values.lat} error={errors.lat} onChange={(e) => update({ lat: e.target.value })} />
        <TextField label="Longitud" inputMode="decimal" placeholder="-79.20422" value={values.lng} error={errors.lng} onChange={(e) => update({ lng: e.target.value })} />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={save.isPending}>
          {isNew ? 'Crear' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
