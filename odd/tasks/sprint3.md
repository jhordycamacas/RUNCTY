# Sprint 3: puntos de apoyo, alertas de zona, incidentes y rutas seguras

**Objetivo:** implementar las 23 historias del Sprint 3 del backlog: EP-06 (RF-06-1 a RF-06-8), EP-07 alertas de zona (RF-07-12 a RF-07-15), EP-08 (RF-08-1 a RF-08-8) y EP-09 (RF-09-1 a RF-09-3), en backend, admin web y app del corredor.

**Por qué:** el usuario pidió completar el Sprint 3 del backlog "de una vez" (2026-11-22), siguiendo SDD: las specs mandan.

**Decisiones:** sección «Decisiones de diseño (2026-11-22)» de las specs 06, 07, 08 y 09 (tipos de incidente, efecto en el índice, cercanía 500 m, tolerancia ±20 %, permisos `routes.manage`, contratos de API).

**Patrones a copiar:** backend `backend/apps/routes/` y `backend/apps/cities/` (domain, application, infrastructure, presentation; repositorios por ruta punteada en `config/settings.py`; fakes en `backend/tests/`); admin `frontend/src/app/admin/routes/`; corredor `frontend/src/app/routes/`. Gancho del índice: `ExtraPenalty` en `backend/apps/routes/domain/safety.py`, hoy sin usar en `_with_recalc`.

## Tareas

- [ ] T1 — Backend EP-08: fuentes e incidentes (CRUD, validaciones, filtros) y penalización de incidentes en el índice con recálculo. Pruebas.
- [ ] T2 — Backend EP-06: puntos de apoyo (con cercanía) y resguardos (sin solape). Pruebas.
- [ ] T3 — Backend EP-07: alertas de zona (CRUD y vigentes). Pruebas.
- [ ] T4 — Backend EP-09: solicitudes de ruta segura con recomendación en el servidor. Pruebas.
- [ ] T5 — Seed y `firestore.rules` (deny-all) de las colecciones nuevas.
- [ ] T6 — Admin: incidentes y fuentes, puntos de apoyo y resguardos, alertas de zona.
- [ ] T7 — Corredor: alertas vigentes (pestaña Alertas), puntos de apoyo y resguardos en el detalle de ruta, solicitud de ruta segura con historial.
- [ ] T8 — Verificación de punta a punta y specs (estados, criterios, `specs/README.md`, `CONTEXTO.md`).

## Checks

- Backend (desde `backend/`): `.venv/Scripts/python -m pytest -q`, `.venv/Scripts/ruff check .`, `.venv/Scripts/ruff format --check .`.
- Frontend (desde `frontend/`): `npx.cmd ng test --watch=false`, `npx.cmd ng lint`, `npx.cmd ng build`.

## Progreso

- 2026-11-22: decisiones de diseño escritas en las specs 06, 07, 08 y 09; documento creado.
