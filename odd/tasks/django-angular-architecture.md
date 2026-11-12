# Feature: Django backend + Angular web panel (frontend/backend split)

- **Branch:** `feat/django-angular-architecture` (from `feat/hardening-and-polish` at `7d36585`)
- **Started:** 2026-11-11
- **Engram mirror:** `odd/django-angular-architecture/tasks` — **pending** (Engram tools were unavailable in this session)

## Objective

Restructure RUNCTY into two top-level folders for the university presentation:

- `backend/`: a Django REST API (Python) that owns all server logic and talks to Google services (Firebase Auth, Firestore, Storage, FCM) through `firebase-admin`.
- `frontend/`: the React Native app (`frontend/mobile`) and a new Angular admin panel (`frontend/web`).

Both clients consume the Django API. Firebase Auth stays on the clients only for sign-in; the ID token is sent as a Bearer token.

## Why

The user needs a classic backend/frontend architecture to present at the university, with Django on the backend and Angular + React on the frontend, while keeping the Google services already chosen.

## Decisions (user, 2026-11-11)

1. React Native stays for mobile; Angular replaces the Next.js panel. The two frameworks are never mixed in one app.
2. Django **replaces** Cloud Functions (option A). `functions/` is removed once its logic and tests are ported (no zombie code).
3. Google services are kept. Firestore remains the data store; Django uses no SQL database.

4. Domain models are real Python classes in each app's `domain/models.py`, named as in the class diagram (`Usuario`, `Rol`, `Ciudad`, `Ruta`, `Tramo`, `FranjaHoraria`, `FactorDeRiesgo`, `IndiceSeguridad`…), persisted in Firestore through one repository per model. The Django ORM is not used (it has no Firestore backend). Class names follow the Spanish names already used in the TypeScript code; attributes, methods and Firestore fields stay in English, as today.
5. The mobile app's design is improved across the board as part of this feature (T7), not only the audit items.

## Constraints

- No zombie code: remove what a change leaves unused, in the same change.
- The mobile folder path must stay short on Windows (Android build). `D:\RUNCTY\frontend\mobile` is 25 characters, at the documented limit; fall back to `frontend\app` if the native build fails.
- Mobile changes must be JS/TS only (a native module forces rebuilding the installed APK).
- UI copy in Spanish; code, comments and docs of the code in English.
- No `gentle-ai review` flow in this repository (user rule).
- No secrets in git; the service-account JSON lives outside the repo.
- Commits: Conventional Commits, authored only by the user, no AI attribution.

## Security requirements carried into the backend (audit 2026-11-11)

- Verify ID tokens with `check_revoked=True` on every request (closes SEC-03 and NEW-01).
- Deny by default; permission classes mirror `hasPermission`; the `{role, perms}` claims are the only authority.
- For role mutations, re-read the caller's claims from Auth; keep `admin-only`, `permission-escalation`, `self-lockout` and `last-admin`, the last one transactional (NEW-03).
- Edits to system roles are admin-only (NEW-02); reject `setUserRole` when `users/{uid}` is missing (NEW-04).
- The Admin SDK bypasses Firestore rules: every ownership check is re-implemented in the API; client rules become deny-all once the clients stop reading Firestore directly.
- Explicit CORS allowlist, DRF throttling, bounded serializers that reject unknown fields, stable error `reason` codes with no internal details.
- Hardened settings (`DEBUG=False` by default, secret key and hosts from the environment, security headers); non-root container.
- Angular panel: CSP and `frame-ancestors 'none'`, no `bypassSecurityTrust*`.

## Audit findings (2026-11-11, two read-only agents)

These extend `CONTEXTO.md` sections 14.2 and 14.3; none of the earlier UX findings were fixed yet. Paths are relative to the layout before the move.

### Security

| ID | Sev. | Where | Defect | Resolved by |
| --- | --- | --- | --- | --- |
| NEW-01 | High | `functions/src/shared/callable.ts:32-39`, `roleService.ts:201-213` | Role callables trust `role`/`perms` from an ID token valid up to 1 h after demotion: a demoted admin can re-promote themselves. | T1 (`check_revoked`), T2 (re-read claims) |
| NEW-02 | Medium | `roleService.ts:119-134` | A non-admin with `roles.manage` can add permissions they hold to the system `runner` role, pushing them to every runner. | T2 |
| NEW-03 | Medium | `functions/src/shared/lastAdmin.ts:8-11` | The last-admin check counts `users` docs, not claims, and is not transactional (two admins can demote each other). | T2 |
| NEW-04 | Medium | `roleService.ts:165-177` | Role sync and deletion find users only through the doc mirror; an Auth-only account keeps stale claims. | T2 |
| NEW-05 | Medium | `admin/next.config.ts:3-16` | No security headers (CSP, frame-ancestors, HSTS, nosniff). | T6 |
| NEW-06 | Low | `mobile/src/core/firebase/index.ts:24` | Refresh token persisted in unencrypted AsyncStorage. `expo-secure-store` is a native module, so it needs an APK rebuild. | Open decision |
| NEW-07 | Low | `firestore.rules:69` | A deleted account's token can recreate `users/{uid}` for up to 1 h. | T4 (deny-all rules) |
| NEW-08 | Low | `firestore.rules:43`, `:180` | `birthDate` only shape-checked; every signed-in user can read all roles. | T2 (serializer validation, permission on roles) |
| NEW-09 | Low | `docker-compose.yml`, Dockerfiles | No `cap_drop`, `no-new-privileges`, resource limits; images pinned by tag only. | T4 |

Verified as fixed: SEC-05, SEC-06. SEC-02 fixed except NEW-02. SEC-03 and SEC-08 incomplete (NEW-01, NEW-03). No secrets are tracked in git.

### UX, mobile

| ID | Sev. | Where | Problem |
| --- | --- | --- | --- |
| UXN-01 | High | `PreferencesScreen.tsx:88,209` | `key={query.dataUpdatedAt}` remounts the form: scroll jumps away from the success notice and a background refetch wipes an unsaved draft. |
| UXN-02 | High | `RecommendedRoutes.tsx:40-50` | Home shows "Aún no hay rutas" for a load error and for a user without a city. |
| UXN-03 | Medium | `core/ui/Screen.tsx:19-23` | No `KeyboardAvoidingView` anywhere; no "next" chain in the register form. |
| UXN-04 | Medium | `core/ui/SwitchRow.tsx:42-43` | Dark theme: an off switch is nearly invisible (about 1.3:1). |
| UXN-05 | Medium | `core/theme/themes.ts:89-90` | Dark theme: `surface` equals `surfaceElevated`; cards do not separate from the background. |
| UXN-06 | Medium | `EditPersonalDataScreen.tsx:24-29`, `ProfileHomeScreen.tsx:55` | Profile load errors have no retry. |
| UXN-07 | Medium | `core/ui/Screen.tsx:21` | Pull-to-refresh exists only on the routes list. |
| UXN-08 | Medium | `PreferencesScreen.tsx:125`, `EditPersonalDataScreen.tsx:48` | Unsaved changes are discarded silently; saving personal data shows no success notice. |
| UXN-09 | Low | `HomeScreen.tsx:131`, `core/ui/Icon.tsx:22` | Quick-action labels shrink against the font preference; icons ignore `fontScale`. |
| UXN-10 | Low | `ProfileHomeScreen.tsx:89,127` | Raw ISO birth date; sign-out without confirmation. |
| UXN-11 | Low | `CityField.tsx:39-45` | Cities as wrapped chips with no search; three different retry styles. |

### UX, admin panel (apply in the Angular rewrite, T6)

| ID | Sev. | Problem |
| --- | --- | --- |
| UXN-12 | High | Every login lands on `/usuarios`; a role without `users.read` hits a dead end. Land on the first permitted section and add a 403 page. |
| UXN-13 | Medium | The notice after creating a route is lost on navigation. Use a global toast service. |
| UXN-14 | Medium | Esc closes the confirm dialog while the mutation is pending. |
| UXN-15 | Medium | Loading is plain text and errors have no retry. |
| UXN-16 | Low | Cities always offer "Eliminar" and fail on the server; "Limpiar" keeps old results; raw ISO dates. |

Angular panel scope: routes `/login`, `/usuarios`, `/roles`, `/ciudades`, `/rutas`, `/rutas/:id`, plus 403, 404 and a permission-aware landing. Guards: session on `admin.access`; per route `users.read`, `roles.manage`, `cities.manage`, `routes.manage`. Confirmation before every delete with the server error shown in the dialog; system roles cannot be deleted.

### Top priorities for the demo (mobile, all JS/TS only)

1. Emergency button on the three tabs that confirms and dials 911.
2. Resend verification email and refresh the verified state.
3. Preferences: fix save feedback and draft loss; apply units or mark dead groups "Próximamente".
4. Home error and no-city states; pull-to-refresh.
5. Dark theme pass (surfaces, switch, borders).
6. Birth date as three numeric fields; keyboard avoidance and "next" chain.
7. Route card "Factor principal:" prefix; horizontal filter chips.
8. "Abrir en Google Maps" from the route start coordinates via `Linking` (an embedded map needs a native module).
9. Global error boundary and retry on profile errors.

## API contract (v1, replaces callables and direct Firestore access)

Base path `/api/v1`. JSON in camelCase. Errors: `{"error": {"reason", "message"}}` with the same `reason` codes the callables use today (clients already map them to Spanish). The Firestore data model does not change.

| Endpoint | Permission | Replaces |
| --- | --- | --- |
| `GET /me` | signed in | `getIdTokenResult` role read, `onSnapshot users/{uid}.role` |
| `POST /users` | signed in, own uid | client `setDoc users/{uid}` + trigger `onUserDocCreated` (default `runner` claims) |
| `GET /users/me`, `PATCH /users/me` | owner | `firestoreProfileRepository` |
| `DELETE /users/me` | owner, `auth_time` within 300 s | callable `deleteAccount` |
| `GET`, `PUT`, `DELETE /users/me/sport-profile` | owner | `firestoreSportProfileRepository` |
| `GET`, `PUT`, `DELETE /users/me/preferences` | owner | `firestorePreferencesRepository` |
| `GET /users` (filters, `limit`, `cursor`) | `users.read` | callable `searchUsers` |
| `PUT /users/{uid}/role` | `roles.manage` | callable `setUserRole` |
| `GET /roles` | `admin.access` | client `getDocs roles` |
| `POST /roles`, `PUT /roles/{id}`, `DELETE /roles/{id}` | `roles.manage` | callables `createRole`, `updateRole`, `deleteRole` |
| `GET /cities` (`coverage` filter) | public | client queries on `cities` |
| `POST /cities`, `PATCH /cities/{id}`, `DELETE /cities/{id}` | `cities.manage` | client writes + callable `deleteCity` |
| `GET /routes` (`cityId`), `GET /routes/{id}` (with segments) | signed in; inactive routes, time slots and risk factors only with `routes.manage` | `firestoreRouteRepository`, admin `routesRepository` reads |
| `POST /routes`, `PUT /routes/{id}`, `DELETE /routes/{id}` | `routes.manage` | route callables |
| `POST/PUT/DELETE /routes/{id}/segments[/{sid}]` | `routes.manage` | segment callables |
| `POST/PUT/DELETE /routes/{id}/time-slots[/{slotId}]` | `routes.manage` | time-slot callables |
| `POST/PUT/DELETE /routes/{id}/segments/{sid}/risk-factors[/{fid}]` | `routes.manage` | risk-factor callables |

Specs to port (Vitest → pytest): safety 13, time 9, geo 2, reorder 5, inputs 13, routeService 30, roleService 32, permissions 5, authz 5, searchUsers 10, deleteAccount 7, assignDefaultRole 8, deleteCity 5, seedGuard 4. The 47 Firestore-rules tests are replaced by API authorization tests (ownership and permission per endpoint), because the rules become deny-all.

Paths that break on the move: `firebase.json` (`source`, rules), `docker-compose.yml`, `docker/firebase.Dockerfile`, root `.dockerignore`, root `package.json` scripts, `scripts/seed-emulator.ts` imports from `../functions/src`, and the docs (`README.md`, `CONTEXTO.md`, `docs/manual-instalacion-android.md`, `mobile/plugins/with-short-cxx-dir.js:13`).

## Tasks

- [x] **T1 — Backend scaffold.** Django + DRF project in `backend/` with a feature-first hexagonal layout, Firebase integration (Auth, Firestore, Storage, FCM accessors), token authentication, permission classes, error handling, hardened settings, health and `me` endpoints, pytest suite, Dockerfile. Route: delegated writer (2+ non-trivial files).
- [ ] **T2 — Port users, roles and account logic** to Django (profile, sport profile, preferences, roles CRUD, role assignment, user search, account deletion), with the audit fixes NEW-01 to NEW-04 and the Vitest specs ported to pytest.
- [ ] **T3 — Port cities, routes and the safety index** to Django, with the specs ported to pytest.
- [ ] **T4 — Python seed and infrastructure:** seed command in Django, Firebase config under `backend/`, deny-all Firestore rules, Docker Compose with the API service; remove `functions/` and the TypeScript seed.
- [ ] **T5 — Move the app to `frontend/mobile`** and switch its infrastructure layer from Firestore/callables to the Django API.
- [ ] **T6 — Angular admin panel** in `frontend/web` with feature parity (login, users, roles, cities and zones, routes with segments, time slots and risk factors), including the pending panel UX fixes; remove `admin/`.
- [ ] **T7 — Mobile polish** (plan T2 of `auditoria-y-pulido.md` plus the 2026-11-11 UX audit).
- [ ] **T8 — Sprint 3:** support points (EP-06), zone alerts (EP-07), incidents (EP-08), safe-route recommendation (EP-09), on the new architecture.
- [ ] **T9 — Documentation:** `CONTEXTO.md` section 9, `README.md`, installation manual, final verification of all packages.

## Acceptance criteria

- `backend/` and `frontend/` are the only code folders at the repository root; `functions/` and `admin/` no longer exist.
- Every behaviour specified by the current Vitest suites of `functions/` has an equivalent passing pytest test.
- The mobile app and the Angular panel work against the Django API on the local emulators through `docker compose up`.
- Typecheck, lint and tests pass in every package.

## Checks

- Backend: `python -m pytest -q`, `python manage.py check`, `ruff check .`
- Mobile: `npx tsc --noEmit`, `npx jest --silent`, lint
- Web: `ng test`, `ng build`

## Delivery

Forecast: well above 400 authored changed lines (a full backend port and a panel rewrite). Strategy `ask-on-risk`: the chain strategy for pull requests is asked when the user decides to open them; work-unit commits stay on the feature branch meanwhile.

## Progress and evidence

| Task | Route | Commit | Checks observed |
| --- | --- | --- | --- |
| (baseline) | inline | `876f377`, `7d36585` | mobile 257 tests, admin 60, functions 186, typecheck clean in all three |
| T1 | delegated writer (2+ non-trivial files) | `e367449` | pytest 80 passed (re-run by the parent), ruff clean, `manage.py check` clean with `DJANGO_DEBUG=true`, `check --deploy` 1 warning left on purpose (W021, HSTS preload). Not done: `backend/.env.example` (a permission rule blocks `.env*` writes; the user creates it from the README), Docker image not built (daemon off). |
| T2 (partial) | delegated writer | `002dbe4`, `df41091`, `488674c` | Not re-run in the 2026-11-12 session. Remaining: user search and account deletion, in progress and uncommitted when the branch was first pushed. |

## Decisions taken by the parent after T1

- Failed-authentication throttling: add a per-IP throttle that runs before authentication (T2).
- Throttle counters stay in process memory for the pilot; a shared cache is a deployment concern.
- HSTS preload stays off (it commits the whole domain).
- Validation errors carry per-field details: `{"error": {"reason": "invalid-argument", "message", "fields": {name: reason}}}`.
- Python stays at 3.10 (the version installed on the team machine); Google's libraries warn it is out of support, so moving to 3.12 is a follow-up for deployment.
- Direct dependencies are pinned; no full lock file for now.
