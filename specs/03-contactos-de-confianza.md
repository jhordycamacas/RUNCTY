# EP-03 — Contactos de confianza

> Spec de capacidad · Debe tener · **0/4 Hecha, 0 Parcial, 4 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-03 · Contactos de confianza |
| Requisitos | RF-03-1 a RF-03-4 (4 sub-requisitos) |
| Requisito de usuario (UR) | UR-10 |
| RNF | RNF-05 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | Pedro Vargas |
| Sprint planificado | Sprint 4 · Semana 9 |
| Sprint real | Planificada: Sprint 4 (semana 9). Sin implementar. |
| Dependencias | [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md) |

## Propósito

Que el corredor registre las personas de confianza que recibirán sus alertas de pánico y verán su ubicación en una sesión compartida. Sin al menos un contacto no se puede activar el botón de pánico ([EP-15](15-boton-de-panico.md)).

Entradas, proceso y salidas del requisito padre en el Excel (RF-03):

- Entradas: nombre, parentesco, teléfono y correo del contacto.
- Proceso: validar el formato del teléfono y del correo y guardar el cambio.
- Salidas: lista de contactos de confianza y confirmación.

## Alcance

**Incluye**

- CRUD de contactos de confianza propios (RF-03-1 a RF-03-4).

**No incluye**

- Envío de alertas ([EP-15](15-boton-de-panico.md)) y ubicación en tiempo real ([EP-16](16-ubicacion-compartida.md)).
- Canal de entrega de la alerta (push, SMS o WhatsApp): decisión abierta, CONTEXTO sección 10 punto 4.

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que el teléfono tenga formato válido.
- Que no se repita el mismo contacto del corredor.
- Que el corredor consulte solo sus propios contactos.
- Que el teléfono mantenga formato válido.
- Que el contacto eliminado deje de recibir alertas y ubicación.

Decididas por el equipo o derivadas de otros documentos:

- Cada corredor solo ve y modifica sus propios contactos.
- Los contactos solo reciben la ubicación mientras dure la sesión compartida (RNF-05).

## Modelo de datos y contrato de API

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /trusted-contacts` | [RF-03-1](#rf-03-1--crear-contacto-de-confianza) Crear contacto de confianza | Corredor |
| `GET /trusted-contacts` y `GET /trusted-contacts/{id}` | [RF-03-2](#rf-03-2--leer-contactos-de-confianza) Leer contactos de confianza | Corredor |
| `PUT /trusted-contacts/{id}` | [RF-03-3](#rf-03-3--actualizar-contacto-de-confianza) Actualizar contacto de confianza | Corredor |
| `DELETE /trusted-contacts/{id}` | [RF-03-4](#rf-03-4--eliminar-contacto-de-confianza) Eliminar contacto de confianza | Corredor |

Campos propuestos de «contacto de confianza» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Nombre | Sí |
| Teléfono | Sí |
| Parentesco | No |
| Correo electrónico | No |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-03-1](#rf-03-1--crear-contacto-de-confianza) | Crear contacto de confianza | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-03-2](#rf-03-2--leer-contactos-de-confianza) | Leer contactos de confianza | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-03-3](#rf-03-3--actualizar-contacto-de-confianza) | Actualizar contacto de confianza | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-03-4](#rf-03-4--eliminar-contacto-de-confianza) | Eliminar contacto de confianza | Corredor | Sprint 4 · Semana 9 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-03-1 — Crear contacto de confianza

- **Historia de usuario:** Como corredor · Deseo registrar mi contacto de confianza. Para disponer de los datos de personas a quienes avisar si necesito ayuda durante una carrera.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01 · **Caso de uso:** Registrar contacto de confianza
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (obligatorio); Teléfono (obligatorio); Parentesco (opcional); Correo electrónico (opcional) | El sistema deberá permitir crear un contacto de confianza con su nombre, parentesco, teléfono y correo electrónico. | Registro de «contacto de confianza» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (nombre, teléfono), el sistema crea el registro de «contacto de confianza» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que el teléfono tenga formato válido.
- [ ] Se valida que no se repita el mismo contacto del corredor.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-03-2 — Leer contactos de confianza

- **Historia de usuario:** Como corredor · Deseo consultar mis contactos de confianza. Para comprobar quién recibiría mis alertas antes de compartir información de ubicación.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01 · **Caso de uso:** Consultar contactos de confianza
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (filtro); Teléfono (filtro); Parentesco (filtro); Correo electrónico (filtro) | El sistema deberá permitir leer la lista de contactos de confianza del usuario, para que sepa quién recibirá sus alertas y elija con quién compartir su ubicación. | Datos de «contactos de confianza» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «contactos de confianza» que cumplen los criterios indicados (nombre, teléfono, parentesco, correo electrónico), o informa que no hay resultados.
- [ ] Se valida que el corredor consulte solo sus propios contactos.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-03-3 — Actualizar contacto de confianza

- **Historia de usuario:** Como corredor · Deseo modificar mi contacto de confianza. Para asegurar que las alertas se envíen a teléfonos y correos de contacto vigentes.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01 · **Caso de uso:** Actualizar contacto de confianza
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (obligatorio); Teléfono (obligatorio); Parentesco (opcional); Correo electrónico (opcional) | El sistema deberá permitir actualizar el teléfono, el correo u otros datos de un contacto de confianza, para asegurar que las alertas lleguen a datos vigentes. | Registro de «contacto de confianza» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «contacto de confianza» (nombre, teléfono) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] Se valida que el teléfono mantenga formato válido.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-03-4 — Eliminar contacto de confianza

- **Historia de usuario:** Como corredor · Deseo eliminar mi contacto de confianza. Para impedir que una persona que retiré siga recibiendo mis alertas o mi ubicación.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01 · **Caso de uso:** Eliminar contacto de confianza
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar un contacto de confianza, para que deje de recibir la ubicación y las alertas del corredor. | Registro de «contacto de confianza» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «contacto de confianza» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] Se valida que el contacto eliminado deje de recibir alertas y ubicación.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md).
- **Dependen de esta capacidad:** [EP-15 · Botón de pánico](15-boton-de-panico.md), [EP-16 · Ubicación compartida en tiempo real](16-ubicacion-compartida.md).

## Supuestos por validar

- El teléfono se valida con formato ecuatoriano (inferido); el Excel solo dice «teléfono».
- No se fija un máximo de contactos; el Excel no lo indica.
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
