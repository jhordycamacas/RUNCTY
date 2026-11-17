# Feature: Admin users, roles and cities in the single frontend (Sprint 1, S5a)

> Specs (SDD): [EP-01 users](../../specs/01-gestion-de-usuarios.md), [EP-02 roles](../../specs/02-roles-y-permisos.md), [EP-04 cities](../../specs/04-ciudades-y-zonas.md)

Locator: `odd/tasks/admin-users-roles-cities-sprint1.md` · Engram mirror: `odd/admin-users-roles-cities-sprint1/tasks` (pending, the Engram tools are not available in this session) · Branch: `feat/admin-users-roles-cities` (from `feat/admin-routes-sprint2`)

## Objective

Give the administrator, inside the Angular + Ionic frontend, the Sprint 1 admin screens: user search and role assignment (`/admin/usuarios`), role management (`/admin/roles`) and city and zone management (`/admin/ciudades`). It closes the admin stories RF-01-2, RF-02-1 to RF-02-4 and RF-04-1 to RF-04-4. The specs live in `specs/01-gestion-de-usuarios.md`, `specs/02-roles-y-permisos.md` and `specs/04-ciudades-y-zonas.md` (grouped by capability).

## Problem and why

The three sections still showed a placeholder ("no disponible"). The Django backend already exposes every endpoint, so the only gap was the UI.

## Scope

In scope: the `usuarios`, `roles` and `ciudades` admin sections in `frontend/src/app/admin`, their tests, the Spanish error messages they need, the removal of the placeholder page, a theme selector in the admin menu (extra request), and the docs. Out of scope: backend changes (none were needed), S6 cleanup.

## Contract notes

- `GET /users` filters: `firstName`, `lastName` (accent-insensitive prefixes), `email`, `idNumber` (10 digits), `birthDate` (YYYY-MM-DD), `cityId`, plus `limit` and `cursor`. It answers `{users, nextCursor}`; a user summary has no id number. The role is `null` for an account without one.
- `GET /roles` needs only `admin.access`; create, update, delete and `PUT /users/{uid}/role` need `roles.manage`. A role update answers `{syncedUsers}`. The permission catalogue is not an endpoint: the frontend keeps it in `core/permissions` and names and groups it in `admin/roles/domain/role.ts`.
- `GET /cities` is public and returns cities and zones together; `PATCH /cities/{id}` edits name, province, location, coverage and parent; id and type never change. Deleting a city with zones answers 400 `city-has-zones` (not 412).
- Optional empty fields are omitted from request bodies (the role description).

## Tasks

- [x] T1 Specs: one spec per admin story plus the README index (later consolidated into the capability specs `specs/01-*.md`, `specs/02-*.md` and `specs/04-*.md`). Route: inline (committed first). Commit `fe15884`.
- [x] T2 Roles: domain, HTTP repository, store, list, form with the grouped permission checklist, delete. Route: delegated writer (this one). Commits `c2d1b3f`, `b3b2a16`.
- [x] T3 Users: search with filters and cursor paging, role assignment with confirmation. Route: delegated writer. Commits `b25af72`, `83c9d18`.
- [x] T4 Theme selector in the admin menu (extra request), reusing `PreferencesStore`. Route: delegated writer. Commit `23c62d0`.
- [x] T5 Cities and zones: domain, repository, store, list with nested zones, form, delete; placeholder page removed. Route: delegated writer. Commits `a03dcc1`, `276d66d`.
- [x] T6 Verification and docs: full tests, lint, build, knip, live walk of every screen at 1280 and 360 px, CONTEXTO.md. Route: same writer.

Route declaration: delegated direct (one bounded writer). Trigger evidence: three sections across four layers, and the reading that prepares the write (backend contract, the routes pattern, the backlog) exceeds the inline budget.

## Checks

From `frontend/`: `npx.cmd ng test --watch=false`, `npx.cmd ng lint`, `npx.cmd ng build`, `npx --yes knip`. Test-first with Vitest through `ng test`.

## Progress and evidence

- T1: 9 specs written before any code and committed alone.
- T2: domain and repository specs written first (RED: unresolved `http-role-admin.repository`), then GREEN; page specs for the list and the form. Live: created, duplicated id (`role-exists` in Spanish), edited (focus on the heading, `syncedUsers`), removed a permission from `admin` (`admin-permissions` message), deleted with the confirmation alert; no horizontal scroll at 360 px.
- T3: live: list, invalid id number message, email filter narrowing to one user, empty state, and an attempt to demote the own admin account (confirmation, then `self-lockout` shown in Spanish and the select returned to its value). The success path of a role change is covered by unit tests only: the seed has a single user.
- T3 defect found live and fixed: the error text of an `app-text-field` (Ionic `ion-input`) did not show for the two format filters even though the component held the message, and the unit test was flaky. The filter errors now show in one `app-notice` under the form. The text-field error binding itself is untouched; it works in the role and route forms.
- T4: live: choosing Oscuro switches the admin and `data-theme` to dark, survives a reload (saved with `PUT /users/me/preferences`); Claro again after a reload. The labels are the ones of the preferences domain ("Según el sistema", "Claro", "Oscuro").
- T5: live: invalid form, create city, duplicate (`city-exists` message), add a zone from the city card (type and parent prefilled), edit the zone (focus on the heading), delete the city with zones (`city-has-zones` in the alert), delete the zone and the city. 360 px: no horizontal scroll.
- T6: `ng test --watch=false`: 86 files, 637 tests passed; `ng lint`: clean; `ng build`: initial total 1.16 MB, no budget warning; knip reports nothing new from this feature (four exported types were made private). The test data created live was deleted.
- Touch targets measure 40 px with a fine pointer and 48 px with a coarse pointer (`_areas.scss`), the existing admin density rule.

## Next step

Push and the PR of `feat/admin-users-roles-cities` are the user's decision. S6 (cleanup) follows.
