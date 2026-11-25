# RUNCTY_INGWEB: Django + MySQL + Angular/Ionic per the course guide

## Objective

Rebuild RUNCTY on the branch `RUNCTY_INGWEB` so it meets the rubric "Aplicación del reto (Django, Angular y Android)":
Django models with relations and validations, migrations applied in MySQL, serializers, views and routes per entity,
configured Django admin, `.env` credentials, `/api/docs/`, an Angular + Ionic app with `core/` and `paginas/`
(list, form and detail page per entity), an Android app named RUNCTY that talks to `10.0.2.2:8000`, full CRUD
end to end for every entity of the requirements document (24 RF), and a requirements document with a traceability matrix.

## Problem and why

`main` stores data in Firebase/Firestore: no Django models, no migrations, no MySQL, no `/api/docs/`, and only RF-01, 02, 04
and 05 have full CRUD end to end. The rubric grades exactly those missing pieces (criteria 1 and 4 = 6 of 10 points).
Decision of the owner (2026-11-24): rebuild following the course guide (reference project
`C:\Users\usuario\proyectos\SeguimientoRetos`), reusing RUNCTY's design tokens and the safety index rule. `main` stays intact.

## Scope

- In: new `backend/` (Django 5.2 + DRF + MySQL 8.4 + drf-spectacular), new `frontend/` (Angular + Ionic + Capacitor Android),
  requirements and traceability document (Word), README.
- Out: Firebase Auth/Firestore/FCM, real push notifications, real-time location streaming, payments, map provider keys.
- Removed on this branch (replaced, no zombie code): old `backend/`, `frontend/` (incl. `frontend/mobile`), `admin/`, `functions/`,
  Firebase files (`firebase.json`, `.firebaserc`, `firestore.*`, `storage.rules`), `docker/`, `docker-compose.yml`, `deploy/`,
  root `package.json`/`package-lock.json` and `scripts/` when they only serve the removed code.

## Constraints

- Commits: Conventional Commits, author `jhordycamacas` only, no AI attribution.
- The assistant cannot create or edit `.env` files: the owner creates `backend/.env` from `backend/.env.example`.
- MySQL 8.4 service `MySQL84` on port 3307; database `runcty`, user `runcty_app` (created by the owner with root, script `backend/sql/01_crear_base.sql`).
- Windows: keep the repo path short (`D:\RUNCTYINGWEB`) for the Android build.
- Screenshots are taken by the owner (the assistant cannot capture the screen here).

## Data model (entity per requirement)

| RF | Django app | Models |
| --- | --- | --- |
| RF-01 | usuarios | Usuario, PerfilDeportivo (1:1), Preferencia (1:1) |
| RF-02 | usuarios | Rol (Usuario.rol FK) |
| RF-03 | seguridad_personal | ContactoConfianza (FK Usuario) |
| RF-04 | ciudades | Ciudad, Zona (FK Ciudad) |
| RF-05 | rutas | Ruta (FK Ciudad), Tramo (FK Ruta) |
| RF-06 | rutas | PuntoApoyo, SenderoResguardado |
| RF-07 | seguridad | FranjaHoraria (FK Ruta, no overlap), FactorRiesgo (FK Tramo), AlertaZona (FK Zona); safety index computed |
| RF-08 | seguridad | Incidente, FuenteInformacion |
| RF-09 | seguridad | SolicitudRutaSegura (recommendation ordered by safety) |
| RF-10 | comunidad | Favorita, Valoracion (1-5 x3, unique user+route) |
| RF-11 | clubes | RutaClub (FK Club, Ruta) |
| RF-12 | entrenamiento | Entrenamiento (GPS points JSON, computed pace) |
| RF-13 | entrenamiento | Meta |
| RF-14 | comunidad | Reto |
| RF-15 | seguridad_personal | AlertaPanico (Activa/Atendida/Cancelada; needs 1+ contacto) |
| RF-16 | seguridad_personal | UbicacionCompartida |
| RF-17 | comunidad | ReporteComunitario (Pendiente/Aprobado/Rechazado/Resuelto) |
| RF-18 | comunidad | Notificacion |
| RF-19 | clubes | Club, Membresia (Pendiente/Aceptada/Activa/Suspendida) |
| RF-20 | clubes | PuntoEncuentro |
| RF-21 | clubes | SalidaGrupal (cupo) |
| RF-22 | comunidad | SolicitudCompanero |
| RF-23 | eventos | Evento, Inscripcion |
| RF-24 | publicidad | Anunciante, Campana (vigencia) |

## Tasks

- [x] T1 Backend Django + MySQL: settings from `.env`, apps and models above with validations, migrations, serializers,
      ViewSets and routers under `/api/`, admin, `/api/docs/` (Swagger) and `/api/schema/`, CORS for web and Android,
      seed command with Loja data, tests of status codes (200, 201, 204, 400, 404) per entity. Route: delegated (writer; 2+ non-trivial files).
- [x] T2 Frontend Angular + Ionic: `core/` (models, API services, config) and `paginas/` (list, form, detail per entity), routes,
      menu by module, backend validation errors shown in forms, RUNCTY design tokens, `npm run build` and tests green. Route: delegated (writer).
- [x] T3 Android: Capacitor app `RUNCTY`, `10.0.2.2:8000`, cleartext, debug APK. Route: delegated (writer).
- [x] T4 Documents: README for the branch and Word "Requisitos, trazabilidad y evidencias" with the matrix and screenshot slots. Route: inline.
- [ ] T5 Push branch `RUNCTY_INGWEB` to GitHub.

## Acceptance criteria

- `python manage.py migrate` creates every table in MySQL; `python manage.py test` green; `/api/docs/` loads.
- Every entity: GET list/detail 200, POST 201, PUT/PATCH 200, DELETE 204, invalid data 400, missing id 404.
- `npm run build` without errors; every entity has list, form and detail pages reachable from the menu.
- The APK installs as RUNCTY and loads data from `10.0.2.2:8000`.
- No `.env`, `node_modules`, `dist`, `.venv` in git.

## Progress and evidence

- 2026-11-24: cloned into `D:\RUNCTYINGWEB`, branch `RUNCTY_INGWEB` created from `026211b`. Engram mirror: pending (Engram tools unavailable in this session).

- 2026-11-24 T1 (delegated writer): commits `d349236` (remove Firebase stack), `051e458` (models + migrations, 10 apps,
  36 models), `20f7327` (serializers, ViewSets, routers under `/api/`, admin, `/api/docs/`, `/api/schema/`, `seed`),
  `10ced42` (tests). Verification with `DB_ENGINE=sqlite` (MySQL `runcty` not created yet): `manage.py check` no issues;
  `makemigrations --check --dry-run` no changes; `manage.py test` 324 tests OK; `spectacular --validate --fail-on-warn` 0 warnings,
  0 errors. RED observed by disabling the franja-overlap and panic-contact rules (both tests failed 201 != 400), then GREEN.
  Pending for the owner: run `sql/01_crear_base.sql` as root, create `backend/.env`, `migrate` and `seed` against MySQL.
  Note: rule "valorar solo si la recorrió" not enforced (only one valoracion per user+route).

- 2026-11-24 T2 (delegated writer): commits `35f248e` (remove old Firebase Angular app), `6265111` (core: `api.config.ts`,
  `modelos.ts` with 36 interfaces, generic `CrudService<T>` + typed `ApiService` registry, `entidades.ts` metadata derived
  from `/api/schema/`, `errores.ts`), `0e9233f` (108 thin pages `<entidad>-lista|form|detalle.page.ts` in 10 module folders,
  shared metadata-driven lista/formulario/detalle components in `paginas/compartido/`, `inicio.page.ts`, ruta detail with
  safety index per franja and Alto/Medio/Bajo badges, solicitud-ruta-segura form showing `rutas_recomendadas`, side menu
  with `ion-split-pane`, lazy routes `/inicio`, `/<endpoint>`, `/<endpoint>/nuevo`, `/<endpoint>/:id`, `/<endpoint>/:id/editar`).
  Same versions as the reference (Angular 22.2, Ionic 9.0.10, Capacitor 8.6, Vitest). Initial budget warning raised
  500 kB -> 1.5 MB (bundle 1.21 MB raw / 224 kB transfer); error limit stays 2 MB.
  Verification: `npm run build` OK without warnings (Initial total 1.21 MB); `npx ng test --watch=false` 6 files, 22 tests
  passed (errores mapping, CrudService URL/params, api.config base URL, formulario body/validation, RutaFormPage shows the
  backend 400 message under `nombre`, ruta list/detail render). Tests written alongside the code; no RED observed.
  CORS: `curl -H "Origin: http://localhost:8100" /api/rutas/` -> 200 with `access-control-allow-origin: http://localhost:8100`.
- 2026-11-24 T3 (delegated writer): commit `433637d`. `capacitor.config.ts` appId `ec.runcty.ingweb`, appName `RUNCTY`,
  `androidScheme: 'http'`, `cleartext: true` (reference approach) plus `usesCleartextTraffic` and
  `res/xml/network_security_config.xml` (10.0.2.2, localhost, 127.0.0.1). `gradlew.bat assembleDebug` with JDK 21:
  BUILD SUCCESSFUL; `frontend/android/app/build/outputs/apk/debug/app-debug.apk` (4,996,801 bytes); `aapt dump badging`:
  `application-label:'RUNCTY'`, package `ec.runcty.ingweb`. Build outputs stay ignored (git ls-files has no node_modules,
  dist, www, app/build, .apk, .env). Not verified here: install/run in the emulator (owner), live browser console check.
  Known gaps: default Capacitor launcher icon (not the RUNCTY logo); clearing an optional number on edit is not possible
  (empty optional numbers are omitted so backend defaults apply). Engram mirror: pending.
- 2026-11-24 follow-up (delegated writer): commit `95a1e2f` `seed` now loads coherent Loja data for all 36 models
  (6 usuarios, 2 ciudades, 2 clubes, 3 eventos, etc.; only users with a contacto de confianza have panic alerts, club
  routes in the club's city, inscriptions only in open events with free spots, no future incidents, no self retos or
  solicitudes; route factors unchanged so safety levels stay the same). New test runs seed twice, asserts the 36 models
  have rows, identical counts, and `full_clean()` passes on every seeded row. Commit `1e4eac5` neutral wording:
  empty list "Todavía no hay registros de <plural>. Pulsa + para agregar el primero.", form header "Agregar: <Entidad>",
  FAB aria-label "Agregar <entidad>"; new spec `paginas/compartido/lista-entidad.spec.ts`.
  Verification: `manage.py test` (sqlite) 325 tests OK; MySQL `seed` twice: identical counts, every model >= 1
  (e.g. Usuario=6, Tramo=13, FranjaHoraria=10, FactorRiesgo=8, Inscripcion=4, Campana=3); `ng test` 7 files, 23 tests
  passed; `npm run build` OK, 0 warnings.
- 2026-11-24 T4 (inline): MySQL database `runcty` and user `runcty_app` created with root; `migrate` and `seed` applied
  on MySQL; `manage.py test` on MySQL: 325 tests OK. Evidence in `docs/evidencias/` taken from real runs: MySQL queries
  (SHOW TABLES, DESCRIBE, JOIN), Swagger, Django admin, real CRUD request sequences (201/200/200/200/204/404/400) for
  rutas, usuarios, clubes, eventos and the franja overlap rule, per-entity CRUD test matrix (36 entities x 8 operations),
  web pages with Playwright (0 console errors except the expected 400), the 36 entity lists (`docs/evidencias/web/`),
  and the Android emulator (Pixel7_API36) with `adb screencap`: data loaded from 10.0.2.2:8000, backend 400 shown under
  the field, create (201) and delete (204, then API 404) from Android. Terminal images are rendered from the real
  command output (the screen capture of the desktop is blocked in this environment). Fix `545242d`: gender-neutral
  toasts. Word + PDF `docs/RUNCTY_Requisitos_Trazabilidad_Evidencias.*` (31 pages, validator passed): requirements,
  architecture, traceability matrix (24 RF), 26 numbered captures and Annex A. Root README rewritten for this branch.
  Known scope notes in the matrix (*): RF-10 "only if run" not enforced; RF-12 no live GPS; RF-15 no SMS/push;
  RF-16/RF-18 records only, no real time or push.

## Next step

T5: push `RUNCTY_INGWEB`. Owner: create `backend/.env` from `.env.example` (DB password given in the session) to run the server without inline env vars.
