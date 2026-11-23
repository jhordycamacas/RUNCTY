# RUNCTY frontend

One Angular 22 + Ionic 9 + Capacitor 8 app for the web (browser) and Android (APK). It talks only to the Django API in `../backend`; Firebase Auth is used on the client only for sign-up, sign-in, re-authentication and the reset/verification emails, and the ID token goes to the API as `Authorization: Bearer`.

> `frontend/mobile` is the old React Native app. It is removed in task S6 and is excluded from every config here (Angular, TypeScript and ESLint only look at `src/`).

## Layout

```
src/app/
  core/          API client, interceptors, error mapping, auth service (+ Firebase gateway port), permissions, guards, system settings (`GET /settings`: the limits the forms validate against) and option catalogs
  shared/        base UI (text field, birth date, notice, confirm dialog, choice chips, avatar), image resizing (`resizeToSquareJpeg` behind an `ImageCodec` port), map view (Google Maps or Leaflet + OpenStreetMap behind a renderer port), form helpers, pages (403, 404)
  auth/          sign in, sign up, password reset, email verification banner
  account/       profile, profile photo (pick, resize on the device, upload, remove), personal data, password change, account deletion
  sport-profile/ sport profile (create, edit, delete)
  preferences/   appearance, font size, units, notifications, location privacy
  cities/        city catalogue and the city picker
  routes/        route catalog: list with filter chips, detail with map and tabs, safety level per time slot, recommended routes
  run/           Correr tab: live GPS position on the map
  alerts/        risk-zone alerts page opened from the bell (`GET /risk-zone-alerts`)
  clubs/         Clubes tab placeholder (EP-19)
  runner/        /app    runner area shell and Home (mobile-first; bottom tabs Inicio, Rutas, Correr, Clubes, Cuenta)
  admin/         /admin  admin area, desktop-first, side menu (ion-split-pane)
src/theme/   design tokens (CSS variables), Ionic mapping, per-area overrides, Outfit (runner), Oswald (display) and Geist (admin) variable fonts from @fontsource-variable
src/environments/  development (emulators) and production (placeholders)
```

The two areas are lazy-loaded bundles. Guards read the role and permissions from `GET /me` (never from the client alone): `admin.access`, `users.read`, `roles.manage`, `cities.manage`, `routes.manage`. `/admin` opens the first section the user may use.

Each feature folder is layered: `domain` (types, rules, ports as abstract classes), `application` (use cases and signal stores), `infrastructure` (HTTP repositories over `ApiClient`, local storage, DOM) and `presentation` (Angular + Ionic pages). The ports are bound to their adapters in `app.config.ts`; specs swap them for fakes. Firebase Auth is used only to sign up/in/out, re-authenticate, reset the password and verify the email; the profile, sport profile, preferences and account deletion go through the API.

### Routes and safety wording

`GET /routes?cityId=` and `GET /routes/{id}` feed the Rutas tab and the Home section. The safety level of a route is shown per time slot as Alto, Medio or Bajo with the risk factors that explain it, and always with the notice that it is an estimate; the UI never calls a route "segura" or "insegura". "Abrir en Google Maps" is a plain `https://www.google.com/maps/search/?api=1&query=lat,lng` link (`target="_blank"`); the in-app maps follow the renderer rules in the Maps section below. There is no on-screen SOS button: the panic trigger with the volume buttons arrives in Sprint 4 (spec 15).

### Preferences and themes

The appearance preference sets `data-theme` on `<html>` (none means "follow the system") and the font-size preference sets `--rc-font-scale`, which multiplies the root font size, so everything sized in `rem` follows it. They are applied at start-up (`PreferencesStore`, from the device copy first, then from the API) and reset on sign-out. Distances go through `formatDistance` (`preferences/domain/units.ts`) so they follow the unit preference. Controls use `--rc-control-border` (3:1 against the page in both themes; `src/theme/tokens.spec.ts` checks the contrast).

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

## Maps

`<app-map-view>` draws lines (colored by safety level) and markers through the `MapRenderer` port (`src/app/shared/map`). `provideMapRenderer(environment.googleMapsApiKey)` in `app.config.ts` picks the provider once at start-up:

- `googleMapsApiKey` set: Google Maps (Maps JavaScript API, loaded lazily and once by `GoogleMapsLoader`, `language=es`, dark style built from the theme tokens).
- `googleMapsApiKey: null` (the default in every environment): Leaflet with OpenStreetMap tiles. It is also the real fallback when the Google script fails or the key is refused (`gm_authFailure`), with an inline notice, so a map is never blank.

To enable Google, create a browser key restricted by API (Maps JavaScript API) and HTTP referrer, then paste it in `googleMapsApiKey` of `environment.real.ts` / `environment.prod.ts`. The referrers to allow, including the Android app, are listed in `../specs/05-catalogo-de-rutas.md` (section "Mapa de la ruta"). Positions of other runners in real time are a later sprint (EP-16). More frontend context: `CONTEXTO-FRONTEND.md`.

## Environments

- `environment.ts`: development. Project `demo-runcty`, fake API key, Auth emulator on port 9099.
- `environment.real.ts`: the real Firebase project with the local API (`npm run start:real`).
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
