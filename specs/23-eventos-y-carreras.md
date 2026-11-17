# EP-23 — Eventos y carreras

> Spec de capacidad · Debe tener · **0/8 Hecha, 0 Parcial, 8 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-23 · Eventos y carreras |
| Requisitos | RF-23-1 a RF-23-8 (8 sub-requisitos) |
| Requisito de usuario (UR) | no definido en el Excel |
| RNF | sin RNF específico (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | Pedro Vargas |
| Sprint planificado | Sprint 5 · Semana 10 |
| Sprint real | Planificada: Sprint 5 (semana 10). Sin implementar. |
| Alcance del piloto | Pagos fuera del piloto: la inscripción no cobra. |
| Dependencias | [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md), [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md) |

## Propósito

Que el administrador publique eventos y carreras y que los corredores consulten e inscriban su participación.

Entradas, proceso y salidas del requisito padre en el Excel (RF-23):

- Entradas: datos del evento y de la inscripción del corredor.
- Proceso: publicar el evento, registrar inscripciones y controlar el cupo.
- Salidas: eventos próximos e inscripciones por evento o corredor.

## Alcance

**Incluye**

- CRUD de eventos y carreras (RF-23-1 a RF-23-4).
- CRUD de inscripciones a eventos (RF-23-5 a RF-23-8).

**No incluye**

- **Pagos y módulo financiero: fuera del alcance del piloto**; la inscripción no cobra.
- Resultados y clasificaciones (rankings, fuera del piloto).

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que la fecha sea posterior a la actual.
- Mostrar los eventos próximos.
- Avisar a los inscritos de los cambios.
- Avisar a los inscritos.
- Que el evento exista y tenga cupo.
- Que el corredor no esté ya inscrito.
- Mostrar las inscripciones por evento o por corredor.
- Que el estado sea Pendiente o Confirmada.
- Liberar el cupo del evento.

Decididas por el equipo o derivadas de otros documentos:

- Estados de inscripción: Pendiente o Confirmada.
- Un corredor tiene a lo sumo una inscripción por evento.
- Un evento pasado no admite inscripciones nuevas (inferido).

## Modelo de datos y contrato de API

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /events` | [RF-23-1](#rf-23-1--crear-evento-o-carrera) Crear evento o carrera | Administrador |
| `GET /events` y `GET /events/{id}` | [RF-23-2](#rf-23-2--leer-eventos-y-carreras) Leer eventos y carreras | Corredor |
| `PUT /events/{id}` | [RF-23-3](#rf-23-3--actualizar-evento-o-carrera) Actualizar evento o carrera | Administrador |
| `DELETE /events/{id}` | [RF-23-4](#rf-23-4--eliminar-evento-o-carrera) Eliminar evento o carrera | Administrador |
| `POST /events/{id}/registrations` | [RF-23-5](#rf-23-5--crear-inscripción-a-evento) Crear inscripción a evento | Corredor |
| `GET /events/{id}/registrations` y `GET /events/{id}/registrations/{id}` | [RF-23-6](#rf-23-6--leer-inscripciones-a-eventos) Leer inscripciones a eventos | Corredor |
| `PUT /events/{id}/registrations/{id}` | [RF-23-7](#rf-23-7--actualizar-inscripción-a-evento) Actualizar inscripción a evento | Corredor |
| `DELETE /events/{id}/registrations/{id}` | [RF-23-8](#rf-23-8--eliminar-inscripción-a-evento) Eliminar inscripción a evento | Corredor |

Campos propuestos de «evento o carrera» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Nombre | Sí |
| Fecha | Sí |
| Lugar | Sí |
| Distancia | Sí |
| Ruta | No |
| Descripción | No |

Campos propuestos de «inscripción a evento» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Evento | Sí |
| Corredor | Sí |
| Categoría | Sí |
| Estado {Pendiente, Confirmada} | Sí |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-23-1](#rf-23-1--crear-evento-o-carrera) | Crear evento o carrera | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-23-2](#rf-23-2--leer-eventos-y-carreras) | Leer eventos y carreras | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-23-3](#rf-23-3--actualizar-evento-o-carrera) | Actualizar evento o carrera | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-23-4](#rf-23-4--eliminar-evento-o-carrera) | Eliminar evento o carrera | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-23-5](#rf-23-5--crear-inscripción-a-evento) | Crear inscripción a evento | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-23-6](#rf-23-6--leer-inscripciones-a-eventos) | Leer inscripciones a eventos | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-23-7](#rf-23-7--actualizar-inscripción-a-evento) | Actualizar inscripción a evento | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-23-8](#rf-23-8--eliminar-inscripción-a-evento) | Eliminar inscripción a evento | Corredor | Sprint 5 · Semana 10 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-23-1 — Crear evento o carrera

- **Historia de usuario:** Como administrador · Deseo registrar evento o carrera. Para anunciar una carrera o evento con su ubicación, fecha, distancia y recorrido.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-05 · **Caso de uso:** Registrar evento o carrera
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (obligatorio); Fecha (obligatorio); Lugar (obligatorio); Distancia (obligatorio); Ruta (opcional); Descripción (opcional) | El sistema deberá permitir crear un evento o carrera con fecha, lugar, distancia, ruta y descripción, para difundirlo entre los corredores. | Registro de «evento o carrera» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (nombre, fecha, lugar, distancia), el sistema crea el registro de «evento o carrera» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que la fecha sea posterior a la actual.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-23-2 — Leer eventos y carreras

- **Historia de usuario:** Como corredor · Deseo consultar eventos y carreras. Para revisar las próximas actividades y elegir en cuáles me interesa participar.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-05 · **Caso de uso:** Consultar eventos y carreras
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (filtro); Fecha (filtro); Lugar (filtro); Distancia (filtro) | El sistema deberá permitir leer los eventos y carreras próximos y su información, para que los corredores decidan en cuáles participar. | Datos de «eventos y carreras» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «eventos y carreras» que cumplen los criterios indicados (nombre, fecha, lugar, distancia), o informa que no hay resultados.
- [ ] El sistema debe mostrar los eventos próximos.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-23-3 — Actualizar evento o carrera

- **Historia de usuario:** Como administrador · Deseo modificar evento o carrera. Para informar correctamente cualquier modificación en la fecha, lugar o características de un evento.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-05 · **Caso de uso:** Actualizar evento o carrera
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (obligatorio); Fecha (obligatorio); Lugar (obligatorio); Distancia (obligatorio); Ruta (opcional); Descripción (opcional) | El sistema deberá permitir actualizar los datos de un evento, como la fecha, el lugar o la descripción, para mantenerlo actualizado. | Registro de «evento o carrera» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «evento o carrera» (nombre, fecha, lugar, distancia) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] El sistema debe avisar a los inscritos de los cambios.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-23-4 — Eliminar evento o carrera

- **Historia de usuario:** Como administrador · Deseo eliminar evento o carrera. Para retirar un evento cancelado y avisar de la cancelación a sus inscritos.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-05 · **Caso de uso:** Eliminar evento o carrera
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar un evento cancelado, avisando a los inscritos mediante notificaciones. | Registro de «evento o carrera» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «evento o carrera» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe avisar a los inscritos.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-23-5 — Crear inscripción a evento

- **Historia de usuario:** Como corredor · Deseo inscribirme en un evento o carrera. Para formalizar la participación de un corredor en un evento y registrar su categoría.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-05 · **Caso de uso:** Inscribirse en un evento
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Evento (obligatorio); Corredor (obligatorio); Categoría (obligatorio); Estado {Pendiente, Confirmada} (obligatorio) | El sistema deberá permitir crear la inscripción de un corredor a un evento con sus datos y su categoría. | Registro de «inscripción a evento» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (evento, corredor, categoría, estado {pendiente, confirmada}), el sistema crea el registro de «inscripción a evento» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que el evento exista y tenga cupo.
- [ ] Se valida que el corredor no esté ya inscrito.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-23-6 — Leer inscripciones a eventos

- **Historia de usuario:** Como corredor · Deseo consultar inscripciones a eventos. Para verificar los inscritos de una carrera y consultar el estado de cada participación.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-05 · **Caso de uso:** Consultar inscripciones
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Evento (filtro); Corredor (filtro); Categoría (filtro); Estado (filtro) | El sistema deberá permitir leer las inscripciones de un evento o de un corredor, para el control del organizador y del participante. | Datos de «inscripciones a eventos» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «inscripciones a eventos» que cumplen los criterios indicados (evento, corredor, categoría, estado), o informa que no hay resultados.
- [ ] El sistema debe mostrar las inscripciones por evento o por corredor.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-23-7 — Actualizar inscripción a evento

- **Historia de usuario:** Como corredor · Deseo modificar inscripción a evento. Para corregir una categoría o cambiar el estado de una inscripción cuando corresponda.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-05 · **Caso de uso:** Actualizar inscripción
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Evento (obligatorio); Corredor (obligatorio); Categoría (obligatorio); Estado {Pendiente, Confirmada} (obligatorio) | El sistema deberá permitir actualizar los datos de una inscripción, como la categoría o su estado (pendiente o confirmada). | Registro de «inscripción a evento» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «inscripción a evento» (evento, corredor, categoría, estado {pendiente, confirmada}) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] Se valida que el estado sea Pendiente o Confirmada.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-23-8 — Eliminar inscripción a evento

- **Historia de usuario:** Como corredor · Deseo eliminar inscripción a evento. Para liberar una plaza cuando una persona cancele su participación.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-05 · **Caso de uso:** Cancelar inscripción
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar una inscripción, liberando el cupo, cuando el corredor ya no participará. | Registro de «inscripción a evento» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «inscripción a evento» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe liberar el cupo del evento.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md), [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md).

## Supuestos por validar

- Las categorías de inscripción no están enumeradas en el Excel.
- Quién confirma una inscripción (el administrador o el sistema) no está definido.
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
