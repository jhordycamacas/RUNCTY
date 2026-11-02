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
| Mapas y ubicación | Google Maps + `expo-location` (detrás de una abstracción) |
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
| `mobile/` | App móvil (Expo + React Native + TypeScript) |

Cada paquete se instala por separado (no se usan workspaces).

### Instalación

```bash
npm install                    # raíz: firebase-tools y script de semilla
npm --prefix functions install # Cloud Functions
npm --prefix mobile install    # App móvil
```

O todo junto: `npm run install:all`.

### Emuladores y datos semilla

```bash
npm run functions:build # compila las functions antes de levantar el emulador
npm run emulators       # Auth 9099 · Firestore 8080 · Functions 5001 · Storage 9199 · UI http://localhost:4000
npm run seed            # en otra terminal: crea la ciudad Loja y el usuario administrador
```

Usuario administrador de prueba (solo emulador): `admin@runcty.dev` / `Admin123!`.

Para conservar los datos entre sesiones usa `npm run emulators:persist` (guarda en `emulator-data/`, ignorado por git).

### App móvil

1. Copia `mobile/.env.example` a `mobile/.env`. Con los emuladores no hace falta cambiar nada.
2. Si pruebas en un teléfono físico, pon la IP de tu computador en la red local en `EXPO_PUBLIC_EMULATOR_HOST` (por ejemplo `192.168.1.20`). En el emulador de Android se usa `10.0.2.2` automáticamente.
3. Con los emuladores levantados:

```bash
npm run mobile:start # abre Expo; escanea el QR con Expo Go o pulsa "a" para Android
```

### Cuentas y roles

- El registro crea la cuenta en Firebase Auth y el documento `users/{uid}` **sin rol**. La función `onUserDocCreated` asigna el custom claim `role: runner` (sin pisar un rol existente, por ejemplo `admin`) y luego copia el rol al documento; la app detecta ese cambio y refresca el token.
- Para probar el registro completo deben estar corriendo los emuladores de Auth, Firestore **y Functions** (`npm run emulators` después de `npm run functions:build`).
- El catálogo `cities` es de lectura pública: el formulario de registro lista las ciudades activas antes de que exista la cuenta.

### Tests

```bash
npm --prefix functions test           # tests unitarios de las functions
npm --prefix functions run test:rules # tests de reglas de Firestore (levanta el emulador)
npm --prefix mobile run typecheck     # tipos de la app móvil
npm --prefix mobile test              # tests de la app móvil (Jest)
npm --prefix mobile run lint          # ESLint (configuración de Expo)
```

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
