# Feature: Single frontend (Angular + Ionic + Capacitor) on a Django backend

> Specs (SDD): [Architecture](../../specs/transversal/arquitectura.md)

- **Started:** 2026-11-13
- **Supersedes:** the frontend decisions of `odd/tasks/django-angular-architecture.md` (React Native mobile + separate Angular panel). Its backend decisions, API contract and audit findings stay valid.
- **Engram mirror:** `odd/single-frontend-ionic/tasks` — **pending** (Engram tools unavailable in this session)

## Objective

RUNCTY has exactly two code folders:

- `backend/`: Django REST API. It is the only server-side component and talks to Google services (Firebase Auth, Firestore, Storage, FCM) through `firebase-admin`. No SQL database, no Django ORM.
- `frontend/`: ONE Angular + Ionic + Capacitor application that serves the web (browser) and Android (APK built by Capacitor). It replaces `frontend/mobile` (React Native), `admin/` (Next.js) and the planned `frontend/web`.

`functions/` (Cloud Functions) is removed once Django reaches parity.

## Why

The course engineer asked for a single Angular + Ionic frontend for web and mobile. The reference project `seguimiento_retos` uses Django + Angular 22 + Ionic + Capacitor.

## Decisions (user, 2026-11-13)

1. Architecture, fixed: Django backend connected to Google services; one Angular + Ionic frontend. Do not drift from it.
2. React Native and Expo/Metro are dropped. Dev flow: `ng serve` in the browser; on the phone `ionic cap run android -l --external` (live reload) or `npx cap sync android` + Gradle build.
3. One project, two areas with independent layout and theme: `/app/...` (runner, mobile-first) and `/admin/...` (administrator, desktop-first), lazy-loaded. Shared: API client, auth, base components, design tokens (overridable per area).
4. Full migration in this feature: port all screens, delete `frontend/mobile`, `admin/` and `functions/` only after parity (no zombie code).
5. Firebase Auth stays on the client only to sign in; the ID token goes to Django as `Bearer`.

## Constraints

- Frontend: Angular 22 standalone components, Ionic, Capacitor 8, TypeScript strict; Node 22.23 and Java 21 are installed.
- Keep the clean layering (`domain` / `application` / `infrastructure` / `presentation`) per feature; reuse the TypeScript `domain` and `application` code from `frontend/mobile`.
- UI copy in Spanish; code, comments and code docs in English.
- No secrets in git; `.env` files are never created or read by the assistant.
- Conventional Commits, authored only by the user, no AI attribution. No `gentle-ai review` in this repository.
- Keep the repo path short on Windows (`D:\RUNCTY`).

## Tasks

- [x] **S1 — Backend: cities, routes and safety index (old T3).** Port `functions/src/{cities,routes}` and their specs to Django (pytest), following the API contract in the previous task file. Branch `feat/backend-cities-routes`.
- [x] **S2 — Backend infrastructure (old T4, first half).** Python seed (Django management command) replacing `scripts/seed-emulator.ts`, Docker Compose with the API service, Firebase emulator config. `functions/`, `admin/`, `frontend/mobile` and the current Firestore rules stay untouched until S6, because the old clients still use them.
- [x] **S3 — Frontend scaffold.** `frontend/` with Angular 22 + Ionic + Capacitor; design tokens and themes; `/app` and `/admin` areas; API client with Bearer token and error-reason mapping; Firebase Auth sign-in; guards; test setup.
- [x] **S4 — Runner area.** Port auth, account, preferences, sport profile, cities and routes from `frontend/mobile` to Angular + Ionic.
- [ ] **S5 — Admin area.** Users, roles, cities, routes (segments, time slots, risk factors) with the pending panel UX fixes.
- [ ] **S6 — Cleanup, Android and docs.** Delete `frontend/mobile`, `admin/` and `functions/` (with the TypeScript seed); switch Firestore rules to deny-all; verify web build and APK; update `CONTEXTO.md` (section 9 and 16), `README.md`, `docs/manual-instalacion-android.md`, root scripts and Docker; push.

## Acceptance criteria

- Only `backend/` and `frontend/` remain as code folders.
- Every behaviour specified by the `functions/` Vitest suites has a passing pytest equivalent.
- The Angular + Ionic app works in the browser and as an APK against the Django API.
- Typecheck, lint and tests pass in both packages.

## Checks

- Backend: `python -m pytest -q`, `ruff check .`, `ruff format --check .`, `python manage.py check`
- Frontend: `ng test`, `ng build`, `npx cap sync android`, `gradlew assembleDebug`

## Delivery

Forecast far above 400 authored changed lines. One work-unit commit per task on a feature branch; the user decides when to push and open pull requests (here the user asked to leave everything pushed at the end).

## Progress and evidence

| Task | Route | Commit | Checks observed |
| --- | --- | --- | --- |
| S1 | delegated writer (2+ non-trivial files) | `1caa6bd`, `6d5a2e2`, `57b92b4`, `48c79d6` | Re-run by the parent: pytest 720 passed (baseline 382), `ruff check` clean. Writer also reported `ruff format --check` clean and `manage.py check` clean. RED observed first in each step. All specs mapped (safety 13, time 9, geo 2, reorder 5, inputs 13, routeService 30, deleteCity 5). |
| S2 | delegated writer (2+ non-trivial files) | `5da6a1f`, `630a903` | pytest 748 passed (baseline 720), `ruff check` and `ruff format --check` clean, `manage.py check` clean, `docker compose config` valid. RED observed first (collection error, module missing). Real run against the Auth and Firestore emulators: the Python seed twice (idempotent) and the TypeScript seed on a wiped emulator produce an identical dump of 52 documents (timestamps and the admin uid masked). Docker daemon was off: images were NOT built and the `api` and `seed` containers were NOT run. |
| S3 | delegated writer (2+ non-trivial files) | `4488be5`, `2b9d074`, `c690d1f`, `0d3a951`, Android platform commit | `ng test` 51 passed (6 files), `ng lint` clean, `ng build` OK (initial 907 kB raw, 210 kB transfer), `cap sync android` OK, `gradlew assembleDebug` BUILD SUCCESSFUL with JDK 21, `app-debug.apk` 5.1 MB. Backend: pytest 753 passed (baseline 748, +5 CORS tests), `ruff check` and `ruff format --check` clean. `ng serve` served index.html (HTTP 200). RED observed first only for the API error mapper; the other specs were written together with their code. Not done: no browser/e2e run of login against the emulators (browser tool unavailable). |
| S4a | delegated writer | `add05a1`, `439b6fa`, preferences and account deletion commit | `ng test` 240 passed (32 files; baseline 51), `ng lint` clean, `ng build` OK (initial 1.09 MB raw, 232 kB transfer). Routes under `/app`: `inicio`, `cuenta`, `cuenta/{datos,deportivo,preferencias,contrasena,eliminar}`; public `/login`, `/registro`, `/recuperar`. Specs were written with the code (no RED run). NOT verified: no browser run (Chrome extension not connected), no run against the emulators/Django, no APK rebuild, the city modal and Ionic overlays only in jsdom. |
| S4b | delegated writer | `21f094c`, `00920a1`, `518e0be` | `ng test` 339 passed (47 files; baseline 240), `ng lint` clean, `ng build` OK (initial 1.12 MB raw, 238 kB transfer; warning budget 1.2 MB), `cap sync android` OK, `gradlew assembleDebug` BUILD SUCCESSFUL with JDK 21, `app-debug.apk` 5.4 MB. Specs were written with the code (no RED run), except one store bug found by its own spec (a route-not-found state stuck after a later network error) and fixed. NOT verified: no browser run against the emulators/Django, no run on a device or emulator (so `tel:911` opening the dialer and the Maps link leaving the WebView are untested), the sticky SOS button and the sideways chips only in jsdom (no visual check, no overlap check with long toolbar titles). |

## Decisions taken in S4b

- Routes live in `src/app/routes/{domain,application,infrastructure,presentation}`; the fixed training slots in `src/app/training`; the emergency button in `src/app/emergency` and is mounted in `RunnerShell`, outside `ion-tabs`, so it is on every tab and sub-screen. It is a fixed top-right 48px "SOS" button (`--rc-primary` on `--rc-on-primary`), its accessible name is "SOS, llamar al 911 de emergencias", it asks with `ConfirmDialog` and then sets `location.href = 'tel:911'` through `PhoneDialer`. No server call. Android opens the dialer (it does not place the call); to be confirmed on a device.
- The old Firestore mappers became tolerant API mappers (`toRoute`, `toSegment`, `toRouteDetail`); ids come from the payload. `GET /routes/{id}` already embeds the segments, so there is no separate segments endpoint and the detail page uses one request. A `route-not-found` 404 shows "Esta ruta ya no está disponible".
- State: `RoutesStore` (root; routes of the requested city, dropped on user or city change), `RunnerCity` (loading, error, no-city, ready: the city from the profile checked against the active catalogue), `CityRoutes` (combines both into the states Home and the Rutas tab render: loading, error with retry, no-city, empty, ready), `RouteDetailStore` (provided per detail page). A failed load is never shown as "Aún no hay rutas" (UXN-02).
- Safety wording: `Seguridad: Alto|Medio|Bajo` badge (icon + text + colour) per time slot, factor severity as text ("Severidad alta"), the card line is "Factor principal: <tipo> en <tramo>" (first factor of the slot, as the backend orders them), and the detail always carries the "no garantiza seguridad absoluta" notice. A spec asserts the labels never contain "segura"/"insegura".
- Units: distances and the sport-profile style summary use `formatDistance`; elevation shows `m` or `ft`; segment lengths show `m`/`km` or miles. The distance filter buckets stay in kilometres ("Hasta 5 km", ...) whatever the preference is.
- The selected time slot travels from the list to the detail as the `franja` query param ("05:00-07:00"); when the chosen window no longer exists, or none was chosen, the window of the current or next training slot is used (`resolveSlotKey`), falling back to the first window.
- Filters are three `ChoiceChips` rows (time slot, distance, difficulty) that scroll sideways; the component exposes a radio group (`role=radio`, `aria-checked`). Pull-to-refresh uses `ion-refresher` on the list.
- Home shows up to 3 routes (best score for the next slot first, then shortest) and a "Ver todas las rutas" button; the old "Rutas seguras" placeholder and its own city handling were removed.
- Ported tests keep every behaviour of the old Jest suites (catalog filters, slots, ordering, mappers, labels, training slots, list/detail/recommended states) plus new ones for the stores, repository, card, units and the emergency flow.

## Decisions taken in S4a

- No zod: the ported rules are pure functions returning the Spanish message (`validatePassword`, `validateBirthDate`, `parseSportProfileForm`...), same messages and behaviours as the old Jest tests. Pages recompute `validateX(formValues)` and show a message once the field is touched or a submit was tried.
- Features live in `src/app/{auth,account,sport-profile,preferences,cities}` (domain/application/infrastructure/presentation); ports are abstract classes bound in `app.config.ts`. `runner/` keeps the shell, Home and routes.
- Sign-up: Firebase `signUp`, `POST /users`, delete the Firebase user if that fails, non-blocking verification email, then `AuthService.refreshSession()` (forced token so the new `runner` claim arrives). Banner "Ya verifiqué" uses the same method.
- Delete account: reauthenticate, force a new ID token, `DELETE /users/me`; `recent-sign-in-required` shows "confirma tu contraseña de nuevo".
- `PreferencesStore` starts with the app (`provideAppInitializer`): device copy first (localStorage per uid), then API; defaults on sign-out. Appearance sets `data-theme`, font size sets `--rc-font-scale` (root font size). Notifications and location privacy are saved but marked "Próximamente". Units apply through `formatDistance` (sport profile summary now); pace stays min/km.
- Tokens: new `--rc-control-border` (3:1) for inputs, toggles, checkboxes; dark surfaces now step background < surface < elevated and the dark border is lighter than elevated. `tokens.spec.ts` parses the SCSS and checks the contrast.
- Initial bundle grew to 1.09 MB (more Firebase Auth functions); warning budget raised to 1.2 MB, error stays 1.5 MB.
- Change password (not in the S4a list) was ported too, as it existed in the old app.
- Birth date uses three numeric fields (own component); the city is a searchable modal.

## Decisions taken in S3

- Angular 22 zoneless (CLI default), Ionic 9 (`@ionic/angular` 9.0.11: components import from `@ionic/angular`, there is no `/standalone` subpath), Vitest through `ng test`, ESLint via `angular-eslint`. Angular project name `runcty-frontend`; build output `dist/runcty-frontend/browser` (Capacitor `webDir`).
- `npm audit` reports 4 high advisories in `@grpc/grpc-js` through `firebase` (Firestore, unused on the client). `@ionic/cli` is not a dependency (it brought critical advisories); use the global `ionic`.
- Environments: development derives hosts from `location.hostname` (works with live reload on a phone); `environment.prod.ts` is placeholders.
- CORS: Capacitor origins are always allowed in `settings.py`; `localhost:8100` and `:4200` only with `DJANGO_DEBUG=true`.
- Guards take no arguments so they serve as `canMatch` (lazy area bundles are not downloaded without access) and `canActivate`. Admin sections `usuarios`, `roles`, `ciudades`, `rutas` are placeholders; `/admin` redirects to the first permitted one (UXN-12).
- Fonts are TTF (only format available locally), about 1.3 MB in the APK; convert to WOFF2 later if size matters.

## Decisions taken in S2

- `manage.py seed` lives in the new app `apps/seed` (domain: guard and data; application: use case and port; infrastructure: Firebase account adapter). It needs `DJANGO_DEBUG=true` (settings refuse emulator hosts otherwise) and a `demo-*` project id; unlike the TypeScript seed it does not default the project id.
- System roles moved to `apps/roles/domain/system_roles.py`; the admin profile `createdAt` is written once instead of on every run.
- Compose: `api` (127.0.0.1:8000, debug mode, CORS for `localhost:4200` and `localhost:8100`) and a one-shot `seed` that reuses the `runcty-api` image. All services drop capabilities, set `no-new-privileges` and have memory, CPU and pid limits; `api` and `seed` are read-only. Python and Node base images are pinned by digest. `admin/Dockerfile` is outside this task, so `admin` got only the compose-level hardening.
- Root scripts: `npm run seed` and `npm run api` run Django from `backend/` and need the venv active. `scripts/seed-emulator.ts` stays until S6.

## Decisions taken in S1 (clients must follow them in S3 to S5)

- Creates return 201 `{"id"}`; route, segment, time-slot and risk-factor PUT/DELETE return 204; city POST returns the city (201) and PATCH returns it (200). Optional fields appear as `null`.
- New city reason codes: `invalid-city-name`, `invalid-city-province`, `invalid-city-type`, `invalid-city-location`, `invalid-coverage`, `invalid-parent-city`, `city-exists` (409). Route reason codes are unchanged.
- City PATCH accepts only `name`, `province`, `location`, `coverage`, `parentCityId`; a zone's parent must be a city, not another zone.
- An inactive route answers 404 `route-not-found` to users without `routes.manage`. The computed `safety` is visible to every signed-in user; `timeSlots` and `riskFactors` need `routes.manage`.
- `GET /cities` is public, but a bad token that is sent still gets 401.
- One repository covers the whole route aggregate (route, segments, slots, factors) because a mutation needs a single Firestore transaction; this bends "one repository per model".
- S2/S6 notes: `scripts/seed-emulator.ts` imports `functions/src/routes/domain/*` and `firestore.rules` still holds the city rules.

## Pause note (2026-11-13)

S5a was stopped by the user mid-task. Only `8f69aac` (admin shared feedback and confirmation) is committed; the unfinished users and roles screens were saved in a git stash (`wip S5a admin users roles`) and are not on `main`. S5a, S5b and S6 remain open. CONTEXTO.md section 17 holds the current state.
