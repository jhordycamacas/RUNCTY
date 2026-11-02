# CONTEXTO DEL PROYECTO — RUNCTY

> Documento de contexto para retomar el desarrollo en cada sesión. Leer completo antes de trabajar.
> Fuentes originales: `D:\Proyecto5to\DocumentosContexto` (Acta de Constitución, Documento de Visión DCV-VIS v1.0.0, Excel de requisitos, PROYECTO 3.pdf, apuntes de la reunión con Gacelas).

## Reglas de trabajo en el repositorio

- **Autoría:** todo commit y push debe aparecer únicamente a nombre del usuario `jhordycamacas`. Nunca agregar `Co-Authored-By`, ni mencionar a Claude o Anthropic en commits, PRs o archivos.
- **NO CÓDIGO ZOMBIE (regla obligatoria):** no se deja en el proyecto código que no se usa. Si una función, componente, archivo, export, dependencia, script o prueba ya no sirve para nada, se **elimina** en el mismo cambio que la deja sin uso. No se comenta "por si acaso" ni se deja desactivado. Git guarda el historial si hace falta recuperarlo. Antes de cerrar cada tarea, se revisa que no queden exports sin usar ni archivos huérfanos (por ejemplo con `npx knip` en cada paquete).
- Commits con formato Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`...).
- Repositorio: https://github.com/jhordycamacas/RUNCTY (clon local: `D:\RUNCTY`).
- **Ruta del clon local (2026-11-02):** el repo se clonó de nuevo en `D:\RUNCTY` y reemplaza al anterior, `D:\Proyecto5to\RunCity\RUNCTY`. En Windows, la compilación nativa de Android falla si la ruta es larga (`Filename longer than 260 characters`), porque la versión de ninja del SDK (1.10.2) no admite rutas largas. La ruta de la carpeta `mobile/` no debe superar unos 25 caracteres, y ni `subst` ni `LongPathsEnabled` lo resuelven. Además, el plugin `mobile/plugins/with-short-cxx-dir.js` mueve la carpeta temporal de CMake a `<unidad>:\.rcx` en Windows. Con las dos medidas, la app compila e instala en un Infinix X678B con `npm run android`. La memoria y el historial del asistente se copiaron de la clave de proyecto `D--Proyecto5to-RunCity-RUNCTY` a `D--RUNCTY`, así que se trabaja abriendo la sesión en `D:\RUNCTY`. El detalle está en `docs/manual-instalacion-android.md`.

## 1. Qué es

Reto académico de la **UTPL** (materias Fundamentos de Ingeniería de Software e Ingeniería Web). El club **Gacelas Running Team (Loja, Ecuador)** planteó un problema y varios grupos de estudiantes compiten por proponer y desarrollar la mejor solución. Nuestro grupo quiere ganar el reto.

- Inicio: semana del 12 al 18 de octubre de 2026 (levantamiento de requisitos).
- Fase actual (2026-11-02): Sprints 1 y 2 implementados en la rama `feat/design-system-sprint2`. La demo con Gacelas es esta semana, con Firebase real. El Sprint 1 cubre usuarios, autenticación, preferencias, roles, administración de usuarios, ciudades y zonas. El Sprint 2 cubre el catálogo de rutas y la evaluación de seguridad por franja. La app también tiene un sistema de diseño nuevo. Sigue el Sprint 3: puntos de apoyo, alertas de zona, incidentes y generación de rutas seguras.
- Docentes tutores: Ing. Segundo Raymundo e Ing. Jorge Landacay.

## 2. Problema

Los corredores no saben **dónde, a qué hora ni con qué nivel de seguridad** correr. Hoy eligen la ruta por cercanía, costumbre o grupos de WhatsApp. Apps como Strava miden el rendimiento, pero no la seguridad.

Riesgos identificados en Loja:
- Acoso callejero (existe el movimiento "La calle es mía").
- Falta de separación entre vehículos y corredores, sobre todo en horas pico.
- Poca iluminación, señalización deficiente, desniveles y deslaves de ríos.
- Delincuencia potencial: no ha ocurrido gracias a que corren en grupo, pero puede pasar.

Factores que aumentan la seguridad: presencia de gente, iluminación, que la zona no sea solitaria y resguardo policial.

**Franjas de entrenamiento:** 05:00–07:00 y 18:00–20:00.

**Principio clave:** nunca declarar una ruta "segura" o "insegura" de forma absoluta. Se muestra un **índice o nivel de seguridad (Alto / Medio / Bajo) por franja horaria**, junto con los factores que lo explican.

## 3. Objetivo y propuesta de valor

App móvil que, en un piloto en Loja, permita:
1. Consultar y recibir recomendaciones de rutas ordenadas por nivel de seguridad, según ciudad, distancia y horario. Ejemplo de entrada: Loja, 5 km, 05:30, principiante.
2. Registrar entrenamientos por GPS y ver estadísticas por día, semana y mes.
3. Contar con un espacio publicitario para la autosostenibilidad. El proyecto no tiene fines de lucro.
4. Administrar las rutas y sus condiciones, a cargo del personal de Gacelas.
5. Escalar a otras ciudades con clubes aliados (Cuenca, Quito, Guayaquil, Manta) y después al ámbito internacional.

Dos momentos de uso:
- **Antes de correr:** la app sugiere la ruta, el horario y el punto de encuentro, priorizando lugares iluminados y concurridos.
- **Después de correr:** la app muestra el recorrido realizado y las estadísticas.

Las 3 funcionalidades que deben verse el día de la presentación son las **estadísticas de lo corrido**, las **rutas seguras con horarios y fechas** y el **espacio de publicidad**.

Idea diferenciadora: sugerir corredores cercanos para ir juntos al punto de encuentro, lo que fortalece la comunidad.

## 4. Stakeholders y equipo

- **Cliente / Product Owner:** Gacelas Running Team. Participan Roberto Betrán Zambrano (presidente), María Lora Ruiz "Lola" (promotora y expresidenta) y Nirvana (enlace). La escritura de los nombres está por confirmar.
- **Usuarios:** corredores. El público principal tiene entre 18 y 43 años, sin límite de edad, por lo que la app debe ser accesible para menores y adultos mayores.
- **Otros interesados:** clubes aliados, anunciantes (tiendas deportivas, gimnasios, comercios) y posibles entidades como ECU 911, Policía Nacional, tránsito y el Ministerio del Deporte. **No hay convenios firmados con ninguna entidad.**
- **Equipo:**

| Integrante | Rol |
| --- | --- |
| Jhordy Camacas | Scrum Master |
| Pedro Vargas | Gerente de Proyecto |
| William Jadan | Desarrollo |
| Santiago Matute | Desarrollo |

Metodología: Scrum, con requisitos documentados según IEEE 830.

## 5. Roles de la app

- **Corredor:** consulta rutas, registra entrenamientos, usa el botón de pánico y los contactos de confianza, y reporta el estado de las rutas.
- **Administrador (Gacelas):** gestiona rutas, horarios y condiciones; valida reportes; gestiona anunciantes y banners.
- **Representante de club:** aporta rutas de su ciudad y apoya la revisión de reportes. Corresponde a la fase de expansión.
- **Sistema:** calcula el índice de seguridad, las métricas y las notificaciones.

## 6. Requisitos funcionales (Excel, iteración 3)

Prioridad MoSCoW: Debe / Debería.

| ID | Módulo / Requisito | Prioridad | Responsable |
| --- | --- | --- | --- |
| RF-01 | Usuarios y cuenta (registro, login, perfil deportivo, preferencias) | Debe | W. Jadan |
| RF-02 | Roles y permisos | Debe | W. Jadan |
| RF-03 | Contactos de confianza | Debe | P. Vargas |
| RF-04 | Ciudades y zonas de operación | Debe | P. Vargas |
| RF-05 | Catálogo de rutas y tramos | Debe | P. Vargas |
| RF-06 | Puntos de apoyo y senderos con resguardo policial | Debería | P. Vargas |
| RF-07 | Evaluación de seguridad (franjas, factores, índice, alertas de zona) | Debe | J. Camacas |
| RF-08 | Incidentes y fuentes de información de seguridad | Debe | J. Camacas |
| RF-09 | Generación/recomendación de rutas seguras (ordenadas por seguridad) | Debe | J. Camacas |
| RF-10 | Favoritas y valoraciones (1–5: seguridad, iluminación, afluencia) | Debe | J. Camacas |
| RF-11 | Rutas sugeridas por clubes | Debería | S. Matute |
| RF-12 | Registro de entrenamientos, recorrido GPS y métricas | Debe | S. Matute |
| RF-13 | Metas personales | Debería | S. Matute |
| RF-14 | Retos entre corredores | Debería | P. Vargas |
| RF-15 | Botón de pánico (exige al menos 1 contacto de confianza) | Debe | J. Camacas |
| RF-16 | Ubicación compartida en tiempo real | Debe | J. Camacas |
| RF-17 | Reportes comunitarios y su validación (identidad reservada) | Debe | W. Jadan |
| RF-18 | Notificaciones | Debe | P. Vargas |
| RF-19 | Clubes y membresías | Debe | S. Matute |
| RF-20 | Puntos de encuentro | Debería | S. Matute |
| RF-21 | Salidas grupales con cupo | Debería | S. Matute |
| RF-22 | Compañeros para correr | Debería | S. Matute |
| RF-23 | Eventos, carreras e inscripciones | Debe | P. Vargas |
| RF-24 | Publicidad (anunciantes y campañas por vigencia) | Debe | W. Jadan |

Los RF se organizan en 11 módulos: Usuarios y accesos, Catálogo de rutas, Evaluación de seguridad, Recomendación de rutas, Entrenamiento, Seguridad personal, Reportes y notificaciones, Clubes, Entrenamiento en grupo, Eventos y Publicidad. La hoja MODULOS del Excel detalla 153 sub-requisitos CRUD en formato entrada-proceso-salida.

### Reglas de negocio destacadas

- Las franjas horarias de una ruta no se solapan.
- Cada corredor puede valorar una ruta una sola vez, y solo si la recorrió.
- Un reporte comunitario solo es visible si fue aprobado. Estados: Aprobado, Rechazado, Resuelto.
- La alerta de pánico tiene los estados Activa, Atendida y Cancelada.
- Estados de membresía en un club: Pendiente, Aceptada, Activa, Suspendida.
- Nivel del corredor: Principiante, Intermedio, Avanzado.
- Tipos de punto de apoyo: comercio abierto, puesto policial, centro de salud, lugar concurrido.
- Al eliminar un usuario se eliminan también sus credenciales, perfil y preferencias.

## 7. Requisitos no funcionales clave

- **Seguridad y privacidad:** contraseñas y comunicaciones cifradas; cumplimiento de la LOPDP (Ecuador) con consentimiento explícito; acceso por rol; identidad del reportante reservada; ubicación visible solo para los contactos elegidos y solo durante la sesión.
- **Rendimiento:**
  - Alerta de pánico en ≤5 s.
  - Rutas recomendadas en ≤10 s (p95, con 4G).
  - Consultas en ≤5 s.
  - Índice de seguridad recalculado en ≤24 h.
- **Disponibilidad y escalabilidad:**
  - Disponibilidad ≥99 % mensual.
  - Respaldos diarios con retención de 30 días; restauración en ≤4 h.
  - 5.000 usuarios concurrentes.
  - Arquitectura modular para añadir ciudades.
- **Móvil:**
  - Entrenamiento offline con sincronización.
  - Error de GPS ≤10 m (p90).
  - Consumo de batería ≤10 %/h.
  - Android 9+ e iOS 14+.
- **Mapas:** acceso mediante interfaces estándar, sin depender de un único proveedor.
- **Usabilidad:**
  - Botón de pánico en ≤2 toques.
  - Registro y primera ruta en <5 min.
  - Interfaz en español.
  - Letra ajustable, contraste 4,5:1 y botones de 48 dp.
  - Modo oscuro (Podría).
- **Publicidad:** solo en espacios definidos; nunca interrumpe el entrenamiento ni el botón de pánico.

## 8. Fuera de alcance del piloto (según el Documento de Visión)

- Pagos y módulo financiero.
- Integración del botón de pánico con ECU 911.
- Garantía absoluta de seguridad.
- Versión web.
- Retos, rankings e integración con dispositivos deportivos.
- Convenios con entidades.
- Expansión real a otras ciudades.

## 9. Arquitectura (decidida — 2026-10-28)

Sin backend propio: se usan servicios de Google (Firebase) como BaaS, más Cloud Functions serverless para la lógica que no puede vivir en el cliente. Así se cumple el Documento de Visión (sin servidor propio) y también los RNF del Excel (datos centralizados, notificaciones, tiempo real, respaldos).

La referencia es la arquitectura de la app **PilasOe** (Expo + Firebase + Cloud Functions + admin en Next.js), corrigiendo sus debilidades.

### Stack

| Capa | Tecnología |
| --- | --- |
| App móvil (Android/iOS) | React Native + Expo + TypeScript |
| Autenticación | Firebase Auth |
| Base de datos | Cloud Firestore (tiempo real con `onSnapshot`) |
| Archivos (banners, fotos de reportes) | Firebase Storage |
| Notificaciones push | Firebase Cloud Messaging (FCM) |
| Lógica de servidor | Cloud Functions (pánico, índice de seguridad, validación de reportes, notificaciones) |
| Estado / datos remotos | TanStack React Query |
| Mapas y ubicación | Google Maps + `expo-location`, detrás de una abstracción (puerto `MapProvider`) |
| Panel de administración | Web en Next.js (rutas, reportes, anunciantes, campañas) |

### Principios

- **Clean Architecture feature-first desde el día uno:** cada módulo (rutas, seguridad, entrenamiento, pánico, comunidad, publicidad) se divide en las capas `domain` / `application` / `infrastructure` / `presentation`. No se mezcla con código legado.
- **Un solo SDK de Firebase y un solo sistema de estilos.**
- **Reglas de Firestore estrictas:** se deniega todo por defecto y se permite solo lo necesario. Los roles se manejan con custom claims. La ubicación de un corredor solo la leen sus contactos elegidos y solo durante la sesión (RNF-05). La identidad del reportante queda reservada (RNF-04).
- **Ubicación en segundo plano** para el entrenamiento GPS y la ubicación compartida (PilasOe solo la usa en primer plano).
- **Offline-first en el entrenamiento:** cola local con sincronización automática (RNF-12).
- **Pánico en el servidor:** la alerta la dispara el cliente y una Cloud Function la reparte a los contactos de confianza (meta: ≤5 s, RNF-06).
- **Mapas desacoplados del proveedor** mediante un puerto/adaptador (RNF-15).
- **Sin secretos en git:** las claves van en variables de entorno o en EAS Secrets. App Check se exige en las Cloud Functions.

### Decisiones de implementación (2026-11-02)

- **Estructura del repo:** tres paquetes npm independientes, sin workspaces: `mobile/` (Expo SDK 58), `admin/` (Next.js 16 + Tailwind) y `functions/` (Gen 2, `us-central1`). La configuración de Firebase vive en la raíz (`firebase.json`, `firestore.rules`, `storage.rules`).
- **Un solo SDK de Firebase** (el SDK JS) en la app y en el panel. El panel no usa cuenta de servicio: toda operación privilegiada pasa por Cloud Functions callables.
- **Navegación:** react-navigation v7. **Estilos:** `StyleSheet` con tokens propios en la app y Tailwind en el panel.
- **Roles y permisos por custom claims** `{ role, perms }`, que solo asignan las Cloud Functions. Las reglas usan `hasPerm()` sin `get()`. Roles del sistema: `runner`, `admin` y `club_rep`. Un cambio de rol se aplica cuando se renueva el token (hasta 1 h o al volver a iniciar sesión).
- **Datos:**
  - `users/{uid}` guarda los datos personales y el consentimiento LOPDP.
  - `users/{uid}/private/sportProfile` y `users/{uid}/private/preferences` guardan el perfil deportivo y las preferencias.
  - `roles/{roleId}` guarda los roles y sus permisos.
  - `cities/{id}` guarda ciudades y zonas (`type`, `parentCityId`, `coverage`). Son de lectura pública porque el registro las necesita.
- **Desarrollo local con los emuladores de Firebase** (proyecto `demo-runcty`) y un seed que crea Loja, los roles y un admin de prueba. No hacen falta claves reales hasta desplegar.
- **Paleta:** blanco `#FFFFFF`, negro `#111111` y rojo suave `#D9534F` como acento. Los botones rellenos usan `#C9302C`, porque `#D9534F` con texto blanco no alcanza el contraste 4,5:1.
- **Pruebas:** Jest en la app, Vitest en el panel y en Functions, y tests de reglas contra el emulador.

### Requisito operativo

Las Cloud Functions requieren el **plan Blaze** de Firebase (pago por uso, con tarjeta registrada). Tiene una cuota gratuita amplia; para el piloto en Loja el costo esperado es prácticamente cero.

## 10. Decisiones abiertas y contradicciones (resolver con el equipo o el cliente)

1. ~~**Backend**~~: resuelto en la sección 9 (Firebase BaaS + Cloud Functions).
2. **Alcance del MVP:** el Acta difiere el pánico, los contactos y las alertas; la Visión y el Excel los marcan como "Debe". Hay que definir qué entra en el primer sprint y qué se muestra el día de la presentación.
3. **Generar o recomendar rutas:** falta decidir entre ordenar un catálogo predefinido y generar rutas nuevas (RF-09, Sprint 3). Por ahora el catálogo se ordena por nivel de seguridad.
   - ~~Índice de seguridad~~: resuelto el 2026-11-02. Cada tramo parte de 100 puntos por franja. Cada factor de riesgo activo en esa franja resta según su severidad: baja −10, media −20, alta −35. Los niveles son **Alto ≥70, Medio 40–69 y Bajo <40**. La ruta toma el nivel de su **peor tramo** y siempre se muestran los factores que lo explican. El cálculo tiene un punto de extensión (`extraPenalties`) para sumar los reportes comunitarios (RF-17). El código está en `functions/src/routes/domain/safety.ts`.
4. **Canal de la alerta de pánico:** push, SMS o WhatsApp.
5. **Menores de edad:** implica consentimiento parental según la LOPDP.
6. **Fuentes de datos de seguridad:** falta definir quién carga los datos y con qué periodicidad (administrador de Gacelas, clubes, reportes comunitarios).
7. **Plataforma:** el Acta deja abierta la elección entre móvil y web; la Visión decide solo móvil.
8. **Texto legal LOPDP** del registro: hoy es provisional y necesita revisión.
9. **Notificaciones por defecto:** hoy vienen activadas; hay que confirmar si deben ser opt-in.
10. **Objetivos del perfil deportivo:** salud, bajar de peso, preparar carrera, mejorar ritmo y socializar (al menos uno obligatorio). Falta validarlos con Gacelas.
11. **Correo sin verificar:** hoy solo se muestra un aviso. Falta decidir si bloquea alguna función.
12. **Representante de club en el panel:** hoy tiene acceso, pero solo ve lo que sus permisos permiten.
13. **Preferencias de apariencia:** hoy se aplican al guardar. Falta decidir si deben aplicarse al instante.

## 11. Product Backlog (corregido — 2026-10-28)

Archivo final: `C:\Users\usuario\Downloads\Backlog_RUNCTY_Final.xlsx`. El original `Backlog_RUNCTY_MegaProPlusUltraSuperSayayin.xlsx` se conserva sin cambios. Destino: importar a Jira.

**Totales:** 27 épicas y 151 historias. Cada subrequisito RF-XX-N es una historia, y los IDs de RF se mantienen por trazabilidad.

**Hojas del archivo:** BKL-G1, Historias de usuario, Sprint Backlog, Épicas por sprint (nueva), Plan semanal y Notas y alcance.

### Correcciones pedidas por el docente

- Se eliminaron historias redundantes:
  - RF-01-5 (establecer credenciales) se unificó en RF-01-1 (registrar cuenta).
  - RF-01-8 (eliminar credenciales) se unificó en RF-01-4 (eliminar cuenta).
  - Cambiar contraseña pasó a RF-01-3 (actualizar datos personales).
  - RF-01-7 queda solo como *recuperar contraseña*, una funcionalidad aparte.
- Las preferencias son una característica del usuario, pero no forman parte de la gestión de usuarios. Por eso tienen épica propia.
- Se agregó una hoja que muestra qué épicas se trabajan en cada sprint.

### Épicas nuevas, separadas de RF-01

- **EP-25 Autenticación:** RF-01-6 iniciar sesión y RF-01-7 recuperar contraseña.
- **EP-26 Gestión de preferencias:** RF-01-13 a RF-01-16.
- **EP-27 Administración de usuarios:** RF-01-2, consultar usuarios. El rol cambió de *corredor* a *administrador*.

### Plan de sprints

La semana 8 no tiene actividad y la semana 11 queda fuera de los sprints.

| Sprint | Semanas | Épicas |
| --- | --- | --- |
| 1 | 4–5 | EP-01 Usuarios (registro, actualizar datos, eliminar cuenta, perfil deportivo), EP-25 Autenticación, EP-26 Preferencias, EP-02 Roles y permisos, EP-27 Administración de usuarios, EP-04 Ciudades y zonas |
| 2 | 6 | EP-05 Catálogo de rutas, EP-07 Evaluación de seguridad (franjas, factores, índice) |
| 3 | 7 | EP-06 Puntos de apoyo, EP-07 Alertas de zona de riesgo, EP-08 Incidentes y fuentes, EP-09 Generación de rutas seguras |
| 4 | 9 | EP-03 Contactos de confianza, EP-10 Favoritas y valoraciones, EP-11 Rutas de clubes, EP-12 Entrenamientos (parte), EP-15 Botón de pánico, EP-16 Ubicación compartida |
| 5 | 10 | EP-12 Entrenamientos (resto), EP-13 a EP-14 y EP-17 a EP-24 (metas, retos, reportes, notificaciones, clubes, encuentros, salidas, compañeros, eventos, publicidad). Entrega final a Gacelas. |

### Pendientes del archivo

- El formato condicional de la hoja BKL-G1 ya venía roto en el original (`#REF!`) y no se modificó.
- Los conteos de "Épicas por sprint" son fórmulas que Excel recalcula al abrir el archivo.

## 12. Estado actual

- [x] Repositorio creado con README.
- [x] CONTEXTO.md creado.
- [x] Arquitectura y stack definidos (sección 9).
- [x] Backlog corregido según el docente (sección 11).
- [x] Estructura inicial del proyecto (app móvil, panel admin, Cloud Functions, reglas, emuladores).
- [x] Sprint 1 implementado y con tests: EP-01, EP-25, EP-26, EP-02, EP-27 y EP-04. El detalle está en `odd/tasks/foundation-sprint1.md`.
- [x] Manual de instalación en Android por USB: `docs/manual-instalacion-android.md`.
- [x] Sistema de diseño en la app (fuente Inter, íconos, componentes) y logo de RUNCTY como ícono de la app.
- [x] Sprint 2: catálogo de rutas (EP-05) y evaluación de seguridad (EP-07, RF-07-1 a RF-07-11). Hay 5 rutas de ejemplo de Loja en el seed. El detalle está en `odd/tasks/design-system-sprint2.md`.
- [x] App instalada en un Infinix X678B. Arreglos hechos en el dispositivo: la hora no se veía en la barra de estado (ahora sigue el tema de la app y no el del sistema), los textos de la barra de pestañas quedaban tapados (ahora la altura se adapta al tamaño de letra y a la barra de gestos de cada celular), y una sesión de un usuario borrado dejaba la app trabada (ahora se cierra sola).
- [x] Todo el trabajo está en la rama `feat/design-system-sprint2`, subida a GitHub. Falta abrir el PR o los PRs hacia `main`.
- [ ] Probar en el navegador la gestión de rutas del panel. Falta `admin/.env.local` en el clon nuevo: copiarlo de `admin/.env.example`.
- [ ] Importar el backlog a Jira.
- [ ] Validar el diseño y la paleta con el cliente.
- [ ] **Demo con Gacelas (semana del 2026-11-02):** pasar a Firebase real. Ver "Plan para la demo" abajo.
- [ ] Mapas: integrar un proveedor detrás del puerto `MapProvider` (pospuesto; hoy las coordenadas se cargan a mano).
- [ ] Sprint 3: puntos de apoyo (EP-06), alertas de zona (EP-07), incidentes (EP-08) y generación de rutas seguras (EP-09).

### Cómo trabajar hoy (desarrollo local)

- Repo en `D:\RUNCTY` (ruta corta obligatoria en Windows; ver sección "Reglas de trabajo").
- Emuladores: `npm run functions:build`, luego `npm run emulators`, y en otra terminal `npm run seed`. El seed crea Loja, los roles, el admin (`admin@runcty.dev` / `Admin123!`) y 5 rutas de ejemplo.
- Celular por USB: `adb reverse` de los puertos 8081, 9099, 8080, 5001 y 9199. Después, desde `mobile/`, `npm run android` (o `npm start` si la app ya está instalada). Detalle en `docs/manual-instalacion-android.md`.
- Panel admin en Docker: `docker compose up -d --build admin`, en http://localhost:3100 (usa los emuladores del host). Sin Docker: `npm run admin:dev`, en http://localhost:3000.
- Si se reinician los emuladores, los usuarios se borran. La app cierra sola una sesión vieja; hay que volver a iniciar sesión.

### Plan para la demo (Firebase real)

Objetivo: que la app funcione en cualquier celular sin la computadora, con datos compartidos.

1. **El usuario** (cuenta y pago, no lo puede hacer el asistente; unos 15 minutos):
   1. Entrar a https://console.firebase.google.com → **Agregar proyecto** → nombre `runcty`. Google Analytics no hace falta.
   2. **Plan Blaze:** engranaje → *Uso y facturación* → *Modificar plan* → **Blaze** → cargar la tarjeta. Después, en Google Cloud Console → *Facturación* → *Presupuestos y alertas*, crear un presupuesto de **5 USD** con alertas por correo. Para el piloto, el costo esperado es casi cero.
   3. **Authentication** → *Comenzar* → activar **Correo electrónico/contraseña**.
   4. **Firestore Database** → *Crear base de datos* → modo **producción** → ubicación **`nam5 (us-central)`**, la misma región que las Cloud Functions (`us-central1`). La ubicación no se puede cambiar después.
   5. **Storage** → *Comenzar* → misma ubicación.
   6. **App web:** engranaje → *Configuración del proyecto* → *Tus apps* → ícono `</>` → registrar `runcty-web` → copiar el bloque `firebaseConfig` (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`). Estos valores van en `mobile/.env` y `admin/.env.local`, nunca en git.
   7. En la terminal, desde `D:\RUNCTY`: `npx firebase login` (abre el navegador para iniciar sesión con la cuenta dueña del proyecto).
   8. Para cargar los datos iniciales en producción hace falta una credencial de administrador. Opción simple: engranaje → *Cuentas de servicio* → *Generar nueva clave privada*. Guardar el JSON **fuera del repo** (por ejemplo `C:\Users\usuario\runcty-admin.json`) y no compartirlo.
   9. Pasarle al asistente el `firebaseConfig` y la ruta del JSON de la cuenta de servicio.
2. **El asistente:**
   - Configurar la app y el panel con esos valores, sin subir claves a git.
   - Desplegar las reglas, los índices y las Cloud Functions.
   - Cargar los datos iniciales en producción: Loja, roles, el admin y las rutas de ejemplo.
   - Generar un APK instalable para compartir.
3. **Google Maps** queda para después de la demo: las rutas todavía no usan mapa.
