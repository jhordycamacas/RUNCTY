# EP-22 — Compañeros para correr

> Spec de capacidad · Debería tener · **0/4 Hecha, 0 Parcial, 4 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-22 · Compañeros para correr |
| Requisitos | RF-22-1 a RF-22-4 (4 sub-requisitos) |
| Requisito de usuario (UR) | no definido en el Excel |
| RNF | sin RNF específico (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debería tener |
| Responsable | Santiago Matute |
| Sprint planificado | Sprint 5 · Semana 10 |
| Sprint real | Planificada: Sprint 5 (semana 10). Sin implementar. Es «Debería tener». |
| Dependencias | [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md), [RF-20 · Puntos de encuentro](20-puntos-de-encuentro.md) |

## Propósito

Que el corredor publique una solicitud de compañía (ritmo, horario y punto de encuentro) para correr acompañado, fortaleciendo la comunidad.

Entradas, proceso y salidas del requisito padre en el Excel (RF-22):

- Entradas: ritmo, horario y punto de encuentro.
- Proceso: comparar ritmo, horario y cercanía con otras solicitudes.
- Salidas: personas sugeridas para ir juntas al punto de encuentro.

## Alcance

**Incluye**

- CRUD de solicitudes de compañía (RF-22-1 a RF-22-4).

**No incluye**

- Emparejamiento automático y mensajería.

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que el corredor no tenga otra solicitud activa con el mismo horario.
- Mostrar personas sugeridas con ritmo y horario similares.
- Que la solicitud siga activa.
- Dejar de aparecer como disponible para correr.

Decididas por el equipo o derivadas de otros documentos:

- Solo se muestran solicitudes de corredores cercanos al punto de encuentro y con ritmo compatible (idea diferenciadora del producto; criterio por definir).
- La solicitud nunca expone datos personales más allá del nombre público y el ritmo.

## Modelo de datos y contrato de API

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /companion-requests` | [RF-22-1](#rf-22-1--crear-solicitud-de-compañía) Crear solicitud de compañía | Corredor |
| `GET /companion-requests` y `GET /companion-requests/{id}` | [RF-22-2](#rf-22-2--leer-solicitudes-de-compañía) Leer solicitudes de compañía | Corredor |
| `PUT /companion-requests/{id}` | [RF-22-3](#rf-22-3--actualizar-solicitud-de-compañía) Actualizar solicitud de compañía | Corredor |
| `DELETE /companion-requests/{id}` | [RF-22-4](#rf-22-4--eliminar-solicitud-de-compañía) Eliminar solicitud de compañía | Corredor |

Campos propuestos de «solicitud de compañía» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Ritmo | Sí |
| Horario | Sí |
| Punto de encuentro | Sí |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-22-1](#rf-22-1--crear-solicitud-de-compañía) | Crear solicitud de compañía | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-22-2](#rf-22-2--leer-solicitudes-de-compañía) | Leer solicitudes de compañía | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-22-3](#rf-22-3--actualizar-solicitud-de-compañía) | Actualizar solicitud de compañía | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-22-4](#rf-22-4--eliminar-solicitud-de-compañía) | Eliminar solicitud de compañía | Corredor | Sprint 5 · Semana 10 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-22-1 — Crear solicitud de compañía

- **Historia de usuario:** Como corredor · Deseo registrar solicitud de compañía. Para encontrar personas que quieran correr con ritmo, horario y lugar de reunión similares a los míos.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-20 · **Caso de uso:** Solicitar compañía para correr
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ritmo (obligatorio); Horario (obligatorio); Punto de encuentro (obligatorio) | El sistema debería permitir crear una solicitud de compañía para correr, indicando ritmo, horario y punto de encuentro, para que el sistema sugiera personas cercanas con características similares. | Registro de «solicitud de compañía» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (ritmo, horario, punto de encuentro), el sistema crea el registro de «solicitud de compañía» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que el corredor no tenga otra solicitud activa con el mismo horario.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-22-2 — Leer solicitudes de compañía

- **Historia de usuario:** Como corredor · Deseo consultar solicitudes de compañía. Para comparar posibles compañeros de entrenamiento antes de elegir con quién reunirme.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-20 · **Caso de uso:** Buscar compañeros para correr
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ritmo (filtro); Horario (filtro); Punto de encuentro (filtro) | El sistema debería permitir leer las solicitudes y las personas sugeridas con ritmo y horario similares, para elegir con quién ir al punto de encuentro. | Datos de «solicitudes de compañía» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «solicitudes de compañía» que cumplen los criterios indicados (ritmo, horario, punto de encuentro), o informa que no hay resultados.
- [ ] El sistema debe mostrar personas sugeridas con ritmo y horario similares.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-22-3 — Actualizar solicitud de compañía

- **Historia de usuario:** Como corredor · Deseo modificar solicitud de compañía. Para adaptar mi solicitud cuando cambien mi disponibilidad, ritmo o punto de encuentro.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-20 · **Caso de uso:** Actualizar solicitud de compañía
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ritmo (obligatorio); Horario (obligatorio); Punto de encuentro (obligatorio) | El sistema debería permitir actualizar el ritmo, el horario o el punto de encuentro de la solicitud. | Registro de «solicitud de compañía» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «solicitud de compañía» (ritmo, horario, punto de encuentro) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] Se valida que la solicitud siga activa.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-22-4 — Eliminar solicitud de compañía

- **Historia de usuario:** Como corredor · Deseo eliminar solicitud de compañía. Para dejar de figurar como disponible cuando ya no busque compañía para correr.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-20 · **Caso de uso:** Eliminar solicitud de compañía
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema debería permitir eliminar una solicitud de compañía, para dejar de aparecer como disponible para correr. | Registro de «solicitud de compañía» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «solicitud de compañía» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe dejar de aparecer como disponible para correr.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md), [RF-20 · Puntos de encuentro](20-puntos-de-encuentro.md).

## Supuestos por validar

- El criterio de «cercanía» y de «ritmo compatible» no está definido en el Excel; se define al implementar.
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
