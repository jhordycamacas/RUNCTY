# RUNCTY - Club Gacelas Running Team

Aplicación móvil para que los corredores encuentren **rutas más seguras para correr**, según la ciudad, la distancia y el horario. Además, permite registrar entrenamientos por GPS y consultar estadísticas.

## Contexto

Este proyecto nace de un reto académico de la **Universidad Técnica Particular de Loja (UTPL)**. El problema lo planteó el club **Gacelas Running Team** de Loja, Ecuador.

Hoy los corredores no saben dónde, a qué hora ni con qué nivel de seguridad correr. Los principales riesgos en Loja son:

- acoso callejero;
- falta de separación entre vehículos y corredores;
- poca iluminación;
- desniveles y deslaves.

Las apps existentes, como Strava, miden el rendimiento, pero no la seguridad.

RUNCTY no declara una ruta "segura" o "insegura" de forma absoluta. Muestra un **índice de seguridad (Alto / Medio / Bajo) por franja horaria**, explicado por sus factores: iluminación, afluencia de gente, tráfico y reportes de la comunidad.

## Funcionalidades principales

- **Rutas seguras:** recomendaciones ordenadas por nivel de seguridad según ciudad, distancia y horario.
- **Entrenamiento:** registro de recorridos por GPS con estadísticas por día, semana y mes.
- **Seguridad personal:** botón de pánico, contactos de confianza y ubicación compartida en tiempo real.
- **Comunidad:** reportes de los corredores validados por el administrador, clubes, puntos de encuentro y salidas grupales.
- **Publicidad:** espacios para anunciantes que hacen autosostenible el proyecto, que no tiene fines de lucro.
- **Administración:** gestión de rutas, condiciones, reportes y campañas.

## Alcance

El piloto empieza en **Loja**. La meta es expandirse a otras ciudades del Ecuador a través de clubes aliados (Cuenca, Quito, Guayaquil y Manta) y, más adelante, a nivel internacional.

## Arquitectura

RUNCTY no tiene un servidor propio. Usa **servicios de Google (Firebase)** como backend como servicio, más **Cloud Functions** serverless para la lógica crítica.

```text
┌─────────────────────────┐      ┌──────────────────────────┐
│  App móvil (Expo / RN)  │      │ Panel admin web (Next.js)│
│  Corredor               │      │ Administrador / Club     │
└────────────┬────────────┘      └────────────┬─────────────┘
             │                                │
             ▼                                ▼
┌──────────────────────────────────────────────────────────┐
│                      Firebase (Google)                   │
│  Auth · Firestore · Storage · Cloud Messaging (push)     │
│  Cloud Functions: pánico · índice de seguridad ·         │
│                   validación de reportes · notificaciones│
└────────────────────────────┬─────────────────────────────┘
                             ▼
                 Google Maps / Geolocalización
```

| Capa | Tecnología |
| --- | --- |
| App móvil (Android 9+ / iOS 14+) | React Native + Expo + TypeScript |
| Autenticación | Firebase Auth |
| Base de datos (tiempo real) | Cloud Firestore |
| Archivos | Firebase Storage |
| Notificaciones push | Firebase Cloud Messaging |
| Lógica de servidor | Cloud Functions |
| Estado / datos remotos | TanStack React Query |
| Mapas y ubicación | Leaflet con OpenStreetMap y la geolocalización del dispositivo; Google Maps pendiente de la clave (detrás de una abstracción) |
| Panel de administración | Next.js |

### Principios de diseño

- **Clean Architecture feature-first:** cada módulo se divide en las capas `domain`, `application`, `infrastructure` y `presentation`.
- **Seguridad y privacidad primero:** reglas de Firestore que deniegan todo por defecto y roles con custom claims. La ubicación solo la ven los contactos de confianza elegidos, y la identidad de quien reporta queda reservada.
- **Offline-first en el entrenamiento:** los recorridos se guardan sin conexión y se sincronizan después.
- **Botón de pánico gestionado en el servidor:** una Cloud Function avisa a los contactos de confianza en segundos.
- **Mapas desacoplados del proveedor**, para poder cambiarlo sin reescribir la app.
- **Sin secretos en el repositorio:** las claves van en variables de entorno.

## Desarrollo local

Todo el desarrollo se hace contra los **emuladores de Firebase** con el proyecto `demo-runcty`. No se necesitan claves reales ni una cuenta de Firebase para trabajar en local.

### Requisitos

- Node.js 22 (ver `.nvmrc`).
- Java 21 o superior (lo usan los emuladores de Firestore y Storage).
- npm 10.

### Estructura

| Carpeta | Contenido |
| --- | --- |
| raíz | Configuración de Firebase (`firebase.json`, reglas, índices), script de datos semilla |
| `functions/` | Cloud Functions (Gen 2, TypeScript) y tests de reglas de Firestore |
| `frontend/mobile/` | App móvil (Expo + React Native + TypeScript) |
| `admin/` | Panel de administración web (Next.js + Tailwind) |

Cada paquete se instala por separado (no se usan workspaces).

### Instalación

```bash
npm install                          # raíz: firebase-tools y script de semilla
npm --prefix functions install       # Cloud Functions
npm --prefix frontend/mobile install # App móvil
npm --prefix admin install           # Panel de administración
```

O todo junto: `npm run install:all`.

### Backend local con Docker (recomendado)

Con Docker Desktop encendido, un solo comando levanta los emuladores de Firebase, carga los datos semilla y arranca el panel de administración:

```bash
docker compose up -d --build
```

| Servicio | Qué hace | Dirección |
| --- | --- | --- |
| `firebase` | Emuladores de Auth (9099), Firestore (8080), Functions (5001) y Storage (9199) con las functions ya compiladas | UI en http://localhost:4000 |
| `seed` | Corre una vez y termina: crea la ciudad Loja, los roles, el administrador de prueba y 5 rutas de ejemplo | — |
| `admin` | Panel de administración | http://localhost:3100 |

- Los puertos se publican **solo en `127.0.0.1`**: los emuladores no tienen autenticación y no deben verse desde la red. Los procesos corren sin root dentro de los contenedores.
- Al reiniciar el contenedor `firebase` se pierden los datos (usuarios incluidos). Para cargar la semilla otra vez: `docker compose up seed`.
- Apagar todo: `docker compose down`.

### Emuladores y datos semilla sin Docker

```bash
npm run functions:build # compila las functions antes de levantar el emulador
npm run emulators       # Auth 9099 · Firestore 8080 · Functions 5001 · Storage 9199 · UI http://localhost:4000
npm run seed            # en otra terminal: crea la ciudad Loja, los roles del sistema, el administrador y las rutas de ejemplo
```

Usuario administrador de prueba (solo emulador): `admin@runcty.dev` / `Admin123!`. El seed se niega a correr si el proyecto no empieza con `demo-` o si los emuladores no están en la máquina local o en el servicio `firebase` de Docker.

Para probar contra el **proyecto real de Firebase** (sin emuladores y con tu propio administrador) sigue [docs/conectar-google.md](docs/conectar-google.md). Para publicar la API en Cloud Run y la web en Firebase Hosting, sigue [docs/despliegue.md](docs/despliegue.md).

Para conservar los datos entre sesiones usa `npm run emulators:persist` (guarda en `emulator-data/`, ignorado por git).

### App móvil

La app usa módulos nativos, así que se instala como build de desarrollo y no con Expo Go. Para instalarla en un celular Android por USB, sigue el manual [docs/manual-instalacion-android.md](docs/manual-instalacion-android.md). El resumen es este:

1. Copia `frontend/mobile/.env.example` a `frontend/mobile/.env` y pon `EXPO_PUBLIC_USE_EMULATORS=true` y `EXPO_PUBLIC_EMULATOR_HOST=127.0.0.1`.
2. Conecta el celular y redirige los puertos con `adb reverse` (Metro, 9099, 8080, 5001 y 9199). Metro usa el **8081**, o el **8082** si la build instalada se hizo cuando el 8081 estaba ocupado: la app recuerda el puerto con el que se compiló. Si al abrirla ves "Unable to load script", revisa los logs con `adb logcat` y busca a qué puerto apunta.
3. Con el backend levantado:

```bash
cd frontend/mobile
npm run android            # compila, instala y abre la app (la primera vez tarda varios minutos)
npm start                  # uso diario, cuando la app ya está instalada
npx expo start --port 8082 # si la build instalada busca Metro en el 8082
```

> **Windows:** clona el repo en una ruta corta (por ejemplo `D:\RUNCTY`). Con rutas largas, la compilación nativa falla por el límite de 260 caracteres de Windows. Ver la sección 10 del manual.

### Panel de administración

Web en Next.js que usa solo el SDK cliente de Firebase (sin cuentas de servicio). Las operaciones privilegiadas pasan por Cloud Functions callables que verifican los permisos de quien llama.

1. Copia `admin/.env.example` a `admin/.env.local`. Con los emuladores no hace falta cambiar nada (`NEXT_PUBLIC_USE_EMULATORS=true`).
2. Levanta los emuladores con Functions y carga la semilla (sección anterior).
3. Inicia el panel y entra con el administrador de prueba (`admin@runcty.dev` / `Admin123!`):

```bash
npm run admin:dev # http://localhost:3000
```

Solo pueden entrar las cuentas con el permiso `admin.access`; a un corredor se le cierra la sesión con un aviso. El menú muestra las secciones según los permisos:

- **Usuarios** (`users.read`): búsqueda por nombres y apellidos (inicio del texto, sin importar mayúsculas ni tildes), correo, identificación, fecha de nacimiento y ciudad, con paginación. Con `roles.manage` se cambia el rol de cada usuario.
- **Roles** (`roles.manage`): crear, editar permisos y eliminar roles. Los roles del sistema (`runner`, `admin`, `club_rep`) no se eliminan, `admin` conserva todos los permisos y solo se elimina un rol sin usuarios asignados.
- **Rutas** (`routes.manage`): crear, editar y eliminar rutas (ciudad, puntos de inicio y fin, distancia, desnivel, superficie, dificultad, activa). En el detalle de cada ruta se gestionan los tramos (coordenadas, orden), las franjas horarias (sin solapamiento) y los factores de riesgo de cada tramo. Todo pasa por Cloud Functions callables, y cada cambio recalcula el índice de seguridad. El detalle también muestra el nivel de la ruta por franja con los factores que lo explican.
- **Ciudades y zonas** (`cities.manage`): crear y editar ciudades y sus zonas (nombre, provincia, latitud y longitud, cobertura activa, planificada o suspendida). Se guardan directo en Firestore y las reglas validan los campos; una zona pertenece a una ciudad existente. Para eliminar se usa la función `deleteCity`, que rechaza la ciudad o zona si tiene rutas asociadas o, en el caso de una ciudad, si aún tiene zonas. El registro de la app móvil lista solo las ciudades activas (sin zonas).

### Cuentas y roles

- El registro crea la cuenta en Firebase Auth y el documento `users/{uid}` **sin rol**. La función `onUserDocCreated` asigna los custom claims `{ role: 'runner', perms: [] }` (sin pisar un rol existente, por ejemplo `admin`) y luego copia el rol al documento; la app detecta ese cambio y refresca el token.
- Roles y permisos (RF-02): cada rol (`roles/{id}`) tiene una lista de permisos del catálogo de `functions/src/roles/permissions.ts`. Al asignar un rol, la función `setUserRole` escribe los claims `{ role, perms }`; al editar un rol, `updateRole` vuelve a escribir los claims de todos sus usuarios. Al cambiar un rol se revocan los refresh tokens del usuario y el cambio se aplica cuando renueva su token (un token ya emitido puede seguir valiendo hasta una hora). Las reglas de Firestore leen los permisos del token (`hasPerm`), sin consultar documentos. Reglas de seguridad de los roles: solo un administrador puede asignar o quitar el rol `admin` o dar `roles.manage` a un rol; nadie concede permisos que no tiene; no se puede degradar ni eliminar al último administrador, ni un administrador puede quitarse su propio rol. App Check se exige en las functions con la variable `ENFORCE_APP_CHECK=true`, apagada por defecto en local (ver CONTEXTO.md, sección 14.2).
- Para probar el registro completo deben estar corriendo los emuladores de Auth, Firestore **y Functions** (`npm run emulators` después de `npm run functions:build`).
- Eliminar la cuenta llama a la función `deleteAccount` (callable). La app pide la contraseña actual justo antes; la función rechaza tokens con más de 5 minutos desde el último inicio de sesión, borra `users/{uid}` con todas sus subcolecciones y luego la cuenta de Auth.
- El catálogo `cities` es de lectura pública: el formulario de registro lista las ciudades activas (sin zonas) antes de que exista la cuenta.

### Tests

```bash
npm --prefix functions test                # tests unitarios de las functions
npm --prefix functions run test:rules      # tests de reglas de Firestore (levanta el emulador)
npm --prefix frontend/mobile run typecheck # tipos de la app móvil
npm --prefix frontend/mobile test          # tests de la app móvil (Jest)
npm --prefix frontend/mobile run lint      # ESLint (configuración de Expo)
npm --prefix admin test                    # tests del panel (Vitest)
npm --prefix admin run typecheck           # tipos del panel
npm --prefix admin run lint                # ESLint (configuración de Next.js)
npm run admin:build                        # build de producción del panel
```

## Estado del desarrollo

Última actualización: 2026-11-10.

| Sprint | Épicas | Estado |
| --- | --- | --- |
| Base | Configuración de Firebase, reglas, emuladores, Cloud Functions, app móvil y panel | ✅ Hecho |
| 1 | EP-01 Usuarios, EP-25 Autenticación, EP-26 Preferencias, EP-02 Roles y permisos, EP-27 Administración de usuarios, EP-04 Ciudades y zonas | ✅ Hecho |
| 2 | EP-05 Catálogo de rutas, EP-07 Evaluación de seguridad (franjas, factores, índice) | ✅ Hecho (rama `feat/design-system-sprint2`) |
| 3 | EP-06 Puntos de apoyo, EP-07 Alertas de zona, EP-08 Incidentes, EP-09 Rutas seguras | 🔄 En curso: backend hecho (2026-11-22); interfaz pendiente salvo la página Alertas |
| 4 | EP-03 Contactos, EP-10 Favoritas, EP-11 Rutas de clubes, EP-12 Entrenamientos, EP-15 Pánico, EP-16 Ubicación compartida | ⏳ Pendiente |
| 5 | EP-12 a EP-24 (resto) | ⏳ Pendiente |

### Qué funciona hoy

- **App móvil:**
  - registro con ciudad y consentimiento LOPDP;
  - inicio de sesión y recuperación de contraseña;
  - edición de datos personales y cambio de contraseña;
  - eliminación de la cuenta;
  - perfil deportivo;
  - preferencias de tamaño de letra, modo oscuro, unidades, notificaciones y privacidad de ubicación;
  - diseño oscuro con el fucsia neón del club (fuentes Outfit y Oswald; Geist en el admin) y pestañas Inicio, Rutas, Correr (GPS en vivo con mapa de OpenStreetMap), Clubes y Cuenta;
  - campana con las alertas de zona de riesgo vigentes en la ciudad del corredor;
  - inicio con las rutas recomendadas para la franja en curso o la siguiente que definió el administrador;
  - catálogo de rutas de la ciudad del corredor, con filtros por franja, distancia y dificultad;
  - detalle de cada ruta con mapa y su nivel de seguridad (Alto, Medio o Bajo) por franja, los factores que lo explican y los tramos.
- **Panel de administración:**
  - gestión de rutas, tramos, franjas y factores de riesgo;
  - búsqueda de usuarios con filtros;
  - roles con permisos (crear, editar, asignar y eliminar);
  - ciudades y zonas, con borrado protegido si tienen rutas o zonas.
- **Servidor:**
  - asignación automática del rol "corredor" al registrarse;
  - roles y permisos mediante custom claims;
  - reglas de Firestore que niegan todo por defecto;
  - índice de seguridad por tramo y franja (100 puntos menos los factores de riesgo; la ruta toma su peor tramo), que se recalcula con cada cambio.

### Pendiente

- Pulido de la app y del panel que dejó la auditoría del 2026-11-10 (botón de emergencia, preferencias que se aplican, reenvío del correo de verificación, panel responsive y confirmación al cambiar roles). El detalle y el plan están en [CONTEXTO.md](CONTEXTO.md), sección 14.
- Probar en el navegador la gestión de rutas del panel.
- Google Maps (falta la clave; mientras tanto los mapas usan Leaflet con OpenStreetMap y las coordenadas se cargan a mano).
- Desplegar en Google Cloud (API en Cloud Run y web en Firebase Hosting): scripts y guía listos, pendiente de ejecutar; ver [docs/despliegue.md](docs/despliegue.md).
- Decisiones de producto: consentimiento parental de menores, texto legal LOPDP y valores por defecto de las notificaciones (ver [CONTEXTO.md](CONTEXTO.md)).

El detalle de las tareas y su evidencia está en [odd/tasks/foundation-sprint1.md](odd/tasks/foundation-sprint1.md) y [odd/tasks/design-system-sprint2.md](odd/tasks/design-system-sprint2.md).

## Equipo

| Integrante | Rol |
| --- | --- |
| Jhordy Camacas | Scrum Master |
| Pedro Vargas | Gerente de Proyecto |
| William Jadan | Desarrollo |
| Santiago Matute | Desarrollo |

Tutor: Ing. Segundo Raymundo.

Tutor: Ing. Jorge Landacay.

## Documentación

El contexto completo del proyecto, con requisitos, reglas de negocio y decisiones abiertas, está en [CONTEXTO.md](CONTEXTO.md).
