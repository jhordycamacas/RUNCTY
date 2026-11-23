# Configuración del sistema

> Spec de capacidad · Decisión del producto (2026-11-22): «nada hardcodeado, todo configurable» · **Hecha**: backend, pantalla de administración y formularios del cliente que leen los parámetros

| Campo | Valor |
| --- | --- |
| Épica | Sin épica del backlog: transversal a EP-04, EP-05, EP-06, EP-07, EP-08, EP-09, EP-01 y EP-26 |
| Requisitos | Ninguno del Excel; sale de la decisión del dueño del producto (`odd/tasks/todo-configurable.md`) |
| Prioridad | Debe tener |
| Permiso | `settings.manage` (lo incluye el rol del sistema `admin`) |
| Estado | `Hecha`: API, dominio, semilla, reglas de Firestore, la sección «Configuración» del panel y los formularios del cliente que leen los parámetros |
| Dependencias | [EP-07](07-evaluacion-de-seguridad.md), [EP-08](08-incidentes-y-fuentes.md), [EP-06](06-puntos-de-apoyo.md), [EP-09](09-rutas-seguras.md), [EP-05](05-catalogo-de-rutas.md), [EP-04](04-ciudades-y-zonas.md), [EP-01](01-gestion-de-usuarios.md) |

## Propósito

Los números que gobiernan los cálculos (penalización por severidad, umbrales de nivel, ventana de incidentes, radios, límites de una ruta, rangos del perfil deportivo, tolerancia de distancia, zona horaria y país) viven en un único documento editable por el administrador, no en constantes del código. Cambiar uno se aplica sin desplegar. Cambiar lo que afecta al índice de seguridad recalcula todas las rutas.

## Alcance

**Incluye**

- Un documento `systemSettings/global` con todos los parámetros, validados en el dominio con tipo y límites.
- `GET /settings` (cualquier usuario con sesión) y `PUT /settings` (`settings.manage`).
- Recalcular el índice de todas las rutas al guardar parámetros que lo afectan y bajo demanda (`POST /admin/recalculate-routes`).
- La sección «Configuración» del panel (`/admin/configuracion`): un formulario con los parámetros agrupados en paneles, validación en español y el botón «Recalcular rutas».
- Valores por defecto en el código (respaldo) y en la semilla.
- Catálogos de opciones que elige el corredor (nivel y metas deportivas) y que el administrador gestiona: `GET`/`PUT /catalogs/<id>` (CFG-4).

**No incluye**

- Lo estructural que se queda en código a propósito: claves de severidad `low`/`medium`/`high` (tienen orden), claves de nivel, tipo de ciudad `city`/`zone`, claves de cobertura, días de la semana, el catálogo de permisos y la estructura de las preferencias.
- Los límites de texto de 40 caracteres de las clasificaciones libres, la longitud de etiquetas y el mínimo de 2 puntos por tramo (una polilínea necesita dos puntos).

## Reglas de negocio

- Todo parámetro tiene tipo, valor por defecto y límites; el dominio rechaza lo que no cumple con `400 invalid-argument` y el motivo de cada campo en `error.fields`.
- Motivos por campo: `required`, `invalid` (tipo), `out-of-range`, `invalid-time-zone`, `invalid-country-code`, `must-not-be-below-previous` (penalizaciones), `must-be-below-high` (umbral medio), `must-exceed-min` (rangos de ritmo y de distancia).
- Penalizaciones: enteros de 0 a 100 con `baja ≤ media ≤ alta`. Umbrales: `0 < medio < alto ≤ 100`.
- Un documento guardado con campos ausentes o inválidos se lee con el valor por defecto de cada uno; un grupo incoherente (penalizaciones, umbrales, ritmos o distancias) vuelve entero a sus valores por defecto.
- El perfil deportivo ya guardado no se oculta si el administrador estrecha los rangos: los rangos se aplican al guardar.
- Cambiar una penalización, un umbral, la ventana o el margen de los incidentes, o la zona horaria recalcula el índice de todas las rutas dentro de la misma petición; la respuesta informa cuántas.
- Los demás cambios (radios, límites, rangos, tolerancia, país) no recalculan: se aplican en la siguiente petición.
- El país se estampa en las ciudades que se crean después del cambio; las existentes conservan el suyo.

## Modelo de datos y contrato de API

**Estado: backend y sección del panel implementados** (código en `backend/apps/system_settings` y `frontend/src/app/admin/settings`).

| Endpoint | Permiso | Descripción |
| --- | --- | --- |
| `GET /settings` | sesión iniciada | `200 {"settings": {...}}` con todos los parámetros; los valores por defecto si nadie guardó. |
| `PUT /settings` | `settings.manage` | Cuerpo: cualquier subconjunto de los parámetros (el resto se conserva). `200 {"settings": {...}, "recalculated": n}`; `n` es 0 si no hizo falta recalcular. |
| `POST /admin/recalculate-routes` | `settings.manage` | Recalcula el índice de todas las rutas con los parámetros vigentes. `200 {"recalculated": n}`. |

Parámetros (claves camelCase del JSON y del documento `systemSettings/global`):

| Clave | Tipo y límites | Defecto | Qué gobierna |
| --- | --- | --- | --- |
| `penaltyLow`, `penaltyMedium`, `penaltyHigh` | entero 0–100, orden no decreciente | 10, 20, 35 | Puntos que resta cada factor o incidente por severidad |
| `thresholdHigh`, `thresholdMedium` | entero 1–100, `medio < alto` | 70, 40 | Nivel Alto desde `thresholdHigh`, Medio desde `thresholdMedium` |
| `incidentWindowDays` | entero 1–3650 | 365 | Días que cuenta un incidente |
| `incidentMarginMinutes` | entero 0–720 | 60 | Margen alrededor de la hora del incidente |
| `timeZone` | id IANA válido | `America/Guayaquil` | Reloj local de las franjas, las alertas y los incidentes |
| `nearbyRadiusM` | entero 1–10 000 | 500 | «Cercano» a una ruta (puntos de apoyo) |
| `maxSearchRadiusM` | entero 1–200 000 | 50 000 | Radio máximo de la búsqueda por ubicación |
| `maxAlertRadiusM` | entero 1–50 000 | 5000 | Radio máximo de una alerta de zona |
| `maxTimeSlotsPerRoute` | entero 1–48 | 12 | Franjas por ruta |
| `maxSegmentsPerRoute` | entero 1–100 | 50 | Tramos por ruta |
| `maxRiskFactorsPerSegment` | entero 1–100 | 20 | Factores por tramo |
| `routeNameMaxLength` | entero 10–200 | 80 | Largo del nombre de una ruta y de un tramo |
| `routeDescriptionMaxLength` | entero 50–2000 | 500 | Largo de la descripción de una ruta |
| `routeMaxDistanceKm` | entero 1–1000 | 500 | Distancia máxima de una ruta |
| `routeMaxElevationM` | entero 1–20 000 | 10 000 | Desnivel máximo de una ruta |
| `segmentMaxPoints` | entero 2–2000 | 500 | Puntos máximos de un tramo |
| `paceMinSecPerKm`, `paceMaxSecPerKm` | entero 30–3600 y 30–7200, `máx > mín` | 150, 1200 | Rango del ritmo habitual del perfil deportivo |
| `distanceMinKm`, `distanceMaxKm` | número 0,1–500 y 0,1–1000, `máx > mín` | 1, 50 | Rango de la distancia preferida del perfil deportivo |
| `safeRouteDistanceTolerance` | número 0,01–1 | 0,2 | Tolerancia de distancia de la ruta segura (±20 %) |
| `safeRouteMaxDistanceKm` | entero 1–1000 | 500 | Distancia máxima pedida en una ruta segura |
| `profilePhotoMaxKb` | entero 20–500 | 100 | Tamaño máximo de la foto de perfil ya decodificada; la API rechaza lo que lo supere |
| `profilePhotoMaxPx` | entero 64–1024 | 256 | Lado en píxeles al que los clientes reducen la foto de perfil antes de enviarla |
| `countryCode` | dos letras mayúsculas | `EC` | País que se estampa en las ciudades nuevas |

Los servicios leen el documento una vez por petición y pasan el objeto de parámetros a los casos de uso y a las funciones puras del dominio; no hay constantes de negocio en el código fuera de los valores por defecto.

## Historias

| ID | Historia | Actor | Estado |
| --- | --- | --- | --- |
| [CFG-1](#cfg-1--leer-los-parámetros) | Leer los parámetros | Usuario con sesión | Parcial |
| [CFG-2](#cfg-2--editar-los-parámetros) | Editar los parámetros | Administrador | Hecha |
| [CFG-3](#cfg-3--recalcular-las-rutas) | Recalcular las rutas | Administrador | Hecha |
| [CFG-4](#cfg-4--gestionar-los-catálogos-de-opciones) | Gestionar los catálogos de opciones | Administrador | Hecha |

## Historias de usuario y criterios de aceptación

### CFG-1 — Leer los parámetros

- **Historia de usuario:** Como corredor o administrador · Deseo que la aplicación conozca los límites vigentes (rangos del perfil, radios, distancias). Para validar los formularios con las mismas reglas que el servidor.
- **Estado:** `Hecha` — 2026-11-22: API y pruebas automáticas en el backend; el perfil deportivo y los formularios de ruta, tramo, franja y factor leen los parámetros y, si la lectura falla, usan los valores por defecto.

**Criterios de aceptación**

- [x] `GET /settings` exige sesión (`401` sin token) y responde `200 {"settings": {...}}` para cualquier usuario.
- [x] Sin documento guardado, responde los valores por defecto.
- [x] Un documento parcial o con valores inválidos se completa con los valores por defecto.
- [x] Los formularios del cliente validan con estos valores en lugar de números propios: el perfil deportivo (ritmo y distancia), la ruta (nombre, descripción, distancia máxima y desnivel máximo), el tramo (nombre y puntos), y el límite de tramos por ruta, de franjas por ruta y de factores por tramo (el botón «Agregar» se desactiva al llegar al máximo y lo explica). Los formularios de alertas llegan con su pantalla (Sprint 3).
- [x] La franja que el catálogo del corredor abre por defecto sale de las franjas que definió el administrador (la que está en curso, si no la siguiente del día, si no la primera); ya no hay un horario fijo en la aplicación.

**Implementación:** `backend/apps/system_settings/presentation/views.py`, `backend/apps/system_settings/domain/models.py`, `frontend/src/app/core/settings`, `frontend/src/app/admin/routes/domain/route-form.ts`, `frontend/src/app/admin/routes/domain/segment-form.ts`, `frontend/src/app/admin/routes/presentation`, `frontend/src/app/routes/domain/catalog.ts`

**Pruebas:** `backend/tests/test_system_settings_api.py`, `backend/tests/test_system_settings_domain.py`, `backend/tests/test_firestore_settings_adapter.py`, `frontend/src/app/admin/routes/**/*.spec.ts`, `frontend/src/app/routes/domain/catalog.spec.ts`

### CFG-2 — Editar los parámetros

- **Historia de usuario:** Como administrador · Deseo cambiar los números que gobiernan los cálculos desde el panel. Para ajustarlos sin pedir un despliegue.
- **Estado:** `Hecha` — 2026-11-22: API y pruebas automáticas en el backend; sección «Configuración» del panel con pruebas automáticas en el frontend.

**Criterios de aceptación**

- [x] `PUT /settings` exige `settings.manage`: `401` sin token, `403 missing-permission` para corredor, representante de club y catalogador.
- [x] Acepta un subconjunto de campos y conserva el resto; responde todos los parámetros y `recalculated`.
- [x] Rechaza con `400` y el motivo por campo: tipo, límites, orden de penalizaciones, umbrales, rangos, zona horaria, país y campos desconocidos; no guarda nada.
- [x] Los parámetros se aplican en la siguiente petición: límite de tramos, largo del nombre de la ruta, país de las ciudades nuevas y rango del perfil deportivo.
- [x] La semilla guarda los valores por defecto una sola vez y no pisa lo que el administrador cambió.
- [x] Las reglas de Firestore niegan todo acceso directo a `systemSettings`.
- [x] Sección «Configuración» del panel (`/admin/configuracion`, permiso `settings.manage`, solo visible con ese permiso) con los parámetros en siete paneles, cada uno con su explicación, y una lectura en vivo de los niveles de seguridad.
- [x] Un solo formulario: «Guardar cambios» (deshabilitado sin cambios o mientras guarda) envía solo los parámetros modificados; «Restablecer valores por defecto» pide confirmación, rellena el formulario y sigue exigiendo guardar.
- [x] Errores en español por campo: los límites del cliente y los motivos que devuelve el API (`required`, `invalid`, `out-of-range`, `invalid-time-zone`, `invalid-country-code`, `must-not-be-below-previous`, `must-be-below-high`, `must-exceed-min`).
- [x] Tras guardar avisa «Configuración guardada» y, si recalculó rutas, cuántas.

**Implementación:** `backend/apps/system_settings`, `backend/apps/shared/domain/permissions.py`, `backend/apps/seed/application/use_cases.py`, `firestore.rules`, `frontend/src/app/admin/settings`, `frontend/src/app/admin/admin-sections.ts`

**Pruebas:** `backend/tests/test_system_settings_api.py`, `backend/tests/test_system_settings_domain.py`, `backend/tests/test_system_settings_use_cases.py`, `backend/tests/test_seed.py`, `frontend/src/app/admin/settings/**/*.spec.ts`, `frontend/src/app/admin/admin-sections.spec.ts`

### CFG-3 — Recalcular las rutas

- **Historia de usuario:** Como administrador · Deseo que al cambiar la penalización, los umbrales, la ventana o el margen se recalculen todas las rutas. Para que el índice que ven el panel y el corredor coincida con los parámetros.
- **Estado:** `Hecha` — 2026-11-22: API y pruebas automáticas en el backend; el panel muestra el resultado, con pruebas automáticas en el frontend.

**Criterios de aceptación**

- [x] Guardar una penalización, un umbral, la ventana, el margen o la zona horaria distintos recalcula el índice almacenado de cada ruta y responde cuántas (`recalculated`).
- [x] Cambiar la penalización alta de 35 a 50 baja de 65 a 50 el índice almacenado de una ruta con un factor alto.
- [x] Un cambio que no afecta al índice responde `recalculated: 0` y no toca las rutas.
- [x] `POST /admin/recalculate-routes` (`settings.manage`) recalcula todas las rutas con los parámetros vigentes y responde `{"recalculated": n}`.
- [x] El panel ofrece «Recalcular rutas» y avisa cuántas se recalcularon (con los valores ya guardados).

**Implementación:** `backend/apps/system_settings/application/use_cases.py`, `backend/apps/routes/application/use_cases.py` (`recalculate_all_routes`), `frontend/src/app/admin/settings/presentation/settings.page.ts`

**Pruebas:** `backend/tests/test_system_settings_use_cases.py`, `backend/tests/test_system_settings_api.py`, `frontend/src/app/admin/settings/presentation/settings.page.spec.ts`

### CFG-4 — Gestionar los catálogos de opciones

- **Historia de usuario:** Como administrador · Deseo definir los niveles y las metas deportivas que ofrece la aplicación. Para cambiar las opciones del corredor sin pedir un despliegue.
- **Estado:** `Hecha` — 2026-11-22: API, dominio, semilla, perfil deportivo y reglas de Firestore con pruebas automáticas en el backend; pantalla «Opciones del perfil deportivo» del panel y formulario del perfil deportivo del corredor que lee el catálogo y los rangos, con pruebas automáticas en el frontend (suite completa: 836 pruebas).

**Contrato:** `GET /catalogs/<id>` (sesión iniciada) responde `200 {"id": "sportLevels", "items": [{"code", "label", "order", "active"}]}` ordenado por `order`, con los inactivos y su marca; `?active=true` deja solo los activos para los formularios del corredor. `PUT /catalogs/<id>` (`settings.manage`) recibe `{"items": [...]}`, reemplaza la lista y responde igual. Catálogos (cerrados en el código): `sportLevels` (`beginner` Principiante, `intermediate` Intermedio, `advanced` Avanzado) y `sportGoals` (`health` Salud, `weightLoss` Bajar de peso, `racePrep` Preparar una carrera, `pace` Mejorar el ritmo, `social` Correr en compañía). Un id desconocido responde `404 catalog-not-found`.

**Criterios de aceptación**

- [x] Un ítem es `{code, label, order, active}`: `code` es un slug `^[a-z][a-zA-Z0-9_-]{0,39}$`, `label` de 1 a 60 caracteres sin espacios sobrantes, `order` entero, `active` booleano.
- [x] Los códigos son únicos, al menos un ítem queda activo y un código que existió nunca se elimina: solo se desactiva (`active: false`).
- [x] Errores `400 invalid-argument` con el motivo por campo (`items.2.label`): `required`, `invalid`, `invalid-format`, `max-length`, `unknown`, `duplicate`; y sobre `items`: `code-removed`, `no-active-item`, `max-length` (más de 30).
- [x] `GET` exige sesión (`401`); `PUT` exige `settings.manage` (`403 missing-permission`).
- [x] Sin documento guardado se responden los valores por defecto; la semilla los guarda solo si faltan y no pisa lo que el administrador cambió.
- [x] El perfil deportivo valida nivel y metas contra los códigos activos de los catálogos al guardar (rechaza un código desconocido o desactivado con `invalid-choice`) y lee sin error un perfil guardado con un código luego desactivado.
- [x] Las reglas de Firestore niegan todo acceso directo a `catalogs` y ya no listan los niveles ni las metas.
- [x] El panel tiene la pantalla `/admin/configuracion/opciones` (segunda pestaña de «Configuración», con `settings.manage`): una lista editable por catálogo con nombre (1 a 60), código (editable solo en las opciones nuevas y sugerido desde el nombre en camelCase ASCII), posición con botones subir/bajar e interruptor «Activa». «Agregar opción» añade una fila, no hay borrar (se desactiva) y queda al menos una opción activa; un solo «Guardar cambios» por catálogo con aviso «Opciones guardadas.» y los errores de la API (`items.N.code|label`, `items`) traducidos junto a cada fila.
- [x] El formulario del perfil deportivo del corredor ofrece solo las opciones activas de `GET /catalogs/<id>`, muestra la etiqueta del catálogo para un código guardado aunque esté desactivado (o el código si el catálogo no lo conoce) y valida ritmo y distancia con los rangos de `GET /settings` (por defecto 150 a 1200 s/km y 1 a 50 km si la llamada falla).

**Implementación:** `backend/apps/catalogs`, `backend/apps/users/domain/models.py` (`PerfilDeportivo.parse`), `backend/apps/users/application/use_cases.py` (`save_sport_profile`), `backend/apps/seed/application/use_cases.py`, `firestore.rules`; frontend: `frontend/src/app/core/catalogs`, `frontend/src/app/core/settings`, `frontend/src/app/admin/settings/catalogs`, `frontend/src/app/sport-profile`

**Pruebas:** `backend/tests/test_catalogs_domain.py`, `backend/tests/test_catalogs_use_cases.py`, `backend/tests/test_catalogs_api.py`, `backend/tests/test_users_domain.py`, `backend/tests/test_seed.py`, `frontend/src/app/core/catalogs/*.spec.ts`, `frontend/src/app/core/settings/system-settings.store.spec.ts`, `frontend/src/app/admin/settings/catalogs/**/*.spec.ts`, `frontend/src/app/sport-profile/**/*.spec.ts`

## Valores que se quedan en el código (a propósito)

Criterio: se queda en el código lo que tiene **estructura o comportamiento** (el código ramifica por esa clave), lo que es **forma de un dato** (el largo de un texto, el formato de una hora) o lo que es **mecánica de la plataforma**. Todo número o lista que un administrador querría cambiar para ajustar el negocio está en «Configuración» o en un catálogo.

| Valor | Dónde vive | Por qué se queda |
| --- | --- | --- |
| Claves de severidad `low`/`medium`/`high` y de nivel `high`/`medium`/`low` | `routes/domain/safety.py`, `frontend/src/app/routes/domain/route.ts` | Tienen orden y el cálculo ramifica por ellas; sus etiquetas («Baja», «Alto») son texto de la interfaz |
| Severidad de las alertas `alta`/`media`/`baja` | `risk_alerts/domain/models.py`, `frontend/src/app/alerts` | Es una escala ordenada igual que la anterior |
| Tipo de ciudad `city`/`zone` y cobertura `active`/`planned`/`suspended` | `cities/domain/models.py`, `firestore.rules` | Cada clave activa un comportamiento (una zona depende de una ciudad, una ciudad suspendida se oculta) |
| Días de la semana `mon`…`sun` | `support_points/domain/models.py` | Estructura del horario de un punto de apoyo |
| Catálogo de permisos y claves de los roles del sistema | `shared/domain/permissions.py`, `roles/domain/system_roles.py` | Cada permiso lo hace cumplir el código; los roles que crea el administrador sí son datos |
| Estructura de las preferencias: idioma, unidades, tamaño de letra, apariencia, privacidad de ubicación y banderas de notificación | `users/domain/models.py`, `frontend/src/app/preferences` | Cada opción cambia el comportamiento de la app; no son opciones de negocio |
| Largo máximo de los textos de clasificación (superficie, dificultad, tipos de factor, incidente, punto de apoyo y alerta: 40), de la etiqueta de un punto (80), de una franja (40), de la descripción de un factor y de una alerta (200), y de los nombres de ciudad y rol | `routes/domain/models.py`, `risk_alerts`, `safety_data`, `support_points`, `cities`, `roles` | Forma del dato: acotan lo que se guarda en Firestore; los largos que sí afectan al negocio (nombre y descripción de ruta, puntos por tramo) son parámetros |
| Mínimo de 2 puntos por tramo, formato `HH:MM` entre `00:00` y `24:00`, formato de fecha | `routes/domain/models.py`, `routes/domain/time.py` | Una polilínea necesita dos puntos y el formato de una hora es parte del contrato de la API |
| Latitud entre −90 y 90 y longitud entre −180 y 180 | formularios y dominio | Geometría, no negocio |
| Edad entre 5 y 110 años, cédula de 10 dígitos, contraseña de 8 caracteres o más | `users/domain/models.py`, `frontend/src/app/auth` | Reglas de validación de datos personales; cambiarlas es una decisión legal o de producto, no un ajuste de operación |
| Reautenticación reciente (5 minutos) y tasas de peticiones por minuto | `users/domain/account_deletion.py`, `config/settings.py` (variables de entorno) | Seguridad y despliegue: las tasas ya se cambian por entorno |
| Semanas del gráfico de registros (8), rutas más largas del resumen (8) y topes de lectura del resumen (5000 y 2000) | `summary/domain/metrics.py`, `summary/application/use_cases.py` | Forma del tablero y protección de rendimiento, no un valor de negocio |
| Centro y zoom iniciales del mapa (Ecuador), teselas y zoom máximo | `frontend/src/app/shared/map` | Es la vista de reserva del mapa; el país del sistema (`countryCode`) no trae coordenadas |
| Tramos de distancia del filtro del catálogo (hasta 5 km, 5–10 km, más de 10 km) | `frontend/src/app/routes/domain/catalog.ts` | Filtro de presentación; las distancias de las rutas sí son datos |
| Etiquetas de rol del resumen (`runner`, `admin`, `none`) | `frontend/src/app/admin/summary/domain/labels.ts` | Solo etiquetan los roles del sistema; un rol creado por el administrador se muestra con su identificador (pendiente: mostrar su nombre) |
| Límite de 30 opciones por catálogo, de 60 caracteres por etiqueta y de 40 por código | `catalogs/domain/models.py` | Forma del dato del catálogo |
| Nombres de colecciones, identificadores de documento y textos de la semilla | `shared/infrastructure/firebase/collections.py`, `seed` | Mecánica de la plataforma y datos de demostración |

Las reglas de Firestore ya no repiten rangos de negocio: el perfil deportivo solo valida su forma (nivel, objetivos, ritmo y distancia numéricos) y el país de una ciudad solo debe ser un código de dos letras; los rangos, los códigos de los catálogos y el país los valida la API con los parámetros vigentes.

## Dependencias

- **Depende de:** [EP-02](02-roles-y-permisos.md) (el permiso `settings.manage` viaja en el token).
- **Alimenta a:** las especificaciones de seguridad, incidentes, puntos de apoyo, rutas seguras, ciudades y perfil deportivo.

## Supuestos por validar

- Los límites de cada parámetro son decisión del equipo (no salen del Excel); se revisan con Gacelas.
- Cambiar la zona horaria recalcula las rutas porque «hoy» decide qué incidentes caen dentro de la ventana.
- Si el volumen de rutas crece, el recálculo masivo deberá pasar a un trabajo en segundo plano; hoy corre en la misma petición.
