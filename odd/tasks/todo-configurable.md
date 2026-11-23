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
- [x] T2 `settings` backend app: system parameters (domain, ports, Firestore, API with
      `settings.manage`, defaults seeded and as code fallback) and injection into the safety
      calculation, incident window, radii and limits; bulk recalculation of all routes
      Evidence: app `backend/apps/system_settings` (24 numeric parameters + time zone + country,
      validated in the domain); `GET`/`PUT /settings`, `POST /admin/recalculate-routes`
      (`settings.manage`); settings injected as a parameter into safety, incidents, radii, limits,
      sport profile, safe routes, cities and the seed; old module constants removed (grep clean);
      deny-all rule for `systemSettings`. Backend 1092 passed + ruff clean (was 992 passed). A
      penalty change recalculates the stored index (65 -> 50 with `penaltyHigh` 35 -> 50). Domain
      tests observed RED (import error) first; the rest were written after the code and passed.
      Route: single writer (delegated).
- [x] T3 Admin "Configuración" section (permission `settings.manage` in backend, frontend and
      functions; parameters form with validation and a "recalcular rutas" result)
      Evidence: frontend section `admin/settings` (domain, store, HTTP repository, fake, page) at
      `/admin/configuracion`; permission added to the catalog, its Spanish label and the role
      editor (group "Sistema"); 7 panels / 26 fields, live levels read-out, one save sending only
      the changed keys, reset with confirmation, field errors from `fields` plus client bounds,
      toast with the recalculated count, "Recalcular rutas". Admin + core specs 423 passed in 54
      files (39 of them new, in settings and `admin-sections.spec.ts`), both tsc clean, `ng lint`
      clean. Specs were written together with the code (RED not observed separately). The HTTP
      spec uses `HttpTestingController`. Legacy `functions/` untouched (not part of this task).
      Route: single writer (delegated).
- [ ] T4 Sport profile catalog (levels, goals) managed by the admin + runner/profile forms read it
  - [x] T4a Backend: app `catalogs` (domain, ports, Firestore adapter, `GET`/`PUT /catalogs/<id>`
        with `settings.manage`, seed), sport profile validates against the active codes
        Evidence: RED observed first (3 test modules failed on import of `apps.catalogs`, 19
        failures in the users domain / private documents specs), then GREEN: backend 1184 passed
        (was 1092 + new), ruff clean. `SPORT_LEVELS`/`SPORT_GOALS` tuples removed (grep clean:
        only the default items inside `catalogs`). Stored profiles keep any code
        (`from_document` skips the catalog check). Deny-all rule for `catalogs`; the level and
        goals `in [...]` lists left `isValidSportProfile`. Route: single writer (delegated).
  - [ ] T4b Frontend: admin section to edit the catalogs + runner/profile forms read
        `GET /catalogs/<id>?active=true` instead of their constants
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
