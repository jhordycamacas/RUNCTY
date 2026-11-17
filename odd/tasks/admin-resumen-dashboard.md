# Feature: Admin summary dashboard and visual refresh

> Specs (SDD): [Admin panel](../../specs/transversal/panel-de-administracion.md), [Design system](../../specs/transversal/sistema-de-diseno.md)

Locator: `odd/tasks/admin-resumen-dashboard.md` · Engram mirror: `odd/admin-resumen-dashboard/tasks` (pending: not written by the bounded writer) · Branch: `feat/admin-users-roles-cities`

## Objective

A first admin section, `Resumen`, with real analytics of the mobile app, and a more distinctive visual design (pastel cards, floating sidebar, Gacelas pink) for the admin and a coherent runner area.

## Constraints

Only real figures (no analytics existed: unbuilt metrics are "Próximamente"), aggregates only, no chart library (initial bundle 1.16 MB), UI in Spanish, no zombie code.

## Tasks

- [x] T1 Specs (now consolidated in `specs/transversal/panel-de-administracion.md` and `specs/transversal/sistema-de-diseno.md`) and index rows. Route: inline (docs). Evidence: commit `93d9c3f`.
- [x] T2 Backend `GET /api/v1/admin/summary` (`backend/apps/summary`), tests first. Route: delegated direct (this writer). Evidence: commit `c5f8a1b`; pytest 776 passed (was 753), `ruff check` and `ruff format --check` clean.
- [x] T3 Frontend domain, mapper, HTTP repository, store, page and chart components; Resumen first in `ADMIN_SECTIONS`; landing guard spec updated. Evidence: commit `d0de170`; 24 summary specs plus guard specs.
- [x] T4 Visual refresh: pastel tokens (light and dark) with contrast specs, floating sidebar with brand and account card, transparent top bar, card shadows. Evidence: the `style(frontend)` commit after `d0de170`.
- [x] T5 Docs: `CONTEXTO.md` section 17.5b, spec checkboxes.

## Verification evidence

- Frontend: `ng test` 91 files, 666 tests passed; `ng lint` clean; `ng build` no warnings, initial total 1.16 MB; `knip` reports no summary leftovers (36 unused files and several exports are pre-existing, mostly `mobile/`).
- Live (headless Chrome, emulators seeded with 1 user, 5 routes, 1 city): Resumen at 1280 light and dark and at 360 light; Usuarios, Roles, Ciudades and Rutas at 1280 light (Rutas also dark; Usuarios at 360); runner home at 390 light and dark. No horizontal page overflow in any capture. Theme left on Claro.
- Not verified live: Resumen error state with the API down (covered by page spec), Resumen at 360 in dark.

## Decisions and limits

- Permission rule: route needs `admin.access`; each block needs `users.read`, `routes.manage` or `cities.manage`, otherwise `null`.
- No search box was added to the top bar (it would have no function); the account card lives in the sidebar.
- Recreating the `firebase` container wiped the emulator data; the dev data was reloaded with `python manage.py seed` against the emulator hosts.
