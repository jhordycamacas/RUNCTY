# Conectar RUNCTY al proyecto real de Firebase (pruebas locales)

Esta guía te lleva de cero a tener la app y la API corriendo en tu computador **contra el proyecto real** `runcty-73d70` (no contra los emuladores), con tu propio administrador. Para los emuladores y la cuenta de prueba sigue el [README](../README.md#emuladores-y-datos-semilla-sin-docker). Para **publicar** la API (Cloud Run) y la web (Firebase Hosting) sigue [despliegue.md](despliegue.md).

| Dato | Valor |
| --- | --- |
| Proyecto Firebase | `runcty-73d70` |
| Bucket de Storage | `runcty-73d70.firebasestorage.app` |
| API local | `http://127.0.0.1:8000/api/v1` |
| App web local | `http://127.0.0.1:4200` |

## 1. Lo que ya está hecho en la consola

- [x] Authentication con el proveedor **Correo y contraseña** activado.
- [x] Firestore en modo **Standard** (base de datos `(default)`).
- [x] Cuenta de servicio: clave JSON generada (Configuración del proyecto, Cuentas de servicio, Generar nueva clave privada) y guardada **fuera del repositorio**, por ejemplo en `D:\secretos\runcty-73d70-service-account.json`.

La clave JSON da control total sobre el proyecto: no la subas a git, no la pegues en chats ni la compartas. Si se filtra, bórrala en la consola y genera otra.

## 2. Crear `backend/.env`

Crea el archivo `backend/.env` (está en `.gitignore`) con este contenido y ajusta la ruta de la clave:

```ini
# Solo para PRUEBAS LOCALES contra el proyecto real. Nunca uses este archivo en producción.
DJANGO_DEBUG=true
FIREBASE_PROJECT_ID=runcty-73d70
FIREBASE_STORAGE_BUCKET=runcty-73d70.firebasestorage.app
GOOGLE_APPLICATION_CREDENTIALS=D:/secretos/runcty-73d70-service-account.json
CORS_ALLOWED_ORIGINS=http://127.0.0.1:4200,http://localhost:4200
# GOOGLE_MAPS_API_KEY=   (todavía no se usa, ver la sección 7)
```

- **`DJANGO_DEBUG=true` es necesario en local**: sin él Django fuerza HTTPS (redirección y HSTS) y el servidor `http://127.0.0.1:8000` no sirve. Con un proyecto real y **sin** variables `*_EMULATOR_HOST` está permitido; el servidor sigue hablando con Google.
- **En producción `DJANGO_DEBUG` no se define**, y entonces hacen falta `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS` y HTTPS.
- **No definas** `FIRESTORE_EMULATOR_HOST` ni `FIREBASE_AUTH_EMULATOR_HOST`, ni en `.env` ni en la terminal: si existen, el SDK habla con un emulador que no está corriendo. Las variables de la terminal ganan sobre `.env`.
- `CORS_ALLOWED_ORIGINS` incluye `127.0.0.1` porque `localhost` y `127.0.0.1` son orígenes distintos para el navegador.

## 3. Cómo se lee el `.env`

`backend/manage.py` carga `backend/.env` solo (`environ.Env.read_env`), sin librerías extra. Basta con ejecutar los comandos desde la carpeta `backend`. Las variables que ya existan en tu terminal tienen prioridad sobre las del archivo.

## 4. Crear tu administrador

Desde `backend/`, sin Docker:

```powershell
cd D:\RUNCTY\backend
.venv\Scripts\python manage.py create_admin --email tu@correo.com --first-name Nombre --last-name Apellido
```

El comando pide la contraseña dos veces por la terminal (no se muestra ni se guarda en el historial; **no existe** un argumento `--password`). Debe tener 8 caracteres o más, al menos una letra y un número, igual que en la app.

Qué hace:

1. Crea el usuario en Firebase Authentication con el correo ya verificado, y su documento en `users/`.
2. Le asigna el rol `admin` con todos los permisos, incluido `settings.manage` (claims `role` y `perms`).
3. Crea solo si faltan: los roles del sistema, la ciudad Loja, la configuración por defecto y los catálogos de nivel y objetivo. Lo que edites luego no se pisa.

Es idempotente: si el correo ya existe, solo se le da el rol de administrador y **no se cambia su contraseña**. Si ya habías iniciado sesión con esa cuenta, cierra sesión y vuelve a entrar para que el token traiga los permisos nuevos.

> `manage.py seed` **no sirve** contra el proyecto real: se niega a crear la cuenta de prueba `admin@runcty.dev` y te remite a `create_admin`. Con `--data-only` carga los datos sin cuentas, incluidas las rutas de ejemplo; úsalo solo si quieres esos datos de muestra en el proyecto.

## 5. Desplegar reglas e índices de Firestore

Con la CLI de Firebase iniciada (`firebase login`), desde la raíz del repositorio:

```powershell
firebase deploy --only firestore:rules,firestore:indexes --project runcty-73d70
```

Los índices tardan unos minutos en construirse; hasta entonces algunas consultas fallan con `failed-precondition`.

## 6. Levantar todo

```powershell
# Terminal 1: API
cd D:\RUNCTY\backend
.venv\Scripts\python manage.py runserver 8000

# Terminal 2: app web contra el proyecto real
cd D:\RUNCTY\frontend
npm run start:real
```

Abre `http://127.0.0.1:4200` e inicia sesión con tu administrador. `npm run start:real` usa la configuración `real` de Angular (`src/environments/environment.real.ts`): la configuración web pública del proyecto y la API en `http://127.0.0.1:8000`. Para comprobar la API: `GET http://127.0.0.1:8000/api/v1/health/services` con tu token.

Si la app va a correr en un celular, el origen del live-reload será la IP de tu red y habrá que añadirla a `CORS_ALLOWED_ORIGINS`; la app Android de producción no necesita cambios en este paso.

## 7. Claves de Google Maps (pendiente)

El adaptador de Google Maps **todavía no está implementado**: los mapas usan Leaflet con OpenStreetMap. Cuando se integre, crea dos claves en Google Cloud, APIs y servicios, Credenciales:

| Clave | Uso | Restricciones |
| --- | --- | --- |
| Navegador (web) | Maps JavaScript API en la app | Restricción por **referente HTTP** (`http://127.0.0.1:4200/*`, `http://localhost:4200/*` y tu dominio) y solo las APIs que uses |
| Servidor (backend) | `GOOGLE_MAPS_API_KEY` | Restricción por **dirección IP** del servidor y solo las APIs que uses |

Antes de activarlas, configura en Facturación un **presupuesto con alertas** (por ejemplo al 50 %, 90 % y 100 %) y cuotas diarias por API. Las claves nunca se suben a git.

## 8. Solución de problemas

| Síntoma | Causa probable | Qué hacer |
| --- | --- | --- |
| El navegador muestra un error de CORS | El origen de la app no está en `CORS_ALLOWED_ORIGINS` (por ejemplo abriste `localhost` y solo está `127.0.0.1`) | Añádelo en `backend/.env` y reinicia `runserver`; abre la app con el mismo host que escribiste |
| La API responde 401 con token inválido | El token es de otro proyecto (la app apunta a un proyecto y la API a otro, o quedó una sesión del emulador) | Comprueba que `FIREBASE_PROJECT_ID=runcty-73d70`, que sirves con `npm run start:real` y no con `npm start`, y cierra sesión y vuelve a entrar |
| La API no arranca: "Refusing to start" | Hay variables `*_EMULATOR_HOST` en la terminal o falta el proyecto | Quítalas (`Remove-Item Env:FIRESTORE_EMULATOR_HOST`) y revisa el `.env` |
| `permission-denied` o `403` de Firestore desde la API | La cuenta de servicio no tiene permisos sobre Firestore, o la API de Firestore no está activada | En Google Cloud, IAM, da a esa cuenta el rol **Usuario de Cloud Datastore** (o Editor) y activa la API de Cloud Firestore |
| `DefaultCredentialsError` o "Could not load the default credentials" | `GOOGLE_APPLICATION_CREDENTIALS` mal escrito o el archivo no existe | Revisa la ruta (usa `/` o `\\`) y que el JSON sea del proyecto `runcty-73d70` |
| `create_admin` falla con "The password must..." | La contraseña no cumple la política | Usa 8 caracteres o más, con letra y número |
| Una consulta falla con `failed-precondition` pidiendo un índice | Los índices aún se están construyendo o no se desplegaron | Despliega los índices (sección 5) y espera a que terminen en la consola |
| Latencia alta en Firestore | La ubicación (región) de la base de datos queda fijada al crearla y no se puede cambiar | Es solo rendimiento en pruebas; para otra región habría que crear otro proyecto o base de datos |
| La página redirige a HTTPS y no carga | Falta `DJANGO_DEBUG=true` en `backend/.env` | Añádelo (solo local) |
