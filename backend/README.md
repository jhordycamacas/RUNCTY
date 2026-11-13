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
| `POST /api/v1/users` | signed in, own uid | 201 with the caller's new profile. Body: `firstName`, `lastName`, `birthDate`, `cityId`, `idNumber?`, `consent: {lopdp: true}` |
| `GET /api/v1/users` | `users.read` | `{"users": [{uid, email, firstName, lastName, birthDate, cityId, role}], "nextCursor"}`. Query: `firstName`, `lastName`, `email`, `idNumber`, `birthDate`, `cityId`, `limit`, `cursor` |
| `GET /api/v1/users/me` | owner | `uid`, `email`, `firstName`, `lastName`, `birthDate`, `cityId`, `idNumber`, `role` |
| `PATCH /api/v1/users/me` | owner | the updated profile. Body: any of `firstName`, `lastName`, `birthDate`, `cityId`, `idNumber` |
| `DELETE /api/v1/users/me` | owner, signed in within 5 minutes | 204 |
| `GET`, `PUT`, `DELETE /api/v1/users/me/sport-profile` | owner | `level`, `goals`, `usualPaceSecPerKm`, `preferredDistanceKm` (204 on delete) |
| `GET`, `PUT`, `DELETE /api/v1/users/me/preferences` | owner | `language`, `fontScale`, `appearance`, `units`, `notifications`, `locationPrivacy` (204 on delete) |
| `GET /api/v1/roles` | `admin.access` | `{"roles": [{id, name, description, permissions, system}]}` |
| `POST /api/v1/roles` | `roles.manage` | 201 with the role. Body: `id`, `name`, `description?`, `permissions` |
| `PUT /api/v1/roles/{id}` | `roles.manage` | `{"syncedUsers": n}`. Body: `name`, `description?`, `permissions` |
| `DELETE /api/v1/roles/{id}` | `roles.manage` | 204 |
| `PUT /api/v1/users/{uid}/role` | `roles.manage` | `{uid, role}`. Body: `roleId` |
| `GET /api/v1/cities` | public | `{"cities": [{id, name, province, country, type, parentCityId, location: {lat, lng}, coverage}]}` sorted by name. Query: `coverage` |
| `POST /api/v1/cities` | `cities.manage` | 201 with the city. Body: `id`, `name`, `province`, `type`, `location`, `coverage`, `parentCityId` (zones) |
| `PATCH /api/v1/cities/{id}` | `cities.manage` | the updated city. Body: any of `name`, `province`, `location`, `coverage`, `parentCityId` |
| `DELETE /api/v1/cities/{id}` | `cities.manage` | 204 |
| `GET /api/v1/routes` | signed in | `{"routes": [...]}` sorted by name; inactive routes only with `routes.manage`. Query: `cityId` |
| `GET /api/v1/routes/{id}` | signed in | the route with `segments` (in route order, each with its `safety`); `timeSlots` and each segment's `riskFactors` only with `routes.manage`, which also reads inactive routes |
| `POST /api/v1/routes`, `PUT`, `DELETE /api/v1/routes/{id}` | `routes.manage` | 201 `{"id"}`, 204, 204. Body: `name`, `cityId`, `description?`, `start`, `end` (`{lat, lng, label}`), `distanceKm`, `elevationGainM`, `surface`, `difficulty`, `active?` |
| `POST /api/v1/routes/{id}/segments`, `PUT`, `DELETE .../segments/{sid}` | `routes.manage` | 201 `{"id"}`, 204, 204. Body: `name`, `coordinates` (`[{lat, lng}]`), `order?` |
| `POST /api/v1/routes/{id}/time-slots`, `PUT`, `DELETE .../time-slots/{slotId}` | `routes.manage` | 201 `{"id"}`, 204, 204. Body: `startTime`, `endTime`, `label?`, `validFrom?`, `validTo?` |
| `POST /api/v1/routes/{id}/segments/{sid}/risk-factors`, `PUT`, `DELETE .../risk-factors/{fid}` | `routes.manage` | 201 `{"id"}`, 204, 204. Body: `type`, `severity`, `description`, `startTime?`, `endTime?` |

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

Values that break a rule of a model are reported the same way, with these field reasons:
`required`, `invalid`, `invalid-format`, `invalid-date`, `invalid-choice`, `max-length`,
`out-of-range`, `not-accepted`.

### Users

"Owner" endpoints have no uid in the URL or the body: they act on the uid of the token.

- **`POST /users`** takes `uid` and `email` from the token (`email-required` if it has
  none) and never a role. It writes `users/{uid}` with the consent record and server
  timestamps, then sets the `{role: "runner", perms: []}` claims and mirrors `role` on the
  document; an account that already has a role claim keeps it. The client must refresh its
  ID token afterwards to receive the claims.
- **Repeated sign-up.** The profile is created only once: a second `POST` answers 409
  `profile-exists` and changes nothing in it. It still completes the role step, which is
  idempotent, so a sign-up that failed half-way heals on retry.
- **`PATCH /users/me`** merges the given fields into the stored personal data and validates
  the result. `idNumber: null` or `""` removes it. Email, role, consent and timestamps cannot
  be changed. 404 `profile-not-found` before sign-up is completed.
- **`birthDate`** must be `YYYY-MM-DD`, a day that exists, and give an age from 5 to 110.
- **Sport profile and preferences** are replaced as a whole by `PUT`. `GET` answers 404
  `sport-profile-not-found` or `preferences-not-found` when nothing was saved (the clients
  then use their defaults), and `DELETE` is idempotent. A stored sport profile that no
  longer matches the schema counts as missing; invalid stored preferences fall back to the
  default field by field.
- **`DELETE /users/me`** needs a sign-in at most 300 seconds old (`auth_time` of the token),
  so the client re-authenticates first; otherwise 400 `recent-sign-in-required`. One Firestore
  transaction deletes `users/{uid}` and every document under `users/{uid}/private`; then the
  Auth account is deleted. Data goes first: if the Auth deletion fails the user can still
  sign in and retry, and an account already gone from Auth is not an error. An account whose
  stored claims say `admin` is deleted only if the role mirror shows another admin, read in
  the same transaction; otherwise 400 `last-admin` and nothing is deleted.
- **`GET /users`** (admin search) matches `email`, `idNumber`, `birthDate` and `cityId`
  exactly in Firestore, and `firstName` and `lastName` as case- and accent-insensitive
  prefixes in memory. A page holds `limit` users (default 20, at most 50) and a request
  scans at most 1000 profiles, so a page can come back short or empty with a `nextCursor`:
  send it as `cursor` to continue, until it is `null`. Reasons: `invalid-filter`,
  `invalid-limit`, `invalid-cursor` (400); an unknown parameter is `invalid-argument`. The
  id number and the consent record are never returned. It uses the tighter
  `THROTTLE_RATE_SENSITIVE` budget.

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

### Cities

`cities/{id}` holds cities and their zones (`type: "zone"` with a `parentCityId`). The id is a
slug (`loja`, `loja-centro`), `country` is always `EC`, and `type` and the id never change.
Reason codes: `invalid-city-id` (also the callable's), `invalid-city-name`,
`invalid-city-province`, `invalid-city-type`, `invalid-city-location`, `invalid-coverage`,
`invalid-parent-city` (400), `city-exists` (409), `city-not-found` (404). Deleting is refused
with `city-has-routes` while a route references the city and `city-has-zones` while it
has zones. A zone's parent must be an existing city, not another zone. `GET` needs no token
(the sign-up form lists the cities), but a token that is sent and bad is still a 401.

### Routes and the safety index

Reason codes are the ones the route callables used: `invalid-route-id`, `invalid-segment-id`,
`invalid-time-slot-id`, `invalid-risk-factor-id`, `invalid-city-id`, `invalid-route-name`,
`invalid-route-description`, `invalid-route-start`, `invalid-route-end`, `invalid-distance`,
`invalid-elevation-gain`, `invalid-surface`, `invalid-difficulty`, `invalid-active`,
`invalid-segment-name`, `invalid-coordinates`, `invalid-segment-order`, `invalid-slot-label`,
`invalid-start-time`, `invalid-end-time`, `invalid-time-range`, `invalid-valid-from`,
`invalid-valid-to`, `invalid-date-range`, `invalid-factor-type`, `invalid-severity`,
`invalid-factor-description` (400); `time-slot-overlap`, `too-many-segments` (50),
`too-many-time-slots` (12), `too-many-risk-factors` (20 per segment) (400); `route-not-found`,
`segment-not-found`, `time-slot-not-found`, `risk-factor-not-found`, `city-not-found` (404).

- **Validation.** The serializers only reject unknown fields; the domain checks every type and
  value so each failure keeps the reason of the callable (`distanceKm: "5"` is
  `invalid-distance`, not a generic shape error). Ids in the path must match
  `[A-Za-z0-9_-]{1,64}`. Optional fields that a `PUT` leaves out are removed from the document.
- **Visibility.** A route that is not `active` does not exist (404) for a user without
  `routes.manage`, and the list leaves it out. Time slots and risk factors are served only to
  `routes.manage`; the computed `safety` of the route and of each segment is public to signed-in
  users because the app shows it.
- **Safety index (RF-07).** Each segment starts at 100 points per time slot; every risk factor
  whose window overlaps the slot (no window means all day) subtracts 10 (`low`), 20 (`medium`)
  or 35 (`high`), down to 0. Levels: `high` from 70, `medium` 40-69, `low` below 40. A route takes
  the level of its worst segment per slot (ties: the first in route order) and keeps the factors
  that explain it. `CalculadoraIndiceSeguridad` accepts `extra_penalties` for later sources such
  as community reports. Slot windows are half-open (`06:00-09:00` and `09:00-12:00` do not
  overlap) and the slots of a route never overlap.
- **Consistency.** Every slot, factor or segment mutation recalculates the `safety` of every
  segment and of the route, `segmentCount` and `safetyUpdatedAt` in the same Firestore
  transaction (the planner can run again on a retry). Segment `order` stays contiguous 0..n-1:
  creating or moving a segment shifts the others and deleting one closes the gap. Deleting a
  route or a segment also deletes everything under it. The Firestore data model is unchanged.

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
| `THROTTLE_RATE_SENSITIVE` | no (`30/min`) | Extra per-uid rate for the role endpoints, the user search and every change to cities and routes. |
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
  users/                     Usuario, PerfilDeportivo, PreferenciaUsuario: sign-up, own
                             profile, sport profile, preferences, account deletion, search
  roles/                     Rol, role CRUD, role assignment
  cities/                    Ciudad: public catalogue of cities and zones, CRUD
  routes/                    Ruta, Tramo, FranjaHoraria, FactorDeRiesgo, IndiceSeguridad and
                             CalculadoraIndiceSeguridad: routes, segments, time slots, risk
                             factors and the safety index
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
