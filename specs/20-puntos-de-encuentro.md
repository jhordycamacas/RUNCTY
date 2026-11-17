# EP-20 — Puntos de encuentro

> Spec de capacidad · Debería tener · **0/4 Hecha, 0 Parcial, 4 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-20 · Puntos de encuentro |
| Requisitos | RF-20-1 a RF-20-4 (4 sub-requisitos) |
| Requisito de usuario (UR) | no definido en el Excel |
| RNF | sin RNF específico (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debería tener |
| Responsable | Santiago Matute |
| Sprint planificado | Sprint 5 · Semana 10 |
| Sprint real | Planificada: Sprint 5 (semana 10). Sin implementar. Es «Debería tener». |
| Dependencias | [RF-04 · Ciudades y zonas de operación](04-ciudades-y-zonas.md) |

## Propósito

Que el administrador registre puntos de encuentro seguros (con nivel de iluminación, afluencia de personas y cercanía a puntos de apoyo) que los corredores consulten para salir a correr juntos.

Entradas, proceso y salidas del requisito padre en el Excel (RF-20):

- Entradas: ubicación, iluminación, afluencia de personas y cercanía a puntos de apoyo.
- Proceso: registrar y mantener actualizadas las características del punto.
- Salidas: puntos de encuentro por ciudad con sus características.

## Alcance

**Incluye**

- CRUD de puntos de encuentro (RF-20-1 a RF-20-4).

**No incluye**

- Puntos de encuentro creados por cualquier corredor.

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que la ubicación sea válida.
- Que el nivel de iluminación sea uno de los definidos.
- Mostrar los puntos de encuentro de la ciudad elegida.
- Reflejar los cambios de iluminación o de afluencia.
- Dejar de sugerir el punto a los grupos.

Decididas por el equipo o derivadas de otros documentos:

- La ubicación pertenece a una ciudad habilitada ([EP-04](04-ciudades-y-zonas.md)).
- Un punto de encuentro con salidas grupales futuras no se elimina sin aviso (inferido).

## Modelo de datos y contrato de API

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /meeting-points` | [RF-20-1](#rf-20-1--crear-punto-de-encuentro) Crear punto de encuentro | Administrador |
| `GET /meeting-points` y `GET /meeting-points/{id}` | [RF-20-2](#rf-20-2--leer-puntos-de-encuentro) Leer puntos de encuentro | Corredor |
| `PUT /meeting-points/{id}` | [RF-20-3](#rf-20-3--actualizar-punto-de-encuentro) Actualizar punto de encuentro | Administrador |
| `DELETE /meeting-points/{id}` | [RF-20-4](#rf-20-4--eliminar-punto-de-encuentro) Eliminar punto de encuentro | Administrador |

Campos propuestos de «punto de encuentro» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Nombre | Sí |
| Ubicación | Sí |
| Nivel de iluminación | Sí |
| Afluencia de personas | No |
| Cercanía a puntos de apoyo | No |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-20-1](#rf-20-1--crear-punto-de-encuentro) | Crear punto de encuentro | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-20-2](#rf-20-2--leer-puntos-de-encuentro) | Leer puntos de encuentro | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-20-3](#rf-20-3--actualizar-punto-de-encuentro) | Actualizar punto de encuentro | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-20-4](#rf-20-4--eliminar-punto-de-encuentro) | Eliminar punto de encuentro | Administrador | Sprint 5 · Semana 10 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-20-1 — Crear punto de encuentro

- **Historia de usuario:** Como administrador · Deseo registrar punto de encuentro. Para proponer lugares de reunión considerando iluminación, afluencia y cercanía a puntos de apoyo.
- **Actor:** Administrador · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-04 · **Caso de uso:** Registrar punto de encuentro
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (obligatorio); Ubicación (obligatorio); Nivel de iluminación (obligatorio); Afluencia de personas (opcional); Cercanía a puntos de apoyo (opcional) | El sistema debería permitir crear un punto de encuentro con sus características (iluminación, afluencia de personas y cercanía a puntos de apoyo), para que los grupos inicien sus entrenamientos en lugares adecuados. | Registro de «punto de encuentro» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (nombre, ubicación, nivel de iluminación), el sistema crea el registro de «punto de encuentro» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que la ubicación sea válida.
- [ ] Se valida que el nivel de iluminación sea uno de los definidos.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-20-2 — Leer puntos de encuentro

- **Historia de usuario:** Como corredor · Deseo consultar puntos de encuentro. Para elegir un lugar para reunirse antes de correr conociendo sus características registradas.
- **Actor:** Corredor · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-04 · **Caso de uso:** Consultar puntos de encuentro
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (filtro); Ubicación (filtro); Nivel de iluminación (filtro); Afluencia de personas (filtro) | El sistema debería permitir leer los puntos de encuentro de una ciudad y sus características, para elegir dónde reunirse antes de correr. | Datos de «puntos de encuentro» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «puntos de encuentro» que cumplen los criterios indicados (nombre, ubicación, nivel de iluminación, afluencia de personas), o informa que no hay resultados.
- [ ] El sistema debe mostrar los puntos de encuentro de la ciudad elegida.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-20-3 — Actualizar punto de encuentro

- **Historia de usuario:** Como administrador · Deseo modificar punto de encuentro. Para mantener al día la ubicación y las condiciones de un punto de encuentro.
- **Actor:** Administrador · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-04 · **Caso de uso:** Actualizar punto de encuentro
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (obligatorio); Ubicación (obligatorio); Nivel de iluminación (obligatorio); Afluencia de personas (opcional); Cercanía a puntos de apoyo (opcional) | El sistema debería permitir actualizar las características o la ubicación de un punto de encuentro, para reflejar cambios en su iluminación o afluencia. | Registro de «punto de encuentro» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «punto de encuentro» (nombre, ubicación, nivel de iluminación) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] El sistema debe reflejar los cambios de iluminación o de afluencia.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-20-4 — Eliminar punto de encuentro

- **Historia de usuario:** Como administrador · Deseo eliminar punto de encuentro. Para dejar de recomendar lugares de reunión que ya no están disponibles o resultan inadecuados.
- **Actor:** Administrador · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-04 · **Caso de uso:** Eliminar punto de encuentro
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema debería permitir eliminar un punto de encuentro que ya no sea adecuado o esté disponible, para que no se sugiera a los grupos. | Registro de «punto de encuentro» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «punto de encuentro» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe dejar de sugerir el punto a los grupos.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-04 · Ciudades y zonas de operación](04-ciudades-y-zonas.md).
- **Dependen de esta capacidad:** [EP-21 · Salidas grupales](21-salidas-grupales.md), [EP-22 · Compañeros para correr](22-companeros-para-correr.md).

## Supuestos por validar

- La escala del nivel de iluminación y de la afluencia (por ejemplo baja, media, alta) no está definida en el Excel.
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
