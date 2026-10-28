# CONTEXTO DEL PROYECTO — RUNCTY

> Documento de contexto para retomar el desarrollo en cada sesión. Leer completo antes de trabajar.
> Fuentes originales: `D:\Proyecto5to\DocumentosContexto` (Acta de Constitución, Documento de Visión DCV-VIS v1.0.0, Excel de requisitos, PROYECTO 3.pdf, apuntes de la reunión con Gacelas).

## Reglas de trabajo en el repositorio

- **Autoría:** todo commit y push debe aparecer únicamente a nombre del usuario `jhordycamacas`. Nunca agregar `Co-Authored-By`, ni mencionar a Claude o Anthropic en commits, PRs o archivos.
- Commits con formato Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`...).
- Repositorio: https://github.com/jhordycamacas/RUNCTY (clon local: `D:\Proyecto5to\RunCity\RUNCTY`).

## 1. Qué es

Reto académico de la **UTPL** (materias Fundamentos de Ingeniería de Software e Ingeniería Web). El club **Gacelas Running Team (Loja, Ecuador)** planteó un problema y varios grupos de estudiantes compiten por proponer y desarrollar la mejor solución. Nuestro grupo quiere ganar el reto.

- Inicio: semana del 12 al 18 de octubre de 2026 (levantamiento de requisitos).
- Fase actual: construcción del backlog, definición de épicas y sprints a partir del Excel de requisitos, y preparación del repositorio.
- Docente tutor: Ing. Segundo Raymundo.

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

### Requisito operativo

Las Cloud Functions requieren el **plan Blaze** de Firebase (pago por uso, con tarjeta registrada). Tiene una cuota gratuita amplia; para el piloto en Loja el costo esperado es prácticamente cero.

## 10. Decisiones abiertas y contradicciones (resolver con el equipo o el cliente)

1. ~~**Backend**~~: resuelto en la sección 9 (Firebase BaaS + Cloud Functions).
2. **Alcance del MVP:** el Acta difiere el pánico, los contactos y las alertas; la Visión y el Excel los marcan como "Debe". Hay que definir qué entra en el primer sprint y qué se muestra el día de la presentación.
3. **Generar o recomendar rutas:** falta decidir entre ordenar un catálogo predefinido y generar rutas nuevas. Tampoco están definidos el algoritmo ni la ponderación del índice de seguridad.
4. **Canal de la alerta de pánico:** push, SMS o WhatsApp.
5. **Menores de edad:** implica consentimiento parental según la LOPDP.
6. **Fuentes de datos de seguridad:** falta definir quién carga los datos y con qué periodicidad (administrador de Gacelas, clubes, reportes comunitarios).
7. **Plataforma:** el Acta deja abierta la elección entre móvil y web; la Visión decide solo móvil.

## 11. Estado actual

- [x] Repositorio creado con README.
- [x] CONTEXTO.md creado.
- [x] Arquitectura y stack definidos (sección 9).
- [ ] Diseño de UI/UX.
- [ ] Backlog: épicas, historias de usuario y sprints.
- [ ] Estructura inicial del proyecto.
