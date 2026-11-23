# usuarios-busqueda-ficha

Objective: the admin searches users with one text box (`q`) and opens a user detail.
Contract: `GET /users?q&limit&cursor` and `GET /users/{uid}` -> `{user, sportProfile, rating}` (`rating` is `null` until group-run ratings exist).

## Backend

- [x] B1 Domain: `q` parsing (`parse_search_query`), `equality_filter` (10 digits = id number, `@` = email), `matches_text` (word prefixes of names, email local part); old multi-filter machinery removed.
- [x] B2 `search_users` over the single `q`; `UserSearchSerializer` accepts only `q`, `limit`, `cursor`.
- [x] B3 `get_user_detail` use case and `GET /users/{uid}` (`users.read`, sensitive throttles, 404 `user-not-found`, `me` routed first).
- [x] B4 Tests: `backend/tests/test_user_search.py`, `backend/tests/test_user_detail.py` (RED observed as collection errors before the code existed).
- [x] B5 Docs: `specs/01-gestion-de-usuarios.md`, `backend/README.md`, `backend/CONTEXTO-BACKEND.md`.

Verification: `pytest tests -q` 1307 passed; `ruff check` and `ruff format --check` clean.
