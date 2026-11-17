# EP-18 — Notificaciones

> Spec de capacidad · Debe tener · **0/4 Hecha, 0 Parcial, 4 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-18 · Notificaciones |
| Requisitos | RF-18-1 a RF-18-4 (4 sub-requisitos) |
| Requisito de usuario (UR) | no definido en el Excel |
| RNF | sin RNF específico (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | Pedro Vargas |
| Sprint planificado | Sprint 5 · Semana 10 |
| Sprint real | Planificada: Sprint 5 (semana 10). Sin implementar. |
| Dependencias | [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md) |

## Propósito

Que el sistema genere y el corredor consulte notificaciones: recordatorio de entrenamiento, alerta de zona, invitación a salida grupal y aviso del estado de un reporte. Respeta las preferencias de notificación ([EP-26](26-preferencias-de-usuario.md)).

Entradas, proceso y salidas del requisito padre en el Excel (RF-18):

- Entradas: tipo, destinatario y contenido de la notificación.
- Proceso: generar y enviar la notificación y actualizar su estado de lectura.
- Salidas: bandeja con notificaciones leídas y pendientes.

## Alcance

**Incluye**

- CRUD de notificaciones (RF-18-1 a RF-18-4).
- Entrega push con Firebase Cloud Messaging.

**No incluye**

- Notificaciones por SMS o WhatsApp (decisión abierta).
- Mensajería entre corredores.

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que el destinatario sea un usuario registrado.
- Que el usuario consulte solo sus propias notificaciones.
- Que el estado sea Leída o Pendiente.
- Que solo el destinatario elimine sus notificaciones.

Decididas por el equipo o derivadas de otros documentos:

- Tipos: recordatorio de entrenamiento, alerta de zona, invitación a salida grupal y aviso de estado de reporte.
- Una notificación solo la ve su destinatario.
- No se envían notificaciones de un tipo que el usuario apagó en sus preferencias.

## Modelo de datos y contrato de API

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /notifications` | [RF-18-1](#rf-18-1--crear-notificación) Crear notificación | Sistema |
| `GET /notifications` y `GET /notifications/{id}` | [RF-18-2](#rf-18-2--leer-notificaciones) Leer notificaciones | Usuario |
| `PUT /notifications/{id}` | [RF-18-3](#rf-18-3--actualizar-notificación) Actualizar notificación | Usuario |
| `DELETE /notifications/{id}` | [RF-18-4](#rf-18-4--eliminar-notificación) Eliminar notificación | Usuario |

Campos propuestos de «notificación» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Tipo {Recordatorio de entrenamiento, Alerta de zona, Invitación a salida grupal, Aviso de estado de reporte} | Sí |
| Destinatario | Sí |
| Contenido | Sí |
| Estado {Leída, Pendiente} | Sí |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-18-1](#rf-18-1--crear-notificación) | Crear notificación | Sistema | Sprint 5 · Semana 10 | Pendiente |
| [RF-18-2](#rf-18-2--leer-notificaciones) | Leer notificaciones | Usuario | Sprint 5 · Semana 10 | Pendiente |
| [RF-18-3](#rf-18-3--actualizar-notificación) | Actualizar notificación | Usuario | Sprint 5 · Semana 10 | Pendiente |
| [RF-18-4](#rf-18-4--eliminar-notificación) | Eliminar notificación | Usuario | Sprint 5 · Semana 10 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-18-1 — Crear notificación

- **Historia de usuario:** Como sistema · Deseo generar notificaciones para los usuarios. Para avisar sobre entrenamientos, zonas de riesgo, invitaciones o reportes.
- **Actor:** Sistema · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01 · **Caso de uso:** Generar notificación
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Tipo {Recordatorio de entrenamiento, Alerta de zona, Invitación a salida grupal, Aviso de estado de reporte} (obligatorio); Destinatario (obligatorio); Contenido (obligatorio); Estado {Leída, Pendiente} (obligatorio) | El sistema deberá permitir crear una notificación para el usuario (recordatorio de entrenamiento, alerta de zona, invitación a una salida grupal o aviso sobre el estado de su reporte), para mantenerlo informado. | Registro de «notificación» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (tipo {recordatorio de entrenamiento, alerta de zona, invitación a salida grupal, aviso de estado de reporte}, destinatario, contenido, estado {leída, pendiente}), el sistema crea el registro de «notificación» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que el destinatario sea un usuario registrado.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-18-2 — Leer notificaciones

- **Historia de usuario:** Como corredor · Deseo consultar notificaciones. Para revisar los avisos recibidos y distinguir los que todavía no he leído.
- **Actor:** Usuario · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01 · **Caso de uso:** Consultar notificaciones
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Tipo (filtro); Destinatario (filtro); Contenido (filtro); Estado (filtro) | El sistema deberá permitir leer las notificaciones recibidas y su estado de lectura, para que el usuario las revise. | Datos de «notificaciones» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «notificaciones» que cumplen los criterios indicados (tipo, destinatario, contenido, estado), o informa que no hay resultados.
- [ ] Se valida que el usuario consulte solo sus propias notificaciones.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-18-3 — Actualizar notificación

- **Historia de usuario:** Como corredor · Deseo modificar mi notificación. Para marcar un aviso como leído o pendiente y llevar un control de lo revisado.
- **Actor:** Usuario · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01 · **Caso de uso:** Actualizar notificación
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Tipo {Recordatorio de entrenamiento, Alerta de zona, Invitación a salida grupal, Aviso de estado de reporte} (obligatorio); Destinatario (obligatorio); Contenido (obligatorio); Estado {Leída, Pendiente} (obligatorio) | El sistema deberá permitir actualizar el estado de una notificación (leída o pendiente), para llevar el control de lo informado. | Registro de «notificación» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «notificación» (tipo {recordatorio de entrenamiento, alerta de zona, invitación a salida grupal, aviso de estado de reporte}, destinatario, contenido, estado {leída, pendiente}) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] Se valida que el estado sea Leída o Pendiente.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-18-4 — Eliminar notificación

- **Historia de usuario:** Como corredor · Deseo eliminar mi notificación. Para despejar mi bandeja quitando avisos que ya no necesito.
- **Actor:** Usuario · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01 · **Caso de uso:** Eliminar notificación
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar notificaciones de la bandeja del usuario, para mantenerla ordenada. | Registro de «notificación» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «notificación» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] Se valida que solo el destinatario elimine sus notificaciones.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md).

## Supuestos por validar

- «Actualizar notificación» se entiende como marcarla leída/no leída (inferido); el Excel lista contenido y estado.
- Si las notificaciones deben estar activadas por defecto o ser opt-in está abierto (CONTEXTO sección 10 punto 9).
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
