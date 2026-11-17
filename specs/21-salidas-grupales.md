# EP-21 — Salidas grupales

> Spec de capacidad · Debería tener · **0/4 Hecha, 0 Parcial, 4 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-21 · Salidas grupales |
| Requisitos | RF-21-1 a RF-21-4 (4 sub-requisitos) |
| Requisito de usuario (UR) | no definido en el Excel |
| RNF | sin RNF específico (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debería tener |
| Responsable | Santiago Matute |
| Sprint planificado | Sprint 5 · Semana 10 |
| Sprint real | Planificada: Sprint 5 (semana 10). Sin implementar. Es «Debería tener». |
| Dependencias | [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md), [RF-19 · Clubes de running y membresías](19-clubes-y-membresias.md), [RF-20 · Puntos de encuentro](20-puntos-de-encuentro.md) |

## Propósito

Que un corredor organice salidas grupales con fecha, hora, punto de encuentro, ruta y cupo, y que otros corredores se sumen.

Entradas, proceso y salidas del requisito padre en el Excel (RF-21):

- Entradas: fecha, hora, punto de encuentro, ruta, distancia y cupo.
- Proceso: controlar el cupo y notificar a los participantes ante cambios o cancelación.
- Salidas: salidas próximas con su cupo disponible y avisos a los participantes.

## Alcance

**Incluye**

- CRUD de salidas grupales (RF-21-1 a RF-21-4).

**No incluye**

- Chat del grupo.
- Cobro por salida.

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que el cupo sea mayor a cero.
- Que la fecha sea posterior a la actual.
- Mostrar las salidas próximas con su cupo disponible.
- Avisar a los inscritos del cambio.
- Notificar a los participantes.

Decididas por el equipo o derivadas de otros documentos:

- El cupo es un entero mayor a cero y no puede quedar por debajo de los inscritos.
- La salida usa una ruta del catálogo y un punto de encuentro existente ([EP-05](05-catalogo-de-rutas.md), [EP-20](20-puntos-de-encuentro.md)).
- Solo el organizador modifica o elimina la salida; las invitaciones llegan como notificaciones ([EP-18](18-notificaciones.md)).

## Modelo de datos y contrato de API

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /group-runs` | [RF-21-1](#rf-21-1--crear-salida-grupal) Crear salida grupal | Corredor |
| `GET /group-runs` y `GET /group-runs/{id}` | [RF-21-2](#rf-21-2--leer-salidas-grupales) Leer salidas grupales | Corredor |
| `PUT /group-runs/{id}` | [RF-21-3](#rf-21-3--actualizar-salida-grupal) Actualizar salida grupal | Corredor |
| `DELETE /group-runs/{id}` | [RF-21-4](#rf-21-4--eliminar-salida-grupal) Eliminar salida grupal | Corredor |

Campos propuestos de «salida grupal» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Fecha | Sí |
| Hora | Sí |
| Punto de encuentro | Sí |
| Ruta | Sí |
| Cupo | Sí |
| Distancia | No |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-21-1](#rf-21-1--crear-salida-grupal) | Crear salida grupal | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-21-2](#rf-21-2--leer-salidas-grupales) | Leer salidas grupales | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-21-3](#rf-21-3--actualizar-salida-grupal) | Actualizar salida grupal | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-21-4](#rf-21-4--eliminar-salida-grupal) | Eliminar salida grupal | Corredor | Sprint 5 · Semana 10 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-21-1 — Crear salida grupal

- **Historia de usuario:** Como corredor · Deseo registrar salida grupal. Para convocar corredores a una sesión con fecha, ruta, distancia, punto de encuentro y cupo definidos.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-05, RF-19, RF-20 · **Caso de uso:** Organizar salida grupal
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Fecha (obligatorio); Hora (obligatorio); Punto de encuentro (obligatorio); Ruta (obligatorio); Cupo (obligatorio); Distancia (opcional) | El sistema debería permitir crear una salida grupal con su fecha, hora, punto de encuentro, ruta, distancia y cupo, para convocar a los corredores. | Registro de «salida grupal» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (fecha, hora, punto de encuentro, ruta, cupo), el sistema crea el registro de «salida grupal» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que el cupo sea mayor a cero.
- [ ] Se valida que la fecha sea posterior a la actual.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-21-2 — Leer salidas grupales

- **Historia de usuario:** Como corredor · Deseo consultar salidas grupales. Para revisar próximas salidas y saber si todavía hay plazas disponibles.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-05, RF-19, RF-20 · **Caso de uso:** Consultar salidas grupales
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Fecha (filtro); Hora (filtro); Punto de encuentro (filtro); Ruta (filtro) | El sistema debería permitir leer las salidas grupales próximas y su cupo disponible, para unirse a las que le interesan. | Datos de «salidas grupales» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «salidas grupales» que cumplen los criterios indicados (fecha, hora, punto de encuentro, ruta), o informa que no hay resultados.
- [ ] El sistema debe mostrar las salidas próximas con su cupo disponible.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-21-3 — Actualizar salida grupal

- **Historia de usuario:** Como corredor · Deseo modificar salida grupal. Para comunicar a las personas inscritas los cambios de horario, recorrido o disponibilidad.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-05, RF-19, RF-20 · **Caso de uso:** Actualizar salida grupal
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Fecha (obligatorio); Hora (obligatorio); Punto de encuentro (obligatorio); Ruta (obligatorio); Cupo (obligatorio); Distancia (opcional) | El sistema debería permitir actualizar la fecha, la hora, el punto de encuentro, la ruta o el cupo de una salida, avisando a los inscritos, para mantenerlos informados. | Registro de «salida grupal» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «salida grupal» (fecha, hora, punto de encuentro, ruta, cupo) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] El sistema debe avisar a los inscritos del cambio.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-21-4 — Eliminar salida grupal

- **Historia de usuario:** Como corredor · Deseo eliminar salida grupal. Para cancelar una salida y avisar a quienes se habían inscrito.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-05, RF-19, RF-20 · **Caso de uso:** Eliminar salida grupal
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema debería permitir eliminar una salida grupal cancelada, notificando a los participantes. | Registro de «salida grupal» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «salida grupal» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe notificar a los participantes.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md), [RF-19 · Clubes de running y membresías](19-clubes-y-membresias.md), [RF-20 · Puntos de encuentro](20-puntos-de-encuentro.md).

## Supuestos por validar

- El mecanismo para sumarse a una salida (inscripción) no tiene historia propia en el Excel; se resuelve con el cupo y las notificaciones, a confirmar.
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
