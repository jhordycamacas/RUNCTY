'use client';

import Link from 'next/link';
import { useState } from 'react';

import { callableErrorMessage } from '@/core/errors/errorMessages';
import { Button } from '@/core/ui/Button';
import { Alert, Badge, LoadingText, PageHeader } from '@/core/ui/feedback';
import { useCityOptions } from '@/features/cities/application/useCities';

import { useRoute, useSegments, useTimeSlots } from '../application/useRoutes';
import { difficultyLabel, surfaceLabel, type Route } from '../domain/route';
import { RouteForm } from './RouteForm';
import { formatKm } from './SafetyBadge';
import { SafetySummary } from './SafetySummary';
import { SegmentsSection } from './SegmentsSection';
import { TimeSlotsSection } from './TimeSlotsSection';

function RouteFacts({ route, cityName }: { route: Route; cityName: string }) {
  const facts: [string, string][] = [
    ['Ciudad', cityName],
    ['Distancia', formatKm(route.distanceKm)],
    ['Desnivel positivo', `${Math.round(route.elevationGainM)} m`],
    ['Superficie', surfaceLabel(route.surface)],
    ['Dificultad', difficultyLabel(route.difficulty)],
    ['Inicio', `${route.start.label} (${route.start.lat}, ${route.start.lng})`],
    ['Llegada', `${route.end.label} (${route.end.lat}, ${route.end.lng})`],
  ];
  return (
    <section aria-label="Datos de la ruta" className="rounded-lg border border-line bg-white p-6">
      {route.description ? <p className="mb-4 text-sm text-ink">{route.description}</p> : null}
      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {facts.map(([term, value]) => (
          <div key={term}>
            <dt className="text-xs uppercase text-muted">{term}</dt>
            <dd className="text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** RF-05 / RF-07: one route with its segments, time slots, risk factors and safety per slot. */
export function RouteDetailScreen({ routeId }: { routeId: string }) {
  const route = useRoute(routeId);
  const segments = useSegments(routeId);
  const slots = useTimeSlots(routeId);
  const cities = useCityOptions();
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const back = (
    <Link href="/rutas" className="text-sm font-medium text-ink underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-ink">
      ← Volver a rutas
    </Link>
  );

  if (route.isPending) return <LoadingText />;
  if (route.isError) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <Alert>{callableErrorMessage(route.error)}</Alert>
      </div>
    );
  }
  if (!route.data) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <p className="text-sm text-muted">La ruta no existe o fue eliminada.</p>
      </div>
    );
  }

  const data = route.data;
  const cityName = cities.data?.find((c) => c.id === data.cityId)?.label ?? data.cityId;

  return (
    <section className="flex flex-col gap-6">
      <div>
        {back}
        <PageHeader
          title={data.name}
          description="Los cambios en tramos, franjas o factores recalculan el nivel de la ruta."
          actions={
            <div className="flex items-center gap-3">
              <Badge tone={data.active ? 'success' : 'neutral'}>{data.active ? 'Activa' : 'Inactiva'}</Badge>
              {editing ? null : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setNotice(null);
                    setEditing(true);
                  }}
                >
                  Editar datos
                </Button>
              )}
            </div>
          }
        />
      </div>

      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {editing ? (
        <RouteForm
          route={data}
          onCancel={() => setEditing(false)}
          onDone={(message) => {
            setEditing(false);
            setNotice(message);
          }}
        />
      ) : (
        <RouteFacts route={data} cityName={cityName} />
      )}

      <SafetySummary safety={data.safety} slots={slots.data ?? []} segments={segments.data ?? []} />

      <TimeSlotsSection routeId={routeId} slots={slots.data ?? []} loading={slots.isPending} error={slots.error} />

      <SegmentsSection
        routeId={routeId}
        segments={segments.data ?? []}
        slots={slots.data ?? []}
        loading={segments.isPending}
        error={segments.error}
      />
    </section>
  );
}
