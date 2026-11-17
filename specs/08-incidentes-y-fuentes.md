# EP-08 — Incidentes y fuentes de información de seguridad

> Spec de capacidad · Debe tener · **0/8 Hecha, 0 Parcial, 8 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-08 · Incidentes y fuentes de información de seguridad |
| Requisitos | RF-08-1 a RF-08-8 (8 sub-requisitos) |
| Requisito de usuario (UR) | UR-05 |
| RNF | RNF-16 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | Jhordy Camacas |
| Sprint planificado | Sprint 3 · Semana 7 |
| Sprint real | Planificada: Sprint 3 (semana 7). Sin implementar. |
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

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

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
| [RF-08-1](#rf-08-1--crear-incidente-de-seguridad) | Crear incidente de seguridad | Administrador | Sprint 3 · Semana 7 | Pendiente |
| [RF-08-2](#rf-08-2--leer-incidentes-de-seguridad) | Leer incidentes de seguridad | Administrador | Sprint 3 · Semana 7 | Pendiente |
| [RF-08-3](#rf-08-3--actualizar-incidente-de-seguridad) | Actualizar incidente de seguridad | Administrador | Sprint 3 · Semana 7 | Pendiente |
| [RF-08-4](#rf-08-4--eliminar-incidente-de-seguridad) | Eliminar incidente de seguridad | Administrador | Sprint 3 · Semana 7 | Pendiente |
| [RF-08-5](#rf-08-5--crear-fuente-de-información) | Crear fuente de información | Administrador | Sprint 3 · Semana 7 | Pendiente |
| [RF-08-6](#rf-08-6--leer-fuentes-de-información) | Leer fuentes de información | Administrador | Sprint 3 · Semana 7 | Pendiente |
| [RF-08-7](#rf-08-7--actualizar-fuente-de-información) | Actualizar fuente de información | Administrador | Sprint 3 · Semana 7 | Pendiente |
| [RF-08-8](#rf-08-8--eliminar-fuente-de-información) | Eliminar fuente de información | Administrador | Sprint 3 · Semana 7 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-08-1 — Crear incidente de seguridad

- **Historia de usuario:** Como administrador · Deseo registrar incidente de seguridad. Para asociar a un tramo los hechos registrados con fecha, hora, tipo y fuente verificable.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Registrar incidente de seguridad
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 3 · Semana 7.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta o tramo (obligatorio); Tipo (obligatorio); Fecha (obligatorio); Hora (obligatorio); Fuente de información (obligatorio) | El sistema deberá permitir crear incidentes de seguridad asociados a un tramo, indicando fecha, hora, tipo y fuente de información. | Registro de «incidente de seguridad» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (ruta o tramo, tipo, fecha, hora, fuente de información), el sistema crea el registro de «incidente de seguridad» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que la ruta o el tramo exista.
- [ ] Se valida que la fecha no sea posterior a la actual.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-08-2 — Leer incidentes de seguridad

- **Historia de usuario:** Como administrador · Deseo consultar incidentes de seguridad. Para examinar antecedentes de incidentes por tramo, fecha y clase al revisar la información disponible.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Consultar incidentes de seguridad
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 3 · Semana 7.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta o tramo (filtro); Tipo (filtro); Fecha (filtro); Hora (filtro) | El sistema deberá permitir leer el historial de incidentes de seguridad, filtrando por tramo, fecha y tipo de incidente. | Datos de «incidentes de seguridad» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «incidentes de seguridad» que cumplen los criterios indicados (ruta o tramo, tipo, fecha, hora), o informa que no hay resultados.
- [ ] El sistema debe permitir filtrar por tramo, fecha y tipo de incidente.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-08-3 — Actualizar incidente de seguridad

- **Historia de usuario:** Como administrador · Deseo modificar incidente de seguridad. Para rectificar la ubicación o los datos de un incidente cuando se detecten inexactitudes.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Actualizar incidente de seguridad
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 3 · Semana 7.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta o tramo (obligatorio); Tipo (obligatorio); Fecha (obligatorio); Hora (obligatorio); Fuente de información (obligatorio) | El sistema deberá permitir actualizar los datos de un incidente de seguridad, incluyendo su ubicación, fecha, tipo y fuente de información. | Registro de «incidente de seguridad» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «incidente de seguridad» (ruta o tramo, tipo, fecha, hora, fuente de información) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] Se valida que la fecha siga sin ser posterior a la actual.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-08-4 — Eliminar incidente de seguridad

- **Historia de usuario:** Como administrador · Deseo eliminar incidente de seguridad. Para eliminar registros duplicados o erróneos sin alterar incidentes válidos.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Eliminar incidente de seguridad
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 3 · Semana 7.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar un incidente de seguridad registrado por error o duplicado, previa confirmación. | Registro de «incidente de seguridad» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «incidente de seguridad» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe eliminar solo incidentes duplicados o registrados por error.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-08-5 — Crear fuente de información

- **Historia de usuario:** Como administrador · Deseo registrar fuente de información. Para identificar y organizar las fuentes autorizadas que alimentan los análisis de seguridad y movilidad.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Registrar fuente de información
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 3 · Semana 7.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Entidad (obligatorio); Tipo de dato (obligatorio); Fecha de carga (obligatorio); Datos cargados (opcional) | El sistema deberá permitir crear una fuente de información de seguridad y movilidad (ECU 911, Policía Nacional, Agencia de Tránsito, estadísticas del cantón o clubes de running) y cargar sus datos, para alimentar el análisis de seguridad. | Registro de «fuente de información» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (entidad, tipo de dato, fecha de carga), el sistema crea el registro de «fuente de información» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que la entidad no esté ya registrada con el mismo tipo de dato.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-08-6 — Leer fuentes de información

- **Historia de usuario:** Como administrador · Deseo consultar fuentes de información. Para conocer de dónde proceden los datos utilizados y cuándo se actualizaron por última vez.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Consultar fuentes de información
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 3 · Semana 7.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Entidad (filtro); Tipo de dato (filtro); Fecha de carga (filtro); Datos cargados (filtro) | El sistema deberá permitir leer las fuentes registradas y los datos cargados, con su fecha de actualización, para saber de dónde proviene la información. | Datos de «fuentes de información» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «fuentes de información» que cumplen los criterios indicados (entidad, tipo de dato, fecha de carga, datos cargados), o informa que no hay resultados.
- [ ] El sistema debe mostrar la fecha de actualización de cada fuente.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-08-7 — Actualizar fuente de información

- **Historia de usuario:** Como administrador · Deseo modificar fuente de información. Para incorporar información más reciente de una fuente y conservar la vigencia de los registros.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Actualizar fuente de información
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 3 · Semana 7.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Entidad (obligatorio); Tipo de dato (obligatorio); Fecha de carga (obligatorio); Datos cargados (opcional) | El sistema deberá permitir actualizar los datos de una fuente y la información cargada de ella, para mantenerla vigente. | Registro de «fuente de información» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «fuente de información» (entidad, tipo de dato, fecha de carga) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] El sistema debe actualizar la fecha de carga al cambiar los datos.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-08-8 — Eliminar fuente de información

- **Historia de usuario:** Como administrador · Deseo eliminar fuente de información. Para impedir que datos de una fuente retirada sigan influyendo en las evaluaciones.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05 · **Caso de uso:** Eliminar fuente de información
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 3 · Semana 7.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar una fuente de información que ya no se utiliza, para que sus datos dejen de intervenir en el análisis. | Registro de «fuente de información» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «fuente de información» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe dejar de usar sus datos en el análisis.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md).

## Supuestos por validar

- Los tipos de incidente no están enumerados en el Excel; se definen con Gacelas antes de implementar.
- La importación automática desde fuentes externas (RNF-16, «Podría tener») queda fuera de las cuatro historias; aquí solo se cubre el registro manual (inferido).
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
