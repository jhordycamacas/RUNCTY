# RUNCTY backend

Django REST API that owns the server logic of RUNCTY. Clients (the React Native app and the
Angular panel) sign in with Firebase Auth and send the ID token as
`Authorization: Bearer <token>`. The API talks to Google services through `firebase-admin`.
Firestore is the data store: there is no SQL database and no Django ORM.

## Run it

Requires Python 3.10+.

```bash
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt   # Linux/macOS: .venv/bin/python
cp .env.example .env            # local values; the file is git-ignored
.venv/Scripts/python manage.py runserver
```

`manage.py` loads `backend/.env`; variables already set in the shell win. Without
`DJANGO_DEBUG=true` the process refuses to start unless it has a secret key and a real
Firebase project.

| Check | Command |
| --- | --- |
| Tests (no network, emulators or credentials) | `.venv/Scripts/python -m pytest -q` |
| Lint | `.venv/Scripts/python -m ruff check .` |
| Django checks | `.venv/Scripts/python manage.py check` |
| Production checks | `manage.py check --deploy` with production variables |

Container: `docker build -t runcty-api backend` then
`docker run --env-file <file outside the repo> -p 8000:8000 runcty-api`. The image runs
gunicorn as a non-root user and contains no configuration or credentials.

## Endpoints

| Method and path | Access | Returns |
| --- | --- | --- |
| `GET /api/v1/health` | public | `{"status": "ok"}` |
| `GET /api/v1/health/services` | `admin` role | which Google services are configured (booleans) |
| `GET /api/v1/me` | any signed-in user | `uid`, `email`, `emailVerified`, `role`, `perms` |
| `GET /api/v1/roles` | `admin.access` | `{"roles": [{id, name, description, permissions, system}]}` |
| `POST /api/v1/roles` | `roles.manage` | 201 with the role. Body: `id`, `name`, `description?`, `permissions` |
| `PUT /api/v1/roles/{id}` | `roles.manage` | `{"syncedUsers": n}`. Body: `name`, `description?`, `permissions` |
| `DELETE /api/v1/roles/{id}` | `roles.manage` | 204 |
| `PUT /api/v1/users/{uid}/role` | `roles.manage` | `{uid, role}`. Body: `roleId` |

JSON only, camelCase keys. Every error has the same shape; clients branch on `reason` and
translate it, `message` is for developers:

```json
{"error": {"reason": "missing-permission", "message": "Missing permission users.read."}}
```

A request body with the wrong shape (missing or unknown field, wrong type) is
`invalid-argument` and names each field, with dotted names for nested ones:

```json
{"error": {"reason": "invalid-argument", "message": "The request is invalid.",
           "fields": {"name": "required", "system": "unknown"}}}
```

### Roles

Reason codes are the ones the role callables used: `invalid-role-id`, `invalid-role-name`,
`invalid-role-description`, `invalid-permissions`, `role-exists` (409), `role-not-found` and
`user-not-found` (404), `admin-only` and `permission-escalation` (403), `admin-permissions`,
`system-role`, `role-has-users`, `self-lockout` and `last-admin` (400). New:
`user-profile-missing` (404) when the account has no `users/{uid}` document.

- **Fresh authority.** The permission class checks the token; the use case then re-reads
  the caller's claims from Firebase Auth and answers `missing-permission` if they no longer
  hold `roles.manage`. A token issued before a demotion cannot manage roles.
- **Delegates** (non-admins with `roles.manage`) cannot grant `roles.manage`, a permission
  they lack, or the admin role, and cannot edit a system role (`system: true`).
- **Last admin.** `PUT /users/{uid}/role` writes the `users/{uid}.role` mirror in a Firestore
  transaction that also reads the admins in the mirror (`role == "admin"`, limit 2). The
  demotion of an admin commits only if that query shows another admin, so two admins
  demoting each other conflict and one of them gets `last-admin`. A missing or stale mirror
  counts as no admin (fail closed). The claims are written after the commit and the
  target's sessions are revoked; if writing the claims fails, the mirror is put back.
- Editing a role re-issues the claims of every user holding it and revokes their sessions,
  one user at a time within the request.

| Status | `reason` |
| --- | --- |
| 401 | `unauthenticated`, `invalid-token`, `token-expired`, `token-revoked`, `user-disabled` |
| 403 | `missing-permission`, `admin-only`, `permission-denied`, or the reason of a domain error |
| 400 / 404 / 409 | `invalid-argument`, `not-found`, or the reason of a domain error |
| 429 | `rate-limited` (with `Retry-After`) |
| 500 | `internal` (details go to the log only) |

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DJANGO_DEBUG` | no (default `false`) | `true` relaxes HTTPS, HSTS, the secret key and the production guard. Developer machines only. |
| `DJANGO_SECRET_KEY` | when not debug | Long random string. |
| `DJANGO_ALLOWED_HOSTS` | when not debug | Comma-separated host names. |
| `DJANGO_NUM_PROXIES` | no (default `0`) | Reverse proxies in front of the app. Above 0, `X-Forwarded-For` and `X-Forwarded-Proto` are trusted, so the proxy must set both. |
| `CORS_ALLOWED_ORIGINS` | for browser clients | Comma-separated origins. No wildcard; empty allows none. |
| `THROTTLE_RATE_IP`, `THROTTLE_RATE_USER` | no (`120/min`, `240/min`) | DRF rates per address and per uid. |
| `THROTTLE_RATE_AUTH_FAILED` | no (`20/min`) | Rejected bearer tokens allowed per address before it is blocked. |
| `THROTTLE_RATE_SENSITIVE` | no (`30/min`) | Extra per-uid rate for the role endpoints and the user search. |
| `FIREBASE_PROJECT_ID` | when not debug | Firebase project. `demo-*` ids are emulator-only. |
| `FIREBASE_STORAGE_BUCKET` | for Storage | Default bucket. |
| `GOOGLE_APPLICATION_CREDENTIALS` | see below | Path to a service-account JSON outside the repository. |
| `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST`, `FIREBASE_STORAGE_EMULATOR_HOST` | no | `host:port` of each emulator. Refused when not debug. |
| `GOOGLE_MAPS_API_KEY` | for Maps | Server-side Google Maps Platform key. |

## Connecting Google services

**Local emulators (no credentials).** Start the Firebase emulators, set the three emulator
hosts, a `demo-*` project id and `DJANGO_DEBUG=true` (the values in `.env.example`). The API
then uses anonymous credentials. Cloud Messaging has no emulator and reports as not configured.

**A real project.**

1. Firebase console, Project settings, Service accounts: generate a private key. Store the
   JSON outside the repository (files named `*service-account*.json` are git-ignored as a
   safety net) and point `GOOGLE_APPLICATION_CREDENTIALS` at it. On Google Cloud (Cloud Run)
   skip the file: the runtime service account is picked up automatically.
2. Set `FIREBASE_PROJECT_ID` and `FIREBASE_STORAGE_BUCKET`, and remove the emulator hosts.
3. Create a Maps Platform key restricted by API and by server address; set `GOOGLE_MAPS_API_KEY`.
4. Sign in as an admin and call `GET /api/v1/health/services` to confirm what is configured.

A production process (`DJANGO_DEBUG` unset) refuses to start with emulator hosts, a `demo-*`
project or no project id, so it cannot be pointed at fake data by mistake.

## Architecture

Feature-first, hexagonal. Dependencies point inwards: presentation and infrastructure depend
on application and domain, never the reverse.

```
config/                      settings (environment-driven), URL root, WSGI entry point
apps/
  shared/
    domain/                  Principal (models.py), permission catalogue, DomainError
    application/             ports: TokenVerifier, AuthGateway
    infrastructure/firebase/ the single firebase-admin app, its accessors, the token
                             verifier and Auth adapters, the production guard
    presentation/            DRF authentication, permissions, throttles, error handling,
                             StrictSerializer
  health/                    liveness and Google services status
  identity/                  GET /me
  roles/                     Rol, role CRUD, role assignment
tests/                       pytest suite with in-memory adapters
```

A feature app gets a `domain/`, `application/`, `infrastructure/` or `presentation/` package
only when it has something to put there. Domain models are plain Python classes in
`domain/models.py`, persisted in Firestore through repositories.

- **Ports and adapters.** Use cases depend on `Protocol` ports. The adapter for each port is
  named by a setting (`TOKEN_VERIFIER`, `AUTH_GATEWAY`, `ROLE_REPOSITORY`...); the tests swap
  in in-memory fakes.
- **Validation in two steps.** Serializers extend `StrictSerializer` and check the shape of
  the body (declared fields only, types, size bounds). The domain classes validate the values
  and own the reason codes; domain and application code import no Django, DRF or Firebase.
- **Firebase access.** Only `apps/shared/infrastructure/firebase/app.py` touches
  `firebase_admin`. Use its accessors: `auth_client()`, `firestore_client()`,
  `storage_bucket()`, `messaging_sender()`.

## Security model

- **Authentication.** Every request verifies the ID token with `check_revoked=True`, so
  revoked sessions and disabled or deleted accounts are rejected immediately. This costs one
  Firebase Auth lookup per authenticated request.
- **Authorization.** Deny by default: an endpoint is public only if it declares `AllowAny`.
  The `{role, perms}` custom claims are the only authority. `HasPermission("users.read")`
  and `IsAdmin` gate endpoints; the `admin` role holds every permission.
- **The Admin SDK bypasses Firestore security rules.** Every ownership check must be
  implemented in the API.
- **Throttling** runs per address and per uid. Counters live in Django's per-process memory
  cache, so with several gunicorn workers or instances the effective limit is multiplied;
  configure a shared cache before relying on exact limits. DRF throttles after
  authenticating, so rejected tokens have their own counter per address, checked before the
  token is verified: past `THROTTLE_RATE_AUTH_FAILED` the address gets 429 for any bearer
  token, valid or not, until the window passes. Accepted tokens do not use that budget.
- **Transport.** Outside debug: HTTPS redirect, HSTS for one year including subdomains,
  `nosniff`, `X-Frame-Options: DENY`. HSTS preload is not enabled (`security.W021`) because
  it is a hard-to-undo commitment for the whole domain. There is no CSRF middleware because
  the API uses bearer tokens and no cookies.
- **Errors** never include stack traces or SDK messages. In debug only, unknown URLs show
  Django's HTML debug page instead of the JSON 404.
