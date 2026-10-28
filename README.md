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
