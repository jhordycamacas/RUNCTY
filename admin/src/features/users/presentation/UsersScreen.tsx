'use client';

import { useMemo, useState, type FormEvent } from 'react';

import { callableErrorMessage } from '@/core/errors/errorMessages';
import { hasPermission } from '@/core/permissions/permissions';
import { Button } from '@/core/ui/Button';
import { Alert, LoadingText, PageHeader } from '@/core/ui/feedback';
import { SelectField, TextField } from '@/core/ui/fields';
import { useClaims } from '@/features/auth/presentation/AdminShell';
import { useCityOptions } from '@/features/cities/application/useCities';
import { useRoles } from '@/features/roles/application/useRoles';

import { useUserSearch } from '../application/useUserSearch';
import { EMPTY_FILTERS, parseUserFilters, type FilterErrors, type UserFilterForm, type UserFilters } from '../domain/userSearch';
import { UsersTable } from './UsersTable';

/** RF-01-2: search users with filters; change their role (RF-02). */
export function UsersScreen() {
  const claims = useClaims();
  const canManageRoles = hasPermission(claims, 'roles.manage');
  const [form, setForm] = useState<UserFilterForm>(EMPTY_FILTERS);
  const [errors, setErrors] = useState<FilterErrors>({});
  const [filters, setFilters] = useState<UserFilters | null>(null);
  const search = useUserSearch(filters);
  const cities = useCityOptions();
  const roles = useRoles();

  const cityNames = useMemo(() => new Map((cities.data ?? []).map((c) => [c.id, c.label])), [cities.data]);
  const users = useMemo(() => search.data?.pages.flatMap((page) => page.users) ?? [], [search.data]);

  function update<K extends keyof UserFilterForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseUserFilters(form);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    setFilters(parsed.filters);
  }

  return (
    <section>
      <PageHeader title="Usuarios" description="Busca corredores y personal por nombre, correo, identificación, fecha de nacimiento o ciudad." />

      <form onSubmit={onSubmit} noValidate className="mb-6 rounded-lg border border-line bg-white p-5" aria-label="Filtros de búsqueda">
        <div className="grid gap-4 md:grid-cols-3">
          <TextField label="Nombres" value={form.firstName} error={errors.firstName} onChange={(e) => update('firstName', e.target.value)} hint="Coincide con el inicio, sin importar tildes." />
          <TextField label="Apellidos" value={form.lastName} error={errors.lastName} onChange={(e) => update('lastName', e.target.value)} />
          <TextField label="Correo electrónico" type="email" value={form.email} error={errors.email} onChange={(e) => update('email', e.target.value)} />
          <TextField label="Identificación" inputMode="numeric" maxLength={10} value={form.idNumber} error={errors.idNumber} onChange={(e) => update('idNumber', e.target.value)} />
          <TextField label="Fecha de nacimiento" type="date" value={form.birthDate} error={errors.birthDate} onChange={(e) => update('birthDate', e.target.value)} />
          <SelectField
            label="Ciudad o zona"
            value={form.cityId}
            onChange={(e) => update('cityId', e.target.value)}
            options={[{ value: '', label: 'Todas' }, ...(cities.data ?? []).map((c) => ({ value: c.id, label: c.label }))]}
          />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setForm(EMPTY_FILTERS);
              setErrors({});
            }}
          >
            Limpiar
          </Button>
          <Button type="submit" loading={search.isFetching && !search.isFetchingNextPage}>
            Buscar
          </Button>
        </div>
      </form>

      {filters === null ? <p className="text-sm text-muted">Usa los filtros y pulsa Buscar. Sin filtros se listan todos.</p> : null}
      {search.isError ? <Alert>{callableErrorMessage(search.error)}</Alert> : null}
      {search.isPending && filters !== null ? <LoadingText label="Buscando…" /> : null}

      {search.isSuccess ? (
        <>
          <p className="mb-2 text-sm text-muted" role="status">
            {users.length === 0 ? 'No se encontraron usuarios.' : `${users.length} usuario(s) mostrados.`}
          </p>
          {users.length > 0 ? (
            <UsersTable users={users} cityNames={cityNames} roles={roles.data ?? []} canManageRoles={canManageRoles} />
          ) : null}
          {search.hasNextPage ? (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" loading={search.isFetchingNextPage} onClick={() => void search.fetchNextPage()}>
                Cargar más
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
