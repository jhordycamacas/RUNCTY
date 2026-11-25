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
- [ ] T2 Frontend Angular + Ionic: `core/` (models, API services, config) and `paginas/` (list, form, detail per entity), routes,
      menu by module, backend validation errors shown in forms, RUNCTY design tokens, `npm run build` and tests green. Route: delegated (writer).
- [ ] T3 Android: Capacitor app `RUNCTY`, `10.0.2.2:8000`, cleartext, debug APK. Route: delegated (writer).
- [ ] T4 Documents: README for the branch and Word "Requisitos, trazabilidad y evidencias" with the matrix and screenshot slots. Route: inline.
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

## Next step

T2.
