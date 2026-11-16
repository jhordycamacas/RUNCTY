# Feature: Admin route management in the single frontend (Sprint 2, S5b)

Locator: `odd/tasks/admin-routes-sprint2.md` · Engram mirror: `odd/admin-routes-sprint2/tasks` · Branch: `feat/admin-routes-sprint2`

## Objective

Give the administrator, inside the Angular + Ionic frontend (`/admin/rutas`), the full management of the Sprint 2 scope: routes, segments, time slots, risk factors and the safety index. It closes the 18 Sprint 2 stories of the Jira board (RUN-14, RUN-28, RUN-73 to RUN-79, RUN-87 to RUN-96).

## Problem and why

The Django backend already exposes every endpoint and the runner area already reads routes and the safety level. The admin area only has a placeholder for `rutas` (`frontend/src/app/admin/admin-sections.ts`), so the stories can only be exercised in the old Next.js panel (`admin/`), which is going to be deleted in S6. Sprint 2 is not complete in the current architecture until the new admin covers it.

## Scope

In scope: the `rutas` admin section in `frontend/`, its domain, application, infrastructure and presentation layers, its tests, and the docs that record it.

Out of scope: S5a (users, roles, cities admin screens; a stash holds unfinished work), S6 cleanup, maps (`MapProvider`), backend changes unless a contract defect blocks a story (report it, do not widen silently).

## Specification (acceptance criteria per story)

All screens require the `routes.manage` permission, show Spanish UI copy, and never label a route "segura" or "insegura": they show the level (Alto, Medio, Bajo) per time slot with the factors that explain it.

| Story | Requirement | Acceptance criteria |
| --- | --- | --- |
| RF-05-1 | Register route | A form creates a route (name, city, distance, difficulty, surface, elevation, description, active flag as the API contract defines). Invalid input shows a field message in Spanish and sends nothing. On success the list shows the new route and a success notice appears. |
| RF-05-2 | Consult routes | The list shows every route of the selected city, including inactive ones, with name, distance, difficulty, status and safety level per slot. Loading, empty and error states exist; the error state offers retry. |
| RF-05-3 | Modify route | The same form edits a route with its current values preloaded. Leaving with unsaved changes asks for confirmation. |
| RF-05-4 | Delete route | Deleting asks for confirmation with a destructive-styled button. On success the route leaves the list. |
| RF-05-5 | Register segment | From the route detail, a form adds a segment (name, order, points as the contract defines). |
| RF-05-6 | Consult segments | The route detail lists segments in order, each with its safety level per slot. |
| RF-05-7 | Modify segment | A segment can be edited with its values preloaded. |
| RF-05-8 | Delete segment | Deleting asks for confirmation; the API rule that blocks or cascades is surfaced in Spanish. |
| RF-07-1 | Register time slot | A form adds a slot with start and end time using time inputs (not free text). Overlapping slots are rejected with a Spanish message (client validation and the API error both mapped). |
| RF-07-2 | Consult time slots | The route detail lists its slots ordered by start time. |
| RF-07-3 | Modify time slot | A slot can be edited; the overlap rule also applies. |
| RF-07-4 | Delete time slot | Deleting asks for confirmation. |
| RF-07-5 | Register risk factor | From a segment, a form adds a factor (type, severity low/medium/high, the slots where it applies, optional validity dates with date inputs, description as the contract defines). |
| RF-07-6 | Consult risk factors | Each segment lists its factors with severity and slots. |
| RF-07-7 | Modify risk factor | A factor can be edited with its values preloaded. |
| RF-07-8 | Delete risk factor | Deleting asks for confirmation. |
| RF-07-9 | Calculate safety index | After any change to slots or factors, the detail shows the index returned by the API (score and level per slot, route and segment). The client never computes the index itself. |
| RF-07-10 | Consult safety indexes | The detail shows a safety summary: per slot, the route level, the worst segment and the factors that explain it. |
| RF-07-11 | Recalculate safety index | Editing or deleting a slot or factor refreshes the shown index without a manual page reload. |

Cross-cutting criteria:

- API error codes map to Spanish messages in `core/errors/error-messages.ts`; an unknown code falls back to the generic message.
- Accessibility: labels on every control, 48 px touch targets, 4.5:1 text contrast, focus moves to the form when an edit starts.
- The admin area stays desktop-first but usable on a narrow screen (no horizontal page scroll).
- No zombie code: the placeholder page is removed only if no section still uses it (users, roles and cities still do).

## Constraints

- Follow the existing layering (`domain` / `application` / `infrastructure` / `presentation`) and the patterns of `frontend/src/app/routes`, `cities` and `account`. Reuse `shared/ui` (confirm dialog, notice, text field, toast) and `core/api/api-client.ts`.
- The contract is the Django code in `backend/apps/routes` (views, serializers, domain) and the section "Decisions taken in S1" of `odd/tasks/single-frontend-ionic.md`. The old panel `admin/src/features/routes` is the behavioral reference, not code to copy (React).
- Angular 22 zoneless, standalone components, signals. UI copy in Spanish; code, comments and tests in English.
- Commits: Conventional Commits, authored only by the user, no AI attribution of any kind.
- No `gentle-ai review` flows in this repository (user rule).

## Tasks

- [x] T1 Domain, validation and HTTP repository for route management (inputs, mappers, all endpoints). Route: delegated writer.
- [x] T2 Routes list and route form (RF-05-1 to 05-4). Route: delegated writer.
- [x] T3 Route detail with segments (RF-05-5 to 05-8). Route: delegated writer.
- [x] T4 Time slots (RF-07-1 to 07-4). Route: delegated writer.
- [ ] T5 Risk factors and safety summary (RF-07-5 to 07-11). Route: delegated writer.
- [ ] T6 Verification: unit tests, lint, build, and a live check against the Docker stack (API + emulators + frontend). Route: delegated verifier plus parent spot check.
- [ ] T7 Docs: CONTEXTO.md section 17 and this document. Route: inline.

Route declaration: delegated direct. Trigger evidence: many non-trivial new files across four layers, and the reading that prepares the write (API contract, existing patterns) exceeds the inline budget.

## Checks

From `frontend/`: `npx.cmd ng test --watch=false`, `npx.cmd ng lint`, `npx.cmd ng build`. Test-first applies: the runner is Vitest through `ng test`; observe RED before GREEN for domain, repository and store logic.

Live: Docker stack up (`runcty-api` healthy on `127.0.0.1:8000`, emulators on 9099/8080, seed admin `admin@runcty.dev`).

## Delivery

Forecast: well above 400 authored lines (five screens with tests). Strategy: `ask-on-risk`; work-unit commits per task on `feat/admin-routes-sprint2`. Push and PR are the user's decisions.

## Progress and evidence

- 2026-11-16: spec written, branch created from `main` at `75d18d5`. Docker stack running.
- Engram mirror: pending (the Engram tools are not available in this session).
- 2026-11-16 T1 done (delegated writer). RED: `ng test` failed to compile (missing `admin/routes` modules, `Route.active`). GREEN: `ng test` 55 files / 396 tests passed; `ng lint` clean; `ng build` OK. Added `Route.active` to the runner domain, `admin/routes/domain` (managed-route types, inputs and `RouteAdminRepository` port; route, segment, time-slot and risk-factor form parsing with the API limits and client overlap check; `toManagedRouteDetail`) and `HttpRouteAdminRepository` (all route, segment, time-slot and risk-factor endpoints; the safety index comes inside `GET /routes/{id}`, there is no separate endpoint). Every route reason code was already mapped in `error-messages.ts`. Commit: `feat(frontend): add the admin route management domain and repository`.
- Contract note for T5: a risk factor has an optional daily window (`startTime`/`endTime`), not a list of slots or validity dates; validity dates (`validFrom`/`validTo`) belong to time slots. The RF-07-5 row above follows the old wording; the screens must follow the contract.

- 2026-11-16 T2 done (delegated writer). RED: `ng test` failed to compile (missing `admin-routes.store`, `route-places`, `slot-safety`, `routes-admin.page`, `route-form.page`). GREEN: `ng test` 62 files / 432 tests passed; `ng lint` clean; `ng build` OK with no budget warning. The `rutas` section now lazy-loads `admin/routes/routes-admin.routes.ts`, which provides `HttpRouteAdminRepository` and `AdminRoutesStore`; users, roles and cities still use the placeholder. List (`/admin/rutas`): city or zone picker ("Todas las ciudades" by default), text filter, loading, empty, error with retry, name, distance, difficulty, Activa/Inactiva and the level per slot (Alto/Medio/Bajo), delete with a destructive `confirmAction` and a toast. Form (`/nueva`, `/:id/editar`): field messages in Spanish, preload on edit, unsaved-changes guard, focus on the form heading, toast and back to the list; saving a route of another city switches the list to it. Decision: `ion-select` and `ion-textarea` added about 108 kB to the initial bundle (Ionic ships one module, so any component used anywhere lands in `main`) and broke the 1.2 MB budget; the admin uses new native `shared/ui/select-field.ts` and `textarea-field.ts` instead. Commit: `c7a98bb` `feat(frontend): add the admin routes list and route form`.

- 2026-11-16 T3 done (delegated writer). RED: `ng test` failed to compile (missing `route-detail.store`, `route-detail.page`, `segments-section`, `segmentSlotLevels`). GREEN: `ng test` 64 files / 448 tests passed; `ng lint` clean; `ng build` OK, no budget warning. `/admin/rutas/:id` (unsaved-changes guard) shows the route summary with its level per slot and `app-segments-section`: segments in order with their level per slot (slot label and range, "Sin evaluar" when the API has no entry), add and edit in one inline form (preloaded, focus on the form heading, Spanish field and API messages, discard confirmation on cancel), delete through `confirmAction` (destructive; the dialog shows the API refusal in Spanish). `RouteDetailStore` (provided by the page) runs every change through a private `mutate` that reloads `GET /routes/{id}`, the only source of the recalculated index.
- Extension points for T4/T5: add `saveTimeSlot`/`deleteTimeSlot` and `saveRiskFactor`/`deleteRiskFactor` to `admin/routes/application/route-detail.store.ts` on top of `mutate`; add `app-time-slots-section` and the safety summary as siblings of `<app-segments-section />` in `admin/routes/presentation/route-detail.page.ts` (and include their drafts in `hasUnsavedChanges`); risk factors per segment go inside each `li.segment` of `segments-section.ts`. `segmentSlotLevels` already takes the route time slots, so new slots show up without changes.

- 2026-11-16 T4 done (delegated writer). RED: `ng test` failed to compile (missing `time-slots-section`, `date-time-field`, `saveTimeSlot`/`deleteTimeSlot`). GREEN: `ng test` 66 files / 460 tests passed; `ng lint` clean; `ng build` OK, initial total 1.15 MB, no budget warning. `RouteDetailStore` gained `saveTimeSlot`/`deleteTimeSlot` on `mutate`. New `app-time-slots-section` (before the segments in the detail page, counted in `hasUnsavedChanges`): slots sorted by start time with name, window and validity ("Todos los días" when unbounded), add and edit in one inline form (preloaded, focus on the form heading, client overlap check that leaves out the edited slot, API `time-slot-overlap` shown in Spanish, discard confirmation on cancel), delete through a destructive `confirmAction`. New native `shared/ui/date-time-field.ts` (`<input type="time|date">`, label, hint and error linked with `aria-describedby`) keeps Ionic pickers out of the bundle. Commit: `feat(frontend): add admin time slot management`.

## Next step

T5.
