# Contexto del backend (RUNCTY)

Contexto vivo y breve del backend. El detalle de endpoints, errores y variables está en [README.md](README.md); los requisitos, en [specs/](../specs/README.md); el contexto general del proyecto, en [../CONTEXTO.md](../CONTEXTO.md).

## Qué es

API REST en Django + DRF que contiene la lógica de servidor de RUNCTY. Los clientes (web Angular + Ionic y app Android con Capacitor) inician sesión con Firebase Authentication y envían `Authorization: Bearer <ID token>`. Firestore es la base de datos: no hay SQL ni ORM. Arquitectura hexagonal por capacidad (`apps/<capacidad>/{domain,application,infrastructure,presentation}`); los puertos se enlazan por ajustes (`TOKEN_VERIFIER`, `ROLE_REPOSITORY`...) y las pruebas usan adaptadores en memoria.

## Apps

`shared` (Principal, permisos, firebase-admin, errores, throttles), `health`, `identity` (`/me`), `users`, `roles`, `cities`, `routes` (rutas, tramos, franjas, factores, índice de seguridad), `safety_data` (incidentes y fuentes), `support_points` (puntos de apoyo y senderos con resguardo), `risk_alerts`, `safe_routes`, `summary` (resumen del panel), `system_settings` (parámetros del sistema), `catalogs` (catálogos de nivel y objetivos) y `seed` (comandos de gestión).

## Cómo correrlo

| Modo | Cómo |
| --- | --- |
| Emuladores (sin credenciales) | `docker compose up -d --build` desde la raíz, o `npm run emulators` + `npm run seed` + `npm run api`. Proyecto `demo-runcty`, `DJANGO_DEBUG=true`. Admin de prueba `admin@runcty.dev` / `Admin123!`. |
| Proyecto real, local | `backend/.env` con `DJANGO_DEBUG=true`, `FIREBASE_PROJECT_ID=runcty-73d70`, la ruta de la clave JSON fuera del repo; `manage.py runserver 8000`. Guía: [../docs/conectar-google.md](../docs/conectar-google.md). |
| Producción | Cloud Run con `deploy/deploy-backend.ps1`. Guía: [../docs/despliegue.md](../docs/despliegue.md). |

Comprobaciones: `.venv/Scripts/python -m pytest -q` (1204 pruebas en verde el 2026-11-22), `-m ruff check .`, `-m ruff format --check .`.

**Proyecto real, notas del 2026-11-22** (detalle y cronología: [../docs/bitacora-2026-11-22.md](../docs/bitacora-2026-11-22.md)):

- `backend/.env` lo crea el propietario, nunca el asistente; la clave JSON de la cuenta de servicio vive fuera del repositorio. `DJANGO_DEBUG=true` solo sirve para probar por HTTP en local; producción no lo define.
- El contenedor `runcty-api` ocupa el puerto 8000: se detiene (`docker stop runcty-api`) antes de `runserver 8000`, y se vuelve a los emuladores con `docker compose up -d api`. En PowerShell 5 no existe `&&`: usar `;`.
- `CORS_ALLOWED_ORIGINS` debe incluir `http://127.0.0.1:4200`; `localhost` y `127.0.0.1` son orígenes distintos y `localhost` puede resolverse a IPv6 (`[::1]`), donde puede escuchar otro `ng serve`.
- Verificado: la clave de servicio funciona; el proveedor correo y contraseña está activo; los dominios autorizados de Authentication son `localhost`, `firebaseapp.com` y `web.app`. Datos del proyecto real: solo administrador, Loja, parámetros, catálogos y roles (`seed --data-only` añade las rutas de ejemplo).
- La política de contraseña (8 o más, letra y número) está replicada en `apps/users/domain/password_policy.py` para `create_admin` y `reset_password`.
- Las reglas de Firestore ya no guardan rangos de negocio; `functions/test/rules/firestore.rules.test.ts` (heredado) todavía espera los antiguos y fallará.

## Variables de entorno

`DJANGO_DEBUG` (solo local), `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_NUM_PROXIES`, `CORS_ALLOWED_ORIGINS`, `THROTTLE_RATE_*`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `GOOGLE_APPLICATION_CREDENTIALS` (solo local), `*_EMULATOR_HOST` (solo debug), `GOOGLE_MAPS_API_KEY`. En contenedor, además: `PORT`, `WEB_CONCURRENCY` (workers de gunicorn) y `GUNICORN_THREADS`. Tabla completa en el README.

## Ajustes del sistema, catálogos y datos

Nada de negocio está fijo en el código: los parámetros (penalizaciones, umbrales, ventanas, radios, límites) viven en `systemSettings/global` (`GET`/`PUT /settings`, permiso `settings.manage`) y las opciones del perfil deportivo en `catalogs/{id}` (`sportLevels`, `sportGoals`). Cambiar una penalización, umbral, ventana, margen o la zona horaria recalcula todas las rutas. Lo que se queda en código a propósito está en `specs/27-configuracion-del-sistema.md`.

**Foto de perfil.** `GET`/`PUT`/`DELETE /users/me/photo` guardan la foto como data URL en `users/{uid}/private/photo` (`data`, `mime`, `updatedAt`), no en Cloud Storage: Storage exige el plan de pago y el proyecto no tiene facturación. La API valida tipo (jpeg, png, webp), base64, bytes mágicos y tamaño (`profilePhotoMaxKb`, 20–500, defecto 100; el cliente reduce a `profilePhotoMaxPx`, 64–1024, defecto 256). Solo existe la foto propia; eliminar la cuenta la borra con el resto de `private`.

## Comandos de gestión (`manage.py`)

| Comando | Para qué |
| --- | --- |
| `seed` | Datos de demostración en **emuladores** (cuenta `admin@runcty.dev`). Contra otro destino se niega a crear la cuenta de prueba; `--data-only` carga solo datos. |
| `create_admin --email --first-name --last-name` | Crea o promueve un administrador en un proyecto real; pide la contraseña por la terminal; guarda roles, ciudad Loja, ajustes y catálogos si faltan. |
| `reset_password --email` | Fija una contraseña nueva para una cuenta existente, pedida por la terminal. |

Se ejecutan desde el equipo del propietario con la clave local, no en Cloud Run.

## Despliegue (2026-11-22)

- Imagen: `backend/Dockerfile` (Python 3.10 slim fijado por digest, usuario sin root, gunicorn en `$PORT`, 2 workers x 4 hilos por defecto, `--worker-tmp-dir /dev/shm`). `backend/.dockerignore` excluye `.env*`, `.venv`, claves y `tests`.
- Cloud Run: servicio `runcty-api`, `southamerica-east1`, 0 a 3 instancias, 1 vCPU, 512 MiB, `WEB_CONCURRENCY=1`, `GUNICORN_THREADS=8`, concurrencia 16, 60 s, pública (la API autentica con el token de Firebase).
- Identidad: cuenta de servicio `runcty-api@runcty-73d70.iam.gserviceaccount.com` con solo `roles/datastore.user` y `roles/firebaseauth.admin`. Sin clave JSON; sin `DJANGO_DEBUG` ni emuladores.
- `DJANGO_SECRET_KEY` en Secret Manager (`runcty-django-secret-key`). `DJANGO_NUM_PROXIES=1` es obligatorio detrás de Cloud Run.
- Se verifica con `GET /api/v1/health` a mano; no se usan sondas HTTP (el host interno no pasa `ALLOWED_HOSTS`), solo la sonda TCP por defecto.
- Estado: **PENDIENTE por decisión del propietario**: `runcty-73d70` no tiene facturación (`billingEnabled False`) y Cloud Run y Cloud Build la exigen. Alternativas y pasos: [../docs/retomar-despliegue.md](../docs/retomar-despliegue.md). Spec: [../specs/transversal/despliegue.md](../specs/transversal/despliegue.md).

## Seguridad (resumen)

Token verificado con `check_revoked=True` en cada solicitud; deniega por defecto (públicos solo `GET /health` y `GET /cities`); el SDK de administrador omite las reglas de Firestore, así que cada comprobación de propiedad vive en la API; HTTPS forzado, HSTS de un año, `nosniff`, `X-Frame-Options: DENY`; sin cookies ni CSRF; errores sin trazas; la guarda de producción impide emuladores y proyectos `demo-*`. Límite conocido: los contadores de tasa (`LocMemCache`) son por proceso y no se comparten entre instancias; ver la sección de riesgos de [../docs/despliegue.md](../docs/despliegue.md).
