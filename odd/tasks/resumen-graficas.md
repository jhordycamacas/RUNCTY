# Resumen: charts with plain words (routes and users)

## Objective
The admin "Resumen" answers, in plain Spanish, how many routes and users there are and how
routes and users compare per city.

## Why
Owner request (2026-11-22): "en Resumen pon gráficas con palabras con sentido: número de rutas,
número de usuarios, y si vas a poner gráficas pon gráficas de rutas vs usuarios: qué rutas,
cuántos usuarios".

## Honest data constraint
Nothing links a user to a route yet (trainings and favorites arrive with EP-12 / EP-10, Sprint 4),
so "which routes have how many users" cannot be computed. The page says so in one text-only note
and shows routes vs users per city instead, which the data supports.

## Scope
- Backend `apps/summary`: `users.bySportLevel`, top-level `byCity` (needs `users.read` and
  `routes.manage`), `UserRecord.city_id`; the `private` scan still selects fields only (adds `level`).
- Frontend `admin/summary`: four number cards, grouped bars per city, users per sport level
  (catalog labels), safety donut, weekly sign-ups, collapsed "Más detalles" (longest routes),
  closing note. Removed: difficulty, surface, risk factor, role and appearance charts,
  `progress-bar`, `top-counts`, the `soon` mode of the tile (zombie code).
- Docs: panel spec, backend README, both CONTEXTO files.

## Out of scope
Trimming the unused aggregates (`byDifficulty`, `bySurface`, `riskFactors`, `byRole`,
`preferences`, `timeSlots`) from the endpoint: still returned, no longer drawn. Users per route.

## Tasks
- [x] T1 Backend RED then GREEN: `bySportLevel`, `city_comparison`, source adapter (`cityId`, `level`), API shape and permissions
- [x] T2 Frontend RED then GREEN: tolerant mapper (`bySportLevel`, `byCity`), store `levelLabel` with catalog fallback
- [x] T3 `grouped-bars` component (legend, numbers, text alternative, hidden table, tokens)
- [x] T4 Page redesign, explanations under each title, removal of redundant charts and components
- [x] T5 Docs (spec, README, CONTEXTO x2) and this document

Route: inline for T1-T5 (one vertical slice by a delegated writer; no further delegation).
Review: skipped in this repo (RDD off by owner rule).

## Evidence
- RED backend: `pytest tests/test_summary_metrics.py ...`: `ImportError: cannot import name 'city_comparison'`; then API test failed on the fake users lacking `cityId` until `tests/fakes.py` carried it.
- RED frontend: `ng test` failed to compile (`GroupedBars` unknown, `bySportLevel` not in `UsersSummary`) before the implementation.
- `.venv/Scripts/python -m pytest tests -q`: 1318 passed
- `.venv/Scripts/python -m ruff check apps tests`: all checks passed
- `.venv/Scripts/python -m ruff format --check apps tests`: 261 files already formatted
- `npx ng test --watch=false --include='src/app/admin/summary/**/*.spec.ts'`: 6 files, 48 tests passed
- `npx tsc --noEmit -p tsconfig.app.json`: clean
- `npx tsc --noEmit -p tsconfig.spec.json`: clean
- `npm run lint`: all files pass linting

## Next step
Sprint 4: with trainings (EP-12) add "usuarios por ruta" and drop the closing note.
