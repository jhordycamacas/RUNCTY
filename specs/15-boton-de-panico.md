# EP-15 — Botón de pánico

> Spec de capacidad · Debe tener · **0/4 Hecha, 0 Parcial, 4 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-15 · Botón de pánico |
| Requisitos | RF-15-1 a RF-15-4 (4 sub-requisitos) |
| Requisito de usuario (UR) | UR-09 |
| RNF | RNF-06, RNF-09, RNF-17 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | Jhordy Camacas |
| Sprint planificado | Sprint 4 · Semana 9 |
| Sprint real | Planificada: Sprint 4 (semana 9). Sin implementar (existe un atajo interino al marcador `tel:911`). |
| Alcance del piloto | Integración con ECU 911 fuera del piloto; hoy solo hay un atajo `tel:911`. |
| Dependencias | [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md), [RF-03 · Contactos de confianza](03-contactos-de-confianza.md) |

## Propósito

Que el corredor active un botón de pánico visible y de fácil acceso que registre una alerta con su ubicación, fecha y hora y la envíe a sus contactos de confianza en menos de 5 segundos. Exige al menos un contacto ([EP-03](03-contactos-de-confianza.md)).

Entradas, proceso y salidas del requisito padre en el Excel (RF-15):

- Entradas: activación del botón, ubicación, fecha, hora y contactos de confianza.
- Proceso: registrar la alerta, enviarla a los contactos y actualizar su estado.
- Salidas: alerta enviada con la ubicación del corredor e historial de alertas.

## Alcance

**Incluye**

- Crear la alerta al activar el botón, con ubicación, fecha y hora, y notificar a los contactos (RF-15-1).
- Consultar el historial de alertas, actualizar su estado y eliminarlas (RF-15-2 a RF-15-4).

**No incluye**

- **Integración con ECU 911: fuera del alcance del piloto** (Documento de Visión).
- Canal de entrega (push, SMS o WhatsApp): decisión abierta, CONTEXTO sección 10 punto 4.
- Ubicación en tiempo real continua: [EP-16](16-ubicacion-compartida.md).

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que el corredor tenga al menos un contacto de confianza.
- Notificar a los contactos con la ubicación, fecha y hora.
- Que el corredor consulte solo sus propias alertas.
- Que el estado sea Activa, Atendida o Cancelada.
- Eliminar solo alertas finalizadas o registradas por error.

Decididas por el equipo o derivadas de otros documentos:

- Estados de la alerta: Activa, Atendida, Cancelada.
- La alerta llega a los contactos en ≤ 5 s desde la activación, con conexión (RNF-06).
- El botón es accesible desde la pantalla principal y durante un entrenamiento en ≤ 2 toques (RNF-17) y nunca lo interrumpe la publicidad (RNF-26).
- La alerta la dispara el cliente y el servidor la reparte a los contactos.
- Hoy el botón SOS del área del corredor solo confirma y abre el marcador del teléfono con `tel:911`: es una medida interina, **no** cumple esta capacidad.

## Modelo de datos y contrato de API

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /panic-alerts` | [RF-15-1](#rf-15-1--crear-alerta-de-pánico) Crear alerta de pánico | Corredor |
| `GET /panic-alerts` y `GET /panic-alerts/{id}` | [RF-15-2](#rf-15-2--leer-alertas-de-pánico) Leer alertas de pánico | Corredor |
| `PATCH /panic-alerts/{id}/status` | [RF-15-3](#rf-15-3--actualizar-estado-de-alerta-de-pánico) Actualizar estado de alerta de pánico | Corredor |
| `DELETE /panic-alerts/{id}` | [RF-15-4](#rf-15-4--eliminar-alerta-de-pánico) Eliminar alerta de pánico | Corredor |

Campos propuestos de «alerta de pánico» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Ubicación | Sí |
| Fecha | Sí |
| Hora | Sí |
| Estado {Activa, Atendida, Cancelada} | Sí |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-15-1](#rf-15-1--crear-alerta-de-pánico) | Crear alerta de pánico | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-15-2](#rf-15-2--leer-alertas-de-pánico) | Leer alertas de pánico | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-15-3](#rf-15-3--actualizar-estado-de-alerta-de-pánico) | Actualizar estado de alerta de pánico | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-15-4](#rf-15-4--eliminar-alerta-de-pánico) | Eliminar alerta de pánico | Corredor | Sprint 4 · Semana 9 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-15-1 — Crear alerta de pánico

- **Historia de usuario:** Como corredor · Deseo registrar alerta de pánico. Para avisar rápidamente a mis contactos de confianza y registrar dónde y cuándo pedí ayuda.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01, RF-03 · **Caso de uso:** Activar botón de pánico
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ubicación (obligatorio); Fecha (obligatorio); Hora (obligatorio); Estado {Activa, Atendida, Cancelada} (obligatorio) | El sistema deberá permitir crear una alerta al activar el botón de pánico, guardando su ubicación, fecha y hora, y notificando a los contactos de confianza. | Registro de «alerta de pánico» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (ubicación, fecha, hora, estado {activa, atendida, cancelada}), el sistema crea el registro de «alerta de pánico» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que el corredor tenga al menos un contacto de confianza.
- [ ] El sistema debe notificar a los contactos con la ubicación, fecha y hora.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-15-2 — Leer alertas de pánico

- **Historia de usuario:** Como corredor · Deseo consultar alertas de pánico. Para revisar las alertas que activé, sus ubicaciones y el estado de cada una.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01, RF-03 · **Caso de uso:** Consultar alertas de pánico
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ubicación (filtro); Fecha (filtro); Hora (filtro); Estado (filtro) | El sistema deberá permitir leer el historial de alertas de pánico y los datos de ubicación, fecha, hora y estado de cada alerta. | Datos de «alertas de pánico» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «alertas de pánico» que cumplen los criterios indicados (ubicación, fecha, hora, estado), o informa que no hay resultados.
- [ ] Se valida que el corredor consulte solo sus propias alertas.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-15-3 — Actualizar estado de alerta de pánico

- **Historia de usuario:** Como corredor · Deseo modificar estado de alerta de pánico. Para indicar si una solicitud de ayuda sigue activa, fue atendida o se activó por accidente.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01, RF-03 · **Caso de uso:** Actualizar estado de alerta de pánico
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ubicación (obligatorio); Fecha (obligatorio); Hora (obligatorio); Estado {Activa, Atendida, Cancelada} (obligatorio) | El sistema deberá permitir actualizar el estado de una alerta de pánico para indicar si continúa activa, fue atendida o se canceló por activación accidental. | Registro de «estado de alerta de pánico» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «estado de alerta de pánico» (ubicación, fecha, hora, estado {activa, atendida, cancelada}) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] Se valida que el estado sea Activa, Atendida o Cancelada.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-15-4 — Eliminar alerta de pánico

- **Historia de usuario:** Como corredor · Deseo eliminar alerta de pánico. Para retirar del historial una alerta finalizada o errónea después de confirmarlo.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01, RF-03 · **Caso de uso:** Eliminar alerta de pánico
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar del historial una alerta de pánico finalizada o registrada por error, previa confirmación. | Registro de «alerta de pánico» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «alerta de pánico» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe eliminar solo alertas finalizadas o registradas por error.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md), [RF-03 · Contactos de confianza](03-contactos-de-confianza.md).

## Supuestos por validar

- Menores de edad: el consentimiento parental para compartir ubicación en alertas está sin resolver (CONTEXTO sección 10 punto 5).
- Eliminar una alerta no debería borrar la evidencia de una alerta atendida; el Excel permite eliminar, se mantiene como pide y se revisa con el cliente (inferido).
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
