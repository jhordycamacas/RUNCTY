# EP-14 — Retos entre corredores

> Spec de capacidad · Debería tener · **0/4 Hecha, 0 Parcial, 4 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-14 · Retos entre corredores |
| Requisitos | RF-14-1 a RF-14-4 (4 sub-requisitos) |
| Requisito de usuario (UR) | no definido en el Excel |
| RNF | sin RNF específico (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debería tener |
| Responsable | Pedro Vargas |
| Sprint planificado | Sprint 5 · Semana 10 |
| Sprint real | Planificada: Sprint 5 (semana 10). Sin implementar. Es «Debería tener». |
| Alcance del piloto | Fuera del piloto según el Documento de Visión (retos y rankings): spec lista, implementación diferida. |
| Dependencias | [RF-12 · Registro de entrenamientos](12-registro-de-entrenamientos.md) |

## Propósito

Que un corredor cree retos con un objetivo y fechas e invite a otros corredores a participar.

Entradas, proceso y salidas del requisito padre en el Excel (RF-14):

- Entradas: nombre, objetivo, fechas de vigencia y participantes.
- Proceso: registrar el avance de cada participante con sus entrenamientos.
- Salidas: retos vigentes con el avance de cada participante.

## Alcance

**Incluye**

- CRUD de retos entre corredores (RF-14-1 a RF-14-4).

**No incluye**

- **Retos, rankings e integración con dispositivos deportivos están fuera del alcance del piloto** según el Documento de Visión. El Excel los mantiene como «Debería tener»; esta spec queda lista pero su implementación se difiere hasta que Gacelas confirme.

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que la fecha de fin sea posterior a la de inicio.
- Mostrar el avance de cada participante.
- Que solo el responsable modifique el reto.
- Que solo el responsable elimine el reto.

Decididas por el equipo o derivadas de otros documentos:

- La fecha de fin no es anterior a la de inicio.
- Solo el creador modifica o elimina el reto; los participantes lo consultan.

## Modelo de datos y contrato de API

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /challenges` | [RF-14-1](#rf-14-1--crear-reto-entre-corredores) Crear reto entre corredores | Corredor |
| `GET /challenges` y `GET /challenges/{id}` | [RF-14-2](#rf-14-2--leer-retos-entre-corredores) Leer retos entre corredores | Corredor |
| `PUT /challenges/{id}` | [RF-14-3](#rf-14-3--actualizar-reto-entre-corredores) Actualizar reto entre corredores | Corredor |
| `DELETE /challenges/{id}` | [RF-14-4](#rf-14-4--eliminar-reto-entre-corredores) Eliminar reto entre corredores | Corredor |

Campos propuestos de «reto entre corredores» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Nombre | Sí |
| Objetivo | Sí |
| Fecha de inicio | Sí |
| Fecha de fin | Sí |
| Participantes | No |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-14-1](#rf-14-1--crear-reto-entre-corredores) | Crear reto entre corredores | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-14-2](#rf-14-2--leer-retos-entre-corredores) | Leer retos entre corredores | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-14-3](#rf-14-3--actualizar-reto-entre-corredores) | Actualizar reto entre corredores | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-14-4](#rf-14-4--eliminar-reto-entre-corredores) | Eliminar reto entre corredores | Corredor | Sprint 5 · Semana 10 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-14-1 — Crear reto entre corredores

- **Historia de usuario:** Como corredor · Deseo registrar reto entre corredores. Para proponer una actividad competitiva con objetivos, fechas y participantes definidos.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-12 · **Caso de uso:** Crear reto entre corredores
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (obligatorio); Objetivo (obligatorio); Fecha de inicio (obligatorio); Fecha de fin (obligatorio); Participantes (opcional) | El sistema debería permitir crear un reto entre corredores, indicando nombre, objetivo, fechas de vigencia y participantes. | Registro de «reto entre corredores» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (nombre, objetivo, fecha de inicio, fecha de fin), el sistema crea el registro de «reto entre corredores» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que la fecha de fin sea posterior a la de inicio.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-14-2 — Leer retos entre corredores

- **Historia de usuario:** Como corredor · Deseo consultar retos entre corredores. Para identificar retos disponibles y conocer quién participa y hasta cuándo están vigentes.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-12 · **Caso de uso:** Consultar retos entre corredores
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (filtro); Objetivo (filtro); Fecha de inicio (filtro); Fecha de fin (filtro) | El sistema debería permitir leer los retos entre corredores, sus objetivos, fechas de vigencia y participantes. | Datos de «retos entre corredores» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «retos entre corredores» que cumplen los criterios indicados (nombre, objetivo, fecha de inicio, fecha de fin), o informa que no hay resultados.
- [ ] El sistema debe mostrar el avance de cada participante.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-14-3 — Actualizar reto entre corredores

- **Historia de usuario:** Como corredor · Deseo modificar reto entre corredores. Para reflejar cambios en las reglas, fechas o participantes de un reto existente.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-12 · **Caso de uso:** Actualizar reto entre corredores
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (obligatorio); Objetivo (obligatorio); Fecha de inicio (obligatorio); Fecha de fin (obligatorio); Participantes (opcional) | El sistema debería permitir actualizar la información, las fechas de vigencia y los participantes de un reto. | Registro de «reto entre corredores» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «reto entre corredores» (nombre, objetivo, fecha de inicio, fecha de fin) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] Se valida que solo el responsable modifique el reto.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-14-4 — Eliminar reto entre corredores

- **Historia de usuario:** Como corredor · Deseo eliminar reto entre corredores. Para retirar un reto cancelado o incorrecto después de confirmar la acción.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-12 · **Caso de uso:** Eliminar reto entre corredores
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema debería permitir eliminar un reto entre corredores, previa confirmación. | Registro de «reto entre corredores» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «reto entre corredores» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] Se valida que solo el responsable elimine el reto.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-12 · Registro de entrenamientos](12-registro-de-entrenamientos.md).

## Supuestos por validar

- Contradicción documentada: el Excel y el backlog incluyen los retos (Sprint 5) y el Documento de Visión los saca del piloto; se difiere por la Visión (decisión pendiente con el cliente).
- Cómo se invita a participantes y cómo se mide el cumplimiento no está definido (inferido).
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
