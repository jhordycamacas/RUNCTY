# Informe de arquitectura y especificaciones técnicas — RUNCTY

Fecha: 2026-11-23. Todas las rutas son relativas a `D:\RUNCTY`. Generado leyendo el código; los números de línea corresponden al estado de esa fecha.

## 1. Resumen de la arquitectura

```
App Angular + Ionic + Capacitor (web admin y APK)
        │  HTTP/JSON + Authorization: Bearer <ID token>
        ▼
Django REST (backend/)  ── única puerta de entrada a los datos
        │  firebase-admin (cuenta de servicio)
        ▼
Firebase: Auth (identidad) · Firestore (datos) · Storage (sin uso)
```

- **Todo dato pasa por Django.** Verificado: `frontend/src` no importa `firebase/firestore`, `firebase/storage` ni `angularfire`. El frontend usa el SDK de Firebase **solo para iniciar sesión** (detrás de `FirebaseAuthGateway`, en `frontend/src/app/core/auth`) y manda el ID token a la API.
- Django **no tiene ORM**: `backend/config/settings.py:96-99` define `DATABASES = {}`, y no hay `models.Model` ni carpetas `migrations`. Firestore es el almacén (decisión registrada en `CONTEXTO.md`, secciones 16 y 17).
- **Pendiente (tarea S6):** `firestore.rules` todavía permite escrituras directas de cliente en `users` y `cities`. Como el frontend ya no las usa, lo correcto es cerrarlas (deny-all) para que Django sea la única vía real.

### Tecnologías usadas (resumen)

| Capa | Tecnología | Para qué |
| --- | --- | --- |
| Frontend | Angular 22 + Ionic 9 | Una sola app para la web del administrador y el celular |
| Móvil | Capacitor 8 (Android) | Empaqueta la app web como APK y da acceso al GPS |
| Mapas | Leaflet + OpenStreetMap (Google Maps opcional) | Mapas detrás de un puerto intercambiable |
| Backend | Django 5.2 + Django REST Framework | API REST: rutas, permisos, límites de uso, seguridad |
| Servidor | gunicorn en Docker (Python 3.10) | Ejecución en producción |
| Identidad | Firebase Authentication | Cuentas, contraseñas y tokens (ID token) |
| Datos | Cloud Firestore | Almacén de todos los datos, accedido solo desde Django |
| Pruebas | pytest (backend) y Vitest (frontend) | 1204 y 857 pruebas |
| Calidad | ruff, ESLint, Prettier, TypeScript | Estilo y tipos |
| Entorno local | Docker Compose + emuladores de Firebase | Desarrollo sin tocar el proyecto real |
| Despliegue (pendiente) | Cloud Run + Firebase Hosting | Publicación de la API y de la web |

### ¿Por qué Django si no hay ORM? El MVC en RUNCTY

El patrón MVC sí existe, repartido por capas y sin el ORM de Django:

| MVC | En RUNCTY | Dónde |
| --- | --- | --- |
| Modelo | Clases Python con las reglas de negocio, y repositorios que las guardan en Firestore | `apps/<app>/domain/models.py` e `infrastructure/` |
| Controlador | Vistas y serializadores de Django REST Framework: validan permisos y entrada y llaman al caso de uso | `apps/<app>/presentation/` y `application/` |
| Vista | Angular + Ionic. Django no genera HTML, solo responde JSON | `frontend/src/app` |

Django aporta la infraestructura de la API: enrutado, permisos por vista, límites de peticiones, CORS, cabeceras de seguridad (HTTPS y HSTS), comandos de gestión (`seed`, `create_admin`), el runner de pruebas y el despliegue con gunicorn.

El ORM no se usa a propósito (arquitectura hexagonal): el modelo no depende de Django ni de Firestore. Cambiar de base de datos (por ejemplo a PostgreSQL en Neon) solo exigiría reemplazar los adaptadores de `infrastructure/`, sin tocar las reglas de negocio ni las vistas. El costo es que no se tienen gratis las migraciones ni el panel `/admin` de Django.

**Dónde ver los "models" de Django:** `backend/apps/<app>/domain/models.py`. Los más representativos son `routes/domain/models.py`, `users/domain/models.py`, `cities/domain/models.py` y `roles/domain/models.py`.

## 2. Diagrama de clases → código

El diagrama de EA "Calcular índice de seguridad" (`CONTEXTO.md`, sección 13) se implementa en **`backend/apps/routes/domain/`**. El backend usa los nombres del diagrama en español; el frontend sigue en inglés.

| Clase del diagrama | Backend (Python) | Frontend (TypeScript) |
| --- | --- | --- |
| `Ruta` | `class Ruta` — `backend/apps/routes/domain/models.py:141` (dataclass congelada con `parse`, `from_document`, `to_document`) | `interface Route` — `frontend/src/app/routes/domain/route.ts:44` |
| `Tramo` | `class Tramo` — `models.py:301`; entrada `TramoInput` `:265`; evaluado `TramoEvaluado` en `safety.py:112` | `interface Segment` — `route.ts:73`; admin: `ManagedSegment` en `admin/routes/domain/managed-route.ts:37` |
| `FranjaHoraria` | `class FranjaHoraria` — `models.py:326` | `interface TimeSlot` — `admin/routes/domain/managed-route.ts:16` |
| `FactorDeRiesgo` | `class FactorDeRiesgo` — `models.py:390` | `RiskFactor` (`managed-route.ts:27`), `SafetyFactor`/`RouteFactor` (`route.ts:21,28`) |
| `ReporteValidado` | **No existe en el código.** EP-17 (reportes comunitarios) está "Sin código". Queda el punto de extensión `ExtraPenalty(source=...)` en `safety.py:46`; hoy solo se usa `source="incident"` | — |
| `IndiceSeguridad` | `class IndiceSeguridad` — `backend/apps/routes/domain/safety.py:79`; subclase `IndiceSeguridadRuta` `:95`; auxiliar `FactorEvaluado` `:55` | `RouteSlotSafety` y `SegmentSlotSafety` — `route.ts:34,67` (solo muestra; el cliente no calcula) |
| `CalculadoraIndiceSeguridad` | `class CalculadoraIndiceSeguridad` — `safety.py:141`, con `segment_safety` (`:145`) y `route_safety` (`:169`) | — (se calcula solo en el backend) |
| `Ruta.obtenerTramosOrdenados()` | **No es método.** Se ordena con `sorted(..., key=lambda s: (s.order, s.id))` en `routes/application/use_cases.py:124,214` y `safety.py:175` | — |
| `FactorDeRiesgo.estaActivoEn(franja)` | **No es método.** Lo hacen `to_window` y `time_windows_overlap` en `routes/domain/time.py`, usados en `safety.py:154-159` | — |

Diferencias con el diagrama (para tenerlas claras en la defensa):

- `IndiceSeguridad` se guarda como un mapa por id de franja dentro del documento de la ruta (`safety` y `safetyUpdatedAt`), no como objeto aparte.
- Nivel y severidad son `str` (sin enumeraciones, como decidió el equipo): `SEVERITIES = ("low","medium","high")`, `safety.py:20`.

### Algoritmo del índice (`safety.py`, cabecera `:1-11`)

1. Cada tramo y franja parte de **100 puntos** (`_MAX_SCORE`, `:22`).
2. Cada factor activo en la franja resta su penalización: **−10 baja, −20 media, −35 alta**. No son constantes: viven en `SystemSettings` (`apps/system_settings/domain/models.py`) y el admin las edita.
3. Piso en 0 (`:161`).
4. Nivel (`level_for_score`, `:124`): **Alto ≥ 70, Medio ≥ 40, Bajo** en otro caso. Los umbrales también son editables.
5. La ruta toma el **peor tramo** por franja (`route_safety`, `:169-198`); si empatan, el primero en orden. Se conservan todos los factores que lo explican.
6. Un tramo sin factores da 100 (Alto).
7. Orquestación y persistencia: `with_recalc` (`routes/application/use_cases.py:129-179`), dentro de una transacción de Firestore. Se recalcula con cada cambio de tramos, franjas o factores, y en bloque con `recalculate_all_routes` (`POST /admin/recalculate-routes`). También penalizan los incidentes recientes.

Tests: `backend/tests/test_route_safety.py` (`TestSegmentSafety`, `TestRouteSafety`, `TestWithOtherSettings`) y complementarios `test_route_time.py`, `test_route_inputs.py`, `test_route_use_cases.py`, `test_routes_api.py`, `test_route_reorder.py`.

## 3. Dónde están los "models" de la base de datos

No hay `models.py` de Django ORM. El modelo de datos está repartido así, en cada app de `backend/apps/<app>/`:

| Qué | Dónde |
| --- | --- |
| Entidades (dataclasses congeladas con `parse`, `from_document`, `to_document`) | `domain/models.py` |
| Contratos (Protocols) de los repositorios | `application/ports.py` |
| Adaptadores de Firestore | `infrastructure/*.py` (p. ej. `FirestoreRouteRepository`) |
| Nombres de colecciones | `apps/shared/infrastructure/firebase/collections.py` |
| Subcolecciones de rutas | `routes/infrastructure/firestore_route_repository.py:18-20` |
| Acceso genérico a documentos | `apps/shared/infrastructure/firebase/documents.py` (`FirestoreDocumentStore`) |
| Reglas de seguridad | `firestore.rules`, índices en `firestore.indexes.json` |

Los atributos en Python van en `snake_case`; los campos en Firestore, en `camelCase`.

### Colecciones y campos

- **`users/{uid}`** (`users/domain/models.py:58-117`): `uid`, `email`, `firstName`, `lastName`, `birthDate`, `cityId`, `idNumber?`; el servidor agrega `role`, `consent{lopdp,acceptedAt}`, `createdAt`, `updatedAt`.
  - `users/{uid}/private/sportProfile`: `level`, `goals[]`, `usualPaceSecPerKm`, `preferredDistanceKm`.
  - `users/{uid}/private/preferences`: `language`, `fontScale`, `appearance`, `units`, `notifications{enabled,safetyAlerts,events}`, `locationPrivacy`.
  - `users/{uid}/private/photo`: foto de perfil.
- **`roles/{id}`**: `name`, `description`, `permissions[]`, `system`.
- **`cities/{id}`**: `name`, `province`, `country`, `type`, `location{lat,lng}`, `coverage`, `parentCityId?`.
- **`routes/{id}`** (`Ruta.to_document`, `models.py:248`): `name`, `cityId`, `description`, `start`/`end{lat,lng,label}`, `distanceKm`, `elevationGainM`, `surface`, `difficulty`, `active`; calculados: `segmentCount`, `preview[]`, `safety{slotId:{level,score,factors[],startTime,endTime,worstSegmentId}}`, `safetyUpdatedAt`, `createdAt`, `updatedAt`.
  - `routes/{id}/segments/{id}`: `name`, `order`, `coordinates[]`, `lengthM`, `safety{...}`.
  - `routes/{id}/segments/{id}/riskFactors/{id}`: `type`, `severity`, `description`, `startTime?`, `endTime?`.
  - `routes/{id}/timeSlots/{id}`: `label?`, `startTime`, `endTime`, `validFrom?`, `validTo?`.
- **`informationSources/{id}`**: `entity`, `dataType`, `loadedAt`, `data`.
- **`safetyIncidents/{id}`**: `routeId`, `segmentId`, `type`, `severity`, `date`, `time`, `sourceId`, `sourceDeleted`.
- **`supportPoints/{id}`**: `type`, `name`, `location`, `cityId`, `openingHours`.
- **`guardedTrails/{id}`**: `routeId`, `segmentId`, `days[]`, `startTime`, `endTime`.
- **`riskZoneAlerts/{id}`**: `type`, `severity`, `description`, `location`, `radiusM`, `cityId`, `routeId`, `validFrom`, `validTo`, `startTime`, `endTime`.
- **`safeRouteRequests/{id}`**: `uid`, `cityId`, `distanceKm`, `startTime`, `endTime`, `createdAt`.
- **`systemSettings/global`**: penalizaciones, umbrales, ventana y margen de incidentes, zona horaria, radios, límites, rangos de perfil y país.
- **`catalogs/{sportLevels|sportGoals}`**: `{items:[{code,label,order,active}]}`.

## 4. Backend (Django)

### Apps (`backend/apps/`)

`catalogs`, `cities`, `risk_alerts`, `roles`, `routes`, `safe_routes`, `safety_data`, `summary`, `support_points`, `system_settings` y `users` tienen las cuatro capas: `domain` / `application` / `infrastructure` / `presentation`. Además: `health` (sin domain), `identity` (solo presentation, `/me`), `seed` (con comandos de gestión) y `shared` (errores, permisos, autenticación y adaptadores de Firebase).

### Inyección de dependencias

`backend/config/settings.py:43-92` declara, por nombre, la ruta de cada adaptador (`TOKEN_VERIFIER`, `AUTH_GATEWAY`, `ROLE_REPOSITORY`, `CITY_REPOSITORY`, `ROUTE_REPOSITORY`, …). Las vistas los obtienen con `adapter("SETTING")` (`shared/presentation/adapters.py`), que hace `import_string`. En tests, `backend/tests/settings.py` y `backend/tests/fakes.py` los reemplazan por versiones en memoria.

### Autenticación y permisos

- `BearerTokenAuthentication` lee `Authorization: Bearer <ID token>` y lo verifica con `FirebaseTokenVerifier` (`verify_id_token(check_revoked=True)`). Rechazos: `token-revoked`, `user-disabled`, `token-expired`, `invalid-token`.
- El `Principal` sale de los claims `{role, perms}`.
- Por defecto todo está denegado (`IsAuthenticated`); cada vista pide `HasPermission(...)` o `IsAdmin`.
- Catálogo de 10 permisos (`shared/domain/permissions.py`): `admin.access`, `users.read`, `users.manage`, `roles.manage`, `cities.manage`, `routes.manage`, `reports.validate`, `ads.manage`, `clubs.manage`, `settings.manage`.
- Limitación de intentos fallidos (`FailedAuthenticationThrottle`).

### Errores

`DomainError(kind, reason, message, fields)`. La respuesta es `{"error":{"reason","message","fields?"}}`. Códigos HTTP: 400, 403, 404, 409 y 500 genérico. El cliente traduce `reason` a español (`frontend/src/app/core/errors/error-messages.ts`).

### Configuración y seguridad (`config/settings.py`)

- `DEBUG` es falso por defecto; `DJANGO_SECRET_KEY` es obligatoria fuera de debug.
- Fuera de debug: redirección a HTTPS, HSTS de 31 536 000 s, `X_FRAME_OPTIONS=DENY`, nosniff.
- `check_production_target` impide usar emuladores o un proyecto `demo-*` sin debug.
- CORS por lista; `localhost:4200` y `8100` solo en debug.
- Throttles DRF: `ip` 120/min, `user` 240/min, `auth-failed` 20/min, `sensitive` 30/min.

### Endpoints (`/api/v1/`)

| Área | Rutas |
| --- | --- |
| health | `GET health`, `GET health/services` |
| identity | `GET me` |
| users | `GET/POST users`; `GET/PATCH/DELETE users/{uid}`; `PUT/DELETE users/{uid}/sport-profile`; `GET/PATCH/DELETE users/me`; `GET/PUT/DELETE users/me/sport-profile`, `…/preferences`, `…/photo` |
| roles | `GET/POST roles`; `PUT/DELETE roles/{id}`; `PUT users/{uid}/role` |
| cities | `GET/POST cities` (el GET es público); `PATCH/DELETE cities/{id}` |
| routes | `GET/POST routes`; `GET/PUT/DELETE routes/{id}`; `POST routes/{id}/segments`; `PUT/DELETE …/segments/{sid}`; `POST routes/{id}/time-slots`; `PUT/DELETE …/time-slots/{slotId}`; `POST …/segments/{sid}/risk-factors`; `PUT/DELETE …/risk-factors/{fid}` |
| safety_data | CRUD `information-sources[/{id}]` y `safety-incidents[/{id}]` |
| support_points | CRUD `support-points[/{id}]` y `guarded-trails[/{id}]` |
| risk_alerts | CRUD `risk-zone-alerts[/{id}]` |
| safe_routes | `GET/POST safe-route-requests`; `GET/DELETE safe-route-requests/{id}` |
| summary | `GET admin/summary` |
| system_settings | `GET/PUT settings`; `POST admin/recalculate-routes` |
| catalogs | `GET/PUT catalogs/{catalogId}` |

El índice de seguridad no tiene endpoint propio: viaja dentro de `GET routes/{id}`.

### Comandos de gestión (`apps/seed/management/commands/`)

`seed` (opción `--data-only`; se niega fuera de emuladores), `create_admin --email --first-name --last-name` (pide la clave con `getpass`) y `reset_password --email`.

## 5. Frontend (Angular + Ionic + Capacitor)

- **Estructura:** `frontend/src/app` con `account`, `admin`, `alerts`, `auth`, `cities`, `clubs`, `core`, `preferences`, `routes`, `run`, `runner`, `shared`, `sport-profile`. Cada feature sigue `domain` / `application` / `infrastructure` / `presentation` / `testing`.
- **Rutas** (`app.routes.ts`): públicas `login`, `registro`, `recuperar`; área del corredor `/app` (inicio, rutas, correr, clubes, notificaciones, cuenta); área admin `/admin` (resumen, usuarios, ciudades, roles, rutas, configuración), protegida con `permissionGuard('admin.access')`. Ambas áreas con carga diferida.
- **Estado:** `signal`/`computed` dentro de Stores `@Injectable`.
- **Hexagonal:** el repositorio es una clase abstracta en `domain` (el puerto) y su implementación `Http*Repository` está en `infrastructure`, enlazada en `app.config.ts`. Hay puertos también para mapas (`MapRenderer`: Google y Leaflet) y geolocalización (`PositionSource`).
- **HTTP:** interceptores `bearerTokenInterceptor` y `apiErrorInterceptor` (`core/api`).
- **Entornos:** `environment.ts` (emuladores), `environment.real.ts` (proyecto real), `environment.prod.ts`.
- **Tema:** variables `--rc-*` en `src/theme/_tokens.scss`, `_palette.scss`, `_areas.scss`, `_ionic.scss`; claro y oscuro; letra ajustable con `--rc-font-scale`; probado en `tokens.spec.ts`.
- **Capacitor:** `appId ec.runcty.app`, carpeta `frontend/android`.
- **Idioma:** no hay librería i18n; los textos están en español en el código.

## 6. Infraestructura

- **`docker-compose.yml`:** `firebase` (emuladores, con volumen para conservar datos), `api` (Django), `seed` (una vez) y `admin` (Next.js legado). Puertos solo en `127.0.0.1`; `cap_drop: ALL` y `no-new-privileges`.
- **`backend/Dockerfile`:** `python:3.10.19-slim-bookworm`, usuario sin root, gunicorn.
- **`firebase.json`:** hosting con cabeceras de seguridad, Firestore, Storage y emuladores.
- **`deploy/`:** scripts de despliegue a Cloud Run y Hosting. **Pendiente** por facturación.
- **Código legado aún versionado** (reemplazado por `frontend/` y `backend/`; borrado pendiente en la tarea S6): `functions/` (Cloud Functions), `admin/` (Next.js), `frontend/mobile/` (Expo) y `scripts/seed-emulator.ts`.

## 7. Especificaciones técnicas

| Componente | Versión |
| --- | --- |
| Django | 5.2.19 |
| Django REST Framework | 3.18.3 |
| django-cors-headers / django-environ | 4.9.0 / 0.14.0 |
| firebase-admin | 7.7.0 |
| gunicorn | 27.0.0 |
| Python | 3.10.19 (Dockerfile) |
| pytest / pytest-django / ruff | 9.2.0 / 4.14.0 / 0.17.4 |
| Angular | ^22.2 |
| Ionic Angular | ^9.0.11 |
| Capacitor | ^8.6.2 (requiere JDK 21 para el APK) |
| Firebase SDK (cliente, solo Auth) | ^13.3.0 |
| Leaflet | ^1.9.4 |
| TypeScript | ~6.0.2 |
| Vitest (con `ng test`) | ^5.0.0 |
| Node | 22 (`.nvmrc`) |

**Pruebas** (según `CONTEXTO.md`, 2026-11-22): backend 1204, frontend 857.

**Requisitos no funcionales documentados:** alerta de pánico ≤ 5 s; rutas recomendadas ≤ 10 s (p95, 4G); índice recalculado ≤ 24 h; disponibilidad ≥ 99 %; GPS ≤ 10 m de error; Android 9+ e iOS 14+; contraste 4,5:1 y botones de 48 dp; modo oscuro; cumplimiento de la LOPDP.

**Accesibilidad medida** el 2026-11-22 en Chrome (1492 y 360 px, claro y oscuro). No verificado todavía en un celular Android real para todas las pantallas.

## 8. Pendientes y riesgos conocidos

1. Cerrar `firestore.rules` a deny-all para `users` y `cities` (S6), de modo que Django sea la única vía.
2. Borrar el código legado (`functions/`, `admin/`, `frontend/mobile/`) en S6.
3. `ReporteValidado` (EP-17) no está implementado; el diagrama lo muestra y el código solo deja el punto de extensión.
4. Abiertos de seguridad: SEC-01 (App Check), SEC-04, SEC-07, SEC-10 (avisos de `npm audit` en `@grpc/grpc-js`).
5. Despliegue a Cloud Run y Hosting pendiente.
