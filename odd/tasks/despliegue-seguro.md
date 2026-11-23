# Secure deployment (Cloud Run + Firebase Hosting)

## Objective
The owner can deploy the Django API to Cloud Run and the Angular web to Firebase Hosting with two
PowerShell scripts, securely, for the 2026-11-23 defense.

## Why
Real project `runcty-73d70` is connected for local tests; nothing is published yet. Remote
operations are executed by the owner only: this feature only writes files and docs.

## Scope
Backend image, deploy scripts, Hosting config with security headers, docs, spec, context files.
Out of scope: running any gcloud/firebase/docker command, custom domain, CI, shared throttle cache,
frontend source (`frontend/src/**` belongs to another writer).

Spec: `specs/transversal/despliegue.md`. Guide: `docs/despliegue.md`. Route: writer inline
(single delegated writer; no review, RDD off in this repo).

## Tasks
- [x] T1 Production image: reuse `backend/Dockerfile` (non-root, pinned digest), bind `$PORT`
      (default 8000 for compose), threads, `/dev/shm` worker tmp; harden `backend/.dockerignore`.
- [x] T2 `deploy/common.ps1`, `deploy/deploy-backend.ps1` (APIs, least-privilege service account,
      secret, clean-copy source deploy, env vars, URL) and `deploy/deploy-web.ps1` (apiBaseUrl line
      only, build, Hosting + Firestore rules/indexes).
- [x] T3 `firebase.json` hosting (SPA rewrite, cache, CSP and security headers) and `.firebaserc`
      alias `production` (default stays `demo-runcty` for the emulators).
- [x] T4 Hardening review by reading `settings.py` (see evidence); limitations documented.
- [x] T5 Docs in Spanish: `docs/despliegue.md`, links from `README.md` and `docs/conectar-google.md`,
      `CONTEXTO.md` section 20, `backend/CONTEXTO-BACKEND.md`, `specs/transversal/despliegue.md`,
      `specs/README.md`.
- [ ] T6 (owner) Run the scripts and tick the open acceptance criteria of the spec.
      STATUS 2026-11-22: PENDING by the owner's decision. `billingEnabled False` on `runcty-73d70`
      (Cloud Run/Cloud Build need billing; the $50 prepayment was not made). Options A/B/C and exact
      steps: `docs/retomar-despliegue.md`.

## Evidence
- `firebase.json` parses with `json.load`; emulators/firestore/storage/functions sections kept.
- PowerShell `Parser.ParseFile` on the three scripts: 0 errors; files are ASCII only.
- apiBaseUrl regex matched exactly 1 line of the real `environment.prod.ts` and replaced only it.
- Settings read: with `DJANGO_DEBUG` unset -> `SECURE_SSL_REDIRECT`, HSTS 1 year, nosniff,
  `X-Frame-Options: DENY`; `SECURE_PROXY_SSL_HEADER` only when `DJANGO_NUM_PROXIES` > 0 (required on
  Cloud Run, else redirect loop); production guard refuses emulator hosts and `demo-*`.
- Throttle cache is Django's default `LocMemCache`: per process, so it is not shared between
  instances or workers. The service runs one worker with 8 threads per instance and max 3
  instances; a shared cache needs new infrastructure and is documented, not built.
- Cloud Run HTTP probes would hit `SecurityMiddleware` with the instance IP as `Host` and fail
  `ALLOWED_HOSTS` (400), so the default TCP startup probe is kept; `/api/v1/health` is for manual checks.
- Not executed (by rule): docker build, gcloud, firebase, ng build, any network command.
- Commit: see git log (`feat(deploy)` / `docs(deploy)`).

## Next step
Owner runs `deploy-backend.ps1`, then `deploy-web.ps1 -ApiUrl <url>`, then the checks in
`docs/despliegue.md` section 3.
