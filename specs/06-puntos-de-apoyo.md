# EP-06 — Puntos de apoyo y senderos con resguardo policial

> Spec de capacidad · Debería tener · **0/8 Hecha, 8 Parcial, 0 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-06 · Puntos de apoyo y senderos con resguardo policial |
| Requisitos | RF-06-1 a RF-06-8 (8 sub-requisitos) |
| Requisito de usuario (UR) | UR-13 |
| RNF | sin RNF específico (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debería tener |
| Responsable | Pedro Vargas |
| Sprint planificado | Sprint 3 · Semana 7 |
| Sprint real | Sprint 3 (semana 7). Backend: 2026-11-22 (commit `9387ea1`). Falta la interfaz de administración y la del corredor. |
| Dependencias | [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md) |

## Propósito

Registrar los puntos de apoyo (comercio abierto, puesto de la Policía Nacional, centro de salud, lugar concurrido) y los senderos con resguardo policial, para que el índice de seguridad ([EP-07](07-evaluacion-de-seguridad.md)) y la recomendación de rutas ([EP-09](09-rutas-seguras.md)) los consideren. Es «Debería tener».

Entradas, proceso y salidas del requisito padre en el Excel (RF-06):

- Entradas: ubicación, tipo y horario del punto de apoyo; días y horarios de presencia policial del sendero.
- Proceso: validar ubicación y horarios y asociarlos a una ruta o tramo.
- Salidas: puntos de apoyo y senderos resguardados visibles para el corredor.

## Alcance

**Incluye**

- CRUD de puntos de apoyo (RF-06-1 a RF-06-4).
- CRUD de senderos con resguardo policial, con días y horarios de presencia (RF-06-5 a RF-06-8).

**No incluye**

- Convenios con entidades como la Policía Nacional o ECU 911 (no hay convenios firmados; fuera del piloto).
- Cargar datos de entidades externas: [EP-08](08-incidentes-y-fuentes.md).

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que el tipo sea uno de los definidos.
- Que la ubicación sea válida.
- Mostrar los puntos cercanos a una ruta o a la ubicación del corredor.
- Mantener vigentes la ubicación, el tipo y el horario.
- Dejar de mostrar el punto al corredor.
- Que el sendero o el tramo exista.
- Mostrar los senderos con sus días y horarios registrados.
- Mantener vigentes los días y horarios.
- Retirar el resguardo sin eliminar el sendero o tramo.

Decididas por el equipo o derivadas de otros documentos:

- Tipo de punto de apoyo: texto libre del administrador, recortado, de 1 a 40 caracteres (por ejemplo comercio abierto, puesto policial, centro de salud, lugar concurrido). No hay lista fija en código.
- Un sendero o tramo no puede tener dos registros de resguardo con el mismo horario (inferido de la regla de no solapamiento).

## Modelo de datos y contrato de API

**Estado: backend implementado** (2026-11-22, commit `9387ea1`; código en `backend/apps/support_points`). El contrato definitivo está en «Decisiones de diseño»; la interfaz está pendiente. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /support-points` | [RF-06-1](#rf-06-1--crear-punto-de-apoyo) Crear punto de apoyo | Administrador |
| `GET /support-points` y `GET /support-points/{id}` | [RF-06-2](#rf-06-2--leer-puntos-de-apoyo) Leer puntos de apoyo | Corredor y Administrador |
| `PUT /support-points/{id}` | [RF-06-3](#rf-06-3--actualizar-punto-de-apoyo) Actualizar punto de apoyo | Administrador |
| `DELETE /support-points/{id}` | [RF-06-4](#rf-06-4--eliminar-punto-de-apoyo) Eliminar punto de apoyo | Administrador |
| `POST /guarded-trails` | [RF-06-5](#rf-06-5--crear-sendero-con-resguardo-policial) Crear sendero con resguardo policial | Administrador |
| `GET /guarded-trails` y `GET /guarded-trails/{id}` | [RF-06-6](#rf-06-6--leer-senderos-con-resguardo-policial) Leer senderos con resguardo policial | Corredor |
| `PUT /guarded-trails/{id}` | [RF-06-7](#rf-06-7--actualizar-sendero-con-resguardo-policial) Actualizar sendero con resguardo policial | Administrador |
| `DELETE /guarded-trails/{id}` | [RF-06-8](#rf-06-8--eliminar-sendero-con-resguardo-policial) Eliminar sendero con resguardo policial | Administrador |

Campos propuestos de «punto de apoyo» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Tipo (texto libre, 1 a 40 caracteres) | Sí |
| Ubicación | Sí |
| Horario de atención | No |

Campos propuestos de «sendero con resguardo policial» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Sendero o tramo | Sí |
| Días de presencia policial | Sí |
| Horarios de presencia policial | Sí |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-06-1](#rf-06-1--crear-punto-de-apoyo) | Crear punto de apoyo | Administrador | Sprint 3 · Semana 7 | Parcial |
| [RF-06-2](#rf-06-2--leer-puntos-de-apoyo) | Leer puntos de apoyo | Corredor y Administrador | Sprint 3 · Semana 7 | Parcial |
| [RF-06-3](#rf-06-3--actualizar-punto-de-apoyo) | Actualizar punto de apoyo | Administrador | Sprint 3 · Semana 7 | Parcial |
| [RF-06-4](#rf-06-4--eliminar-punto-de-apoyo) | Eliminar punto de apoyo | Administrador | Sprint 3 · Semana 7 | Parcial |
| [RF-06-5](#rf-06-5--crear-sendero-con-resguardo-policial) | Crear sendero con resguardo policial | Administrador | Sprint 3 · Semana 7 | Parcial |
| [RF-06-6](#rf-06-6--leer-senderos-con-resguardo-policial) | Leer senderos con resguardo policial | Corredor | Sprint 3 · Semana 7 | Parcial |
| [RF-06-7](#rf-06-7--actualizar-sendero-con-resguardo-policial) | Actualizar sendero con resguardo policial | Administrador | Sprint 3 · Semana 7 | Parcial |
| [RF-06-8](#rf-06-8--eliminar-sendero-con-resguardo-policial) | Eliminar sendero con resguardo policial | Administrador | Sprint 3 · Semana 7 | Parcial |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-06-1 — Crear punto de apoyo

- **Historia de usuario:** Como administrador · Deseo registrar punto de apoyo. Para ubicar comercios, centros de salud u otros puntos de apoyo con sus horarios registrados.
- **Actor:** Administrador · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Registrar punto de apoyo
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `POST /support-points`. Falta la pantalla de administración; los mensajes de error en español dependen de esa pantalla.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Tipo {Comercio abierto, Puesto de la Policía Nacional, Centro de salud, Lugar concurrido} (obligatorio); Ubicación (obligatorio); Horario de atención (opcional) | El sistema debería permitir crear un punto de apoyo (comercio abierto, puesto de la Policía Nacional, centro de salud o lugar concurrido) con su ubicación y horario de atención, para que el corredor sepa dónde pedir ayuda. | Registro de «punto de apoyo» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Con los datos obligatorios completos y válidos (tipo {comercio abierto, puesto de la policía nacional, centro de salud, lugar concurrido}, ubicación), el sistema crea el registro de «punto de apoyo» y confirma al actor.
- [x] Se valida que los datos obligatorios estén completos.
- [x] Se valida que el tipo sea uno de los definidos.
- [x] Se valida que la ubicación sea válida.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/support_points/domain/models.py`, `backend/apps/support_points/application/use_cases.py`, `backend/apps/support_points/presentation/views.py`

**Pruebas:** `backend/tests/test_support_points_api.py`

### RF-06-2 — Leer puntos de apoyo

- **Historia de usuario:** Como corredor o administrador · Deseo consultar puntos de apoyo. Para identificar qué puntos de apoyo están cerca de mi recorrido y cuándo atienden.
- **Actor:** Corredor y Administrador · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Consultar puntos de apoyo
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `GET /support-points` (filtros `cityId`, `routeId`, `lat`+`lng`+`radiusM`) y `GET /support-points/{id}`. No filtra por tipo ni por horario. Falta la vista del corredor y la de administración.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Tipo (filtro); Ubicación (filtro); Horario de atención (filtro) | El sistema debería permitir leer los puntos de apoyo cercanos a una ruta o a la ubicación del corredor, con su horario de atención, para elegir rutas con apoyo disponible. | Datos de «puntos de apoyo» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «puntos de apoyo» que cumplen los criterios indicados (tipo, ubicación, horario de atención), o informa que no hay resultados.
- [x] El sistema debe mostrar los puntos cercanos a una ruta o a la ubicación del corredor.
- [x] Solo un usuario con el permiso correspondiente al actor «Corredor y Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/support_points/application/use_cases.py`, `backend/apps/support_points/presentation/views.py`

**Pruebas:** `backend/tests/test_support_points_api.py`

### RF-06-3 — Actualizar punto de apoyo

- **Historia de usuario:** Como administrador · Deseo modificar punto de apoyo. Para evitar indicaciones incorrectas cuando un punto de apoyo cambia de ubicación u horario.
- **Actor:** Administrador · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Actualizar punto de apoyo
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `PUT /support-points/{id}`. Las validaciones al modificar no tienen prueba propia. Falta la pantalla de administración.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Tipo {Comercio abierto, Puesto de la Policía Nacional, Centro de salud, Lugar concurrido} (obligatorio); Ubicación (obligatorio); Horario de atención (opcional) | El sistema debería permitir actualizar la ubicación, el tipo o el horario de atención de un punto de apoyo, para mantener la información vigente. | Registro de «punto de apoyo» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El sistema guarda los cambios de «punto de apoyo» (tipo {comercio abierto, puesto de la policía nacional, centro de salud, lugar concurrido}, ubicación) y confirma al actor.
- [x] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [x] El sistema debe mantener vigentes la ubicación, el tipo y el horario.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/support_points/application/use_cases.py`, `backend/apps/support_points/presentation/views.py`

**Pruebas:** `backend/tests/test_support_points_api.py`

### RF-06-4 — Eliminar punto de apoyo

- **Historia de usuario:** Como administrador · Deseo eliminar punto de apoyo. Para dejar de mostrar como disponible un punto de apoyo que ya cerró.
- **Actor:** Administrador · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Eliminar punto de apoyo
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `DELETE /support-points/{id}`. Falta la pantalla de administración con la confirmación previa.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema debería permitir eliminar un punto de apoyo que cerró o ya no está disponible, para no desinformar al corredor. | Registro de «punto de apoyo» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El sistema elimina el registro de «punto de apoyo» indicado y confirma al actor.
- [x] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [x] El sistema debe dejar de mostrar el punto al corredor.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/support_points/application/use_cases.py`, `backend/apps/support_points/presentation/views.py`

**Pruebas:** `backend/tests/test_support_points_api.py`

### RF-06-5 — Crear sendero con resguardo policial

- **Historia de usuario:** Como administrador · Deseo registrar sendero con resguardo policial. Para registrar en qué senderos y horarios se ha reportado presencia policial de respaldo.
- **Actor:** Administrador · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Registrar sendero con resguardo policial
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `POST /guarded-trails`, con rechazo de resguardos que se solapan en día y horario. Falta la pantalla de administración.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Sendero o tramo (obligatorio); Días de presencia policial (obligatorio); Horarios de presencia policial (obligatorio) | El sistema debería permitir crear los senderos o tramos que cuentan con resguardo policial, indicando los días y horarios de presencia policial. | Registro de «sendero con resguardo policial» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Con los datos obligatorios completos y válidos (sendero o tramo, días de presencia policial, horarios de presencia policial), el sistema crea el registro de «sendero con resguardo policial» y confirma al actor.
- [x] Se valida que los datos obligatorios estén completos.
- [x] Se valida que el sendero o el tramo exista.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/support_points/domain/models.py`, `backend/apps/support_points/application/use_cases.py`, `backend/apps/support_points/presentation/views.py`

**Pruebas:** `backend/tests/test_support_points_api.py`

### RF-06-6 — Leer senderos con resguardo policial

- **Historia de usuario:** Como corredor · Deseo consultar senderos con resguardo policial. Para consultar los días y horarios registrados de resguardo antes de elegir un sendero.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Consultar senderos con resguardo policial
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `GET /guarded-trails` (filtro `routeId`) y `GET /guarded-trails/{id}`. No filtra por días ni por horario. Falta la vista del corredor.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Sendero o tramo (filtro); Días de presencia policial (filtro); Horarios de presencia policial (filtro) | El sistema debería permitir leer los senderos y tramos con resguardo policial, junto con los días y horarios registrados. | Datos de «senderos con resguardo policial» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «senderos con resguardo policial» que cumplen los criterios indicados (sendero o tramo, días de presencia policial, horarios de presencia policial), o informa que no hay resultados.
- [x] El sistema debe mostrar los senderos con sus días y horarios registrados.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/support_points/application/use_cases.py`, `backend/apps/support_points/presentation/views.py`

**Pruebas:** `backend/tests/test_support_points_api.py`

### RF-06-7 — Actualizar sendero con resguardo policial

- **Historia de usuario:** Como administrador · Deseo modificar sendero con resguardo policial. Para mantener vigentes los horarios de resguardo que figuran en la información de los senderos.
- **Actor:** Administrador · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Actualizar sendero con resguardo policial
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `PUT /guarded-trails/{id}`. Solo la regla de no solapamiento tiene prueba al modificar. Falta la pantalla de administración.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Sendero o tramo (obligatorio); Días de presencia policial (obligatorio); Horarios de presencia policial (obligatorio) | El sistema debería permitir actualizar los días y horarios de resguardo policial de un sendero o tramo. | Registro de «sendero con resguardo policial» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El sistema guarda los cambios de «sendero con resguardo policial» (sendero o tramo, días de presencia policial, horarios de presencia policial) y confirma al actor.
- [x] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [x] El sistema debe mantener vigentes los días y horarios.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/support_points/application/use_cases.py`, `backend/apps/support_points/presentation/views.py`

**Pruebas:** `backend/tests/test_support_points_api.py`

### RF-06-8 — Eliminar sendero con resguardo policial

- **Historia de usuario:** Como administrador · Deseo eliminar sendero con resguardo policial. Para dejar de informar un resguardo que ya no está vigente sin eliminar el sendero.
- **Actor:** Administrador · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Eliminar sendero con resguardo policial
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `DELETE /guarded-trails/{id}`; la ruta y su tramo se conservan. Falta la pantalla de administración con la confirmación previa.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema debería permitir eliminar el registro de resguardo policial cuando deje de estar vigente, sin eliminar el sendero o tramo. | Registro de «sendero con resguardo policial» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El sistema elimina el registro de «sendero con resguardo policial» indicado y confirma al actor.
- [x] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [x] El sistema debe retirar el resguardo sin eliminar el sendero o tramo.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/support_points/application/use_cases.py`, `backend/apps/support_points/presentation/views.py`

**Pruebas:** `backend/tests/test_support_points_api.py`

## Dependencias

- **Depende de:** [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md).

## Decisiones de diseño (2026-11-22)

Tomadas para implementar el Sprint 3 sin bloquearlo; se revisan con Gacelas en la demo.

- **Ubicación:** `{lat, lng}` y `cityId`. «Cercano» a una ruta o al corredor = a 500 m o menos (distancia de haversine al punto o a cualquier punto de los tramos).
- **Horario de atención:** texto libre opcional (por ejemplo «Lun–Sáb 06:00–20:00»).
- **Resguardo policial:** `routeId`, `segmentId` opcional (vacío = toda la ruta), `days` (lunes a domingo, al menos uno), `startTime` y `endTime`. No se permiten dos resguardos del mismo tramo que compartan día y se solapen en horario.
- **Efecto en el índice:** en el Sprint 3 los puntos de apoyo y los resguardos **solo se muestran** al corredor; no cambian el puntaje, porque la fórmula de RF-07 solo resta. Se revisa con Gacelas si deben sumar.
- **Permisos:** escritura con `routes.manage`; lectura con sesión iniciada (corredor y administrador).
- **API:** `GET/POST /support-points` (filtros `cityId`, `routeId`, `lat`+`lng`+`radiusM`), `GET/PUT/DELETE /support-points/{id}`; `GET/POST /guarded-trails` (filtro `routeId`), `GET/PUT/DELETE /guarded-trails/{id}`.

## Supuestos por validar

- El efecto de un punto de apoyo o de un resguardo en el puntaje del índice no está definido en el Excel; en el Sprint 3 solo se muestran (ver Decisiones de diseño).
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
