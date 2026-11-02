'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { callableErrorMessage } from '@/core/errors/errorMessages';
import { Button } from '@/core/ui/Button';
import { ConfirmDialog } from '@/core/ui/ConfirmDialog';
import { Alert, Badge, LoadingText, PageHeader } from '@/core/ui/feedback';
import { SelectField, TextField } from '@/core/ui/fields';
import { useCityOptions } from '@/features/cities/application/useCities';

import { useDeleteRoute, useRoutes } from '../application/useRoutes';
import {
  DIFFICULTIES,
  difficultyLabel,
  filterRoutes,
  safetyBySlot,
  surfaceLabel,
  type Route,
  type RouteFilters,
} from '../domain/route';
import { formatWindow } from '../domain/schedule';
import { RouteForm } from './RouteForm';
import { SafetyBadge, formatKm } from './SafetyBadge';

type Editing = { mode: 'create' } | { mode: 'edit'; route: Route } | null;

/** RF-05-1..3 / RF-05-7: route catalog for admins (includes inactive routes). */
export function RoutesScreen() {
  const router = useRouter();
  const routes = useRoutes();
  const cities = useCityOptions();
  const remove = useDeleteRoute();
  const [filters, setFilters] = useState<RouteFilters>({ cityId: '', difficulty: '', text: '' });
  const [editing, setEditing] = useState<Editing>(null);
  const [toDelete, setToDelete] = useState<Route | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const cityNames = useMemo(() => new Map((cities.data ?? []).map((c) => [c.id, c.label])), [cities.data]);
  const rows = useMemo(() => filterRoutes(routes.data ?? [], filters), [routes.data, filters]);

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
        title="Rutas"
        description="Rutas con sus tramos, franjas horarias y factores de riesgo. El nivel por franja (Alto, Medio o Bajo) lo calcula el sistema."
        actions={
          editing ? null : (
            <Button
              onClick={() => {
                setNotice(null);
                setEditing({ mode: 'create' });
              }}
            >
              Nueva ruta
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
          <RouteForm
            key={editing.mode === 'edit' ? editing.route.id : 'new'}
            route={editing.mode === 'edit' ? editing.route : undefined}
            onCancel={() => setEditing(null)}
            onDone={(message, createdId) => {
              setEditing(null);
              setNotice(message);
              // Next step after creating: add segments and time slots.
              if (createdId) router.push(`/rutas/${createdId}`);
            }}
          />
        </div>
      ) : null}

      <form role="search" aria-label="Filtrar rutas" className="mb-4 grid gap-4 md:grid-cols-3" onSubmit={(e) => e.preventDefault()}>
        <TextField
          label="Buscar"
          type="search"
          placeholder="Nombre o descripción"
          value={filters.text}
          onChange={(e) => setFilters((f) => ({ ...f, text: e.target.value }))}
        />
        <SelectField
          label="Ciudad o zona"
          value={filters.cityId}
          onChange={(e) => setFilters((f) => ({ ...f, cityId: e.target.value }))}
          options={[{ value: '', label: 'Todas' }, ...(cities.data ?? []).map((c) => ({ value: c.id, label: c.label }))]}
        />
        <SelectField
          label="Dificultad"
          value={filters.difficulty}
          onChange={(e) => setFilters((f) => ({ ...f, difficulty: e.target.value as RouteFilters['difficulty'] }))}
          options={[{ value: '', label: 'Todas' }, ...DIFFICULTIES.map((d) => ({ value: d, label: difficultyLabel(d) }))]}
        />
      </form>

      {routes.isPending ? <LoadingText /> : null}
      {routes.isError ? <Alert>{callableErrorMessage(routes.error)}</Alert> : null}
      {routes.isSuccess && routes.data.length === 0 ? <p className="text-sm text-muted">Aún no hay rutas registradas.</p> : null}
      {routes.isSuccess && routes.data.length > 0 && rows.length === 0 ? (
        <p className="text-sm text-muted">Ninguna ruta coincide con los filtros.</p>
      ) : null}

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Rutas registradas</caption>
            <thead className="border-b border-line bg-surface text-xs uppercase text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Nombre</th>
                <th scope="col" className="px-4 py-3">Ciudad</th>
                <th scope="col" className="px-4 py-3">Distancia</th>
                <th scope="col" className="px-4 py-3">Dificultad</th>
                <th scope="col" className="px-4 py-3">Superficie</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3">Tramos</th>
                <th scope="col" className="px-4 py-3">Nivel por franja</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((route) => {
                const slots = safetyBySlot(route.safety);
                return (
                  <tr key={route.id} className="border-b border-line align-top last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">
                      <Link href={`/rutas/${route.id}`} className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ink">
                        {route.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{cityNames.get(route.cityId) ?? route.cityId}</td>
                    <td className="px-4 py-3 tabular-nums">{formatKm(route.distanceKm)}</td>
                    <td className="px-4 py-3">{difficultyLabel(route.difficulty)}</td>
                    <td className="px-4 py-3">{surfaceLabel(route.surface)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={route.active ? 'success' : 'neutral'}>{route.active ? 'Activa' : 'Inactiva'}</Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{route.segmentCount}</td>
                    <td className="px-4 py-3">
                      {slots.length === 0 ? (
                        <span className="text-xs text-muted">Sin franjas o tramos</span>
                      ) : (
                        <ul className="flex flex-col gap-1">
                          {slots.map((s) => (
                            <li key={s.slotId}>
                              <SafetyBadge level={s.level} window={formatWindow(s.startTime, s.endTime)} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/rutas/${route.id}`}
                          aria-label={`Ver detalle de ${route.name}`}
                          className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                        >
                          Detalle
                        </Link>
                        <Button
                          variant="secondary"
                          aria-label={`Editar ${route.name}`}
                          onClick={() => {
                            setNotice(null);
                            setEditing({ mode: 'edit', route });
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          aria-label={`Eliminar ${route.name}`}
                          onClick={() => {
                            remove.reset();
                            setToDelete(route);
                          }}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar ruta"
        confirmLabel="Eliminar"
        loading={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => void confirmDelete()}
      >
        <p>
          ¿Eliminar <strong>{toDelete?.name}</strong>? La ruta dejará de recomendarse y se borrarán sus tramos, franjas y
          factores de riesgo. Esta acción no se puede deshacer.
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
