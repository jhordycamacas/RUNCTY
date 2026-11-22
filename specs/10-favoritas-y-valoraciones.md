# EP-10 — Rutas favoritas y valoraciones

> Spec de capacidad · Debe tener · **0/7 Hecha, 0 Parcial, 7 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-10 · Rutas favoritas y valoraciones |
| Requisitos | RF-10-1 a RF-10-7 (7 sub-requisitos) |
| Requisito de usuario (UR) | no definido en el Excel |
| RNF | sin RNF específico (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | Jhordy Camacas |
| Sprint planificado | Sprint 4 · Semana 9 |
| Sprint real | Planificada: Sprint 4 (semana 9). Sin implementar. |
| Dependencias | [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md), [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md) |

## Propósito

Que el corredor guarde rutas favoritas y valore las rutas que recorrió (seguridad, iluminación y afluencia de personas, de 1 a 5), aportando una señal comunitaria sobre la ruta.

Entradas, proceso y salidas del requisito padre en el Excel (RF-10):

- Entradas: ruta seleccionada, puntuaciones y comentario.
- Proceso: asociar la preferencia al corredor y a la ruta.
- Salidas: rutas favoritas y valoraciones de cada ruta.

## Alcance

**Incluye**

- Guardar, consultar y quitar rutas favoritas (RF-10-1 a RF-10-3).
- CRUD de valoraciones de ruta (RF-10-4 a RF-10-7).

**No incluye**

- Que las valoraciones modifiquen el índice de seguridad (no está pedido; solo los factores y los reportes validados lo afectan).

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que la ruta exista.
- Que la ruta no esté ya en favoritas.
- Que el corredor consulte solo sus favoritas.
- Quitar la ruta de la lista sin eliminarla de la plataforma.
- Que la ruta haya sido recorrida por el corredor.
- Que el corredor valore una ruta una sola vez.
- Mostrar las valoraciones y comentarios por ruta.
- Que solo el autor modifique su valoración.
- Que solo el autor elimine su valoración.

Decididas por el equipo o derivadas de otros documentos:

- Una ruta no se guarda dos veces como favorita para el mismo corredor.
- Cada corredor puede valorar una ruta **una sola vez** y solo si la recorrió (CONTEXTO sección 6).
- Las puntuaciones van de 1 a 5.

## Modelo de datos y contrato de API

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /favorite-routes` | [RF-10-1](#rf-10-1--crear-ruta-favorita-guardar) Crear ruta favorita (guardar) | Corredor |
| `GET /favorite-routes` y `GET /favorite-routes/{id}` | [RF-10-2](#rf-10-2--leer-rutas-favoritas) Leer rutas favoritas | Corredor |
| `DELETE /favorite-routes/{id}` | [RF-10-3](#rf-10-3--eliminar-ruta-favorita) Eliminar ruta favorita | Corredor |
| `POST /route-ratings` | [RF-10-4](#rf-10-4--crear-valoración-de-ruta) Crear valoración de ruta | Corredor |
| `GET /route-ratings` y `GET /route-ratings/{id}` | [RF-10-5](#rf-10-5--leer-valoraciones-de-ruta) Leer valoraciones de ruta | Corredor |
| `PUT /route-ratings/{id}` | [RF-10-6](#rf-10-6--actualizar-valoración-de-ruta) Actualizar valoración de ruta | Corredor |
| `DELETE /route-ratings/{id}` | [RF-10-7](#rf-10-7--eliminar-valoración-de-ruta) Eliminar valoración de ruta | Corredor |

Campos propuestos de «ruta favorita» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Ruta | Sí |

Campos propuestos de «valoración de ruta» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Ruta | Sí |
| Puntuación de seguridad {1 a 5} | Sí |
| Puntuación de iluminación {1 a 5} | No |
| Puntuación de afluencia de personas {1 a 5} | No |
| Comentario | No |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-10-1](#rf-10-1--crear-ruta-favorita-guardar) | Crear ruta favorita (guardar) | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-10-2](#rf-10-2--leer-rutas-favoritas) | Leer rutas favoritas | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-10-3](#rf-10-3--eliminar-ruta-favorita) | Eliminar ruta favorita | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-10-4](#rf-10-4--crear-valoración-de-ruta) | Crear valoración de ruta | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-10-5](#rf-10-5--leer-valoraciones-de-ruta) | Leer valoraciones de ruta | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-10-6](#rf-10-6--actualizar-valoración-de-ruta) | Actualizar valoración de ruta | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-10-7](#rf-10-7--eliminar-valoración-de-ruta) | Eliminar valoración de ruta | Corredor | Sprint 4 · Semana 9 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-10-1 — Crear ruta favorita (guardar)

- **Historia de usuario:** Como corredor · Deseo registrar mi ruta favorita (guardar). Para guardar un recorrido existente y recuperarlo sin repetir la búsqueda.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01, RF-05 · **Caso de uso:** Guardar ruta favorita
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta (obligatorio) | El sistema deberá permitir al usuario crear una ruta favorita a partir de una ruta existente, para acceder a ella posteriormente. | Registro de «ruta favorita» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (ruta), el sistema crea el registro de «ruta favorita» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que la ruta exista.
- [ ] Se valida que la ruta no esté ya en favoritas.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-10-2 — Leer rutas favoritas

- **Historia de usuario:** Como corredor · Deseo consultar mis rutas favoritas. Para localizar rápidamente mis recorridos guardados y consultar los datos de cada uno.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01, RF-05 · **Caso de uso:** Consultar rutas favoritas
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta (filtro) | El sistema deberá permitir al usuario leer su lista de rutas favoritas y acceder a la información de cada ruta. | Datos de «rutas favoritas» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «rutas favoritas» que cumplen los criterios indicados (ruta), o informa que no hay resultados.
- [ ] Se valida que el corredor consulte solo sus favoritas.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-10-3 — Eliminar ruta favorita

- **Historia de usuario:** Como corredor · Deseo eliminar mi ruta favorita. Para mantener organizada mi lista personal sin borrar la ruta del catálogo general.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01, RF-05 · **Caso de uso:** Eliminar ruta favorita
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir al usuario eliminar una ruta de su lista de favoritas, sin eliminar la ruta de la plataforma. | Registro de «ruta favorita» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «ruta favorita» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe quitar la ruta de la lista sin eliminarla de la plataforma.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-10-4 — Crear valoración de ruta

- **Historia de usuario:** Como corredor · Deseo registrar valoración de ruta. Para aportar mi experiencia real sobre iluminación, afluencia y condiciones del recorrido.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01, RF-05 · **Caso de uso:** Valorar ruta
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta (obligatorio); Puntuación de seguridad {1 a 5} (obligatorio); Puntuación de iluminación {1 a 5} (opcional); Puntuación de afluencia de personas {1 a 5} (opcional); Comentario (opcional) | El sistema deberá permitir al corredor crear una valoración de una ruta recorrida, incluyendo puntuaciones de seguridad, iluminación, afluencia de personas y comentarios. | Registro de «valoración de ruta» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (ruta, puntuación de seguridad {1 a 5}), el sistema crea el registro de «valoración de ruta» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que la ruta haya sido recorrida por el corredor.
- [ ] Se valida que el corredor valore una ruta una sola vez.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-10-5 — Leer valoraciones de ruta

- **Historia de usuario:** Como corredor · Deseo consultar valoraciones de ruta. Para conocer las opiniones y puntuaciones de quienes ya recorrieron esa ruta.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01, RF-05 · **Caso de uso:** Consultar valoraciones de ruta
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta (filtro); Puntuación de seguridad (filtro); Puntuación de iluminación (filtro); Puntuación de afluencia de personas (filtro) | El sistema deberá permitir leer las valoraciones y los comentarios registrados por los corredores sobre una ruta. | Datos de «valoraciones de ruta» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «valoraciones de ruta» que cumplen los criterios indicados (ruta, puntuación de seguridad, puntuación de iluminación, puntuación de afluencia de personas), o informa que no hay resultados.
- [ ] El sistema debe mostrar las valoraciones y comentarios por ruta.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-10-6 — Actualizar valoración de ruta

- **Historia de usuario:** Como corredor · Deseo modificar valoración de ruta. Para corregir una valoración propia si cambié de opinión o advertí un dato inexacto.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01, RF-05 · **Caso de uso:** Actualizar valoración de ruta
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta (obligatorio); Puntuación de seguridad {1 a 5} (obligatorio); Puntuación de iluminación {1 a 5} (opcional); Puntuación de afluencia de personas {1 a 5} (opcional); Comentario (opcional) | El sistema deberá permitir al corredor actualizar las puntuaciones y los comentarios de una valoración que haya registrado. | Registro de «valoración de ruta» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «valoración de ruta» (ruta, puntuación de seguridad {1 a 5}) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] Se valida que solo el autor modifique su valoración.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-10-7 — Eliminar valoración de ruta

- **Historia de usuario:** Como corredor · Deseo eliminar valoración de ruta. Para retirar mis comentarios o puntuaciones de una ruta cuando ya no quiera publicarlos.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01, RF-05 · **Caso de uso:** Eliminar valoración de ruta
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir al corredor eliminar una valoración propia de una ruta, previa confirmación. | Registro de «valoración de ruta» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «valoración de ruta» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] Se valida que solo el autor elimine su valoración.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md), [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md).

## Decisiones de diseño (2026-11-22)

Pedidas por el usuario el 2026-11-22; se adelantan para hacerlas justo después del Sprint 3.

- **Valoración con estrellas:** cada corredor valora una ruta una sola vez (puede editarla o borrarla) con tres puntajes de 1 a 5 estrellas (seguridad, iluminación y afluencia de personas) y una opinión escrita opcional (hasta 500 caracteres). La ruta muestra el promedio general en estrellas (media de los tres aspectos de todas las valoraciones) y cuántas valoraciones tiene.
- **Opiniones dentro de la ruta:** el detalle de la ruta lista las opiniones de los corredores (nombre visible del corredor, estrellas, texto y fecha), la más reciente primero; el corredor ve la suya arriba para editarla.
- **Favoritas:** un corazón en la tarjeta y en el detalle de la ruta guarda o quita la favorita; la lista de favoritas está en Cuenta.
- **API:** `GET/POST /routes/{id}/ratings`, `PUT/DELETE /routes/{id}/ratings/mine`; `GET/POST /favorite-routes`, `DELETE /favorite-routes/{routeId}`.

## Supuestos por validar

- «Si la recorrió» se verifica con un entrenamiento propio sobre esa ruta ([EP-12](12-registro-de-entrenamientos.md)); esa dependencia no está en la columna de dependencias del backlog (RF-01, RF-05) y debe confirmarse.
- Los dos filtros del Excel «Criterios de búsqueda: Ruta, puntuaciones» se implementan como parámetros de consulta (inferido).
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
