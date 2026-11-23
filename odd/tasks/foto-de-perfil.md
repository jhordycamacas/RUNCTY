# Profile photo

## Objective
A runner can set, change and remove a profile photo from the account screen; it shows on the
profile (and later on lists). Routes created by an admin already reach the phone (active routes of
the runner's city): nothing to build there.

## Why
Owner request (2026-11-22). Cloud Storage for Firebase needs the paid plan on new projects and the
owner has no billing, so the photo is stored resized inside Firestore through the backend.

## Design
- Client: `<input type="file" accept="image/*">` (works in the Android WebView, offers camera or
  gallery, no new plugin), decode, center-crop to a square, resize to `profilePhotoMaxPx` (default
  256) and encode JPEG until it fits `profilePhotoMaxKb`.
- Backend: document `users/{uid}/private/photo` = `{data, mime, updatedAt}` (the `private`
  subcollection is already deny-all for clients in firestore.rules; only the API reads/writes).
  Validation: data URL `data:image/(jpeg|png|webp);base64,...`, valid base64, decoded size <=
  `profilePhotoMaxKb`, magic bytes match the declared mime. The account deletion use case also
  deletes the photo.
- Settings (editable in Configuración, group "Foto de perfil"): `profilePhotoMaxKb` (default 100,
  bounds 20-500), `profilePhotoMaxPx` (default 256, bounds 64-1024).

## API contract
- `GET /api/v1/users/me/photo` -> 200 `{"photo": "data:image/jpeg;base64,..."}` or `{"photo": null}`.
- `PUT /api/v1/users/me/photo` body `{"photo": "<data url>"}` -> 200 `{"photo": "<data url>"}`.
  400 `error.fields.photo` in `required|invalid-format|invalid-image|too-large`.
- `DELETE /api/v1/users/me/photo` -> 204 (idempotent).

## Tasks
- [x] T1 Backend: settings, photo domain/use cases/Firestore adapter/views, account deletion, tests
      Evidence: RED observed first (settings tests 5 failed, photo domain import error, photo API
      23 failed); then `pytest tests -q`: 1275 passed; `ruff check apps tests`: all checks passed;
      `ruff format --check apps tests`: 260 files already formatted. Route: inline (writer
      delegated by the parent). Account deletion already removes every `private` document; the
      summary scan now selects only preference fields so it never downloads photos. Commit: see
      git log (`feat(backend): store a profile photo ...`).
- [x] T2 Frontend: avatar component, account screen (choose/take, preview, save, remove), resize
      util, settings page group, tests
      Evidence: RED observed first for every piece (compile errors for the missing modules/keys, and
      7 failing page tests); then `ng test` full: 928 passed, 5 failed, all in `admin/users` (another
      writer's in-flight work) plus one timing flake in `risk-factors-section.spec` that passes alone
      (8/8); `tsc --noEmit` app and spec: clean; `npm run lint`: all files pass; `ng build -c real`:
      ok. Route: delegated writer. Not verified on a real phone (camera/gallery of the WebView).
      The Inicio greeting was left without avatar (no redesign of other screens). Commit: see git
      log (`feat(frontend): let a runner set ...`).
- [ ] T3 Specs and context docs updated; verification green

## Acceptance
- From the phone: pick a photo, it is shown on the profile, survives reload, can be removed.
- Oversized or non-image payloads are rejected with Spanish messages.
- Changing `profilePhotoMaxKb` in Configuración changes what the backend accepts.
