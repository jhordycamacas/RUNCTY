# Arquitectura

> Spec transversal · Estado: **Hecha** para el backend y el frontend de los Sprints 1 y 2; **Pendiente** la limpieza final (S6) y el despliegue

Restricciones de arquitectura que todas las specs de capacidad asumen. Es un contrato de decisiones vigentes, no una bitácora: la historia está en `CONTEXTO.md` (secciones 16 y 17) y en `odd/tasks/single-frontend-ionic.md`. Cambiar cualquiera de estas decisiones exige decisión del usuario y actualizar primero este documento.

## Propósito

Fijar la forma del sistema (qué carpetas existen, quién habla con quién, cómo se autentica y cómo responde la API) para que cada capacidad se construya igual y los clientes no tengan que adivinar.

## Estructura del repositorio

```
RUNCTY/
├── backend/    Django + Django REST Framework. Única pieza de servidor.
│               Habla con Google (Firebase Auth, Firestore, Storage, FCM) con firebase-admin.
│               Sin base de datos SQL y sin ORM: Firestore es el almacén.
└── frontend/   UNA app Angular 22 + Ionic 9 + Capacitor 8 (web y Android/APK).
    ├── /app    Área del corredor: móvil primero, pestañas abajo.
    └── /admin  Área del administrador: escritorio primero, menú lateral.
```

- [x] `backend/` y `frontend/` son las dos carpetas de código vigentes.
- [ ] Se eliminan `frontend/mobile/` (React Native), `admin/` (Next.js), `functions/` (Cloud Functions) y `scripts/seed-emulator.ts` cuando se cierre S6; hasta entonces son código **heredado** y no se amplía. No implementan nada que el stack nuevo no tenga (Sprints 1 y 2).
- [ ] Reglas de Firestore y Storage cerradas (deny-all para clientes), porque todo pasa por la API.
- [ ] Verificar la APK y el build web de punta a punta y reescribir README, manual de Android y CONTEXTO sección 9 (S6).

## Backend

| Aspecto | Decisión |
| --- | --- |
| Capas | Cada app de `backend/apps/<nombre>/` se divide en `domain` / `application` / `infrastructure` / `presentation`. El dominio no importa Django ni Firebase. |
| Apps actuales | `health`, `identity`, `shared`, `users`, `roles`, `cities`, `routes`, `summary`, `seed`. Cada capacidad nueva es una app nueva con la misma forma. |
| Modelos | Clases de Python en `domain/models.py` con los nombres del diagrama de clases (`Usuario`, `Rol`, `Ciudad`, `Ruta`, `Tramo`...). Los atributos van en inglés y los campos de Firestore en camelCase. |
| Almacén | Cloud Firestore. Un repositorio por agregado; el agregado de la ruta (ruta, tramos, franjas, factores) comparte repositorio porque cada cambio necesita **una sola transacción**. |
| Pruebas | `pytest` (`backend/tests/`), `ruff check` y `ruff format --check` limpios, `manage.py check` sin avisos. |
| Semilla | `python manage.py seed` (app `seed`) crea Loja, los roles, el administrador de prueba y 5 rutas; solo corre con `DJANGO_DEBUG=true` y un proyecto `demo-*`. |
| Despliegue | Docker Compose local (`api`, `seed`, emuladores de Firebase) con `cap_drop ALL`, `no-new-privileges`, límites de recursos y puertos solo en `127.0.0.1`. El despliegue real (Firebase real, Blaze) sigue pendiente. |

## Frontend

| Aspecto | Decisión |
| --- | --- |
| Tecnología | Angular 22 standalone y zoneless, Ionic 9, Capacitor 8, TypeScript estricto, Vitest vía `ng test`. |
| Estructura | Por capacidad en `frontend/src/app/<capacidad>/{domain,application,infrastructure,presentation}`; los puertos son clases abstractas enlazadas en `app.config.ts`. Las áreas `app` y `admin` son diferidas (lazy) con guards por permiso. |
| Compartido | Cliente de la API, autenticación, componentes base (`shared/ui`), tokens de diseño ([Sistema de diseño](sistema-de-diseno.md)). |
| Idioma | Todo el texto de la interfaz en español; el código, los comentarios y los nombres en inglés. |
| Presupuesto | Paquete inicial por debajo de 1,2 MB (`ng build` sin avisos). Los campos nativos (`select`, `textarea`, `time`, `date`) de `shared/ui` evitan que Ionic entre completo al paquete inicial. |
| Android | Capacitor empaqueta el build en un WebView; JDK 21 para compilar (ver `frontend/README.md`). |

## Autenticación y autorización

1. El cliente usa Firebase Auth **solo** para iniciar y cerrar sesión, reautenticar, recuperar contraseña y verificar correo.
2. El ID token viaja a la API como `Authorization: Bearer <token>`. La API lo verifica en **cada** petición con `check_revoked=True`; un token malo que se envía recibe 401 aunque el endpoint sea público.
3. El rol y los permisos salen del token (claims `{role, perms}`) y de `GET /me`; el cliente nunca decide por sí solo. Un cambio de rol revoca los tokens de refresco y se aplica al renovar el token.
4. La API deniega por defecto: un endpoint es público solo si lo declara (por ejemplo `GET /cities` y `GET /health`).
5. Las operaciones sensibles (crear, modificar o borrar datos de administración) tienen un límite de peticiones más estricto.

Catálogo de permisos (`backend/apps/shared/domain/permissions.py`):

| Permiso | Concede |
| --- | --- |
| `admin.access` | Entrar al panel y ver el Resumen |
| `users.read` | Buscar y leer perfiles de usuario |
| `users.manage` | Editar los datos y el perfil deportivo de otros usuarios y eliminar cuentas |
| `roles.manage` | CRUD de roles y asignarlos a usuarios |
| `cities.manage` | CRUD de ciudades y zonas |
| `routes.manage` | CRUD de rutas, tramos, franjas y factores de riesgo |
| `reports.validate` | Validar reportes comunitarios (reservado para [EP-17](../17-reportes-comunitarios.md)) |
| `ads.manage` | Gestionar anunciantes y campañas (reservado para [EP-24](../24-publicidad.md)) |
| `clubs.manage` | Gestionar clubes y membresías (reservado para [EP-19](../19-clubes-y-membresias.md)) |
| `settings.manage` | Editar los parámetros del sistema y los catálogos de opciones ([spec 27](../27-configuracion-del-sistema.md)) |

Roles del sistema: `runner`, `admin` y `club_rep` (no se pueden eliminar). Solo un administrador asigna el rol `admin` o concede `roles.manage`; nadie concede permisos que no tiene (`permission-escalation`); no se puede dejar al sistema sin administradores (`last-admin`) ni quitarse el acceso a uno mismo (`self-lockout`).

## Contrato de la API

Base: `/api/v1/`, JSON en camelCase, solo `application/json`.

| Regla | Detalle |
| --- | --- |
| Crear | `201` con `{"id": "..."}`. La ciudad se devuelve completa en `POST` (201) y `PATCH` (200). |
| Modificar y borrar | `204` sin cuerpo en `PUT` y `DELETE` de rutas, tramos, franjas y factores. |
| Opcionales | Llegan como `null`. En el cuerpo de una petición los opcionales vacíos **se omiten**; nunca se envían como `null`. |
| Paginación | Cursor opaco: la respuesta trae `nextCursor` cuando hay más; un cursor malo responde `invalid-cursor`. |
| Cálculo | El servidor calcula todo lo derivado (por ejemplo el índice de seguridad); el cliente nunca lo calcula. |
| Datos personales | El resumen del panel solo devuelve agregados; la lista de usuarios no devuelve la identificación. |
| Límites | `120/min` por IP, `240/min` por usuario, `20/min` para intentos de autenticación fallidos y `30/min` para escrituras sensibles (configurables por entorno). |

Formato de error (único para toda la API):

```json
{ "error": { "reason": "city-exists", "message": "texto para desarrolladores", "fields": { "name": "required" } } }
```

- `reason` es un código estable en kebab-case y es lo que el cliente traduce a español (`frontend/src/app/core/errors/error-messages.ts`); `message` no se muestra al usuario. `fields` solo aparece cuando se rechaza un cuerpo, con un motivo por campo.
- Estados: `400` argumento o precondición inválidos, `401` `unauthenticated` o token inválido/vencido/revocado, `403` `missing-permission`, `404` no encontrado, `409` ya existe, `429` `rate-limited`, `500` `internal` (sin detalle).
- Un código sin traducción cae en el mensaje genérico; ningún error revela si una cuenta existe.
- Códigos relevantes por capacidad se listan en cada spec (por ejemplo `recent-sign-in-required`, `role-has-users`, `city-has-zones`, `time-slot-overlap`).

## Seguridad y privacidad de la arquitectura

- [x] Sin secretos en git: las claves van en variables de entorno; los archivos `.env*` no se versionan.
- [x] En producción la API redirige a HTTPS, envía HSTS y rechaza orígenes CORS no listados (los orígenes de Capacitor están siempre permitidos; los servidores de desarrollo solo con `DJANGO_DEBUG=true`).
- [x] La guarda del seed impide correrlo fuera de emuladores.
- [ ] App Check, `email_verified` obligatorio al crear el perfil y bitácora de las búsquedas de usuarios están abiertos (CONTEXTO 14.2: SEC-01, SEC-04, SEC-07).
- [ ] `npm audit` marca 4 avisos altos en `@grpc/grpc-js` (dependencia de `firebase`); no se baja la versión, se revisa al desplegar.

## Pruebas y SDD

- El flujo es **spec → prueba que falla (RED) → implementación (GREEN) → marcar el criterio → evidencia**. Ver [README de specs](../README.md).
- El backend ya sigue RED/GREEN (753 pruebas el 2026-11-13); en el frontend casi todas las pruebas se escribieron junto con el código. Desde ahora una historia nueva empieza por su spec y su prueba roja.

## Pruebas y verificación de esta spec

- Backend: `backend/tests/test_endpoints.py`, `test_authentication.py`, `test_exception_handler.py`, `test_security_settings.py`, `test_permissions.py`, `test_permission_catalogue.py`, `test_production_guard.py`, `test_seed_guard.py`.
- Frontend: `frontend/src/app/core/api/interceptors.spec.ts`, `core/errors/to-api-error.spec.ts`, `core/errors/error-messages.spec.ts`, `core/guards/guards.spec.ts`, `core/auth/auth.service.spec.ts`.

## Supuestos por validar

- Los límites de peticiones y el cursor opaco son decisiones del equipo, no del Excel.
- Python 3.10 es la versión local; las librerías de Google avisan que ya no tiene soporte, se pasa a 3.12 al desplegar.
- El stack Docker local se levantó y se recorrió el 2026-11-16 (CONTEXTO 17.4); la imagen de producción y el despliegue en Firebase real no se han probado.
