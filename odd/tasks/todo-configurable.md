# Everything configurable from the admin web

## Objective
No business list or number is hardcoded. Whatever an admin may reasonably want to change is edited
from the admin web and applies without a deploy.

## Why
Product owner decision (2026-11-22): "nothing hardcoded, everything configurable". Inventory of the
hardcoded values: see the report in the conversation of 2026-11-22 (catalogs duplicated in backend,
frontend and `firestore.rules`).

## Criteria (decided with the owner)
1. **Classifications the admin types** -> free text, trimmed 1-40 chars: route surface and
   difficulty (DONE, see `rutas-texto-libre.md`), risk factor type, incident type, support point
   type, risk alert type, information source type.
2. **Values that drive calculations** -> editable system parameters (admin "Configuración"):
   penalty per severity (10/20/35), safety level thresholds (70/40), incident window days (365)
   and margin minutes (60), local time zone (IANA id), nearby and search radii, max time slots /
   segments / factors per segment, route length limits, pace and distance ranges, safe-route
   tolerance, country. Changing a penalty, threshold, window or margin recalculates every route.
3. **Choices the runner makes** (sport level, sport goals) -> a catalog the admin manages
   (code, label, order, active). Deactivating never deletes: stored documents keep their value.
4. **Structural, stays in code on purpose (documented)**: severity keys low/medium/high (they have
   an order), safety level keys, city type city/zone, city coverage keys with behavior
   (active/planned/suspended), weekdays, permission catalog (each permission is enforced by code),
   appearance/units/font-scale structure of the preferences.

## Tasks
- [x] T1 Free text for risk factor type, incident type (+ explicit severity chosen by the admin),
      support point type, alert type, source type (backend, admin forms, runner labels, tests)
      Evidence: RED observed (40 backend failures, 7 form spec failures) before the code; backend
      992 passed + ruff clean; frontend routes/admin/alerts specs 398 passed + both tsc clean.
      Incidents carry `severity` (stored without it reads as `medium`); `from_document` keeps any
      stored type text. Incident/support point/alert admin UI does not exist yet (Sprint 3), so
      only the API, seed and risk factor form changed. Route: delegated writer.
- [ ] T2 `settings` backend app: system parameters (domain, ports, Firestore, API with
      `settings.manage`, defaults seeded and as code fallback) and injection into the safety
      calculation, incident window, radii and limits; bulk recalculation of all routes
- [ ] T3 Admin "Configuración" section (permission `settings.manage` in backend, frontend and
      functions; parameters form with validation and a "recalcular rutas" result)
- [ ] T4 Sport profile catalog (levels, goals) managed by the admin + runner/profile forms read it
- [ ] T5 Remove every leftover duplicate list (frontend constants, firestore.rules `in [...]`),
      specs, README, CONTEXTO, traceability; final grep proving nothing hardcoded remains outside
      the structural list above

## Acceptance
- Grep for the old tuples/constants (`RISK_FACTOR_TYPES`, `INCIDENT_TYPES`, `SUPPORT_POINT_TYPES`,
  `_SEVERITY_PENALTY`, `_COUNTED_DAYS`, `LOCAL_TIMEZONE`, `SPORT_LEVELS`, ...) returns only the
  default values of the settings/catalog seed.
- Changing the "high severity penalty" in Configuración and saving recalculates the routes and the
  index shown in admin and runner changes accordingly.
- All backend and frontend tests green; no dead code.

## Route
Delegated direct, sequential writers (one per task), parent spot-checks between them.
