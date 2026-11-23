# Admin edits and deletes users

## Objective
An admin with the new permission `users.manage` edits the personal data and the sport profile of
any account and deletes accounts, from the user detail page of the panel.

## Why
Owner request (2026-11-22): the admin must be able to edit and delete users.

## Scope
- Backend (`backend/`): permission `users.manage`, `PATCH /users/{uid}`,
  `PUT`/`DELETE /users/{uid}/sport-profile`, `DELETE /users/{uid}`.
- Frontend (`frontend/src`): done by another writer; they add their section below.

## Out of scope
Editing the email (it is the login; needs re-authentication and verification), privilege
hierarchy between admins (only the self and last-admin rules apply), the role of the account.

## Contract
- `users.manage` in `ALL_PERMISSIONS`; the `admin` system role gets it; admins already signed in
  need a token refresh (sign out and in) so the `perms` claim carries it.
- `PATCH /users/{uid}`: non-empty subset of `firstName`, `lastName`, `birthDate`, `idNumber`,
  `cityId`; same validation and field reasons as `PATCH /users/me`; unknown keys 400
  `fields {key: "unknown"}`; empty body 400 `invalid-argument`; 404 `user-not-found`; 200
  `{"user": {uid, email, firstName, lastName, birthDate, cityId, role, idNumber}}`.
- `PUT /users/{uid}/sport-profile`: same body and validation as the own one; 200
  `{"sportProfile": {level, goals, usualPaceSecPerKm, preferredDistanceKm}}`; 404.
- `DELETE /users/{uid}/sport-profile`: 204, idempotent; 404 for an unknown account.
- `DELETE /users/{uid}`: 204; 409 `cannot-delete-self`; 400 `last-admin` (existing reason and
  status of the own deletion); 404 `user-not-found`.
- All: 401 without token, 403 `missing-permission` without `users.manage`, sensitive throttles.

## Backend tasks
- [x] B1 Permission `users.manage` in the catalogue; the `admin` role holds it (RED: import error, then green)
- [x] B2 Use cases `update_user_personal_data`, `save_user_sport_profile`, `clear_user_sport_profile`, `delete_user_account` (shared `_erase_account`, `_require_user`, `ErrorKind.CONFLICT` -> 409) with in-memory fakes
- [x] B3 Views and routes (`UserDetailView` PATCH/DELETE, `UserSportProfileView`), API tests for every status
- [x] B4 Docs: `specs/01` (EXT-01-3), `specs/02`, `backend/README.md`, `backend/CONTEXTO-BACKEND.md`

## Frontend tasks
- [x] F1 Permission `users.manage` (`core/permissions`), role editor label «Editar y eliminar usuarios» and groups «Usuarios» / «Roles»; message `cannot-delete-self`
- [x] F2 Port + HTTP repository (`PATCH`, `PUT`, `DELETE`), domain `user-edit.ts` (reuses `validatePersonalData`/`parseSportProfileForm`), store methods that patch the shown detail
- [x] F3 Page: pencils (only with `users.manage`), `UserPersonalEdit`, `UserSportEdit`, delete zone with `confirmAction`, self-delete disabled
- [x] F4 Docs: `specs/01` (EXT-01-3), `frontend/CONTEXTO-FRONTEND.md`
- [ ] F5 Check in a real browser against the local stack (not done: no ng serve/docker here)

Route: inline (one writer, no delegation). Test-first note: the page specs and the missing-module
compile error were observed RED; domain, repository, store and role specs were written together
with their implementation and first run green.

## Verification (backend)
- `pytest tests -q`: 1376 passed; `ruff check apps tests` and `ruff format --check apps tests`: clean.
- Test fixtures: new principal `USER_MANAGER` (`user-manager-token`) in `tests/fakes.py`; the
  summary tests count one more user because of it.

## Verification (frontend)
- `npx ng test --watch=false`: 126 files, 985 tests passed; `tsc --noEmit` (app and spec),
  `npm run lint` and `npx ng build -c real`: clean.

## Next step
Browser check of the detail page (edit, clear, delete). Also add `users.manage` to the permission catalogue table of
`specs/transversal/arquitectura.md` (outside the backend writer's edit surface).
