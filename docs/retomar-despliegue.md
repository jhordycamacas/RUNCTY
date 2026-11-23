# Cómo retomar el despliegue

> **Estado: PENDIENTE** (decisión del propietario, 2026-11-22). Los archivos están escritos; **no se ha desplegado nada** y no se ejecutó ningún comando de despliegue.

Guía completa del camino previsto (Cloud Run + Firebase Hosting): [despliegue.md](despliegue.md). Spec: [specs/transversal/despliegue.md](../specs/transversal/despliegue.md). Scripts: `deploy/common.ps1`, `deploy/deploy-backend.ps1`, `deploy/deploy-web.ps1`. Probar en local contra el proyecto real: [conectar-google.md](conectar-google.md). Contexto de lo ocurrido: [bitacora-2026-11-22.md](bitacora-2026-11-22.md).

## Dónde se quedó

| Dato | Valor al 2026-11-22 |
| --- | --- |
| Proyecto | `runcty-73d70`, estado ACTIVE |
| Facturación | `gcloud billing projects describe runcty-73d70` devolvió `billingEnabled False` |
| Por qué | Cloud Run, Cloud Build y Secret Manager exigen una cuenta de facturación vinculada. Google pidió un prepago de 50 USD (pagos manuales); el propietario tenía 56 USD y decidió no hacerlo. **No se sabe** si ese saldo se puede reembolsar: confirmarlo en https://cloud.google.com/billing/docs antes de pagar |
| `gcloud` | Instalado y con la sesión de la cuenta personal del propietario, proyecto `runcty-73d70` |
| `firebase login` | **No hecho** |
| Frontend de producción | `frontend/src/environments/environment.prod.ts` trae `apiBaseUrl` con el marcador `https://api.example.com/api/v1`; `deploy-web.ps1 -ApiUrl` lo reescribe |
| Clave de Google Maps | No creada (la web usa Leaflet) |

## Decisiones todavía abiertas

1. **Qué opción** (A, B o C).
2. **Cloud Run sin autenticación** (`--allow-unauthenticated`), solo para las opciones B: el navegador no puede mandar el token de identidad de Google y la API ya autentica con el ID token de Firebase y deniega por defecto. El script lo aplica; hay que confirmarlo explícitamente.
3. Si se crea la clave de Google Maps para la web desplegada (con referente `https://runcty-73d70.web.app/*`).

## Opción A: Hosting en el plan gratuito (Spark) + API en Render gratis

Sirve la web desde Firebase Hosting sin facturación y la API desde Render. Es una **propuesta discutida, no probada** en este repositorio: los datos de Render (arranque en frío de unos 50 s, clave como archivo secreto) los dio el propietario y deben verificarse en su documentación.

Qué se necesita del propietario: una cuenta de Render, `firebase login` con la cuenta del proyecto y la clave JSON de la cuenta de servicio (se sube como archivo secreto en Render, nunca al repositorio).

1. `npm install -g firebase-tools` y `firebase login`.
2. Crear en Render un servicio web desde el repositorio con `backend/Dockerfile` (contexto `backend/`). Variables: `DJANGO_SECRET_KEY` (valor largo aleatorio), `DJANGO_ALLOWED_HOSTS=<servicio>.onrender.com`, `DJANGO_NUM_PROXIES=1`, `FIREBASE_PROJECT_ID=runcty-73d70`, `FIREBASE_STORAGE_BUCKET=runcty-73d70.firebasestorage.app`, `CORS_ALLOWED_ORIGINS=https://runcty-73d70.web.app,https://runcty-73d70.firebaseapp.com`, y `GOOGLE_APPLICATION_CREDENTIALS` apuntando al archivo secreto. **No** definir `DJANGO_DEBUG` ni variables `*_EMULATOR_HOST`.
3. La cuenta de servicio de esa clave necesita `roles/datastore.user` y `roles/firebaseauth.admin` (no verificado qué roles tiene la clave actual).
4. Abrir `firebase.json` y añadir `https://*.onrender.com` a `connect-src` de la política CSP: hoy solo permite `https://*.run.app`, `googleapis.com` y `firebaseapp.com`, y el navegador bloquearía la API. Es un cambio de configuración, hay que hacerlo antes del paso 5.
5. Construir y publicar la web: `powershell -ExecutionPolicy Bypass -File deploy\deploy-web.ps1 -ApiUrl https://<servicio>.onrender.com`. Sirve con Hosting y reglas e índices de Firestore (`firebase deploy --only hosting,firestore:rules,firestore:indexes --project runcty-73d70`); no necesita facturación.
6. Crear datos y administrador desde el equipo del propietario: `create_admin` (ver [conectar-google.md](conectar-google.md), sección 4).
7. Verificar con la sección 3 de [despliegue.md](despliegue.md). El primer pedido tras un rato inactivo tarda por el arranque en frío: avisar antes de una demostración o llamar a `GET /api/v1/health` un minuto antes.
8. Riesgos: arranque en frío, límite de horas gratuitas de Render, `DJANGO_DEBUG` jamás en producción.

## Opción B: Cloud Run + Hosting (plan Blaze)

El camino que dejan listo los scripts. Qué se necesita del propietario: activar la facturación (la parte del prepago de 50 USD) o vincular una cuenta de facturación con método de pago, y `firebase login`.

1. Vincular la facturación al proyecto y comprobar: `gcloud billing projects describe runcty-73d70` debe mostrar `billingEnabled: True`.
2. Crear un presupuesto con alertas (por ejemplo 10 USD, al 50 %, 90 % y 100 %): https://console.cloud.google.com/billing/budgets. Una alerta avisa, no corta el gasto.
3. `gcloud auth login` (con la cuenta propietaria) y `gcloud config set project runcty-73d70`; `npm install -g firebase-tools` y `firebase login`.
4. `powershell -ExecutionPolicy Bypass -File deploy\deploy-backend.ps1` (pide confirmación en cada paso remoto; si falla por permisos de compilación en un proyecto nuevo, repetir con `-GrantBuildPermissions`). Anotar la URL de Cloud Run.
5. `powershell -ExecutionPolicy Bypass -File deploy\deploy-web.ps1 -ApiUrl <url-de-cloud-run>`.
6. Crear el administrador: `create_admin` desde el equipo (ver [despliegue.md](despliegue.md), paso 3). Si ya existe el administrador de las pruebas locales, el proyecto es el mismo y no hace falta.
7. Verificar (sección 3 de [despliegue.md](despliegue.md)): `GET /api/v1/health` 200, `GET /api/v1/me` sin token 401, ingreso en `https://runcty-73d70.web.app`, cabeceras de seguridad y registros sin `DisallowedHost`.
8. Para volver atrás: sección 4 de [despliegue.md](despliegue.md).
9. Costos esperados: cercanos a cero con tráfico de demostración (sección 6 de [despliegue.md](despliegue.md)).

## Opción C: solo local

No hace falta nada de Google Cloud. Es lo que se usa hoy.

- **Emuladores:** `docker compose up -d --build` y, en `frontend/`, `npx ng serve --host 127.0.0.1`; `admin@runcty.dev` / `Admin123!`.
- **Proyecto real, sin publicar:** terminal 1 `cd D:\RUNCTY\backend` y `.venv\Scripts\python manage.py runserver 8000` (el contenedor `runcty-api` debe estar detenido porque ocupa el 8000; para volver a los emuladores, `docker compose up -d api`); terminal 2 `cd D:\RUNCTY\frontend` y `npm run start:real`. PowerShell 5 no admite `&&`: usar `;` o dos líneas. Abrir `http://127.0.0.1:4200` en incógnito y no dejar otro `ng serve` encendido.

## Después de desplegar, sea cual sea la opción

- Marcar los criterios abiertos de `specs/transversal/despliegue.md` con la evidencia y cambiar su estado.
- Actualizar `CONTEXTO.md` (secciones 20 y 21), `odd/tasks/despliegue-seguro.md` (tarea T6) y `backend/CONTEXTO-BACKEND.md`.
- Agregar las URLs publicadas a `CORS_ALLOWED_ORIGINS` solo si cambian los dominios.
