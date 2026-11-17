# EP-17 — Reportes comunitarios

> Spec de capacidad · Debe tener · **0/7 Hecha, 0 Parcial, 7 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-17 · Reportes comunitarios |
| Requisitos | RF-17-1 a RF-17-7 (7 sub-requisitos) |
| Requisito de usuario (UR) | UR-11, UR-12 |
| RNF | RNF-04, RNF-14 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | William Jadan |
| Sprint planificado | Sprint 5 · Semana 10 |
| Sprint real | Planificada: Sprint 5 (semana 10). Sin implementar. |
| Dependencias | [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md), [RF-02 · Roles y permisos](02-roles-y-permisos.md), [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md) |

## Propósito

Que los corredores reporten el estado de una ruta o sendero (acoso, falta de iluminación, señalización, deslave, tráfico o peligro en general) y que el administrador **valide** cada reporte (aprobar, rechazar o dar por resuelto) antes de que otros corredores lo vean o afecte el índice de seguridad. La identidad de quien reporta queda reservada.

Entradas, proceso y salidas del requisito padre en el Excel (RF-17):

- Entradas: tipo de condición, ubicación, descripción, fotografía opcional y decisión del administrador.
- Proceso: enviar el reporte a revisión sin mostrar la identidad de quien reporta y aplicar la decisión.
- Salidas: reportes aprobados visibles por ruta y estado de validación de cada reporte.

## Alcance

**Incluye**

- CRUD de reportes comunitarios (RF-17-1 a RF-17-4).
- Crear, consultar y actualizar la validación del administrador (RF-17-5 a RF-17-7).

**No incluye**

- Reportes anónimos hacia entidades externas (ECU 911, Policía): fuera del piloto.
- Moderación automática.

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que la ubicación sea válida.
- Que no se muestre la identidad de quien reporta.
- Mostrar a otros corredores solo los reportes aprobados.
- Permitir filtrar por ruta, tramo, tipo o estado de validación.
- Que solo el autor modifique el reporte y mientras no esté validado.
- Que elimine solo el autor, o el administrador si es inapropiado.
- Que el reporte exista y esté pendiente.
- Que la decisión sea Aprobado, Rechazado o Resuelto.
- Mostrar los reportes pendientes y las decisiones tomadas.
- Permitir cambiar la decisión (por ejemplo, de rechazado a aprobado).

Decididas por el equipo o derivadas de otros documentos:

- Un reporte solo es visible para otros corredores si fue **aprobado**. Estados de la validación: Aprobado, Rechazado, Resuelto.
- La identidad de quien reporta no la ve ningún otro usuario (RNF-04); el administrador la ve solo si hace falta moderar (inferido).
- Solo los reportes validados penalizan el índice de seguridad, que se actualiza en ≤ 24 h (RNF-14), mediante `extraPenalties` ([EP-07](07-evaluacion-de-seguridad.md)).
- Requiere el permiso `reports.validate` para validar; un corredor solo modifica o elimina sus reportes mientras estén pendientes.

## Modelo de datos y contrato de API

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /reports` | [RF-17-1](#rf-17-1--crear-reporte-comunitario) Crear reporte comunitario | Corredor |
| `GET /reports` y `GET /reports/{id}` | [RF-17-2](#rf-17-2--leer-reportes-comunitarios) Leer reportes comunitarios | Corredor y Administrador |
| `PUT /reports/{id}` | [RF-17-3](#rf-17-3--actualizar-reporte-comunitario) Actualizar reporte comunitario | Corredor |
| `DELETE /reports/{id}` | [RF-17-4](#rf-17-4--eliminar-reporte-comunitario) Eliminar reporte comunitario | Corredor y Administrador |
| `POST /reports/{id}/validation` | [RF-17-5](#rf-17-5--crear-validación-de-reporte) Crear validación de reporte | Administrador |
| `GET /reports/{id}/validation` y `GET /reports/{id}/validation/{id}` | [RF-17-6](#rf-17-6--leer-validaciones-de-reportes) Leer validaciones de reportes | Administrador |
| `PUT /reports/{id}/validation/{id}` | [RF-17-7](#rf-17-7--actualizar-validación-de-reporte) Actualizar validación de reporte | Administrador |

Campos propuestos de «reporte comunitario» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Tipo {Acoso, Falta de iluminación, Señalización, Deslave, Tráfico, Peligro en general} | Sí |
| Ubicación | Sí |
| Descripción | Sí |
| Fotografía | No |

Campos propuestos de «validación de reporte» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Reporte | Sí |
| Decisión {Aprobado, Rechazado, Resuelto} | Sí |
| Fecha de decisión | Sí |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-17-1](#rf-17-1--crear-reporte-comunitario) | Crear reporte comunitario | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-17-2](#rf-17-2--leer-reportes-comunitarios) | Leer reportes comunitarios | Corredor y Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-17-3](#rf-17-3--actualizar-reporte-comunitario) | Actualizar reporte comunitario | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-17-4](#rf-17-4--eliminar-reporte-comunitario) | Eliminar reporte comunitario | Corredor y Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-17-5](#rf-17-5--crear-validación-de-reporte) | Crear validación de reporte | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-17-6](#rf-17-6--leer-validaciones-de-reportes) | Leer validaciones de reportes | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-17-7](#rf-17-7--actualizar-validación-de-reporte) | Actualizar validación de reporte | Administrador | Sprint 5 · Semana 10 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-17-1 — Crear reporte comunitario

- **Historia de usuario:** Como corredor · Deseo registrar mi reporte comunitario. Para informar condiciones concretas de un sendero mediante ubicación, descripción y fotografía opcional.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-02, RF-05 · **Caso de uso:** Reportar estado de una ruta
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Tipo {Acoso, Falta de iluminación, Señalización, Deslave, Tráfico, Peligro en general} (obligatorio); Ubicación (obligatorio); Descripción (obligatorio); Fotografía (opcional) | El sistema deberá permitir crear un reporte sobre el estado de una ruta o sendero (acoso, falta de iluminación, señalización, deslaves, tráfico o peligro en general) con ubicación, descripción y fotografía opcional, para avisar a otros corredores. | Registro de «reporte comunitario» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (tipo {acoso, falta de iluminación, señalización, deslave, tráfico, peligro en general}, ubicación, descripción), el sistema crea el registro de «reporte comunitario» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que la ubicación sea válida.
- [ ] Se valida que no se muestre la identidad de quien reporta.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-17-2 — Leer reportes comunitarios

- **Historia de usuario:** Como corredor o administrador · Deseo consultar mis reportes comunitarios. Para consultar avisos por tramo, tipo y validación y conocer problemas reportados recientemente.
- **Actor:** Corredor y Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-02, RF-05 · **Caso de uso:** Consultar reportes comunitarios
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Tipo (filtro); Ubicación (filtro); Descripción (filtro); Fotografía (filtro) | El sistema deberá permitir leer los reportes comunitarios por ruta, tramo, tipo o estado de validación, para conocer las condiciones recientes. | Datos de «reportes comunitarios» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «reportes comunitarios» que cumplen los criterios indicados (tipo, ubicación, descripción, fotografía), o informa que no hay resultados.
- [ ] El sistema debe mostrar a otros corredores solo los reportes aprobados.
- [ ] El sistema debe permitir filtrar por ruta, tramo, tipo o estado de validación.
- [ ] Solo un usuario con el permiso correspondiente al actor «Corredor y Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-17-3 — Actualizar reporte comunitario

- **Historia de usuario:** Como corredor · Deseo modificar mi reporte comunitario. Para corregir un reporte propio antes de que se valide y evitar difundir información incorrecta.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-02, RF-05 · **Caso de uso:** Actualizar reporte comunitario
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Tipo {Acoso, Falta de iluminación, Señalización, Deslave, Tráfico, Peligro en general} (obligatorio); Ubicación (obligatorio); Descripción (obligatorio); Fotografía (opcional) | El sistema deberá permitir actualizar la descripción, la ubicación o la fotografía de un reporte propio mientras no esté validado, para corregirlo. | Registro de «reporte comunitario» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «reporte comunitario» (tipo {acoso, falta de iluminación, señalización, deslave, tráfico, peligro en general}, ubicación, descripción) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] Se valida que solo el autor modifique el reporte y mientras no esté validado.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-17-4 — Eliminar reporte comunitario

- **Historia de usuario:** Como corredor o administrador · Deseo eliminar mi reporte comunitario. Para retirar un reporte propio o inapropiado de la plataforma conforme a los permisos establecidos.
- **Actor:** Corredor y Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-02, RF-05 · **Caso de uso:** Eliminar reporte comunitario
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar un reporte propio, o un reporte inapropiado cuando lo solicite el administrador, para retirarlo de la plataforma. | Registro de «reporte comunitario» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «reporte comunitario» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] Se valida que elimine solo el autor, o el administrador si es inapropiado.
- [ ] Solo un usuario con el permiso correspondiente al actor «Corredor y Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-17-5 — Crear validación de reporte

- **Historia de usuario:** Como administrador · Deseo registrar validación de reporte. Para decidir si un reporte debe aprobarse, rechazarse o marcarse como resuelto antes de influir en el índice.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-02, RF-05 · **Caso de uso:** Validar reporte comunitario
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Reporte (obligatorio); Decisión {Aprobado, Rechazado, Resuelto} (obligatorio); Fecha de decisión (obligatorio) | El sistema deberá permitir crear la decisión del administrador sobre un reporte (aprobar, rechazar o marcar como resuelto), para que solo los reportes verificados afecten el índice de seguridad. | Registro de «validación de reporte» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (reporte, decisión {aprobado, rechazado, resuelto}, fecha de decisión), el sistema crea el registro de «validación de reporte» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que el reporte exista y esté pendiente.
- [ ] Se valida que la decisión sea Aprobado, Rechazado o Resuelto.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-17-6 — Leer validaciones de reportes

- **Historia de usuario:** Como administrador · Deseo consultar validaciones de reportes. Para conocer qué reportes siguen pendientes y qué decisión se tomó sobre los revisados.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-02, RF-05 · **Caso de uso:** Consultar reportes por validar
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Reporte (filtro); Decisión (filtro); Fecha de decisión (filtro) | El sistema deberá permitir leer los reportes pendientes de validación y las decisiones tomadas, para dar seguimiento a su revisión. | Datos de «validaciones de reportes» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «validaciones de reportes» que cumplen los criterios indicados (reporte, decisión, fecha de decisión), o informa que no hay resultados.
- [ ] El sistema debe mostrar los reportes pendientes y las decisiones tomadas.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-17-7 — Actualizar validación de reporte

- **Historia de usuario:** Como administrador · Deseo modificar validación de reporte. Para rectificar una revisión administrativa o marcar como solucionado un reporte ya atendido.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-02, RF-05 · **Caso de uso:** Actualizar validación de reporte
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Reporte (obligatorio); Decisión {Aprobado, Rechazado, Resuelto} (obligatorio); Fecha de decisión (obligatorio) | El sistema deberá permitir actualizar una decisión de validación (por ejemplo, cambiar de rechazado a aprobado o marcar como resuelto), para corregirla. | Registro de «validación de reporte» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «validación de reporte» (reporte, decisión {aprobado, rechazado, resuelto}, fecha de decisión) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] El sistema debe permitir cambiar la decisión (por ejemplo, de rechazado a aprobado).
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md), [RF-02 · Roles y permisos](02-roles-y-permisos.md), [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md).
- **Dependen de esta capacidad:** [EP-07 · Evaluación de seguridad de rutas y zonas de riesgo](07-evaluacion-de-seguridad.md).

## Supuestos por validar

- Las fotografías se guardan en Firebase Storage con reglas cerradas; el tamaño y formato máximos no están definidos.
- Quién ve la identidad (administrador, representante de club) no está definido por el Excel: se resuelve en la implementación junto a RNF-04.
- El Excel no incluye «eliminar validación»; se mantiene así para conservar el historial de decisiones.
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
