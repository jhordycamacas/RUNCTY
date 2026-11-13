# RUNCTY frontend

One Angular 22 + Ionic 9 + Capacitor 8 app for the web (browser) and Android (APK). It talks only to the Django API in `../backend`; Firebase Auth is used on the client only to sign in, and the ID token goes to the API as `Authorization: Bearer`.

> `frontend/mobile` is the old React Native app. It is removed in task S6 and is excluded from every config here (Angular, TypeScript and ESLint only look at `src/`).

## Layout

```
src/app/
  core/      API client, interceptors, error mapping, auth service, permissions, guards
  shared/    base components and pages (403, 404)
  auth/      login
  runner/    /app    runner area, mobile-first, bottom tabs
  admin/     /admin  admin area, desktop-first, side menu (ion-split-pane)
src/theme/   design tokens (CSS variables), Ionic mapping, per-area overrides, Inter font
src/environments/  development (emulators) and production (placeholders)
```

The two areas are lazy-loaded bundles. Guards read the role and permissions from `GET /me` (never from the client alone): `admin.access`, `users.read`, `roles.manage`, `cities.manage`, `routes.manage`. `/admin` opens the first section the user may use.

## Commands

Use `npm.cmd`, `npx.cmd` and `ionic.cmd` in PowerShell.

| Command | What it does |
| --- | --- |
| `npm ci` | Install dependencies (first time) |
| `npm start` | Dev server at http://localhost:4200 |
| `npm test` | Unit tests (Vitest through `ng test`) |
| `npm run lint` | ESLint |
| `npm run build` | Production build into `dist/runcty-frontend/browser` |
| `npx cap sync android` | Copy the build and plugins into `android/` |
| `ionic cap run android -l --external` | Run on a phone or emulator with live reload |

The development environment points at the API and the Auth emulator on the host that serves the app (`location.hostname`), so it works on `localhost` and, with `--external`, from a phone on the same network. For that case start the API listening on the network and allow the origin (`CORS_ALLOWED_ORIGINS`, see `../backend`).

Backend for development (from the repo root): `firebase emulators:start`, then `python manage.py seed` and `python manage.py runserver` in `backend/` (or `docker compose up`). The API is at `http://localhost:8000/api/v1`.

## Environments

- `environment.ts`: development. Project `demo-runcty`, fake API key, Auth emulator on port 9099.
- `environment.prod.ts`: production build (`npm run build`). Only placeholders; replace them at deployment time. No secrets belong in git.

## Android (Capacitor)

App id `ec.runcty.app`, name `RUNCTY`, `webDir` `dist/runcty-frontend/browser`.

1. Requirements: Android Studio with the SDK, `ANDROID_HOME` pointing at it (usually `%LOCALAPPDATA%\Android\Sdk`), and JDK 21 (Capacitor 8 needs it).
2. Point `JAVA_HOME` at JDK 21: the Android Studio JBR (`C:\Program Files\Android\Android Studio\jbr`) or an installed Temurin 21. In PowerShell for the current session:

   ```powershell
   $env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
   $env:Path = "$env:JAVA_HOME\bin;$env:Path"
   ```

3. Build and sync, then build the debug APK:

   ```powershell
   npm.cmd run build
   npx.cmd cap sync android
   cd android
   .\gradlew.bat assembleDebug
   ```

   The APK is `android/app/build/outputs/apk/debug/app-debug.apk`. Install it with `adb install -r <apk>` (USB debugging on, see `../docs/manual-instalacion-android.md` for the phone setup).
4. A production build calls the placeholder API of `environment.prod.ts`. To test an APK against your computer use live reload (`ionic cap run android -l --external`) or build with `npx.cmd ng build --configuration development`.
5. Windows paths: keep the repo in a short path such as `D:\RUNCTY`. Gradle and the Android build tools hit the 260 character limit in deep folders.
6. The WebView serves the app from `https://localhost`; the backend allows that origin (and `http://localhost`, `capacitor://localhost`) in CORS.
