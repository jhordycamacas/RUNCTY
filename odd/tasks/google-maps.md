# Google Maps behind the map port

## Objective
Draw the route map with Google Maps (Maps JavaScript API) in the admin route detail ("Tramos y factores" and route detail) and in the runner app (route detail, live map of Correr), in the browser and in the Capacitor Android app. Without a key the app keeps the OpenStreetMap/Leaflet renderer.

## Scope
- `GoogleMapRenderer` implementing the existing `MapRenderer` port; `GoogleMapsLoader` (single lazy load, timeout, `gm_authFailure`).
- `environment.googleMapsApiKey: string | null`, `null` in every environment; the owner pastes the key.
- Provider-level choice: key -> Google, no key -> Leaflet; load failure or refused key -> Leaflet at runtime with an inline notice.
- Docs: spec 05 (and 16 note), `frontend/README.md`, `frontend/CONTEXTO-FRONTEND.md`.
- Out of scope: positions of other runners in real time (EP-16, Sprint 4).

## Tasks
- [x] T1 Loader + renderer + selection, specs written first (RED: modules missing), then GREEN
- [x] T2 Environment model/files, `app.config.ts`, `MapView` notice, Leaflet `notice`
- [x] T3 Docs in Spanish (spec 05/16, README, CONTEXTO-FRONTEND) with the key steps and referrers
- [x] T4 Full verification

## Decisions
- Inline loader instead of `@googlemaps/js-api-loader`: no runtime dependency, testable with a fake window; only `@types/google.maps` (dev) was added.
- Dark map by JSON `styles` from tokens, not `mapId`, so only an API key is needed. `google.maps.Marker` (deprecated, supported) because `AdvancedMarkerElement` requires `mapId`.
- Android app: Capacitor serves bundled assets from `https://localhost` (no `server` in `capacitor.config.ts`); live reload uses the dev server URL.

## Route
Inline by the delegated writer; 2+ non-trivial files, single writer.

## Evidence
- RED: the new specs failed to compile (missing `google-map-renderer`, `map-renderer-provider`, `Leaflet.notice`).
- `npx ng test --watch=false`: 117 files, 857 tests passed.
- `npx tsc --noEmit -p tsconfig.app.json` and `-p tsconfig.spec.json`: clean. `npm run lint`: all files pass. `npx ng build -c real`: ok.
