# Runner app and admin improvements (2026-11-23)

Engram mirror: pending (memory tools unavailable this session).

## Objective

Eight requested changes across the runner app and the admin web, plus a friends feature.

## Authorized scope

Frontend (`frontend/src`) and backend (`backend/apps`, `backend/tests`) files needed for the tasks below. No Firebase config, no docker files, no `.env`. Existing uncommitted work in `admin/summary` and `admin/roles` must not be reverted or reflowed.

## Constraints

- No zombie code (CONTEXTO.md): delete anything the change leaves unused.
- Code, comments and identifiers in English; user-facing UI copy in Spanish (the project already does this).
- Tests next to sources; backend fakes appended to `backend/tests/fakes.py`, not reflowed.
- Test-first where a runnable deterministic test exists.

## Tasks

- [x] T1 UI polish (frontend only). Route: delegated (writer), trigger: 2+ non-trivial files.
  - Routes list "Ordenar"/"Filtros" buttons look dark/odd: soften `.tool` styling (`routes-list.page.ts`).
  - Notifications: the "Alertas" page becomes "Notificaciones" (title, route, bell aria-label, specs); zone alerts are shown as notifications.
  - Admin summary: replace the fuchsia tints on tiles/panels and the neon bar colors with calmer colors (`kpi-tile.ts`, `bar-list.ts`, chart tokens).
  - Runner home: remove "N rutas disponibles", replace the big "Empezar a correr" focus with a small eye-catching "Novedades" block plus recommendations; soften the global neon pink tokens in `theme/`.
- [x] T2 Cities free text (backend + frontend). City type, parent and coverage become free-form fields the admin types; zone/parent logic stays keyed on the parent city.
- [x] T3 Route custom image (backend + frontend). Admin uploads any image per route; the runner app shows it instead of the generated shape preview, with the generated shape as fallback. Store it outside the list payload.
- [x] T4 Friends (backend + frontend). Route: delegated (writer), trigger: 2+ non-trivial files. Users can search other users, send, accept and reject friend requests, list and remove friends. Entry from the Cuenta page.

## Acceptance criteria

Each task: its unit tests pass, `npm --prefix frontend run build` or the typecheck succeeds, backend `pytest` for touched areas passes.

## Progress

- T1 done (writer, uncommitted): `npm test -- --watch=false`: 132 files, 1074 tests passed; `npx tsc -p tsconfig.app.json --noEmit`: no errors. Primary is now deep magenta-violet #ad37a0 with white text; admin summary uses teal/indigo tokens (`--rc-chart-accent`, `--rc-tile-tint`). Gap: `chart-math.ts` still names the token `--rc-chart-rose` (now indigo) and `recommended-routes.ts` heading stays «Rutas recomendadas»; both are outside T1 surfaces.
- T2 done (writer, uncommitted): city `type` and `coverage` are trimmed free text (type max 40, coverage max 60, reasons `invalid-city-type`/`invalid-coverage` kept); `parentCityId` is optional for every type and defines a zone (parent must exist and be top-level); type is editable on update; tolerant read keeps stored text. Backend `pytest -q`: 1419 passed; `ruff check apps tests`: clean. Frontend `npm test -- --no-watch`: 132 files, 1076 tests passed; `npx tsc -p tsconfig.app.json --noEmit`: no errors. T1 cleanups done: `--rc-chart-rose` -> `--rc-chart-indigo` (tokens, chart-math, theme tokens spec), heading «Recomendaciones». Gaps: `functions/` (Firestore rules, routeCallables type check) and `safe_routes` (`coverage == "active"` enables a city) still assume the old values; the form hint tells the admin that «active» enables safe routes.
- T3 done (writer, uncommitted): route image = full JPEG in `routes/{id}/private/image` (`GET|PUT|DELETE /routes/{id}/image`, PUT/DELETE need `routes.manage`, GET any signed-in user) plus a thumbnail `imageThumb` inside the route document (list and detail carry it); limits 600 KB / 60 KB decoded, jpeg/png/webp, reasons on fields `image`/`thumbnail`; deleting a route cascades through `recursive_delete`. Admin form has "Imagen de la ruta" (new `route-image-field`), the runner `route-card` shows the image or falls back to `app-route-preview`, the detail page loads the full image with thumbnail fallback. Safe routes now accept coverage "active"/"activa"/"activo" trimmed and case-insensitive. Backend `pytest -q`: 1474 passed; `ruff check apps tests`: clean. Frontend `npm test -- --no-watch`: 135 files, 1118 tests passed (one unrelated flaky risk-factors spec failed once, passed on rerun); `npx tsc -p tsconfig.app.json --noEmit` and `tsconfig.spec.json`: no errors.
- T1b color identity done (writer, uncommitted): primary is now a true fuchsia (hue 326): fill #d1177f (white 5.07:1), pressed and light-theme text #a80f68 (white 7.16:1), dark-theme text #ff5db1 (5.87:1 on the raised surface); Ionic rgb 209, 23, 127. Fuchsia kept for primary buttons, active tab/nav, selected chips, focus rings, map route line and brand slogan; distance/time figures, metric and list icons, badges, avatar, status icons and the maps link are neutral text tokens. Tokens spec asserts hue 315-340 and not #ff2d95. Not verified visually (no browser run).
- T4 done (writer, uncommitted): new backend app `friends` (`GET friends`, `DELETE friends/{uid}`, `GET|POST friends/requests`, `DELETE friends/requests/{id}`, `POST friends/requests/{id}/accept|reject`, `GET friends/search?q=`); requests in `friendRequests/{id}`, friendships in `users/{uid}/friends/{friendUid}` written on both sides in one batch; search matches name prefixes only (never email or id number), min 3 chars, max 20, `sensitive` throttle; account deletion (own and admin) erases requests and friendships through the new `UserFriendsEraser` port (`FRIENDS_ERASER` adapter key). Frontend `friends/` feature (page «Amigos» with segments Amigos/Solicitudes/Buscar, store, Http repository), entry «Amigos» in Cuenta with a pending-requests count, route `cuenta/amigos`. Backend `pytest -q`: 1523 passed; `ruff check apps tests`: clean. Frontend `npm test -- --no-watch`: 138 files, 1165 tests passed; `npx tsc -p tsconfig.app.json --noEmit` and `tsconfig.spec.json`: no errors. Gaps: no photo in friend lists (photos are private documents); Firestore rules untouched (new collections stay deny-all); `functions/` not touched.
- T5 admin map done (writer, uncommitted): `app-map-view` gains `interactive`, `mapClick` and `view` (initial look); both renderers (Leaflet `map.on('click')` with wrapped longitude, Google `addListener('click')`) report clicks through `MapHooks.click`. Route form: map «Marca el inicio y el fin en el mapa» with Marcar inicio / Marcar fin / Limpiar puntos, start then end markers and a joining line, read-only «Inicio: lat, lng»; free lat/lng inputs removed, missing-point messages now «Marca el inicio/fin en el mapa.». Route detail: the map is always at the top (start/end markers plus segment lines), or a notice when there are no coordinates. Frontend `npm test -- --no-watch`: 138 files, 1165 tests passed; `tsc -p tsconfig.app.json` and `tsconfig.spec.json`: no errors. Gaps: not checked in a real browser; cities carry no coordinates, so the empty map always opens on Loja (-3.99313, -79.20422, zoom 13).
