# Despliegue en Google Cloud (Cloud Run + Firebase Hosting)

Guía paso a paso para publicar RUNCTY en el proyecto real `runcty-73d70`: la **API Django** en Cloud Run y la **web Angular** (web del corredor y panel de administración, un solo build) en Firebase Hosting. Para probar en local contra el proyecto real, sigue [conectar-google.md](conectar-google.md).

> Estado: **pendiente de ejecutar por el propietario**. Los archivos y scripts están listos y verificados por lectura y análisis de sintaxis, pero ningún comando de esta guía se ha ejecutado contra Google Cloud todavía. Spec: [specs/transversal/despliegue.md](../specs/transversal/despliegue.md).

| Pieza | Dónde queda | Quién la sirve |
| --- | --- | --- |
| API Django (`/api/v1/*`) | Cloud Run, servicio `runcty-api`, región `southamerica-east1` | `deploy/deploy-backend.ps1` |
| Web del corredor y panel admin | Firebase Hosting: `https://runcty-73d70.web.app` y `https://runcty-73d70.firebaseapp.com` | `deploy/deploy-web.ps1` |
| Datos y usuarios | Firestore y Firebase Authentication de `runcty-73d70` (ya creados) | reglas e índices: `deploy-web.ps1` |
| Clave de Django | Secret Manager, secreto `runcty-django-secret-key` | `deploy-backend.ps1` |

## 1. Requisitos previos

1. **Facturación activa (plan Blaze).** Cloud Run, Cloud Build y Secret Manager exigen una cuenta de facturación vinculada. Compruébalo en https://console.cloud.google.com/billing y que el proyecto `runcty-73d70` esté vinculado. Los scripts se detienen si no lo está.
2. **Alerta de presupuesto, antes de desplegar:** https://console.cloud.google.com/billing/budgets. Crea un presupuesto bajo (por ejemplo 10 USD) con alertas al 50 %, 90 % y 100 %. Una alerta avisa, **no corta** el gasto.
3. **Google Cloud CLI** (`gcloud`): https://cloud.google.com/sdk/docs/install. Luego, con la cuenta **propietaria del proyecto**:

   ```powershell
   gcloud auth login
   gcloud config set project runcty-73d70
   ```

4. **Firebase CLI** y Node.js 22 (ver `.nvmrc`):

   ```powershell
   npm install -g firebase-tools
   firebase login
   ```

5. **Permiso para ejecutar scripts** en esta sesión (no cambia la configuración del equipo):

   ```powershell
   powershell -ExecutionPolicy Bypass -File deploy\deploy-backend.ps1
   ```

6. **Docker no hace falta**: la imagen se construye en Cloud Build.
7. **Primer administrador**: aún no existe en el proyecto real si no ejecutaste [conectar-google.md](conectar-google.md), sección 4. Se crea después del despliegue (paso 5 de esta guía).

## 2. Orden de despliegue

Primero el backend (da la URL de la API), después la web (necesita esa URL).

### Paso 1. Backend: `deploy/deploy-backend.ps1`

Desde la raíz del repositorio (`D:\RUNCTY`):

```powershell
powershell -ExecutionPolicy Bypass -File deploy\deploy-backend.ps1
```

El script valida que `gcloud` esté instalado, que haya una cuenta activa, que el proyecto exista y tenga facturación, y **pide confirmación antes de cada paso remoto** (`y` para seguir; cualquier otra tecla lo omite). Es idempotente: se puede repetir y reutiliza lo que ya existe.

| Paso | Qué hace | Por qué |
| --- | --- | --- |
| 1. APIs | Activa `run`, `cloudbuild`, `artifactregistry`, `secretmanager`, `firestore`, `identitytoolkit`, `iam` y `cloudresourcemanager` | Sin ellas no se puede construir, guardar la imagen, guardar el secreto ni dar permisos |
| 2. Cuenta de servicio | Crea `runcty-api@runcty-73d70.iam.gserviceaccount.com` con **solo dos roles** (tabla de abajo) | La API no usa una clave JSON: Cloud Run le da esta identidad y los SDK de Google la toman solos |
| 3. Secreto | Genera `DJANGO_SECRET_KEY` aleatoria (48 bytes) y la guarda en Secret Manager sin mostrarla; solo `runcty-api` puede leerla | La clave nunca pasa por el repositorio, el historial ni la pantalla; si el secreto ya existe no se rota |
| 4. Permisos de build (opcional) | Solo con `-GrantBuildPermissions`: da `roles/cloudbuild.builds.builder` a la cuenta de Compute por defecto | Algunos proyectos nuevos fallan en el primer build por este permiso (ver solución de problemas) |
| 5. Despliegue | Copia **solo** `manage.py`, `config/`, `apps/`, `requirements.txt` y el `Dockerfile` a una carpeta temporal limpia, construye la imagen en Cloud Build y despliega | Garantiza que `.env` o claves nunca se suban, aunque existan en tu carpeta |
| 6. Prueba | Llama a `GET /api/v1/health` (con confirmación) y muestra la URL del servicio | Verificación inmediata |

**Roles de la cuenta de servicio `runcty-api`**

| Rol | Para qué lo necesita el código | Si se quitara |
| --- | --- | --- |
| `roles/datastore.user` | Leer y escribir documentos de Firestore (roles, usuarios, ciudades, rutas, ajustes...) | Error `403 PermissionDenied` en casi todos los endpoints |
| `roles/firebaseauth.admin` | Verificar sesiones con revocación (`check_revoked`), asignar claims (`set_custom_claims`), revocar tokens y borrar cuentas | El inicio de sesión falla con 401/500 y no se pueden cambiar roles |

No se concede: **Storage** (el código configura el bucket pero todavía no lo usa; se añadiría `roles/storage.objectUser` cuando haya subidas), **Cloud Messaging** (no se usa aún), **Editor** ni **Owner**. Las reglas de Firestore no aplican a la API (el SDK de administrador las omite): la protección de los datos es el código de la API más estos roles.

**Configuración del servicio Cloud Run**

| Ajuste | Valor | Motivo |
| --- | --- | --- |
| Región | `southamerica-east1` (São Paulo) | La más cercana a Ecuador con Cloud Run |
| Instancias | mínimo 0, máximo 3 | Cuesta cero en reposo y limita el gasto ante un abuso |
| CPU y memoria | 1 vCPU, 512 MiB, `--cpu-boost` | Suficiente para un worker de gunicorn con `firebase-admin`; el boost acorta el arranque en frío |
| Concurrencia y tiempo | 16 solicitudes por instancia, 60 s | Un worker con 8 hilos (`WEB_CONCURRENCY=1`, `GUNICORN_THREADS=8`) |
| Cuenta de servicio | `runcty-api` | Mínimo privilegio |
| Secretos | `DJANGO_SECRET_KEY` desde Secret Manager | Nunca en variables en claro |
| Variables | `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `DJANGO_NUM_PROXIES=1` | Ver sección 5 |
| **No se definen** | `DJANGO_DEBUG`, `*_EMULATOR_HOST`, `GOOGLE_APPLICATION_CREDENTIALS` | La API se niega a arrancar en producción con emuladores o un proyecto `demo-*` |
| Acceso | `--allow-unauthenticated` | Ver la nota siguiente |

> **Por qué la API es pública a nivel de Cloud Run.** Los navegadores no pueden enviar el token de identidad de Google que exige Cloud Run privado, y además ya llevan el `Authorization: Bearer <token de Firebase>`. La **propia API autentica** cada solicitud: verifica el ID token de Firebase con revocación, deniega por defecto todo endpoint que no se declare público (solo `GET /health` y `GET /cities` lo son) y limita la tasa por IP y por usuario. Cualquiera puede *llegar* a la API; solo un token válido pasa de ahí.

Al terminar, el script imprime `Service URL: https://runcty-api-<número>.southamerica-east1.run.app`. **Cópiala.** Si el host real difiere del esperado, el script lo añade a `DJANGO_ALLOWED_HOSTS` solo.

### Paso 2. Web: `deploy/deploy-web.ps1`

```powershell
powershell -ExecutionPolicy Bypass -File deploy\deploy-web.ps1 -ApiUrl https://runcty-api-<número>.southamerica-east1.run.app
```

Sustituye la URL por la que imprimió el paso 1 (sin barra final ni ruta). El script:

1. Valida la URL y que existan Node, npm y la Firebase CLI.
2. Cambia **solo la línea `apiBaseUrl`** de `frontend/src/environments/environment.prod.ts` (muestra la línea anterior y la nueva, y pide confirmación). No toca la configuración web de Firebase ni ninguna otra clave. La URL de la API no es un secreto; tras el despliegue puedes dejar el cambio y hacer commit.
3. Ejecuta `npm ci` y `ng build --configuration production` en `frontend/`. La salida queda en `frontend/dist/runcty-frontend/browser`.
4. Comprueba que la sesión de Firebase ve el proyecto y, tras confirmar, ejecuta `firebase deploy --only hosting,firestore:rules,firestore:indexes --project runcty-73d70`.

Los índices tardan unos minutos en construirse; hasta entonces algunas consultas fallan con `failed-precondition`.

### Paso 3. Administrador y datos (una vez)

Los comandos de gestión se ejecutan **desde tu equipo**, no en Cloud Run, con la clave local descrita en [conectar-google.md](conectar-google.md) (secciones 1 a 4):

```powershell
cd D:\RUNCTY\backend
.venv\Scripts\python manage.py create_admin --email tu@correo.com --first-name Nombre --last-name Apellido
# Si olvidas la contraseña de una cuenta existente:
.venv\Scripts\python manage.py reset_password --email tu@correo.com
```

`create_admin` crea el administrador, los roles del sistema, la ciudad Loja, la configuración y los catálogos (solo lo que falte). `manage.py seed` **no** sirve en el proyecto real (solo crea la cuenta de prueba en emuladores; con `--data-only` carga rutas de ejemplo).

## 3. Cómo verificar

1. **Salud de la API.** Desde un navegador o `curl`: `https://<url-de-cloud-run>/api/v1/health` debe responder `{"status":"ok"}` con HTTP 200. (Se hace a mano; ver la nota sobre sondas en la sección 5.)
2. **Autenticación exigida.** `https://<url-de-cloud-run>/api/v1/me` sin token debe responder **401** en JSON, no 200 ni una página HTML.
3. **Inicio de sesión.** Abre `https://runcty-73d70.web.app`, entra con el administrador creado. Debe cargar sin errores en la consola del navegador (F12) y sin mensajes de CORS ni de CSP.
4. **Panel de administración.** En `https://runcty-73d70.web.app/admin` deben verse Resumen, Usuarios, Roles, Ciudades, Rutas y Configuración, con datos.
5. **Servicios de Google.** Como administrador, `GET /api/v1/health/services` (con tu token) lista qué está configurado.
6. **Cabeceras de seguridad.** En F12, Red, el documento `index.html` debe traer `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY` y `Cache-Control: no-cache`.
7. **Registros.** Cloud Run, servicio `runcty-api`, pestaña Registros: sin tracebacks ni `DisallowedHost`.

## 4. Cómo revertir

| Qué | Cómo |
| --- | --- |
| **API (Cloud Run)** | Consola, Cloud Run, `runcty-api`, Revisiones, elige la anterior, Administrar tráfico, 100 % a esa revisión. O por CLI: `gcloud run services update-traffic runcty-api --to-revisions <REVISION>=100 --region southamerica-east1 --project runcty-73d70` (la lista: `gcloud run revisions list --service runcty-api --region southamerica-east1`). |
| **Web (Hosting)** | Consola de Firebase, Hosting, historial de versiones, menú de la versión anterior, **Revertir** (o "Rollback"). |
| **Reglas de Firestore** | Consola de Firebase, Firestore, Reglas, historial; o vuelve a desplegar desde un commit anterior con `firebase deploy --only firestore:rules`. |
| **Apagar la API** | `gcloud run services delete runcty-api --region southamerica-east1 --project runcty-73d70` (pide confirmación; el secreto y la cuenta de servicio quedan). |

## 5. Seguridad: qué se hizo y qué queda

**Backend con `DJANGO_DEBUG` sin definir** (verificado leyendo `backend/config/settings.py`):

- Exige `DJANGO_SECRET_KEY` y rechaza arrancar sin ella; el despliegue la inyecta desde Secret Manager.
- `SECURE_SSL_REDIRECT=True`, HSTS de un año con subdominios y `nosniff`. Tras el proxy de Cloud Run, `DJANGO_NUM_PROXIES=1` activa `SECURE_PROXY_SSL_HEADER` (confía en `X-Forwarded-Proto`, que Cloud Run siempre fija); **sin esa variable la API redirige a HTTPS sin fin**.
- `DJANGO_ALLOWED_HOSTS` lleva exactamente el host del servicio. `CORS_ALLOWED_ORIGINS` lleva los dos dominios de Hosting, sin comodines. (Los orígenes de Capacitor para la app Android se añaden siempre por código.)
- No hay cookies ni CSRF: la API usa solo tokens `Bearer`.
- La guarda de producción impide arrancar con `*_EMULATOR_HOST` o un proyecto `demo-*`.
- Contenedor sin root, sin `.env` ni claves en la imagen (`backend/.dockerignore` y la copia limpia del script).

**Web (`firebase.json`, cabeceras de Hosting):**

| Cabecera | Valor y motivo |
| --- | --- |
| `Content-Security-Policy` | `default-src 'self'`; scripts solo propios más `apis.google.com`, `maps.googleapis.com` y `maps.gstatic.com`; **sin `unsafe-eval`**. Conexiones: la API en `*.run.app`, `identitytoolkit`/`securetoken` y `*.googleapis.com`, `*.firebaseapp.com`. Imágenes: propias, `data:`/`blob:`, Google y teselas de OpenStreetMap. `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`. |
| `'unsafe-inline'` en estilos | Necesario: Angular y Ionic aplican estilos en línea (atributos `style`, estilos de componentes). No afecta a los scripts. Se acepta como riesgo menor documentado. |
| `script-src-attr` con un hash | El build de Angular carga los estilos críticos con `onload="this.media='all'"`; solo esa cadena exacta está permitida (hash SHA-256), no cualquier script en línea. |
| `X-Frame-Options: DENY` y `frame-ancestors 'none'` | Impide incrustar la app (clickjacking). |
| `Strict-Transport-Security` | Un año con subdominios, sin `preload` (decisión difícil de deshacer). |
| `Referrer-Policy`, `Permissions-Policy` | `strict-origin-when-cross-origin`; geolocalización solo propia, cámara y micrófono deshabilitados. |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups`, para no romper ventanas emergentes de inicio de sesión. |
| Caché | `index.html` y `/` sin caché; `*.js` y `*.css` con hash en el nombre, un año `immutable`. |

> Si algo de Google Maps u otra fuente queda bloqueado, F12, Consola, dice qué directiva de la CSP lo rechazó; se añade el dominio a `firebase.json` y se vuelve a desplegar solo Hosting.

**Claves de Google Maps** (cuando se integre): restringe la clave del navegador por **referente HTTP** (`https://runcty-73d70.web.app/*` y `https://runcty-73d70.firebaseapp.com/*`) y por API; la del servidor por **IP/API**; cuotas diarias y el presupuesto de la sección 1. La clave web de Firebase de `environment.prod.ts` es pública por diseño; restríngela también por referente en la consola de Google Cloud, Credenciales.

### Riesgos residuales (honestos)

1. **Límites de tasa por instancia.** Los contadores de DRF viven en la memoria del proceso (`LocMemCache`): no se comparten entre instancias ni entre workers. Con máximo 3 instancias y 1 worker por instancia, el límite efectivo por IP puede ser hasta 3 veces el configurado y se reinicia cuando la instancia se recicla. Un caché compartido (Memorystore o Firestore) requiere infraestructura nueva y se deja fuera a propósito. La mitigación real contra abuso es `--max-instances 3` y el presupuesto con alertas.
2. **API pública a nivel de red.** Cualquiera puede enviar solicitudes (rechazadas con 401), que se facturan como solicitudes. Mitigado por el tope de instancias y la tasa de fallos por IP (`THROTTLE_RATE_AUTH_FAILED`).
3. **`NUM_PROXIES=1` supone que Cloud Run es el único proxy.** Con un balanceador o dominio propio delante habría que subirlo a 2.
4. **`'unsafe-inline'` en estilos** (ver arriba).
5. **Sin sondas HTTP de salud.** Cloud Run usa la sonda TCP por defecto. Una sonda HTTP a `/api/v1/health` recibiría el host interno de la instancia, que `ALLOWED_HOSTS` rechaza (HTTP 400) antes de responder. El endpoint existe y sirve para pruebas manuales y para monitoreo externo con el host público.
6. **Cuenta de servicio con `firebaseauth.admin`** puede gestionar todas las cuentas de Authentication del proyecto (es lo que el código necesita para roles y borrado de cuentas). Una vulnerabilidad en la API tendría ese alcance.
7. **`create_admin` y `reset_password` se ejecutan en tu equipo con una clave JSON**: la clave da control total del proyecto. Guárdala fuera del repositorio, bórrala de la consola al terminar la jornada y no la subas jamás.
8. **Imagen base fijada por digest**: hay que subir la etiqueta y el digest juntos para recibir parches de seguridad; no hay escaneo automático de dependencias.
9. **App Android**: este despliegue no la cubre; su build necesita `apiBaseUrl` con la URL de Cloud Run y se genera aparte.
10. **Sin dominio propio ni WAF** (Cloud Armor): fuera del alcance de la defensa.

## 6. Costos

Con tráfico de demostración el costo esperado es **cercano a cero**: Cloud Run con 0 instancias mínimas no cobra en reposo y tiene una capa gratuita mensual; Firestore, Authentication (correo y contraseña) y Hosting tienen capa gratuita. Se factura por: tiempo de CPU y memoria mientras atiende solicitudes, Cloud Build (primeros minutos diarios gratis), Artifact Registry (almacenamiento de imágenes, centavos), Secret Manager (6 versiones activas gratis) y las lecturas/escrituras de Firestore sobre la cuota. Controla el gasto con el presupuesto de https://console.cloud.google.com/billing/budgets. Para detener cualquier gasto: borra el servicio de Cloud Run (sección 4) y las imágenes de Artifact Registry.

## 7. Secretos y qué NO subir a git

- **Nunca** se suben: `backend/.env`, cualquier `*service-account*.json` o clave de cuenta de servicio, claves privadas (`.pem`, `.key`), `google-services.json`, el valor de `DJANGO_SECRET_KEY`, claves de Google Maps del servidor. Ya están en `.gitignore`; si dudas, `git status` antes de cada commit.
- `DJANGO_SECRET_KEY` vive **solo** en Secret Manager. Para rotarla: `gcloud secrets versions add runcty-django-secret-key --data-file=<archivo temporal>` y un despliegue nuevo (invalida sesiones propias de Django, que esta API no usa).
- La configuración web de Firebase (`apiKey`, `appId`, `projectId`) **es pública**; la `apiKey` no es un secreto de servidor.
- Los scripts no imprimen secretos, no leen `.env` y no aceptan contraseñas por argumento.
- Si una clave se filtró: bórrala en la consola (IAM, Cuentas de servicio, Claves), genera otra y revisa los registros de auditoría.

## 8. Solución de problemas

| Síntoma | Causa probable | Qué hacer |
| --- | --- | --- |
| El navegador muestra un error de **CORS** | `CORS_ALLOWED_ORIGINS` no incluye el origen exacto (por ejemplo abriste otro dominio o con `http`) | Comprueba el origen en el mensaje de F12 y actualiza: `gcloud run services update runcty-api --region southamerica-east1 --update-env-vars "^@^CORS_ALLOWED_ORIGINS=https://runcty-73d70.web.app,https://runcty-73d70.firebaseapp.com"` |
| **401** con "token inválido" o `project mismatch` | El token es de otro proyecto (la web apunta a un Firebase y la API a otro, o quedó una sesión de emulador) | `FIREBASE_PROJECT_ID` del servicio debe ser `runcty-73d70` y `environment.prod.ts` debe tener ese `projectId`; cierra sesión y vuelve a entrar |
| **403 / PermissionDenied** de Firestore o Auth en los registros | Faltan roles a `runcty-api`, o las APIs no están activas | Repite el paso 2 del script (roles) y comprueba `firestore.googleapis.com` e `identitytoolkit.googleapis.com` |
| Primera solicitud lenta (varios segundos) | **Arranque en frío**: con 0 instancias mínimas la instancia arranca al recibir tráfico | Normal. Antes de una demostración, abre la web 1 minuto antes; si hace falta, `--min-instances 1` (tiene costo continuo) |
| La API responde **301 en bucle** o "demasiadas redirecciones" | Falta `DJANGO_NUM_PROXIES=1`, y Django no ve que la solicitud ya era HTTPS | Añade la variable con `--update-env-vars DJANGO_NUM_PROXIES=1` |
| **400 `DisallowedHost`** en los registros | El host de la solicitud no está en `DJANGO_ALLOWED_HOSTS` (por ejemplo la URL antigua `...-uc.a.run.app`) | `gcloud run services update runcty-api --region southamerica-east1 --update-env-vars "^@^DJANGO_ALLOWED_HOSTS=host1,host2"` |
| El despliegue falla con **permisos de Cloud Build** o "Build failed" por permisos | Proyecto nuevo sin permisos de build en la cuenta de Compute por defecto | Ejecuta `deploy-backend.ps1 -GrantBuildPermissions` |
| `--allow-unauthenticated` no se aplica / el servicio responde 403 de Google | Política de organización que bloquea `allUsers` | Pide al administrador de la organización permitir el invocador público, o usa un proyecto sin esa política |
| La web carga en blanco y F12 muestra un error de **CSP** | La directiva bloquea un dominio nuevo (mapas, fuentes) | Añade el dominio a `firebase.json` y `firebase deploy --only hosting` |
| La API no arranca: "Refusing to start" | Variables `*_EMULATOR_HOST`, `FIREBASE_PROJECT_ID` ausente o `demo-*` | Revisa las variables del servicio; el script no las define |
| `DJANGO_SECRET_KEY is required` | El secreto no está montado o la cuenta de servicio no puede leerlo | Repite el paso 3 del script y comprueba el rol `secretmanager.secretAccessor` sobre ese secreto |
| El script se niega a ejecutarse (política de ejecución) | Windows bloquea scripts sin firma | Usa `powershell -ExecutionPolicy Bypass -File ...` como en esta guía |
| Consulta de Firestore falla con `failed-precondition` | Los índices aún se construyen | Espera a que terminen en la consola de Firestore, Índices |
