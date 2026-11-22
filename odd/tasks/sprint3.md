# Sprint 3: puntos de apoyo, alertas de zona, incidentes y rutas seguras

**Objetivo:** implementar las 23 historias del Sprint 3 del backlog: EP-06 (RF-06-1 a RF-06-8), EP-07 alertas de zona (RF-07-12 a RF-07-15), EP-08 (RF-08-1 a RF-08-8) y EP-09 (RF-09-1 a RF-09-3), en backend, admin web y app del corredor.

**Por qué:** el usuario pidió completar el Sprint 3 del backlog "de una vez" (2026-11-22), siguiendo SDD: las specs mandan.

**Decisiones:** sección «Decisiones de diseño (2026-11-22)» de las specs 06, 07, 08 y 09 (tipos de incidente, efecto en el índice, cercanía 500 m, tolerancia ±20 %, permisos `routes.manage`, contratos de API).

**Patrones a copiar:** backend `backend/apps/routes/` y `backend/apps/cities/` (domain, application, infrastructure, presentation; repositorios por ruta punteada en `config/settings.py`; fakes en `backend/tests/`); admin `frontend/src/app/admin/routes/`; corredor `frontend/src/app/routes/`. Gancho del índice: `ExtraPenalty` en `backend/apps/routes/domain/safety.py`, hoy sin usar en `_with_recalc`.

## Tareas

- [x] T1 — Backend EP-08: fuentes e incidentes (CRUD, validaciones, filtros) y penalización de incidentes en el índice con recálculo. Pruebas.
- [x] T2 — Backend EP-06: puntos de apoyo (con cercanía) y resguardos (sin solape). Pruebas.
- [x] T3 — Backend EP-07: alertas de zona (CRUD y vigentes). Pruebas.
- [x] T4 — Backend EP-09: solicitudes de ruta segura con recomendación en el servidor. Pruebas.
- [x] T5 — Seed y `firestore.rules` (deny-all) de las colecciones nuevas.
- [ ] T6 — Admin: incidentes y fuentes, puntos de apoyo y resguardos, alertas de zona.
- [ ] T7 — Corredor: alertas vigentes (pestaña Alertas), puntos de apoyo y resguardos en el detalle de ruta, solicitud de ruta segura con historial.
- [ ] T8 — Verificación de punta a punta y specs (estados, criterios, `specs/README.md`, `CONTEXTO.md`).

## Checks

- Backend (desde `backend/`): `.venv/Scripts/python -m pytest -q`, `.venv/Scripts/ruff check .`, `.venv/Scripts/ruff format --check .`.
- Frontend (desde `frontend/`): `npx.cmd ng test --watch=false`, `npx.cmd ng lint`, `npx.cmd ng build`.

## Progreso

- 2026-11-22: decisiones de diseño escritas en las specs 06, 07, 08 y 09; documento creado.
- 2026-11-22 T1 (delegada, un escritor): app `backend/apps/safety_data`; `GET/POST /information-sources`, `GET/PUT/DELETE /information-sources/{id}`, `GET/POST /safety-incidents` (filtros `routeId`, `segmentId`, `type`, `from`, `to`), `GET/PUT/DELETE /safety-incidents/{id}`, todo con `routes.manage`. `RouteState.incidents` se lee en la transacción (`safetyIncidents` por `routeId`) y `with_recalc` suma `ExtraPenalty(source="incident")` (12 meses, ±1 h, severidad por tipo); borrar una fuente marca `sourceDeleted` y recalcula. Almacén genérico `shared/infrastructure/firebase/documents.py`. Pruebas: `test_safety_data_api.py` (76), `test_safety_data_domain.py` (12), `test_firestore_document_store.py` (3), `test_firestore_route_adapters.py` ampliada.
- 2026-11-22 T2: app `backend/apps/support_points`; `GET/POST /support-points` (filtros `cityId`, `routeId` a ≤ 500 m, `lat`+`lng`+`radiusM`), `GET/PUT/DELETE /support-points/{id}`, `GET/POST /guarded-trails` (filtro `routeId`), `GET/PUT/DELETE /guarded-trails/{id}`; lectura con sesión, escritura con `routes.manage`; sin solape por ruta+tramo+día. Pruebas: `test_support_points_api.py` (51).
- 2026-11-22 T3: app `backend/apps/risk_alerts`; `GET/POST /risk-zone-alerts` (filtros `cityId`, `routeId`, `active=true` con hora local UTC-5), `GET/PUT/DELETE /risk-zone-alerts/{id}`. Pruebas: `test_risk_alerts_api.py` (37).
- 2026-11-22 T4: app `backend/apps/safe_routes`; `POST /safe-route-requests` → `201 {id, routes}`, `GET` (las del corredor), `GET/DELETE /safe-route-requests/{id}` (solo el dueño; ajeno = 404). Regla `recommend` en el dominio (±20 %, puntaje de la franja que se solapa, la peor si hay varias; sin índice al final). Pruebas: `test_safe_routes.py` (16).
- 2026-11-22 T5: seed con 2 fuentes, 2 incidentes (Jipiro tarde pasa de Alto a Medio, 65), 3 puntos de apoyo, 1 resguardo (PUEAR) y 2 alertas vigentes; `firestore.rules` deny-all para las 6 colecciones nuevas. Pruebas: `test_seed.py` (17).
- Verificación backend: `pytest -q` 974 passed; `ruff check .` sin errores; `ruff format --check .` 224 archivos formateados. Sin commit (lo hace el orquestador).
- 2026-11-22 T8 (parcial, solo documentación): las 23 historias del Sprint 3 pasan a `Parcial` en las specs 06, 07 (RF-07-12 a 15), 08 y 09, con los criterios cubiertos por las pruebas del backend marcados; `specs/README.md` queda en 28 Hecha, 38 Parcial y 87 Pendiente; `CONTEXTO.md` sección 18. Falta la verificación de punta a punta cuando existan las pantallas (T6, T7).
