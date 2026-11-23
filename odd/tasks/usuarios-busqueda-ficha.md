# Admin users: one search box and the user detail

## Objective
In the admin web the user search is one box (cédula, email or name) and each user has a detail
page with the personal profile, the sport profile and the rating.

## Why
Owner request (2026-11-22): "cuando se busca un usuario no pongas todos esos parámetros: una sola
barra en la que se pueda ingresar cédula, correo electrónico o nombre; y que desde el admin pueda
ver el perfil personal y deportivo de cada usuario, así como su rating".

## Scope
- Frontend only, `frontend/src/app/admin/users`. The backend (`GET /users?q=`, `GET /users/{uid}`)
  was built by another writer (commit `3d7b464`).
- List: one `type="search"` input, Enter or «Buscar», «Limpiar», «Cargar más», role select kept,
  each name links to `/admin/usuarios/:uid`. The five fields, the city select, `user-search.ts`,
  `UserFilters` and `cityOptions` are gone.
- Detail: lazy child route of the users section (same `users.read` guard as the section), three
  panels, loading / 404 / error states, generic `<app-rating-stars>`.

## Out of scope
The source of the ratings (comes with the group runs sprint): the page renders an optional
`rating: {average, count}` and an empty state meanwhile. `shared/ui` stays untouched.

## Frontend tasks
- [x] T1 Domain: `toUserDetail` tolerant reader, `displayDate`, `starFills` / `ratingText` (RED first)
- [x] T2 Port, HTTP repository (`search(query, cursor)` sending `q`, `get(uid)`), stores (list + `UserDetailStore`), fake
- [x] T3 List page with the single search and links; removal of the filter code and specs
- [x] T4 Detail page, rating stars component, route registration
- [x] T5 Specs (`01-gestion-de-usuarios.md`), `CONTEXTO-FRONTEND.md`, this document; checks green

## Acceptance
- Typing a cédula, an email or part of a name and pressing Enter sends only `q`; empty lists everyone.
- Opening a user shows the three panels with catalog labels; a null sport profile or rating shows
  its empty state; a 404 says "No encontramos a este usuario."; an error offers «Reintentar».

## Route
Delegated direct: one frontend writer (2+ non-trivial files); allowed surfaces were
`frontend/src/app/admin/users/**`, `frontend/CONTEXTO-FRONTEND.md`, `specs/01-gestion-de-usuarios.md`
and this file. `admin.routes.ts` needed no change: the `usuarios` section already carries the
`users.read` guard and loads `USERS_ADMIN_ROUTES`.

## Test-first
RED observed: after writing every spec the run failed to build (`Cannot find module
'../application/user-detail.store'`, `'./user-detail.page'`, `RatingStars` unknown, ...); GREEN after
the implementation. Exception: the HTTP repository spec keeps the existing style (mocked
`ApiClient`) instead of `HttpTestingController`.

## Evidence
- `npx ng test --watch=false --include='src/app/admin/**/*.spec.ts'` -> 54 files, 422 tests passed.
- `npx tsc --noEmit -p tsconfig.app.json` -> no errors.
- `npx tsc --noEmit -p tsconfig.spec.json` -> no errors.
- `npm run lint` -> All files pass linting.
- Commit: see `git log` (one `feat(frontend)` commit on main).
- Not verified: the pages in a real browser or phone.

## Backend (written by the backend writer, commit `3d7b464`)

Contract: `GET /users?q&limit&cursor` and `GET /users/{uid}` -> `{user, sportProfile, rating}` (`rating` is `null` until group-run ratings exist).

- [x] B1 Domain: `q` parsing (`parse_search_query`), `equality_filter` (10 digits = id number, `@` = email), `matches_text` (word prefixes of names, email local part); old multi-filter machinery removed.
- [x] B2 `search_users` over the single `q`; `UserSearchSerializer` accepts only `q`, `limit`, `cursor`.
- [x] B3 `get_user_detail` use case and `GET /users/{uid}` (`users.read`, sensitive throttles, 404 `user-not-found`, `me` routed first).
- [x] B4 Tests: `backend/tests/test_user_search.py`, `backend/tests/test_user_detail.py` (RED observed as collection errors before the code existed).
- [x] B5 Docs: `specs/01-gestion-de-usuarios.md`, `backend/README.md`, `backend/CONTEXTO-BACKEND.md`.

Verification: `pytest tests -q` 1307 passed; `ruff check` and `ruff format --check` clean.
