'use client';

import { useMemo, useState } from 'react';

import { callableErrorMessage } from '@/core/errors/errorMessages';
import { Button } from '@/core/ui/Button';
import { ConfirmDialog } from '@/core/ui/ConfirmDialog';
import { Alert, Badge, LoadingText, PageHeader } from '@/core/ui/feedback';

import { useCities, useDeleteCity } from '../application/useCities';
import { coverageLabel, type City, type CityCoverage } from '../domain/city';
import { CityForm } from './CityForm';

const COVERAGE_TONE: Record<CityCoverage, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  planned: 'neutral',
  suspended: 'warning',
};

type Editing = { mode: 'create' } | { mode: 'edit'; city: City } | null;

/** RF-04-1..4: cities and zones of operation. */
export function CitiesScreen() {
  const cities = useCities();
  const remove = useDeleteCity();
  const [editing, setEditing] = useState<Editing>(null);
  const [toDelete, setToDelete] = useState<City | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Cities first, each followed by its zones.
  const rows = useMemo(() => {
    const all = cities.data ?? [];
    const zonesOf = (id: string) => all.filter((c) => c.type === 'zone' && c.parentCityId === id);
    const known = new Set(all.filter((c) => c.type === 'city').map((c) => c.id));
    const orphans = all.filter((c) => c.type === 'zone' && !known.has(c.parentCityId ?? ''));
    return [...all.filter((c) => c.type === 'city').flatMap((c) => [c, ...zonesOf(c.id)]), ...orphans];
  }, [cities.data]);
  const names = useMemo(() => new Map((cities.data ?? []).map((c) => [c.id, c.name])), [cities.data]);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      setNotice(`"${toDelete.name}" eliminada.`);
      setToDelete(null);
    } catch {
      // Shown in the dialog.
    }
  }

  return (
    <section>
      <PageHeader
        title="Ciudades y zonas"
        description="Ciudades y zonas de operación. Solo se elimina una ciudad o zona sin rutas asociadas (y una ciudad, sin zonas)."
        actions={
          editing ? null : (
            <Button
              onClick={() => {
                setNotice(null);
                setEditing({ mode: 'create' });
              }}
            >
              Nueva ciudad o zona
            </Button>
          )
        }
      />

      {notice ? (
        <div className="mb-4">
          <Alert tone="success">{notice}</Alert>
        </div>
      ) : null}

      {editing ? (
        <div className="mb-6">
          <CityForm
            key={editing.mode === 'edit' ? editing.city.id : 'new'}
            city={editing.mode === 'edit' ? editing.city : undefined}
            cities={cities.data ?? []}
            onCancel={() => setEditing(null)}
            onDone={(message) => {
              setEditing(null);
              setNotice(message);
            }}
          />
        </div>
      ) : null}

      {cities.isPending ? <LoadingText /> : null}
      {cities.isError ? <Alert>{callableErrorMessage(cities.error)}</Alert> : null}
      {cities.isSuccess && rows.length === 0 ? <p className="text-sm text-muted">Aún no hay ciudades registradas.</p> : null}

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Ciudades y zonas registradas</caption>
            <thead className="border-b border-line bg-surface text-xs uppercase text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Nombre</th>
                <th scope="col" className="px-4 py-3">Tipo</th>
                <th scope="col" className="px-4 py-3">Provincia</th>
                <th scope="col" className="px-4 py-3">Ubicación</th>
                <th scope="col" className="px-4 py-3">Cobertura</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((city) => (
                <tr key={city.id} className="border-b border-line last:border-0">
                  <td className={`px-4 py-3 font-medium text-ink ${city.type === 'zone' ? 'pl-10' : ''}`}>
                    {city.name}
                    <span className="block text-xs font-normal text-muted">{city.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    {city.type === 'zone' ? `Zona de ${names.get(city.parentCityId ?? '') ?? city.parentCityId}` : 'Ciudad'}
                  </td>
                  <td className="px-4 py-3">{city.province}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {city.location.lat.toFixed(5)}, {city.location.lng.toFixed(5)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={COVERAGE_TONE[city.coverage]}>{coverageLabel(city.coverage)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        aria-label={`Editar ${city.name}`}
                        onClick={() => {
                          setNotice(null);
                          setEditing({ mode: 'edit', city });
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        aria-label={`Eliminar ${city.name}`}
                        onClick={() => {
                          remove.reset();
                          setToDelete(city);
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete?.type === 'zone' ? 'Eliminar zona' : 'Eliminar ciudad'}
        confirmLabel="Eliminar"
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
      >
        <p>
          ¿Eliminar <strong>{toDelete?.name}</strong>? Esta acción no se puede deshacer.
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
