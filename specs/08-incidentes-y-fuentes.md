# EP-08 — Incidentes y fuentes de información de seguridad

> Spec de capacidad · Debe tener · **0/8 Hecha, 8 Parcial, 0 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-08 · Incidentes y fuentes de información de seguridad |
| Requisitos | RF-08-1 a RF-08-8 (8 sub-requisitos) |
| Requisito de usuario (UR) | UR-05 |
| RNF | RNF-16 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | Jhordy Camacas |
| Sprint planificado | Sprint 3 · Semana 7 |
| Sprint real | Sprint 3 (semana 7). Backend: 2026-11-22 (commit `9387ea1`); los incidentes ya penalizan el índice de seguridad. Falta la interfaz de administración. |
| Dependencias | [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md) |

## Propósito

Registrar incidentes de seguridad ocurridos en rutas o tramos y las fuentes de información de seguridad (entidad, tipo de dato, fecha de carga) que los respaldan, para alimentar el índice de seguridad. Permite la importación de fuentes externas en formatos abiertos (RNF-16).

Entradas, proceso y salidas del requisito padre en el Excel (RF-08):

- Entradas: tipo, fecha, hora y ubicación del incidente; entidad y tipo de dato de la fuente.
- Proceso: asociar cada incidente a una ruta y a su fuente.
- Salidas: historial de incidentes filtrable y fuentes registradas.

## Alcance

**Incluye**

- CRUD de incidentes de seguridad (RF-08-1 a RF-08-4).
- CRUD de fuentes de información (RF-08-5 a RF-08-8).

**No incluye**

- Convenios con entidades (no hay convenios firmados).
- Quién carga los datos y con qué periodicidad: decisión abierta, CONTEXTO sección 10 punto 6.

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que la ruta o el tramo exista.
- Que la fecha no sea posterior a la actual.
- Permitir filtrar por tramo, fecha y tipo de incidente.
- Que la fecha siga sin ser posterior a la actual.
- Eliminar solo incidentes duplicados o registrados por error.
- Que la entidad no esté ya registrada con el mismo tipo de dato.
- Mostrar la fecha de actualización de cada fuente.
- Actualizar la fecha de carga al cambiar los datos.
- Dejar de usar sus datos en el análisis.

Decididas por el equipo o derivadas de otros documentos:

- Un incidente se asocia a una ruta o tramo y a una fuente de información existentes.
- Los incidentes no se muestran con datos personales de las personas involucradas.

## Modelo de datos y contrato de API

**Estado: backend implementado** (2026-11-22, commit `9387ea1`; código en `backend/apps/safety_data`). El contrato definitivo está en «Decisiones de diseño»; la interfaz de administración está pendiente. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /safety-incidents` | [RF-08-1](#rf-08-1--crear-incidente-de-seguridad) Crear incidente de seguridad | Administrador |
| `GET /safety-incidents` y `GET /safety-incidents/{id}` | [RF-08-2](#rf-08-2--leer-incidentes-de-seguridad) Leer incidentes de seguridad | Administrador |
| `PUT /safety-incidents/{id}` | [RF-08-3](#rf-08-3--actualizar-incidente-de-seguridad) Actualizar incidente de seguridad | Administrador |
| `DELETE /safety-incidents/{id}` | [RF-08-4](#rf-08-4--eliminar-incidente-de-seguridad) Eliminar incidente de seguridad | Administrador |
| `POST /information-sources` | [RF-08-5](#rf-08-5--crear-fuente-de-información) Crear fuente de información | Administrador |
| `GET /information-sources` y `GET /information-sources/{id}` | [RF-08-6](#rf-08-6--leer-fuentes-de-información) Leer fuentes de información | Administrador |
| `PUT /information-sources/{id}` | [RF-08-7](#rf-08-7--actualizar-fuente-de-información) Actualizar fuente de información | Administrador |
| `DELETE /information-sources/{id}` | [RF-08-8](#rf-08-8--eliminar-fuente-de-información) Eliminar fuente de información | Administrador |

Campos propuestos de «incidente de seguridad» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Ruta o tramo | Sí |
| Tipo | Sí |
| Fecha | Sí |
| Hora | Sí |
| Fuente de información | Sí |

Campos propuestos de «fuente de información» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Entidad | Sí |
| Tipo de dato | Sí |
| Fecha de carga | Sí |
| Datos cargados | No |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-08-1](#rf-08-1--crear-incidente-de-seguridad) | Crear incidente de seguridad | Administrador | Sprint 3 · Semana 7 | Parcial |
| [RF-08-2](#rf-08-2--leer-incidentes-de-seguridad) | Leer incidentes de seguridad | Administrador | Sprint 3 · Semana 7 | Parcial |
| [RF-08-3](#rf-08-3--actualizar-incidente-de-seguridad) | Actualizar incidente de seguridad | Administrador | Sprint 3 · Semana 7 | Parcial |
| [RF-08-4](#rf-08-4--eliminar-incidente-de-seguridad) | Eliminar incidente de seguridad | Administrador | Sprint 3 · Semana 7 | Parcial |
| [RF-08-5](#rf-08-5--crear-fuente-de-información) | Crear fuente de información | Administrador | Sprint 3 · Semana 7 | Parcial |
| [RF-08-6](#rf-08-6--leer-fuentes-de-información) | Leer fuentes de información | Administrador | Sprint 3 · Semana 7 | Parcial |
| [RF-08-7](#rf-08-7--actualizar-fuente-de-información) | Actualizar fuente de información | Administrador | Sprint 3 · Semana 7 | Parcial |
| [RF-08-8](#rf-08-8--eliminar-fuente-de-información) | Eliminar fuente de información | Administrador | Sprint 3 · Semana 7 | Parcial |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-08-1 — Crear incidente de seguridad

- **Historia de usuario:** Como administrador · Deseo registrar incidente de seguridad. Para asociar a un tramo los hechos registrados con fecha, hora, tipo y fuente verificable.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Registrar incidente de seguridad
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `POST /safety-incidents`; el incidente penaliza el índice de su tramo en la franja que cubre su hora. Falta la pantalla de administración; los mensajes de error en español dependen de esa pantalla.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta o tramo (obligatorio); Tipo (obligatorio); Fecha (obligatorio); Hora (obligatorio); Fuente de información (obligatorio) | El sistema deberá permitir crear incidentes de seguridad asociados a un tramo, indicando fecha, hora, tipo y fuente de información. | Registro de «incidente de seguridad» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Con los datos obligatorios completos y válidos (ruta o tramo, tipo, fecha, hora, fuente de información), el sistema crea el registro de «incidente de seguridad» y confirma al actor.
- [x] Se valida que los datos obligatorios estén completos.
- [x] Se valida que la ruta o el tramo exista.
- [x] Se valida que la fecha no sea posterior a la actual.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/safety_data/domain/models.py`, `backend/apps/safety_data/application/use_cases.py`, `backend/apps/safety_data/presentation/views.py`

**Pruebas:** `backend/tests/test_safety_data_api.py`, `backend/tests/test_safety_data_domain.py`

### RF-08-2 — Leer incidentes de seguridad

- **Historia de usuario:** Como administrador · Deseo consultar incidentes de seguridad. Para examinar antecedentes de incidentes por tramo, fecha y clase al revisar la información disponible.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Consultar incidentes de seguridad
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `GET /safety-incidents` (filtros `routeId`, `segmentId`, `type`, `from`, `to`) y `GET /safety-incidents/{id}`. No filtra por hora. Falta la pantalla de administración.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta o tramo (filtro); Tipo (filtro); Fecha (filtro); Hora (filtro) | El sistema deberá permitir leer el historial de incidentes de seguridad, filtrando por tramo, fecha y tipo de incidente. | Datos de «incidentes de seguridad» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «incidentes de seguridad» que cumplen los criterios indicados (ruta o tramo, tipo, fecha, hora), o informa que no hay resultados.
- [x] El sistema debe permitir filtrar por tramo, fecha y tipo de incidente.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/safety_data/application/use_cases.py`, `backend/apps/safety_data/presentation/views.py`

**Pruebas:** `backend/tests/test_safety_data_api.py`

### RF-08-3 — Actualizar incidente de seguridad

- **Historia de usuario:** Como administrador · Deseo modificar incidente de seguridad. Para rectificar la ubicación o los datos de un incidente cuando se detecten inexactitudes.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Actualizar incidente de seguridad
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `PUT /safety-incidents/{id}`; al modificar se recalcula el índice de la ruta (y de la anterior si el incidente cambia de ruta). Solo la regla de la fecha tiene prueba al modificar. Falta la pantalla de administración.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta o tramo (obligatorio); Tipo (obligatorio); Fecha (obligatorio); Hora (obligatorio); Fuente de información (obligatorio) | El sistema deberá permitir actualizar los datos de un incidente de seguridad, incluyendo su ubicación, fecha, tipo y fuente de información. | Registro de «incidente de seguridad» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El sistema guarda los cambios de «incidente de seguridad» (ruta o tramo, tipo, fecha, hora, fuente de información) y confirma al actor.
- [x] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [x] Se valida que la fecha siga sin ser posterior a la actual.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/safety_data/application/use_cases.py`, `backend/apps/safety_data/presentation/views.py`

**Pruebas:** `backend/tests/test_safety_data_api.py`

### RF-08-4 — Eliminar incidente de seguridad

- **Historia de usuario:** Como administrador · Deseo eliminar incidente de seguridad. Para eliminar registros duplicados o erróneos sin alterar incidentes válidos.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Eliminar incidente de seguridad
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `DELETE /safety-incidents/{id}`; al eliminar se restablece el índice. Falta la pantalla de administración con la confirmación previa.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar un incidente de seguridad registrado por error o duplicado, previa confirmación. | Registro de «incidente de seguridad» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El sistema elimina el registro de «incidente de seguridad» indicado y confirma al actor.
- [x] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe eliminar solo incidentes duplicados o registrados por error.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/safety_data/application/use_cases.py`, `backend/apps/safety_data/presentation/views.py`

**Pruebas:** `backend/tests/test_safety_data_api.py`

### RF-08-5 — Crear fuente de información

- **Historia de usuario:** Como administrador · Deseo registrar fuente de información. Para identificar y organizar las fuentes autorizadas que alimentan los análisis de seguridad y movilidad.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Registrar fuente de información
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `POST /information-sources`; la fecha de carga la pone el servidor. Falta la pantalla de administración.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Entidad (obligatorio); Tipo de dato (obligatorio); Fecha de carga (obligatorio); Datos cargados (opcional) | El sistema deberá permitir crear una fuente de información de seguridad y movilidad (ECU 911, Policía Nacional, Agencia de Tránsito, estadísticas del cantón o clubes de running) y cargar sus datos, para alimentar el análisis de seguridad. | Registro de «fuente de información» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Con los datos obligatorios completos y válidos (entidad, tipo de dato, fecha de carga), el sistema crea el registro de «fuente de información» y confirma al actor.
- [x] Se valida que los datos obligatorios estén completos.
- [x] Se valida que la entidad no esté ya registrada con el mismo tipo de dato.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/safety_data/domain/models.py`, `backend/apps/safety_data/application/use_cases.py`, `backend/apps/safety_data/presentation/views.py`

**Pruebas:** `backend/tests/test_safety_data_api.py`

### RF-08-6 — Leer fuentes de información

- **Historia de usuario:** Como administrador · Deseo consultar fuentes de información. Para conocer de dónde proceden los datos utilizados y cuándo se actualizaron por última vez.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Consultar fuentes de información
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `GET /information-sources` y `GET /information-sources/{id}`, con la fecha de carga. La lista no tiene filtros. Falta la pantalla de administración.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Entidad (filtro); Tipo de dato (filtro); Fecha de carga (filtro); Datos cargados (filtro) | El sistema deberá permitir leer las fuentes registradas y los datos cargados, con su fecha de actualización, para saber de dónde proviene la información. | Datos de «fuentes de información» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «fuentes de información» que cumplen los criterios indicados (entidad, tipo de dato, fecha de carga, datos cargados), o informa que no hay resultados.
- [x] El sistema debe mostrar la fecha de actualización de cada fuente.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/safety_data/application/use_cases.py`, `backend/apps/safety_data/presentation/views.py`

**Pruebas:** `backend/tests/test_safety_data_api.py`

### RF-08-7 — Actualizar fuente de información

- **Historia de usuario:** Como administrador · Deseo modificar fuente de información. Para incorporar información más reciente de una fuente y conservar la vigencia de los registros.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Actualizar fuente de información
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `PUT /information-sources/{id}`; actualiza la fecha de carga. Falta la pantalla de administración.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Entidad (obligatorio); Tipo de dato (obligatorio); Fecha de carga (obligatorio); Datos cargados (opcional) | El sistema deberá permitir actualizar los datos de una fuente y la información cargada de ella, para mantenerla vigente. | Registro de «fuente de información» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El sistema guarda los cambios de «fuente de información» (entidad, tipo de dato, fecha de carga) y confirma al actor.
- [x] Se valida que el registro exista.
- [x] Se valida que los datos modificados cumplan las validaciones del registro.
- [x] El sistema debe actualizar la fecha de carga al cambiar los datos.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/safety_data/application/use_cases.py`, `backend/apps/safety_data/presentation/views.py`

**Pruebas:** `backend/tests/test_safety_data_api.py`

### RF-08-8 — Eliminar fuente de información

- **Historia de usuario:** Como administrador · Deseo eliminar fuente de información. Para impedir que datos de una fuente retirada sigan influyendo en las evaluaciones.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Eliminar fuente de información
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `DELETE /information-sources/{id}`; sus incidentes se conservan marcados y dejan de contar en el índice. Falta la pantalla de administración con la confirmación previa.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar una fuente de información que ya no se utiliza, para que sus datos dejen de intervenir en el análisis. | Registro de «fuente de información» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El sistema elimina el registro de «fuente de información» indicado y confirma al actor.
- [x] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [x] El sistema debe dejar de usar sus datos en el análisis.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/safety_data/application/use_cases.py`, `backend/apps/safety_data/presentation/views.py`

**Pruebas:** `backend/tests/test_safety_data_api.py`

## Dependencias

- **Depende de:** [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md).

## Decisiones de diseño (2026-11-22)

Tomadas para implementar el Sprint 3 sin bloquearlo; se revisan con Gacelas en la demo.

- **Tipo de incidente y del tipo de dato de la fuente:** texto libre del administrador, recortado, de 1 a 40 caracteres (decisión del 2026-11-22: nada de listas fijas en código). Se guarda y se muestra tal cual.
- **Efecto en el índice (RF-07-11):** cada incidente de los últimos 12 meses suma una penalización (`ExtraPenalty`, origen `incident`) al tramo donde ocurrió, en la franja que cubre la hora del incidente (±1 h). La ventana (`incidentWindowDays`, 365 por defecto) y el margen (`incidentMarginMinutes`, 60) son parámetros del sistema ([configuración](27-configuracion-del-sistema.md)); cambiarlos recalcula las rutas. Cada incidente lleva una **severidad** (`low`, `medium` o `high`) que elige el administrador, porque el tipo ya no la determina: baja (10), media (20) o alta (35). Un incidente guardado sin severidad se lee como `medium`; razón `invalid-incident-severity` (400) si es inválida. Registrar, editar o eliminar un incidente recalcula el índice de su ruta.
- **Fuente eliminada:** sus incidentes dejan de contar en el índice y se recalculan las rutas afectadas; el registro del incidente se conserva para el historial del administrador.
- **Permisos:** lectura y escritura solo con `routes.manage` (el corredor nunca ve incidentes; no tienen datos personales).
- **API:** `GET/POST /safety-incidents`, `GET/PUT/DELETE /safety-incidents/{id}` con filtros `routeId`, `segmentId`, `type`, `from`, `to`; `GET/POST /information-sources`, `GET/PUT/DELETE /information-sources/{id}`. Respuestas: `201 {id}`, `204`, errores `{error:{reason,message}}`.

## Supuestos por validar

- Los tipos de incidente no están enumerados en el Excel; son texto libre (ver Decisiones de diseño) y la severidad la elige el administrador.
- La importación automática desde fuentes externas (RNF-16, «Podría tener») queda fuera de las cuatro historias; aquí solo se cubre el registro manual (inferido).
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
