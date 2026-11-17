# EP-13 — Metas personales

> Spec de capacidad · Debería tener · **0/4 Hecha, 0 Parcial, 4 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-13 · Metas personales |
| Requisitos | RF-13-1 a RF-13-4 (4 sub-requisitos) |
| Requisito de usuario (UR) | no definido en el Excel |
| RNF | sin RNF específico (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debería tener |
| Responsable | Santiago Matute |
| Sprint planificado | Sprint 5 · Semana 10 |
| Sprint real | Planificada: Sprint 5 (semana 10). Sin implementar. Es «Debería tener». |
| Dependencias | [RF-12 · Registro de entrenamientos](12-registro-de-entrenamientos.md) |

## Propósito

Que el corredor fije metas personales de distancia, tiempo o frecuencia para un período, y sepa su avance con base en sus entrenamientos.

Entradas, proceso y salidas del requisito padre en el Excel (RF-13):

- Entradas: tipo de meta, objetivo y período.
- Proceso: calcular el avance con los entrenamientos del período.
- Salidas: metas con su porcentaje de avance.

## Alcance

**Incluye**

- CRUD de metas personales (RF-13-1 a RF-13-4).

**No incluye**

- Retos entre corredores y rankings (fuera del piloto): [EP-14](14-retos-entre-corredores.md).

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que el período de cumplimiento sea posterior a la fecha actual.
- Mostrar el avance según los entrenamientos del período.
- Actualizar el avance al cambiar la meta.
- Conservar los entrenamientos asociados.

Decididas por el equipo o derivadas de otros documentos:

- Tipos de meta: Distancia, Tiempo o Frecuencia.
- El período de cumplimiento tiene fecha de inicio y de fin válidas (la de fin no es anterior a la de inicio).
- Cada corredor solo ve y modifica sus metas.

## Modelo de datos y contrato de API

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /goals` | [RF-13-1](#rf-13-1--crear-meta-personal) Crear meta personal | Corredor |
| `GET /goals` y `GET /goals/{id}` | [RF-13-2](#rf-13-2--leer-metas-personales) Leer metas personales | Corredor |
| `PUT /goals/{id}` | [RF-13-3](#rf-13-3--actualizar-meta-personal) Actualizar meta personal | Corredor |
| `DELETE /goals/{id}` | [RF-13-4](#rf-13-4--eliminar-meta-personal) Eliminar meta personal | Corredor |

Campos propuestos de «meta personal» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Tipo de meta {Distancia, Tiempo, Frecuencia} | Sí |
| Objetivo | Sí |
| Período de cumplimiento | Sí |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-13-1](#rf-13-1--crear-meta-personal) | Crear meta personal | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-13-2](#rf-13-2--leer-metas-personales) | Leer metas personales | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-13-3](#rf-13-3--actualizar-meta-personal) | Actualizar meta personal | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-13-4](#rf-13-4--eliminar-meta-personal) | Eliminar meta personal | Corredor | Sprint 5 · Semana 10 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-13-1 — Crear meta personal

- **Historia de usuario:** Como corredor · Deseo registrar mi meta personal. Para establecer objetivos medibles de distancia, duración o frecuencia dentro de un período.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-12 · **Caso de uso:** Registrar meta personal
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Tipo de meta {Distancia, Tiempo, Frecuencia} (obligatorio); Objetivo (obligatorio); Período de cumplimiento (obligatorio) | El sistema debería permitir al corredor crear metas personales de distancia, tiempo o frecuencia de entrenamiento, indicando su objetivo y período de cumplimiento. | Registro de «meta personal» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (tipo de meta {distancia, tiempo, frecuencia}, objetivo, período de cumplimiento), el sistema crea el registro de «meta personal» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que el período de cumplimiento sea posterior a la fecha actual.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-13-2 — Leer metas personales

- **Historia de usuario:** Como corredor · Deseo consultar mis metas personales. Para saber cuánto he avanzado hacia mis objetivos a partir de los entrenamientos registrados.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-12 · **Caso de uso:** Consultar metas personales
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Tipo de meta (filtro); Objetivo (filtro); Período de cumplimiento (filtro) | El sistema debería permitir al corredor leer sus metas personales y el avance alcanzado a partir de sus entrenamientos. | Datos de «metas personales» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «metas personales» que cumplen los criterios indicados (tipo de meta, objetivo, período de cumplimiento), o informa que no hay resultados.
- [ ] El sistema debe mostrar el avance según los entrenamientos del período.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-13-3 — Actualizar meta personal

- **Historia de usuario:** Como corredor · Deseo modificar mi meta personal. Para ajustar un objetivo o su fecha límite y ver el avance recalculado.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-12 · **Caso de uso:** Actualizar meta personal
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Tipo de meta {Distancia, Tiempo, Frecuencia} (obligatorio); Objetivo (obligatorio); Período de cumplimiento (obligatorio) | El sistema debería permitir al corredor actualizar el objetivo o el período de una meta personal, recalculando su avance. | Registro de «meta personal» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «meta personal» (tipo de meta {distancia, tiempo, frecuencia}, objetivo, período de cumplimiento) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] El sistema debe actualizar el avance al cambiar la meta.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-13-4 — Eliminar meta personal

- **Historia de usuario:** Como corredor · Deseo eliminar mi meta personal. Para dejar de seguir una meta sin perder los registros de mis entrenamientos.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-12 · **Caso de uso:** Eliminar meta personal
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema debería permitir al corredor eliminar una meta personal que ya no desee mantener, sin eliminar sus entrenamientos. | Registro de «meta personal» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «meta personal» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe conservar los entrenamientos asociados.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-12 · Registro de entrenamientos](12-registro-de-entrenamientos.md).

## Supuestos por validar

- El cálculo del avance sale de [EP-12](12-registro-de-entrenamientos.md); el Excel no define un criterio de cumplimiento (inferido: suma o conteo dentro del período).
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
