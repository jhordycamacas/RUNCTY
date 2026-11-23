# Route surface and difficulty as free text

## Objective
Admins type the surface and the difficulty of a route instead of picking from a list written in the
code. Nothing about the route catalog stays hardcoded.

## Why
Product owner decision (2026-11-22): "everything must be configurable; let them always type it".
The lists (`SURFACES`, `DIFFICULTIES`) are duplicated in the backend and the frontend and cannot be
changed without a deploy.

## Scope
- Backend `routes` app: `surface` and `difficulty` become trimmed free text (1–40 chars, optional
  where they are optional today). No more `invalid-surface` / `invalid-difficulty` against a tuple;
  length and type errors keep a reason code. Reading a stored value never falls back to `mixed`.
- Backend `summary` and `seed`: group by the stored text; seed keeps its sample values.
- Frontend: the admin route form uses a text field for both; labels maps (`SURFACE_LABELS`,
  `DIFFICULTY_LABELS`) go away; the runner list/detail/card show the stored text; the runner
  filters offer the distinct values found in the loaded routes; the admin summary groups by text.
- Specs 05 (and 07 if it mentions them) and `error-messages.ts`.

## Out of scope
Sport-level, goals, risk factor types, incident types and the other catalogs (separate step).

## Tasks
- [ ] T1 Backend: model, use cases, serializers, seed, summary, tests (RED first)
- [ ] T2 Frontend: domain, admin form, runner views/filters, summary, tests
- [ ] T3 Specs and docs updated; full backend and frontend tests green

## Acceptance
- Creating/editing a route with surface "Adoquín" and difficulty "Media" works and shows back the
  same text everywhere (admin list/detail, runner card/detail, summary chart).
- An empty or longer-than-40 value is rejected with a clear Spanish message.
- No `SURFACE`/`DIFFICULTY` constant list remains in backend or frontend (no dead code).

## Route
Delegated direct: one writer (2+ non-trivial files across backend and frontend).
