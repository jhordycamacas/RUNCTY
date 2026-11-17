# CONTEXTO DEL PROYECTO — RUNCTY

> Documento de contexto para retomar el desarrollo en cada sesión. Leer completo antes de trabajar.
> Fuentes originales: `D:\Proyecto5to\DocumentosContexto` (Acta de Constitución, Documento de Visión DCV-VIS v1.0.0, Excel de requisitos, PROYECTO 3.pdf, apuntes de la reunión con Gacelas).

## Reglas de trabajo en el repositorio

- **Autoría:** todo commit y push debe aparecer únicamente a nombre del usuario `jhordycamacas`. Nunca agregar `Co-Authored-By`, ni mencionar a Claude o Anthropic en commits, PRs o archivos.
- **NO CÓDIGO ZOMBIE (regla obligatoria):** no se deja en el proyecto código que no se usa. Si una función, componente, archivo, export, dependencia, script o prueba ya no sirve para nada, se **elimina** en el mismo cambio que la deja sin uso. No se comenta "por si acaso" ni se deja desactivado. Git guarda el historial si hace falta recuperarlo. Antes de cerrar cada tarea, se revisa que no queden exports sin usar ni archivos huérfanos (por ejemplo con `npx knip` en cada paquete).
- Commits con formato Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`...).
- Repositorio: https://github.com/jhordycamacas/RUNCTY (clon local: `D:\RUNCTY`).
- **Ruta del clon local (2026-11-02):** el repo se clonó de nuevo en `D:\RUNCTY` y reemplaza al anterior, `D:\Proyecto5to\RunCity\RUNCTY`. En Windows, la compilación nativa de Android falla si la ruta es larga (`Filename longer than 260 characters`), porque la versión de ninja del SDK (1.10.2) no admite rutas largas. La ruta de la carpeta de la app (`frontend/mobile/` desde el 2026-11-12; antes `mobile/`) no debe superar unos 25 caracteres, y ni `subst` ni `LongPathsEnabled` lo resuelven. Además, el plugin `frontend/mobile/plugins/with-short-cxx-dir.js` mueve la carpeta temporal de CMake a `<unidad>:\.rcx` en Windows. Con las dos medidas, la app compila e instala en un Infinix X678B con `npm run android`. La memoria y el historial del asistente se copiaron de la clave de proyecto `D--Proyecto5to-RunCity-RUNCTY` a `D--RUNCTY`, así que se trabaja abriendo la sesión en `D:\RUNCTY`. El detalle está en `docs/manual-instalacion-android.md`.

## 1. Qué es

Reto académico de la **UTPL** (materias Fundamentos de Ingeniería de Software e Ingeniería Web). El club **Gacelas Running Team (Loja, Ecuador)** planteó un problema y varios grupos de estudiantes compiten por proponer y desarrollar la mejor solución. Nuestro grupo quiere ganar el reto.

- Inicio: semana del 12 al 18 de octubre de 2026 (levantamiento de requisitos).
- Fase actual (2026-11-10): Sprints 1 y 2 implementados, integrados en `main` y verificados contra el código (sección 14). La demo con Gacelas con Firebase real sigue pendiente. El Sprint 1 cubre usuarios, autenticación, preferencias, roles, administración de usuarios, ciudades y zonas. El Sprint 2 cubre el catálogo de rutas y la evaluación de seguridad por franja. La app también tiene un sistema de diseño nuevo. Sigue el Sprint 3: puntos de apoyo, alertas de zona, incidentes y generación de rutas seguras.
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

> **Cambio en curso (arquitectura vigente desde el 2026-11-13, ver secciones 16 y 17):** la arquitectura es **backend Django + un solo frontend**. `backend/` es una API REST en Django que reemplaza a las Cloud Functions y se conecta a los servicios de Google (Firebase Auth, Firestore, Storage, FCM). `frontend/` es **una sola aplicación Angular + Ionic + Capacitor** que sirve la web y Android (APK); reemplaza a la app React Native (`frontend/mobile`) y al panel Next.js (`admin/`). Lo que sigue en esta sección describe la arquitectura anterior, que sigue vigente en el código de `frontend/mobile/`, `admin/` y `functions/` hasta que termine la migración (tarea S6); se reescribe entonces.

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

## 11. Product Backlog (versión final — 2026-11-10)

**Archivo vigente:** `D:\Proyecto5to\Docs\BacklogRUNCTY_Final.xlsx`. Usa la plantilla del docente (`plantillaFINALBACKLOG.xlsx`): una sola hoja, `BKL-G1`, con las épicas e historias arriba y la tabla Sprint Backlog abajo. Las versiones anteriores (`BacklogDesarrolladoPorModificar.xlsx`, `BacklogRUNCTY_PlantillaFinal.xlsx` y el de `Downloads`) quedan como historial.

**Fuente de verdad de los requisitos:** `D:\Proyecto5to\Docs\RequsitosExcelFInal.xlsx`. No se modifica. El backlog y los diagramas se alinean con él.

**Totales:** 26 épicas y 153 historias. **Una historia por sub-requisito (RF-XX-N)**, con el mismo ID y el mismo significado que en el Excel. El rol de cada historia es el actor de la hoja MODULOS.

**Columna Comentarios (L):** prioridad · responsable · requisito de usuario (UR) · RNF · caso de uso · diagrama · dependencia · estado. Con esa columna se responde la revisión de trazabilidad.

### Épicas

- EP-01 a EP-24 corresponden uno a uno a RF-01 a RF-24, salvo RF-01, que se divide en tres:
  - **EP-01 Gestión de usuarios:** RF-01-1 a 01-4 (cuenta) y RF-01-9 a 01-12 (perfil deportivo). Incluye "Consultar usuarios", que hace el administrador.
  - **EP-25 Autenticación y credenciales:** RF-01-5 a 01-8. **Recuperar contraseña es un flujo propio**, separado de la gestión de usuarios.
  - **EP-26 Preferencias de usuario:** RF-01-13 a 01-16. Son las preferencias del propio usuario, no un catálogo del administrador.
- La EP-27 (Administración de usuarios) del backlog anterior se integró en EP-01.
- "Cerrar sesión" no existe en el Excel final, así que no está en el backlog.

### Plan de sprints

Se mantiene el calendario del equipo: Sprint 1, semanas 4–5; Sprint 2, semana 6; Sprint 3, semana 7; Sprint 4, semana 9; Sprint 5, semana 10. La semana 8 no tiene actividad y la 11 queda fuera de los sprints.

## 12. Estado actual

- [x] Repositorio creado con README.
- [x] CONTEXTO.md creado.
- [x] Arquitectura y stack definidos (sección 9).
- [x] Backlog corregido según el docente (sección 11).
- [x] Estructura inicial del proyecto (app móvil, panel admin, Cloud Functions, reglas, emuladores).
- [x] Sprint 1 implementado y con tests: EP-01 (incluye la administración de usuarios, antes EP-27), EP-25, EP-26, EP-02 y EP-04. El detalle está en `odd/tasks/foundation-sprint1.md`.
- [x] Manual de instalación en Android por USB: `docs/manual-instalacion-android.md`.
- [x] Sistema de diseño en la app (fuente Inter, íconos, componentes) y logo de RUNCTY como ícono de la app.
- [x] Sprint 2: catálogo de rutas (EP-05) y evaluación de seguridad (EP-07, RF-07-1 a RF-07-11). Hay 5 rutas de ejemplo de Loja en el seed. El detalle está en `odd/tasks/design-system-sprint2.md`.
- [x] App instalada en un Infinix X678B. Arreglos hechos en el dispositivo: la hora no se veía en la barra de estado (ahora sigue el tema de la app y no el del sistema), los textos de la barra de pestañas quedaban tapados (ahora la altura se adapta al tamaño de letra y a la barra de gestos de cada celular), y una sesión de un usuario borrado dejaba la app trabada (ahora se cierra sola).
- [x] Limpieza de código zombie (2026-11-02) con `npx knip` en mobile, admin y functions, verificando cada caso con búsqueda en todo el repo. Se eliminaron código sin uso (`formatDistance`, tipos y constantes huérfanos), exports innecesarios de los barrels y el script `web` de mobile, que no podía funcionar. Quedó a propósito `contrast.ts`, que solo usa su test pero vigila el contraste AA de los temas. **Revisión del 2026-11-10:** `knip` todavía marca restos (ver 14.4) y no está instalado como dependencia de desarrollo; se ejecuta con `npx --yes knip`.
- [x] Todo integrado en `main` y subido a GitHub (2026-11-02).
- [ ] Probar en el navegador la gestión de rutas del panel. Falta `admin/.env.local` en el clon nuevo: copiarlo de `admin/.env.example`.
- [x] Backlog final con la plantilla del docente y trazabilidad con el Excel (sección 11).
- [x] Proyecto de Enterprise Architect con el modelo 4+1, casos de uso y un diagrama de clases (sección 13).
- [ ] Marcar como "Terminado" en el backlog las historias de los Sprints 1 y 2 que ya están implementadas (hoy figuran como "Pendiente").
- [x] Especificación de los 155 casos de uso y PDF de los diagramas del requisito elegido, en `D:\Proyecto5to\Docs\Entregables` (sección 13). Reemplaza a `Especificaciones de casos de uso RUNCTY - Con diagramas.docx`, que describe el modelo viejo.
- [ ] Importar el backlog a Jira.
- [ ] Validar el diseño y la paleta con el cliente.
- [ ] **Demo con Gacelas:** pasar a Firebase real. La fecha original (semana del 2026-11-02) ya pasó; confirmar la nueva. Ver "Plan para la demo" abajo.
- [ ] Mapas: integrar un proveedor detrás del puerto `MapProvider` (pospuesto; hoy las coordenadas se cargan a mano).
- [ ] Sprint 3: puntos de apoyo (EP-06), alertas de zona (EP-07), incidentes (EP-08) y generación de rutas seguras (EP-09).
- [x] Backend local en Docker (2026-11-10): emuladores de Firebase, seed y panel con `docker compose up -d --build`, puertos solo en `127.0.0.1` y procesos sin root.
- [x] Auditoría del 2026-11-10 (seguridad, UX/UI y verificación de sprints): hallazgos y plan en la sección 14.
- [x] Correcciones de seguridad del servidor (T1; SEC-01, 02, 03, 05, 06 y 08): hechas en la rama `feat/hardening-and-polish`. El agente reportó los tests en verde; **no se volvieron a ejecutar** antes de subirlas (ver 14.2).
- [ ] Pulido de la app móvil y del panel (T2 y T3 de `odd/tasks/auditoria-y-pulido.md`): **pausado a pedido del usuario**. El plan detallado está en 14.5.
- [x] Guion y checklist para presentar el Sprint 1: sección 14.6.
- [ ] **Migración a Django + un solo frontend Angular/Ionic** (plan vigente en `odd/tasks/single-frontend-ionic.md`; el plan anterior, `django-angular-architecture.md`, queda para el contrato de la API y la auditoría): backend de usuarios, roles, ciudades, rutas y seguridad hecho; frontend nuevo con el área del corredor completa; faltan el área de admin (S5) y la limpieza final (S6). El estado detallado está en la sección 17.

### Cómo trabajar hoy (desarrollo local)

- Repo en `D:\RUNCTY` (ruta corta obligatoria en Windows; ver sección "Reglas de trabajo").
- **Backend con Docker (recomendado, 2026-11-10):** con Docker Desktop encendido, `docker compose up -d --build` levanta los emuladores de Firebase (`runcty-firebase`), el seed (`runcty-seed`, corre una vez y termina) y el panel admin (`runcty-admin`). El seed crea Loja, los roles, el admin (`admin@runcty.dev` / `Admin123!`) y 5 rutas de ejemplo. Los puertos se publican solo en `127.0.0.1`. La UI de los emuladores está en http://localhost:4000. Archivos: `docker-compose.yml`, `docker/firebase.Dockerfile`, `.dockerignore`. Si cambia el código de `functions/`, hay que reconstruir la imagen: `docker compose up -d --build firebase`.
- Sin Docker: `npm run functions:build`, luego `npm run emulators`, y en otra terminal `npm run seed`.
- Celular por USB: `adb reverse` de los puertos de Metro, 9099, 8080, 5001 y 9199. **Metro usa el 8082 en el Infinix:** la build instalada busca Metro en el 8082 (se compiló cuando el 8081 estaba ocupado; si no, el celular muestra "Unable to load script"). Desde `frontend/mobile/`: `EXPO_PUBLIC_USE_EMULATORS=true EXPO_PUBLIC_EMULATOR_HOST=127.0.0.1 npx expo start --port 8082`. Esas dos variables pueden ir en `frontend/mobile/.env` (copiar de `.env.example`; el asistente no puede leer ni crear archivos `.env`). `npm run android` solo hace falta para reinstalar. Detalle y solución de problemas en `docs/manual-instalacion-android.md` (todavía dice 8081).
- Si se reconstruye el contenedor de Firebase, los `adb reverse` siguen vigentes, pero al reiniciar Metro hay que volver a abrir **todos** los túneles (se perdieron una vez y la app mostró "Aún no hay rutas" y un error de red de Firebase).
- Panel admin: lo levanta el mismo `docker compose` en http://localhost:3100. Sin Docker: `npm run admin:dev`, en http://localhost:3000.
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

## 13. Documentación de análisis y diseño (Enterprise Architect — 2026-11-10)

Todos los documentos están en `D:\Proyecto5to\Docs`. El proyecto de EA es `RunCty.eap`, hecho con EA Trial. Los respaldos de las versiones anteriores quedaron fuera del repo.

### Estructura del proyecto `RunCty`

Tiene las 5 vistas del modelo 4+1 (imagen `Modelo4+1.png`): Desarrollo, Escenarios, Lógica, Procesos y Física.

- **Vista de Escenarios**
  - **Diagrama de contexto:** el sistema RUNCTY con 7 entidades externas y sus flujos de datos.
  - **Casos de uso:** paquete "Actores", 26 paquetes (uno por épica, sin códigos en el nombre) y el diagrama "Mapa de épicas".
- **Vista Lógica:** diagrama de clases "Calcular índice de seguridad".
- **Vistas de Desarrollo, Procesos y Física:** todavía vacías.

### Reglas del modelo de casos de uso

- **4 actores:** Corredor, Administrador, Representante de club y Sistema. El actor de cada caso sale de la hoja MODULOS. "Usuario" y "Persona que se registra" se modelan como Corredor; iniciar sesión, cambiar contraseña y recuperar contraseña los usan los tres roles humanos.
- **Un caso de uso por requisito (RF-XX-N), con nombre en lenguaje natural:** 155 en total. RF-01-7 se divide en "Cambiar contraseña" y "Recuperar contraseña", y RF-02-3 en "Actualizar permisos de un rol" y "Asignar rol a un usuario".
- **Un diagrama por cada objeto que gestiona la épica:** 40 diagramas, de 2 a 5 óvalos cada uno. Por ejemplo, la épica de seguridad tiene Franjas horarias, Factores de riesgo, Índice de seguridad y Alertas de zonas de riesgo.
- **Sin códigos** (CU, EP o RF) en los nombres de casos de uso, diagramas ni paquetes. La trazabilidad va en la **nota** de cada caso de uso: RF con su descripción, reglas de MODULOS, épica, historia del backlog, UR y RNF.
- **Relaciones respaldadas por requisitos o por el código:**
  - "Crear cuenta" incluye "Crear credenciales de acceso".
  - "Eliminar cuenta" incluye "Eliminar credenciales de acceso" y "Eliminar perfil deportivo".
  - "Configurar perfil deportivo" extiende "Crear cuenta".
  - "Solicitar ruta segura" incluye "Consultar índice de seguridad".
  - "Registrar entrenamiento" incluye "Registrar recorrido GPS" y "Calcular métricas de entrenamiento".
  - Registrar, actualizar y eliminar franjas y factores de riesgo incluyen "Recalcular índice de seguridad", porque así lo hace `withRecalc` en `routeService.ts`.
- El archivo `corregido.eap` de un compañero se revisó y no se usó como base: conservaba los errores del modelo viejo. Solo se adoptó su estilo de nombres en lenguaje natural.

### Diagrama de clases del requisito elegido

- **Requisito:** RF-07-9 "Calcular índice de seguridad". Se eligió porque es el núcleo de la propuesta de valor y porque ya está implementado y probado en `functions/src/routes/domain/safety.ts`.
- **Clases:** Ruta, Tramo, FranjaHoraria, FactorDeRiesgo, ReporteValidado (hereda de FactorDeRiesgo), IndiceSeguridad (de una ruta o de un tramo, por franja) y CalculadoraIndiceSeguridad (`«create»` IndiceSeguridad).
- **Decisiones para que sea simple y UML válido:**
  - Sin enumeraciones: el equipo todavía no las vio en clase, así que nivel, severidad y tipo quedan como String.
  - Las clases de datos no llevan métodos inventados: UML no obliga a tener operaciones. Ruta tiene `obtenerTramosOrdenados()` y FactorDeRiesgo tiene `estaActivoEn(franja)`, que reflejan la lógica real.

### Trazabilidad de RF-07-9 (para la revisión)

- **UR:** UR-05 (visualización del nivel de seguridad) y UR-06 (rutas seguras por horarios).
- **RNF:** RNF-14 (recálculo en 24 h como máximo) y los transversales RNF-10, 11, 21 y 23.
- **Backlog:** fila 51, épica EP-07, Sprint 2.
- **Caso de uso:** "Calcular índice de seguridad", en el diagrama "Índice de seguridad".
- **Diagrama de clases:** Vista Lógica → "Calcular índice de seguridad".
- **Código:** `safety.ts` y `safety.test.ts`.

### Entregables (`D:\Proyecto5to\Docs\Entregables`, 2026-11-10)

- **PDF en A4 horizontal**, exportados desde EA en formato vectorial (EMF) para que se lean nítidos:
  - `Diagrama de casos de uso - Índice de seguridad.pdf`;
  - `Diagrama de clases - Calcular índice de seguridad.pdf`;
  - `Diagrama de contexto - RUNCTY.pdf`.
- **`Especificación de casos de uso RUNCTY.docx`:** 182 páginas, con una especificación por cada uno de los 155 casos de uso.
  - **Estructura:** portada, actores, índice por épica con enlaces, y luego cada épica con sus diagramas y sus casos.
  - **Contenido de cada caso:** una tabla con descripción, actores, RF, historia de usuario, fila del backlog, UR, RNF, diagrama, relaciones, precondiciones, postcondición y reglas de negocio de MODULOS; flujo principal; y flujos alternativos.
  - **Estilo:** el mismo del documento anterior del equipo (Calibri, azul marino `#192840`, acentos `#13796F`, etiquetas de tabla en `#EFF3F6`).
  - **Origen de los flujos:** 40 casos con lógica propia tienen flujos escritos a mano (autenticación, perfil, índice de seguridad, solicitud de rutas, entrenamiento, pánico, ubicación compartida, reportes, notificaciones, clubes, salidas y eventos). Los demás siguen un patrón según la operación (registrar, consultar, actualizar o eliminar), con los datos y reglas propios de cada requisito.
- **Para regenerarlos:** los scripts quedaron en la carpeta temporal de la sesión, no en el repo. Si el modelo cambia, hay que volver a exportar los diagramas desde EA y regenerar el documento.

### Consideraciones abiertas

- **El Excel no declara la relación UR → RF.** La asignación de requisitos de usuario en el backlog la hizo el equipo. Además, 11 RF no tienen ningún UR asociado: RF-10, 11, 13, 14, 16, 18, 19, 20, 21, 22 y 23. Conviene agregarlos al Excel antes de la revisión de trazabilidad.
- **Precondición distinta del código.** MODULOS pide, para RF-07-9, que existan factores o reportes validados. El código, en cambio, le da 100 puntos (nivel Alto) a un tramo sin factores. Se justifica como decisión de diseño, o se ajusta el código.
- **Anunciante en el diagrama de contexto.** Aparece enviando datos de campañas, pero según RF-24 quien registra anunciantes y campañas es el Administrador.
- **Avisos de EA Trial.** A veces abre avisos que bloquean la automatización, sobre todo al cambiar de día. Si un script de EA se queda colgado, hay que buscar la ventana del aviso y aceptarla.

## 14. Auditoría y pendientes (2026-11-10)

El 2026-11-10 tres agentes de solo lectura auditaron el repo: seguridad, UX/UI y verificación de los sprints contra el código. Esta sección guarda sus hallazgos completos para retomar el trabajo más tarde sin repetir la auditoría. El plan de trabajo está en `odd/tasks/auditoria-y-pulido.md` y la rama es `feat/hardening-and-polish`.

### 14.1 Qué se hizo y qué quedó pausado

- **Hecho:** Docker con emuladores, seed y panel (puertos solo en `127.0.0.1`, procesos sin root); correcciones de seguridad del servidor (T1); documentación (README y esta sección).
- **Pausado a pedido del usuario:** pulido de la app móvil (T2) y del panel admin (T3). La app del celular y el panel quedan **como estaban**.
- **Al retomar, primero:** reconstruir la imagen de Firebase para que los emuladores usen las functions nuevas (`docker compose up -d --build firebase`) y volver a correr los tests (`npm --prefix functions test`), porque los cambios de T1 se subieron sin que el asistente los re-ejecutara.

### 14.2 Seguridad (SEC-01 a SEC-10)

| ID | Sev. | Hallazgo | Estado |
| --- | --- | --- | --- |
| SEC-01 | Alta | App Check no se exige en ningún callable (`enforceAppCheck` no aparece en `functions/src`) ni los clientes llaman a `initializeAppCheck`. Con cualquier token válido se podía llamar a `setUserRole`, `deleteAccount` o `searchUsers` sin la app. | **Parcial.** Flag `ENFORCE_APP_CHECK=true` (apagada por defecto) en `functions/src/shared/appCheck.ts`, aplicada con `setGlobalOptions` en `functions/src/index.ts`. **Falta:** activar el proveedor Play Integrity en la consola de Firebase, agregar `initializeAppCheck` en `mobile/` y `admin/`, y prender la flag al desplegar. Apagada para no romper emuladores ni la demo. |
| SEC-02 | Media | `roles.manage` equivale a admin: quien lo tenga puede crear un rol con todos los permisos y asignárselo. | **Corregido.** Solo un admin asigna o quita el rol `admin` o incluye `roles.manage` en un rol; nadie concede permisos que no tiene (errores `admin-only` y `permission-escalation`). En `updateRole`, un no-admin solo se valida en los permisos nuevos. Archivo: `functions/src/roles/roleService.ts`. |
| SEC-03 | Media | Al cambiar un rol, el usuario conservaba los permisos viejos hasta 1 hora. | **Corregido en parte.** Se llama a `revokeRefreshTokens` tras cambiar los claims. Un ID token ya emitido sigue valiendo hasta 1 h (los callables no usan `checkRevoked`). |
| SEC-04 | Media | Quien tenga `users.read` lee datos personales de todos (`idNumber`, `birthDate`) por reglas (`firestore.rules`, lectura de `users/{uid}`) y por `searchUsers`; sin bitácora ni límite de consultas. | **Pendiente (decisión).** Opciones: lectura directa solo del dueño, registrar cada búsqueda con el uid, exigir admin para buscar por identificación. Cambiar las reglas puede romper la búsqueda del panel. |
| SEC-05 | Media | El admin de prueba (`admin@runcty.dev` / `Admin123!`) está en claro en el repo y la guarda del seed solo miraba dos variables. | **Corregido en la guarda:** `scripts/seed-emulator.ts` usa `functions/src/seed/seedGuard.ts` y exige proyecto `demo-*` y hosts `127.0.0.1`, `localhost`, `::1` o `firebase` (el servicio de Docker). La clave sigue fija y es solo para emulador. |
| SEC-06 | Media | Docker publicaba los emuladores (sin autenticación) en todas las interfaces y corría como root. | **Corregido** (commit `774fb91`). |
| SEC-07 | Baja | Las reglas no exigen `email_verified` al crear el perfil. | **Pendiente.** |
| SEC-08 | Baja | `deleteAccount` no impedía que el último admin se borrara; `setUserRole` tampoco impedía degradarlo. | **Corregido.** Error `last-admin`, usando la consulta `users` con `role == 'admin'` y `limit(2)` (sin índice nuevo). Pendiente: limpiar datos por usuario cuando existan colecciones nuevas. |
| SEC-09 | Informativo | El control de acceso del panel (`RequirePermission` en `AdminShell.tsx`) es solo del lado del cliente; no hay middleware. No es explotable, porque los datos los protegen reglas y callables. | Mantener la autorización en el servidor como única autoridad. |
| SEC-10 | Baja (por confirmar) | `npm audit --omit=dev`: avisos altos en `firebase`, `@firebase/firestore` y `@grpc/grpc-js` (mobile 4 altas y 10 moderadas; admin 4 altas; functions 6 moderadas). El único arreglo que ofrece npm es bajar a `firebase@9.14.0`. | **No aplicar la bajada.** Revisar si los avisos aplican al uso cliente del SDK y si hay una versión nueva. |

**Estado de las pruebas de T1:** el agente reportó `functions` con 16 archivos y 186 tests en verde (antes 167) y typecheck sin errores; mostró RED antes de implementar. No se tipó ni corrió `scripts/seed-emulator.ts`. El asistente no volvió a correr los tests.

**Lo que ya estaba bien:** Storage niega todo por defecto y Firestore no tiene regla comodín; `onUserDocCreated` nunca confía en el campo `role` del documento; `deleteAccount` exige inicio de sesión reciente (5 min); `searchUsers` limita página (50) y escaneo (1000); `.gitignore` cubre `.env*`, keystores y archivos de Firebase; la imagen del panel usa usuario sin root.

### 14.3 UX/UI

La app móvil está bien construida: tokens usados de forma consistente, todos los botones respetan `MIN_TOUCH_TARGET`, hay etiquetas y roles de accesibilidad, y el texto de seguridad evita decir "segura" o "insegura". Lo que la hace ver incompleta son funciones prometidas que no están conectadas y algunos contrastes. Los contrastes salen de los valores de los tokens, no se midieron en pantalla; el panel no se ejecutó.

**Lo que más resta calidad (en orden):**

1. **Preferencias que no hacen nada.** Se guardan unidades, notificaciones, alertas de seguridad, eventos y privacidad de ubicación, pero ningún código las usa (`PreferencesScreen.tsx:170-207`; `formatKm` en `mobile/src/features/routes/domain/labels.ts:41` está fijo en km).
2. **Sin botón de emergencia ni mapa.** No hay nada de pánico, SOS o emergencia en `mobile/src`; el detalle de ruta solo muestra "N puntos" por tramo (`RouteDetailScreen.tsx:183`).
3. **El aviso de correo sin verificar es un callejón sin salida** (`HomeScreen.tsx:55-62`): el gateway ya tiene `sendEmailVerification` (`firebaseAuthGateway.ts:43`), pero no hay botón de reenviar ni de refrescar.
4. **Registro largo y fecha escrita a mano** como `AAAA-MM-DD` (`PersonalDataFields.tsx:35-45`), difícil para adultos mayores y menores.
5. **El panel no es responsive y cambia roles sin confirmar** (`AdminShell.tsx:43,77`; `UsersTable.tsx:84-88`).

**App móvil**

| ID | Sev. | Lugar | Problema | Arreglo |
| --- | --- | --- | --- | --- |
| UX-M-01 | Alta | `PreferencesScreen.tsx:170-207` | Unidades, notificaciones y privacidad se guardan pero no tienen efecto. | Aplicar la unidad en `formatKm`, `formatElevation` y `formatMeters`, o marcar los grupos "Próximamente" como la opción de idioma (`PreferencesScreen.tsx:33-36`). |
| UX-M-02 | Alta | `HomeScreen.tsx:55-62` | No se puede reenviar el correo ni refrescar el estado verificado. El registro lo envía una vez y traga el error (`authUseCases.ts:43`). | Botón "Reenviar correo" con mensaje de éxito y re-chequeo de `emailVerified` al volver a la pantalla. |
| UX-M-03 | Alta | `PersonalDataFields.tsx:35-45` | Fecha de nacimiento escrita a mano. | Selector de fecha **sin módulo nativo** (ver 14.5): tres campos numéricos o máscara. |
| UX-M-04 | Media | `core/theme/themes.ts:64,91`; `TextField.tsx:37,111` | Bordes de campos y chips (`#D4D4D4` sobre blanco; `grey800` sobre `#111111`) rondan 1,5:1, bajo el 3:1 de contraste no textual. | Token `inputBorder` más oscuro (~`#8A8A8A` claro, ~`#6B6B6B` oscuro) para campos, casillas y chips sin seleccionar. |
| UX-M-05 | Media | `RouteCard.tsx:34-38` | La tarjeta muestra "Seguridad alta" junto a "Iluminación deficiente en…", sin contexto; parece una contradicción. | Prefijo "Factor principal:" y la insignia de severidad, como en `FactorList`. |
| UX-M-06 | Media | `SportProfileScreen.tsx:51-52,59-76` | Tras "Eliminar perfil deportivo" se pierde el aviso de éxito; un error de consulta sin perfil tampoco se muestra. | Pasar `notice` y `error` a `SportProfileForm`. |
| UX-M-07 | Media | `HomeScreen.tsx:68-70` | Los accesos rápidos "Rutas" y "Perfil" repiten la barra de pestañas; la tarjeta "Próxima franja" no se puede tocar y sus franjas salen de `trainingSlots.ts:10-13` fijas. | Accesos reales (ver rutas de esta franja, última ruta vista); tarjeta que abre Rutas con la franja elegida. |
| UX-M-08 | Media | `Button.tsx:54` | Botón deshabilitado o cargando usa `opacity: 0.6`; texto blanco sobre `#C9302C` queda bajo 4,5:1. | Par de colores propio para deshabilitado. |
| UX-M-09 | Media | `RoutesListScreen.tsx:58-73` | Los 3 grupos de filtros (franja, distancia, dificultad) ocupan casi una pantalla antes de la primera ruta. | Fila de chips con desplazamiento horizontal o una hoja "Filtros". |
| UX-M-10 | Baja | `Checkbox.tsx:41-45` | La marca es el carácter `✓`, que cambia según la fuente. | Usar `<Icon name="checkmark">`, como `ChoiceGroup`. |
| UX-M-11 | Baja | `PreferencesScreen.tsx:35` | "English (próximamente)" mezcla idiomas. | "Inglés (próximamente)". |
| UX-M-12 | Baja | `RouteDetailScreen.tsx:149` | Frase "No hay factores de riesgo registrados para esta franja" sin punto final ni aclaración. | Agregar el punto y reutilizar el aviso de que no es una garantía. |
| UX-M-13 | Baja | `ProfileHomeScreen.tsx:49` | Sin nombre de ciudad muestra el `cityId` crudo o "—". | "Sin ciudad". |
| UX-M-14 | Baja | `mobile/src/app` | No hay `ErrorBoundary`: un fallo de render deja pantalla en blanco o roja. | Límite de errores global con "Reiniciar". |

**Panel de administración**

| ID | Sev. | Lugar | Problema | Arreglo |
| --- | --- | --- | --- | --- |
| UX-A-01 | Alta | `AdminShell.tsx:43,77` | Barra lateral fija de 240 px, inutilizable bajo ~768 px. | Menú colapsable bajo `md:`. |
| UX-A-02 | Alta | `UsersTable.tsx:84-88` | El cambio de rol se aplica con un clic en "Aplicar", sin confirmar. | `ConfirmDialog` antes de `mutation.mutate`. |
| UX-A-03 | Media | `RoutesScreen.tsx:96-123,127-210` | Tabla de 9 columnas con desplazamiento horizontal; sin orden ni paginación. | Ocultar "Superficie" y "Tramos" bajo `xl`, u ordenar por columna. |
| UX-A-04 | Media | `UsersScreen.tsx:81,88,93-99` | "N usuario(s) mostrados" es ambiguo junto a "Cargar más". | "N de M" o "N resultados (hay más)". |
| UX-A-05 | Media | `RolesScreen.tsx:61-73`; `CitiesScreen.tsx:76-89`; `RoutesScreen.tsx:80-94` | El formulario de crear/editar aparece sobre la lista; "Editar" en una fila de abajo no mueve la vista ni el foco. | `scrollIntoView` y foco al primer campo. |
| UX-A-06 | Media | `feedback.tsx:3-14` | Los avisos de éxito y error no se cierran; el de éxito es un contorno blanco poco evidente. | Botón de cerrar o cierre automático, y un tinte de éxito. |
| UX-A-07 | Media | `ConfirmDialog.tsx:47` | Las confirmaciones destructivas usan el botón primario, igual que una acción normal. | Prop `variant="danger"`. |
| UX-A-08 | Media | `TimeSlotsSection.tsx:81-111`; `RiskFactorsPanel.tsx:91-101` | Horas y fechas son texto libre ("HH:MM", "AAAA-MM-DD"); `UsersScreen.tsx:57` ya usa `type="date"`. | `type="time"` y `type="date"`. |
| UX-A-09 | Media | `RouteForm.tsx:113-129`; `SegmentsSection.tsx:79-85` | Las coordenadas se escriben a mano, sin mapa ni vista previa. | Vista previa en mapa o "Pegar desde Google Maps" (el mapa llega con `MapProvider`). |
| UX-A-10 | Baja | `app/layout.tsx:6-9` | Un solo título para todas las páginas. | `generateMetadata` por ruta ("Usuarios · RUNCTY"). |
| UX-A-11 | Baja | `Button.tsx:27` | Al cargar, la etiqueta se reemplaza por "Procesando…" y se pierde el contexto. | Mantener la etiqueta y agregar un spinner. |
| UX-A-12 | Baja | `LoginScreen.tsx:61-68` | Sin mostrar contraseña ni "¿Olvidaste tu contraseña?" (la app móvil sí los tiene). | Agregar el botón de mostrar. |
| UX-A-13 | Baja | `AdminShell.tsx:45`; `globals.css:5,9` | El rojo de marca `#D9534F` (3,96:1) se usa como texto pequeño en negrita sobre blanco, bajo AA. | Usar `text-primary`. |

### 14.4 Verificación de sprints (2026-11-10)

**Comprobaciones (resultado observado):**

- `mobile`: typecheck sin errores; 35 suites y 257 tests en verde; lint limpio.
- `admin`: 9 archivos y 60 tests en verde; `tsc --noEmit` sin errores.
- `functions`: typecheck sin errores; 14 archivos y 167 tests en verde (después de T1: 16 archivos y 186, reportado por el agente). Vite imprime un aviso inofensivo de CJS/ESM.
- `test:rules`: **no se ejecutó** (levanta otro emulador sobre puertos ocupados). El archivo existe: `functions/test/rules/firestore.rules.test.ts`.
- `npx --yes knip` (v6.44.2): `mobile` marca `expo-asset` sin uso (`package.json:15`) y `expo-updates` y `expo-system-ui` sin declarar (se usan en `app.config.ts`); `admin` limpio; `functions` marca `RoutePoint` (`src/routes/domain/inputs.ts:44`), que es un **falso positivo**: lo importa `scripts/seed-emulator.ts`, fuera del paquete. Antes de quitar `expo-asset`, verificar que no sea dependencia de `expo-font`.

**Épicas:** EP-01, EP-25, EP-26, EP-02, administración de usuarios, EP-04, EP-05 y EP-07 (RF-07-1 a 11) están **completas** de punta a punta: pantalla, caso de uso, función o regla, y pruebas. Brechas menores:

- Recuperar contraseña usa el SDK cliente directo, sin lógica de servidor.
- No hay tests de pantalla para Preferencias, ni de componentes del panel.
- La gestión de rutas del panel no se probó en el navegador (pendiente en la sección 12).
- Existe y no estaba documentado: `mobile/src/features/training/domain/trainingSlots.ts`, `RecommendedRoutes.tsx`, el rol `club_rep`, `firestore.indexes.json` y `storage.rules`.

**Punto de partida del Sprint 3:** no existe nada de EP-06, alertas de zona, EP-08 ni EP-09 (sin colecciones, reglas, callables ni pantallas), y `MapProvider` tampoco. Hay puntos de extensión:

- `computeSegmentSafety(slots, factors, extraPenalties = [])` en `functions/src/routes/domain/safety.ts:99`: nadie pasa `extraPenalties` todavía; es el gancho para los reportes comunitarios (RF-17).
- `routeCallables.ts` es una fábrica de callables reutilizable.
- `RecommendedRoutes` en mobile es la base natural de EP-09.
- Roles y permisos, con el rol `club_rep`, ya admiten permisos nuevos.

**Inconsistencias de documentación:**

- Corregidas hoy: EP-27 listado como épica del Sprint 1; falta de Docker; fecha de la demo; nota de `knip`.
- Pendientes: `docs/manual-instalacion-android.md` (líneas 69, 78, 139, 155) y `README.md` aún nombran el puerto 8081 en el manual; `odd/tasks/design-system-sprint2.md:42` deja T6 sin marcar aunque el Sprint 2 está hecho; `odd/tasks/trazabilidad-casos-de-uso.md:23` deja T4 sin marcar aunque T8 y T13 lo reemplazan; marcar "Terminado" en el backlog las historias de los Sprints 1 y 2.

### 14.5 Plan para retomar el desarrollo

**Restricción importante:** el celular tiene una build de desarrollo instalada. **Todo cambio de la app debe ser solo JS/TS.** Un módulo nativo (por ejemplo `@react-native-community/datetimepicker` o `react-native-maps`) obliga a recompilar e instalar el APK (`npm run android`, varios minutos). Los textos de la interfaz van en español.

**T2 — App móvil** (en este orden, un cambio coherente por commit):

1. **Botón de emergencia** visible en Inicio, que abra una pantalla simple con "Llamar al 911" (`Linking.openURL('tel:911')`), con texto honesto: la integración con ECU 911 y los contactos de confianza están fuera del alcance del piloto o son del Sprint 4.
2. **Preferencias que se aplican:** unidades (km/mi) en todos los formateadores; los grupos sin efecto, con la etiqueta "Próximamente" (siguen guardándose).
3. **Reenviar correo de verificación** y refrescar el estado al volver a la pantalla.
4. **Fecha de nacimiento sin teclado de guiones**, sin módulo nativo (tres campos numéricos o máscara), conservando la validación de dominio y el formato guardado.
5. **Contraste y estados:** token `inputBorder`, colores de botón deshabilitado, ícono en `Checkbox`, aviso tras eliminar el perfil deportivo, `ErrorBoundary`, filtros de rutas compactos, tarjeta de franja que abre Rutas, prefijo "Factor principal:", y los textos de UX-M-11, 12 y 13.

**T3 — Panel admin:** menú responsive; `ConfirmDialog` al cambiar rol y variante `danger`; `type="time"` y `type="date"`; avisos que se cierran; título por página; mostrar contraseña en el login; `text-primary` en lugar de `text-brand` para texto pequeño; scroll y foco al editar; "N de M" en la lista de usuarios.

**T5 — Verificación final:** tests, typecheck y lint de los tres paquetes; reconstruir la imagen de Firebase (`docker compose up -d --build firebase`); probar la app en el celular y el panel en el navegador.

**Decisiones abiertas (ya anotadas arriba):** activar App Check al desplegar (SEC-01); lectura de datos personales con `users.read` (SEC-04); `email_verified` en reglas (SEC-07); avisos de dependencias (SEC-10).

### 14.6 Presentación del Sprint 1

**Alcance del Sprint 1:** EP-01 Gestión de usuarios (con perfil deportivo y consulta de usuarios), EP-25 Autenticación y credenciales, EP-26 Preferencias de usuario, EP-02 Roles y permisos y EP-04 Ciudades y zonas. Las rutas y la evaluación de seguridad son del Sprint 2 y pueden mostrarse como adelanto.

**Antes de presentar (checklist):**

1. Docker Desktop encendido y `docker compose up -d --build` desde `D:\RUNCTY`. Esperar a que `runcty-seed` quede en `Exited (0)`.
2. Celular con depuración USB y cable: `adb devices` debe listarlo.
3. Túneles: `adb reverse tcp:P tcp:P` para `P` en 8082, 9099, 8080, 5001 y 9199.
4. Metro, desde `frontend/mobile/`: `EXPO_PUBLIC_USE_EMULATORS=true EXPO_PUBLIC_EMULATOR_HOST=127.0.0.1 npx expo start --port 8082`.
5. Abrir la app en el celular (queda en el inicio de sesión) y el panel en http://localhost:3100.
6. Tras reiniciar los emuladores se borran los usuarios: el corredor se crea en vivo (es parte de la demo).

**Cuentas:** administrador `admin@runcty.dev` / `Admin123!` (lo crea el seed). El corredor se registra en la app durante la demo.

**Guion por épica:**

| Épica | Qué mostrar |
| --- | --- |
| EP-01 Usuarios | En la app: registro con ciudad (Loja) y consentimiento LOPDP; perfil deportivo (nivel y objetivos); editar datos personales. En el panel: **Usuarios**, búsqueda por nombre, correo, identificación y ciudad. Dejar para el final "Eliminar cuenta" (pide la contraseña actual) y hacerlo con una cuenta de prueba. |
| EP-25 Autenticación | Iniciar sesión, cambiar contraseña y "¿Olvidaste tu contraseña?". En el emulador el correo no sale a ninguna bandeja: se muestra el flujo, y el envío real llega con Firebase real. |
| EP-26 Preferencias | Tamaño de letra y modo oscuro (se aplican al guardar). |
| EP-02 Roles | Panel, **Roles**: crear un rol con permisos y asignarlo desde **Usuarios**. Mostrar que un corredor no entra al panel (se le cierra la sesión con un aviso) y las protecciones: el rol `admin` conserva todos los permisos, un admin no puede quitarse su propio rol, ni degradarse ni borrarse al último admin, y solo un admin da `roles.manage` o el rol `admin`. |
| EP-04 Ciudades y zonas | Panel, **Ciudades y zonas**: crear una ciudad y una zona. Intentar eliminar una ciudad con zonas o rutas y mostrar que lo rechaza. El registro de la app solo lista ciudades activas. |
| Adelanto del Sprint 2 | Rutas de Loja con nivel de seguridad (Alto, Medio, Bajo) por franja y los factores que lo explican; en el panel, gestión de rutas, tramos, franjas y factores. |

**Límites conocidos (decirlos antes de que pregunten):**

- Las preferencias de unidades, notificaciones y privacidad se guardan pero todavía no cambian el comportamiento de la app.
- El correo sin verificar solo muestra un aviso, sin botón de reenvío.
- La fecha de nacimiento se escribe a mano (`AAAA-MM-DD`).
- No hay botón de emergencia ni mapas: son de sprints posteriores.
- El panel está pensado para pantalla de computador y no es responsive.
- Los datos viven en emuladores y se borran al reiniciar; la demo con datos compartidos requiere Firebase real (sección "Plan para la demo").
- App Check está apagado hasta pasar a Firebase real; el texto legal LOPDP del registro es provisional.

**Pruebas como evidencia:** 257 tests en `mobile`, 60 en `admin` y 167 en `functions` (186 con T1, sin re-ejecutar por el asistente), con typecheck limpio en los tres paquetes. Cada historia tiene su fila en el backlog (`D:\Proyecto5to\Docs\BacklogRUNCTY_Final.xlsx`) y su caso de uso en `D:\Proyecto5to\Docs\Entregables`.

## 15. Bitácora del 2026-11-10 (tarde): entregables finales, diagramas y renombrado

### 15.1 Carpeta de entregables finales

`D:\Proyecto5to\Docs\Entregables\Final` (reemplaza a lo que había en `Entregables` para la entrega):

- **CSV** (separador `;`, UTF-8 con BOM, generados desde `RequsitosExcelFInal.xlsx`, que no se modificó): `Requisitos de usuario - RUNCTY.csv` (17 UR), `Requisitos funcionales - RUNCTY.csv` y `Requisitos no funcionales - RUNCTY.csv` (26 RNF).
- **Backlog:** por pedido del usuario no está en `Final`. El CSV queda en `Entregables\CSV\Backlog RUNCTY.csv`, junto con `Requisitos RUNCTY.csv`, una versión que unía UR, RF y RNF en un solo archivo y que se descartó.
- **PDF:**
  - `Diagrama de contexto - RUNCTY.pdf`: el de siempre.
  - `Diagramas de casos de uso - RUNCTY.pdf`: 41 páginas, primero el diagrama general y luego los 40 específicos, en el orden de las épicas.
  - `Diagrama de clases - RUNCTY.pdf`: la versión de **22 clases** (la presentada).
- **Los PDF llevan los diagramas como imagen a 250 dpi, no en vectorial.** La conversión de EMF a PDF con Word se colgó sin dar error, así que se armaron con Python (`reportlab`).

### 15.2 Modelo de Enterprise Architect (`RunCty.eap`)

- **Casos de uso:** nuevo paquete "Casos de uso generales" con el diagrama "Diagrama de casos de uso general": 26 casos de uso (uno por épica) y solo los **4 actores** del modelo (Corredor, Administrador, Representante de club y Sistema). Se reutilizan los elementos del paquete "Actores"; no se creó ningún actor nuevo.
- **Clases:** en Vista Lógica → "Modelo de dominio RUNCTY" → "Diagrama de clases RUNCTY". Quedó la versión de 22 clases. Se probaron otras tres y se descartaron; los respaldos están en `D:\Proyecto5to\Docs\Respaldos_EA`:
  - **41 clases:** se veía recargada y con cajas solapadas (no se conservó).
  - **13 clases según el código** (`RunCty_clases_segun_codigo_13.eap`): demasiado simple.
  - **43 clases completo** (`RunCty_clases_completo_43.eap`): verde = programada y gris = pendiente. Con estilo de línea ortogonal (`TREE=OS` en los `DiagramLinks`), que es lo que hizo legibles las líneas. Se descartó porque el usuario prefirió la versión presentada.
- **Scripts para regenerar:** `D:\Proyecto5to\Docs\Respaldos_EA\scripts` (`plan.py`, `cls2.py` a `cls4.py`, `build.ps1`, `pdf.ps1`, `exp.ps1`, `rename.js`). `cls2.py` genera el plan del diagrama de 22 clases, `build.ps1` lo crea en EA por COM y exporta EMF, y `pdf.ps1` quedó obsoleto (usar `reportlab`).
- **Truco de EA:** abrir el modelo con `SQLQuery` es instantáneo. Recorrer colecciones COM (`Packages`, `Diagrams`) tarda minutos y a veces parece colgado.

### 15.3 Informe del coach (`Resultados Grupo 8 - Evaluacion requisitos y UML.md`, en Descargas)

Madurez global: "En progreso (alto)". Semáforo: verde en RF, RNF y casos de uso; amarillo en UR, contexto y clases.

- **Prioridades que pide:**
  1. Cerrar la trazabilidad UR → RF: hay 17 UR frente a 24 módulos y unos 12 RF sin UR de origen (RF-06, 08, 11, 13, 14, 16, 18 a 23). Los RF no traen columna de UR (el backlog sí la tiene en Comentarios).
  2. Alinear el diagrama de clases con los requisitos: faltan unas 15 entidades como clase (Preferencia, Credencial, Valoración, Fuente, Reto, Membresía, Inscripción, Sesión, etc.) y casi no hay operaciones.
  3. Corregir el actor "Sistema" en los casos de uso, los `«include»`/`«extend»` y pasar el contexto de círculo (DFD) a caja negra.
- **Otros hallazgos:** varios UR describen la UI en vez de la necesidad; UR-16 es arquitectura; los sub-RF no tienen responsable ni prioridad y la columna Estimación está vacía; el encabezado de los RNF dice ISO 9126 pero los atributos son de 25010.
- **Decisiones abiertas:**
  - "Sistema" como actor: el Excel de requisitos (fuente de verdad) lo usa ("Actor: Sistema"), y el usuario pidió no agregar actores. Quitarlo cambia el modelo.
  - El ingeniero pide que las clases del diagrama estén programadas. Ver 15.4.

### 15.4 Diagrama de clases frente al código

El código modela el dominio con `interface`/`type` y funciones puras, sin `class` (solo `DomainError` y dos repositorios de infraestructura). De las clases del diagrama, **13 existen en el código** (Sprints 1 y 2) y **30 faltan** (Sprints 3 a 5).

- **Atributos que no coinciden del todo:** Usuario (el código tiene `uid`, `cityId` y `role`; los atributos están en inglés), Ciudad (la app móvil solo tiene `id`, `name` y `province`; el panel sí tiene `type` y `coverage`), IndiceSeguridad (en el código es un mapa por franja con `score` y `level`, sin `actualizadoEn`) y Rol (el código agrega `description` y `system`).
- **Decisión del usuario:** dejar el diagrama presentado (22 clases) y no programar las clases faltantes todavía. Si el ingeniero insiste en el código, las opciones son (A) ajustar el diagrama a lo implementado o (B) programar las 30 pendientes, que sin pantallas ni lógica serían código zombie.

### 15.5 Renombrado de tipos del dominio a español (sin commitear)

Se renombraron **solo los nombres de tipo**, con un renombrado por símbolos de TypeScript (`ts-morph`), porque un buscar-y-reemplazar habría cambiado mensajes de error y logs que contienen palabras como "Route". No se tocaron campos de Firestore, nombres de funciones ni textos de la interfaz.

| Antes | Ahora | Antes | Ahora |
| --- | --- | --- | --- |
| `UserProfile` | `Usuario` | `Segment` | `Tramo` |
| `SportProfile` | `PerfilDeportivo` | `TimeSlot` (admin) | `FranjaHoraria` |
| `Preferences` | `PreferenciaUsuario` | `RiskFactor` (admin) | `FactorDeRiesgo` |
| `NotificationPreferences` | `PreferenciaNotificaciones` | `RouteSlotSafety` | `IndiceSeguridadRuta` |
| `RoleRecord` (functions) | `Rol` | `SegmentSlotSafety` | `IndiceSeguridadTramo` |
| `City` | `Ciudad` | `Route` | `Ruta` |

- **Alcance:** 45 archivos en `mobile`, `admin` y `functions`, 201 líneas cambiadas y 201 quitadas.
- **Verificación:** typecheck limpio en los tres paquetes; Jest en `mobile` con 257 tests y Vitest en `admin` con 60 y en `functions` con 186 (47 omitidos). Falla `functions/test/rules/firestore.rules.test.ts` porque necesita un emulador de Firestore aparte; falla igual sin el renombrado.
- **Pendiente:** los cambios están **sin commitear** en la rama `feat/hardening-and-polish`. No se probó la app en el celular después del renombrado (son solo tipos, no debería notarse).

### 15.6 Entorno y problemas del día

- **"Unable to load script" en el celular:** los túneles `adb reverse` se pierden cuando se mueve o se reconecta el cable USB. Solución: `for P in 8082 9099 8080 5001 9199; do adb reverse tcp:$P tcp:$P; done` y relanzar la app (`adb shell monkey -p ec.utpl.runcty -c android.intent.category.LAUNCHER 1`).
- **App sin backend:** Docker Desktop estaba apagado, así que `docker compose up` fallaba. Hay que encenderlo y esperar a que `runcty-seed` quede en `Exited (0)`.
- **Sesión vieja en el celular:** tras reiniciar los emuladores salía `auth/invalid-refresh-token` en el log; la app lo maneja y vuelve al inicio de sesión. El corredor hay que crearlo de nuevo.
- **Hook de revisión (`gentle-ai review`):** se omitió, según la regla del repo de no usar esos flujos. Para quitar el aviso: `gentle-ai review mode disable --scope clone --cwd D:\RUNCTY` (decisión del usuario).
- **Al terminar la sesión** se apagaron Metro, los túneles `adb`, los contenedores de Docker y Docker Desktop.

### 15.7 Pendientes que quedan

1. Commitear (o descartar) el renombrado de tipos.
2. Decidir con el ingeniero qué pide exactamente para el diagrama de clases (15.4) y cómo tratar el actor "Sistema" (15.3).
3. Trazabilidad UR → RF: agregar la columna de UR a los RF y redactar los UR que faltan (prioridad 1 del coach).
4. Cambios menores del coach: encabezado de los RNF (9126 → 25010) y contexto como caja negra.
5. Lo ya pendiente de las secciones 12 y 14 (demo con Firebase real, pulido T2 y T3, marcar "Terminado" en el backlog los Sprints 1 y 2).

## 16. Migración a backend Django + frontend React Native y Angular (2026-11-11 y 2026-11-12)

> **Reemplazada en parte el 2026-11-13 (sección 17):** el frontend ya no son dos aplicaciones (React Native + Angular), sino **una sola en Angular + Ionic + Capacitor**. Las decisiones del backend, el contrato de la API y la bitácora de esta sección siguen vigentes; las tareas T5 a T7 de la tabla 16.2 se sustituyen por S3 a S6 de la sección 17.

**Leer primero** `odd/tasks/django-angular-architecture.md`: tiene el objetivo, las decisiones, el contrato de la API, los hallazgos de la auditoría del 2026-11-11 y la lista de tareas. Esta sección solo resume el estado.

### 16.1 Decisiones del usuario

- La arquitectura se presenta en la universidad como **backend + frontend**, en dos carpetas de la raíz:
  - `backend/`: API REST en Django + Django REST Framework. Habla con los servicios de Google mediante `firebase-admin`. No usa base de datos SQL ni el ORM de Django: Firestore sigue siendo el almacén de datos.
  - `frontend/mobile`: la app en React Native (Expo).
  - `frontend/web`: el panel de administración en Angular, que reemplaza al de Next.js.
- React Native y Angular nunca se mezclan en una misma aplicación.
- Django **reemplaza** a las Cloud Functions. Las carpetas `functions/` y `admin/` se eliminan cuando su lógica y sus pruebas estén portadas (regla de no código zombie).
- Firebase Auth queda en los clientes solo para iniciar sesión; el ID token viaja como `Bearer` y la API lo verifica en cada petición con `check_revoked=True`.
- Los modelos del dominio son clases de Python en `domain/models.py` de cada app, con los nombres del diagrama de clases (`Usuario`, `Rol`, `Ciudad`, `Ruta`, `Tramo`...). Los atributos y los campos de Firestore siguen en inglés.
- El backend usa la misma organización por capas que el resto del proyecto: `domain` / `application` / `infrastructure` / `presentation` en cada app (`health`, `identity`, `roles`, `users`, `shared`).

### 16.2 Estado de las tareas

| Tarea | Estado | Evidencia |
| --- | --- | --- |
| T1 Estructura del backend | Hecha | Commit `e367449`. `pytest` con 80 pruebas en verde, `ruff` limpio y `manage.py check` limpio (verificado el 2026-11-11). |
| T2 Usuarios, roles y cuenta | Hecha | Commits: límite de intentos con token rechazado (`002dbe4`), roles y asignación de rol (`df41091`), registro, perfil propio, perfil deportivo y preferencias (`488674c`), búsqueda de usuarios y eliminación de cuenta (`04e66b3`). Verificado el 2026-11-12 sobre `04e66b3`: `pytest` con 382 pruebas en verde, `ruff check` y `ruff format --check` limpios, y `manage.py check` sin avisos. |
| T3 Ciudades, rutas e índice de seguridad | Pendiente | |
| T4 Seed en Python, Docker con la API, reglas de Firestore cerradas, eliminar `functions/` | Pendiente | |
| T5 Mover la app a `frontend/mobile` y conectarla a la API | **En curso** | Traslado hecho el 2026-11-12 en la rama `feat/frontend-folder` (ver 16.5). Falta conectar la app a la API de Django: hoy sigue usando Firestore y las Cloud Functions. |
| T6 Panel en Angular en `frontend/web`, eliminar `admin/` | Pendiente | |
| T7 Pulido de la app móvil | Pendiente | |
| T8 Sprint 3 sobre la arquitectura nueva | Pendiente | |
| T9 Documentación y verificación final | Pendiente | |

### 16.3 Cómo retomar

1. Abrir la sesión en `D:\RUNCTY`. La rama `feat/django-angular-architecture` ya está integrada en `main` (16.5); el trabajo nuevo sale de `main` en una rama propia.
2. Revisar `git status`: el árbol debe estar limpio.
3. Comprobaciones del backend, desde `backend/` y con el entorno `.venv`: `python -m pytest -q`, `ruff check .`, `ruff format --check .` y `python manage.py check` (con `DJANGO_DEBUG=true`). La instalación está explicada en `backend/README.md`.
4. Seguir con T3. Mientras dure la migración, la app y el panel actuales (`mobile/`, `admin/`, `functions/`) siguen funcionando con los emuladores como describe la sección 12.

### 16.4 Notas

- **Para los clientes (T5 y T6):** eliminar la cuenta con un inicio de sesión de más de 5 minutos devuelve el código nuevo `recent-sign-in-required` (400), que la app y el panel deben traducir. La búsqueda devuelve `role: null` cuando el usuario no tiene rol, y rechaza con `invalid-cursor` un cursor que contenga `/`.
- `backend/.env.example` no existe: el asistente no puede crear archivos `.env*`. Se crea a mano siguiendo `backend/README.md`.
- La imagen de Docker del backend todavía no se construyó.
- Python 3.10 es la versión instalada en el equipo; las librerías de Google avisan que ya no tiene soporte. Pasar a 3.12 queda para el despliegue.
- La ruta `D:\RUNCTY\frontend\mobile` tiene 25 caracteres, el límite documentado para compilar Android en Windows. Si la compilación nativa falla, usar `frontend\app`.

### 16.5 Bitácora del 2026-11-12

**Pull request #1, integrado en `main`**

- Enlace: https://github.com/jhordycamacas/RUNCTY/pull/1 (commit de integración `f467fba`).
- Contenido: 14 commits de las ramas `feat/hardening-and-polish` y `feat/django-angular-architecture`: Docker con emuladores, correcciones de seguridad de las Cloud Functions, renombrado de tipos a español, backend de Django (T1 y T2) y documentación.
- Fue un solo PR de unas 7.900 líneas en 169 archivos, por pedido del usuario (excepción de tamaño aceptada por el dueño del repositorio).
- **Dónde verlo como evidencia:** en GitHub, pestaña "Pull requests" → **"Closed"**. La lista muestra por defecto solo los abiertos, y un PR integrado aparece entre los cerrados, con la etiqueta "Merged".
- Para ese PR solo se volvieron a ejecutar las pruebas del backend (382 en verde). Las de `mobile`, `admin` y `functions` no se volvieron a correr en ese momento.

**Estructura de carpetas: `backend/` y `frontend/`**

- El usuario pidió que las dos aplicaciones cliente vivan dentro de `frontend/`, para que se entienda que ambas son el frontend:
  - `frontend/mobile`: la app en React Native. **Trasladada el 2026-11-12** desde `mobile/`, que ya no existe.
  - `frontend/web`: el panel en Angular. Todavía no existe; se crea ahí directamente (T6).
- El panel actual en Next.js sigue en `admin/` y **no se mueve**: se elimina cuando Angular lo reemplace. `functions/` también sigue en la raíz hasta que termine T4.
- El traslado movió la carpeta completa (incluye `node_modules`, `android/` y los `.env`) y corrigió las rutas en `package.json` de la raíz, `docker-compose.yml`, `.dockerignore`, `README.md`, `docs/manual-instalacion-android.md` y un comentario de `admin/src/app/globals.css`. El código de la app no cambió.
- **Verificado desde `frontend/mobile`:** typecheck sin errores, 35 suites y 257 pruebas en verde, lint limpio.
- **No verificado:** la compilación nativa de Android desde la ruta nueva y la app en el celular. La carpeta `android/` conserva cachés generadas con la ruta vieja; si `npm run android` falla, borrar `frontend/mobile/android/app/.cxx`, `frontend/mobile/android/.gradle` y `D:\.rcx` y volver a compilar.
- **Cambio para el día a día:** Metro se arranca ahora desde `frontend/mobile` (ya no desde `mobile`). La app instalada en el celular no hay que reinstalarla solo por el traslado.
- **Rutas en este documento:** las secciones 9 a 15 son bitácoras anteriores y nombran archivos como `mobile/src/...`; hoy están en `frontend/mobile/src/...`.

**Eliminar la cuenta en la API de Django**

- `DELETE /users/me` exige haber iniciado sesión hace menos de 5 minutos. Si la sesión es más vieja, responde con el código `recent-sign-in-required`.
- No es un comportamiento nuevo para el usuario: la app ya pide la contraseña actual antes de eliminar la cuenta, y eso renueva la sesión. Solo cambió el nombre del código de error (antes era un error genérico).
- Pendiente (T5 y T6): que la app y el panel muestren un mensaje en español al recibir ese código.

**Aviso del hook de `gentle-ai review`**

- El hook pide una revisión al terminar cada turno. No se ejecuta, por la regla del usuario de no usar ese flujo en este repositorio.
- Para que el aviso deje de aparecer (decisión del usuario): `gentle-ai review mode disable --scope clone --cwd D:\RUNCTY`.

## 17. Un solo frontend: Angular + Ionic + Capacitor (2026-11-13)

**Leer primero** `odd/tasks/single-frontend-ionic.md`: tiene las decisiones, las formas de respuesta de la API, las notas de cada tarea y la evidencia. Esta sección resume el estado.

### 17.1 Qué se decidió y por qué

El ingeniero pidió que la solución sea **un solo frontend en Angular + Ionic, que sirva web y móvil**, como el proyecto de referencia `C:\xampp\htdocs\seguimiento_retos` (Django + Angular 22 + Ionic + Capacitor + MySQL). Ese proyecto no mezcla React: lo "mixto" es Angular + Ionic + Capacitor, donde un solo código produce la web y la APK de Android (Capacitor empaqueta el build en un WebView).

**Arquitectura vigente (no cambiarla sin decisión del usuario):**

```
RUNCTY/
├── backend/     Django + DRF. Única pieza de servidor. Se conecta a los servicios de
│                Google (Firebase Auth, Firestore, Storage, FCM) con firebase-admin.
│                Sin base de datos SQL y sin ORM: Firestore es el almacén.
└── frontend/    UNA app Angular 22 + Ionic 9 + Capacitor 8 (web y Android).
    ├── /app     Área del corredor: mobile-first, pestañas abajo.
    └── /admin   Área del administrador: desktop-first, menú lateral (ion-split-pane).
```

- Las dos áreas son **lazy** y pueden tener diseño propio (variables `.area-runner` y `.area-admin` sobre los tokens compartidos). Lo compartido es el cliente de la API, la autenticación, los componentes base y los tokens.
- Firebase Auth se usa en el cliente **solo** para iniciar sesión, cerrar sesión, reautenticar, recuperar contraseña y verificar correo. El ID token viaja a Django como `Bearer`; el rol y los permisos salen de `GET /me`, nunca solo del cliente.
- React Native, Expo y Metro **dejan de existir**. Flujo nuevo: `npm start` (navegador), `ionic cap run android -l --external` (celular con recarga en vivo), `npx cap sync android` y Gradle para reinstalar.
- Se elimina al final (S6), solo cuando haya paridad: `frontend/mobile/`, `admin/` y `functions/`.

### 17.2 Estado de las tareas

| Tarea | Estado | Evidencia (commits en `feat/backend-cities-routes`) |
| --- | --- | --- |
| S1 Backend: ciudades, rutas e índice de seguridad | **Hecha** | `1caa6bd`, `6d5a2e2`, `57b92b4`, `48c79d6`. Apps `cities` y `routes` con todos los endpoints del contrato, el índice recalculado en una transacción y las pruebas portadas de Vitest. |
| S2 Backend: seed en Python y Docker con la API | **Hecha** | `5da6a1f`, `630a903`, `816fe36`. `manage.py seed` genera los mismos 52 documentos que el seed de TypeScript (comparado contra los emuladores reales); compose con servicios `api` y `seed`, `cap_drop ALL`, `no-new-privileges` y límites. Las imágenes **no se construyeron** (Docker apagado). |
| S3 Frontend: base | **Hecha** | `4488be5`, `2b9d074`, `c690d1f`, `0d3a951`, `1dd08fa`. Angular + Ionic + Capacitor, cliente de la API con interceptor, mapa de errores a español, login con Firebase, guards (`canMatch`), layouts de las dos áreas, tokens claro/oscuro con Inter local, CORS del backend para Ionic y Capacitor, plataforma Android y APK de depuración. |
| S4a Área del corredor: cuenta | **Hecha** | `add05a1`, `439b6fa`, `f5f3f83`. Registro con consentimiento, login, recuperar contraseña, correo sin verificar con "Reenviar correo", perfil, perfil deportivo, preferencias, cambiar contraseña, eliminar cuenta (reautenticación y `recent-sign-in-required`), selector de ciudad con búsqueda y fecha en tres campos. |
| S4b Área del corredor: rutas | **Hecha** | `21f094c`, `00920a1`, `518e0be`, `464c06a`. Pestaña Rutas con filtros, tarjeta con "Factor principal", detalle con segmentos y factores, "Abrir en Google Maps", rutas recomendadas en Inicio y botón SOS (confirma y abre `tel:911`). |
| S5a Área de admin: usuarios, roles y ciudades | **Hecha** (2026-11-17) | En la rama `feat/admin-users-roles-cities`: `fe15884` (specs), `b3b2a16` (roles), `83c9d18` (usuarios), `23c62d0` (selector de tema), `276d66d` (ciudades y zonas). Cubre RF-01-2, RF-02-1 a RF-02-4 y RF-04-1 a RF-04-4 (specs en `specs/01-gestion-de-usuarios.md`, `specs/02-roles-y-permisos.md` y `specs/04-ciudades-y-zonas.md`); se eliminó la página provisional "no disponible". |
| S5b Área de admin: rutas, segmentos, franjas y factores | **Hecha** (2026-11-16) | En la rama `feat/admin-routes-sprint2`: `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`. La gestión de rutas del Sprint 2 (RF-05-1 a RF-05-8 y RF-07-1 a RF-07-11; Jira RUN-14, RUN-28, RUN-73 a RUN-79 y RUN-87 a RUN-96) vive en `/admin/rutas` del frontend único: lista con rutas inactivas, formulario de ruta, detalle con tramos, franjas, factores de riesgo y resumen de seguridad. Detalle y evidencia en `odd/tasks/admin-routes-sprint2.md`. |
| S6 Limpieza, Android y documentación | Pendiente | Borrar `frontend/mobile`, `admin/`, `functions/` y `scripts/seed-emulator.ts`; reglas de Firestore cerradas (deny-all); verificar web y APK; reescribir la sección 9, el README y el manual de Android. |

**Pruebas observadas el 2026-11-13 (las ejecuté yo sobre el último commit):** backend 753 pruebas en verde y `ruff check` limpio; frontend 347 pruebas en verde (49 archivos), `ng build` correcto (paquete inicial de 1,12 MB, 238 kB transferidos). La APK de depuración compiló al cerrar S4b (5,4 MB).

### 17.3 Decisiones que los clientes ya siguen

- La API devuelve 201 `{"id"}` al crear; 204 en PUT/DELETE de rutas, tramos, franjas y factores; la ciudad se devuelve completa en POST (201) y PATCH (200). Los campos opcionales llegan como `null`.
- Códigos nuevos de ciudades: `invalid-city-name`, `invalid-city-province`, `invalid-city-type`, `invalid-city-location`, `invalid-coverage`, `invalid-parent-city` y `city-exists` (409). Una zona solo puede colgar de una ciudad, no de otra zona.
- Una ruta inactiva responde 404 `route-not-found` a quien no tiene `routes.manage`. El nivel de seguridad lo ve todo usuario con sesión; las franjas y los factores solo con `routes.manage`.
- `GET /cities` es público, pero un token enviado y malo recibe 401.
- Un repositorio cubre todo el agregado de la ruta (ruta, tramos, franjas, factores), porque cada cambio necesita una sola transacción de Firestore.
- Eliminar la cuenta exige un inicio de sesión reciente: el cliente reautentica y renueva el token antes de `DELETE /users/me`.
- Las preferencias de apariencia y tamaño de letra sí se aplican (`data-theme` y `--rc-font-scale`); notificaciones y privacidad de ubicación se guardan pero están marcadas "Próximamente". La unidad (km/millas) se aplica en distancias y elevaciones; el ritmo sigue en min/km.
- Los controles de formulario tienen un borde de contraste 3:1 y el tema oscuro tiene superficies distinguibles (hay una prueba que lo verifica).
- Rutas en el admin (S5b): **no hay endpoint del índice de seguridad**. El backend lo recalcula en cada cambio de tramos, franjas o factores, y el admin lo lee siempre de `GET /routes/{id}` (recarga el detalle tras cada cambio). El cliente nunca calcula el puntaje.
- Un factor de riesgo tiene tipo, severidad, descripción y una **ventana diaria opcional** (`startTime`/`endTime`, ambas o ninguna = todo el día). Las fechas de vigencia (`validFrom`/`validTo`) son de las **franjas**, no de los factores.
- El admin usa campos nativos (`select`, `textarea`, `input type="time"` y `type="date"` en `shared/ui`) en lugar de `ion-select`, `ion-textarea` y los selectores de Ionic: Ionic entra entero al paquete inicial y rompía el presupuesto de 1,2 MB.
- Los campos opcionales vacíos **se omiten** del cuerpo de la petición; nunca se envían como `null` (un PUT sin el campo lo borra).
- Usuarios en el admin (S5a): `GET /users` se pagina con `nextCursor`; si el cursor es inválido (`invalid-cursor`) se descarta y se vuelve a buscar. La lista no muestra la identificación (la API tampoco la devuelve). Cambiar el rol (`PUT /users/{uid}/role`) pide confirmación y solo se ofrece con `roles.manage`; `last-admin` y `self-lockout` se muestran en español.
- Roles en el admin (S5a): el catálogo de permisos no es un endpoint; el cliente lo nombra y agrupa por área en `admin/roles/domain/role.ts`. Los roles del sistema no se pueden eliminar (no tienen botón). Al editar un rol, el aviso dice a cuántos usuarios se les actualizó el acceso (`syncedUsers`).
- Ciudades en el admin (S5a): una zona se crea desde su ciudad ("Agregar zona") o eligiendo el tipo; el identificador y el tipo no se pueden cambiar. Eliminar una ciudad con zonas responde 400 `city-has-zones`.
- Los errores de los campos de texto de Ionic (`ion-input`) no se mostraron de forma fiable en el filtro de usuarios; ahí los avisos de formato van en un `app-notice`. Los formularios de roles, rutas y ciudades siguen usando el error del campo.
- El menú del admin tiene un selector de tema (Según el sistema, Claro, Oscuro) que guarda la preferencia de apariencia del usuario con el caso de uso de preferencias.

### 17.4 Qué NO está verificado

- **Nadie ha abierto el frontend nuevo en un navegador real** ni lo ha probado contra los emuladores y Django. La extensión de Chrome falló en todas las sesiones, así que todo está validado con pruebas unitarias y compilación. Es lo primero que hay que hacer al retomar.
- **No se probó en el celular:** que `tel:911` abra el marcador de Android, que el enlace de Maps salga del WebView ni cómo se ve el botón SOS con títulos largos.
- Angular 22 trabaja sin zone.js (zoneless); la interacción con Ionic en ejecución real no se ejercitó.
- Docker: solo se validó `docker compose config`; las imágenes `api` y `seed` no se construyeron ni se ejecutaron. **Actualización 2026-11-16:** el stack levantó sano y la API de rutas del admin se recorrió entera con `curl`/`fetch` (ruta, tramo, franjas, solape, factores, recálculo y borrados); **Actualización 2026-11-17:** las pantallas de `/admin/rutas` se recorrieron en Chrome (22 de 22 pasos) y se corrigió el error del toast (`646deb8`); el tema por defecto pasó a claro (`5ce08cd`).
- Casi todas las pruebas del frontend se escribieron junto con el código, sin ver antes el fallo (RED); solo se vio RED en el backend de S1 y S2 y en el mapa de errores.

### 17.5 Pendientes y avisos

- **Aviso de npm:** `npm audit` marca 4 avisos altos en `@grpc/grpc-js`, que entra con el paquete `firebase` (parte de Firestore, que el cliente no usa). No se bajó la versión.
- **Java:** el `JAVA_HOME` del equipo apunta a JDK 17, pero Capacitor 8 exige JDK 21. Para compilar la APK hay que apuntarlo a `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot`. El detalle está en `frontend/README.md`.
- `backend/README.md` dice `cp .env.example .env`, pero `backend/.env.example` no existe en git (el asistente no puede crear archivos `.env*`). Hay que crearlo a mano o corregir esa línea en S6.
- El primer commit del frontend (`4488be5`) no compila solo, porque `src/app` llega en `c690d1f`; los commits se dividieron por capa.
- Las fuentes Inter en TTF suman unos 1,3 MB a la APK; se pueden pasar a WOFF2.
- Siguen abiertos los puntos de 14.2 (SEC-01 App Check, SEC-04, SEC-07, SEC-10) y la auditoría de UX del panel, que S5 aplica en el área de admin.
- Las secciones 9 a 15 describen la arquitectura anterior y nombran archivos como `functions/src/...` o `admin/src/...`; se reescriben en S6.
- El aviso del hook de `gentle-ai review` sigue apareciendo al terminar cada turno y se ignora por la regla de este repositorio.

### 17.5b Resumen del panel y rediseño (2026-11-17)

- **Resumen** es la primera sección de `/admin` (permiso `admin.access`) y la pantalla de aterrizaje. Muestra analíticas reales de la app móvil: usuarios, altas por semana, rutas por dificultad, superficie y ciudad, nivel de seguridad por ruta (peor nivel de sus franjas, nunca «segura» o «insegura»), perfil deportivo y preferencias. Specs: `specs/transversal/panel-de-administracion.md` y `specs/transversal/sistema-de-diseno.md`.
- **Endpoint** `GET /api/v1/admin/summary` (app `backend/apps/summary`): solo agregados, sin datos personales; cada bloque (`users`, `routes`, `cities`) llega solo si el usuario tiene `users.read`, `routes.manage` o `cities.manage`, si no es `null`. Lecturas acotadas (5000 documentos; 2000 rutas) y `truncated` avisa si se alcanzó el tope.
- **No inventar cifras:** entrenamientos, alertas SOS y eventos no existen todavía; la pantalla muestra fichas «Próximamente» sin números. El correo verificado no se cuenta porque vive en Auth, no en Firestore.
- **Diseño:** lienzo rosado suave, barra lateral flotante con marca y tarjeta de cuenta, fichas y columnas en pasteles (rosa, durazno, cielo, lavanda, menta) con tokens claro y oscuro en `frontend/src/theme/` (la tinta sobre cada pastel cumple 4,5:1 en `tokens.spec.ts`). Gráficos propios sin librería (barras, barra apilada, barras semanales, progreso) con alternativa de texto.
- **Ojo en desarrollo:** recrear el contenedor `firebase` pierde los datos de los emuladores; se vuelven a cargar con `python manage.py seed` apuntando a `127.0.0.1:8080` y `:9099`.

### 17.7 Specs (SDD)

- Viven en `specs/` y se organizan **por capacidad, no por sprint**: una spec por épica del backlog (`01-gestion-de-usuarios.md` a `26-preferencias-de-usuario.md`, que cubren los 153 sub-requisitos `RF-XX-N`) y cuatro transversales en `specs/transversal/` (RNF, arquitectura, sistema de diseño, panel de administración). El índice, la leyenda de estados y la matriz de trazabilidad están en `specs/README.md`.
- Flujo: **spec primero** -> prueba que falla (RED) -> implementación (GREEN) -> marcar el criterio con evidencia -> anotar en `odd/tasks/<feature>.md`. Si cambia el comportamiento, primero se cambia la spec.
- Estados honestos: `Hecha` (todos los criterios con evidencia), `Parcial` (implementada con criterios abiertos o sin verificar en navegador o celular) y `Pendiente`. Al 2026-11-17: 9 Hecha, 35 Parcial y 109 Pendiente.

### 17.6 Cómo retomar

1. Abrir la sesión en `D:\RUNCTY` y leer `odd/tasks/single-frontend-ionic.md`.
2. Recuperar el trabajo pausado de S5a, si sirve: `git stash list` muestra "wip S5a admin users roles". Se puede aplicar con `git stash apply` (o rehacerlo). Está incompleto: no se sabe si compila ni si sus pruebas pasan.
3. Comprobaciones del backend (desde `backend/` con `.venv`): `python -m pytest -q`, `ruff check .`, `ruff format --check .`, `DJANGO_DEBUG=true python manage.py check`.
4. Comprobaciones del frontend (desde `frontend/`): `npx.cmd ng test --watch=false`, `npx.cmd ng lint`, `npx.cmd ng build`.
5. Levantar todo en local: emuladores y API con `docker compose up -d --build` (Docker Desktop encendido) o sin Docker con `npm run emulators`, `npm run seed` y `npm run api`; el frontend con `npm start` desde `frontend/`. Usuario de prueba del emulador: `admin@runcty.dev` / `Admin123!`.
6. Seguir con S5a (usuarios, roles y ciudades del admin) y S6 (limpieza). S5b (rutas) está hecha en `feat/admin-routes-sprint2`; subirla y abrir el PR lo decide el usuario.
7. **Antes de borrar `frontend/mobile`, `admin/` y `functions/`:** abrir el frontend nuevo en un navegador y recorrer el registro, el login, las rutas y el admin.
