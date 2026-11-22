# EP-11 — Rutas sugeridas por clubes

> Spec de capacidad · Debería tener · **0/4 Hecha, 0 Parcial, 4 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-11 · Rutas sugeridas por clubes |
| Requisitos | RF-11-1 a RF-11-4 (4 sub-requisitos) |
| Requisito de usuario (UR) | no definido en el Excel |
| RNF | RNF-22 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debería tener |
| Responsable | Santiago Matute |
| Sprint planificado | Sprint 4 · Semana 9 |
| Sprint real | Planificada: Sprint 4 (semana 9). Sin implementar. Es «Debería tener» y corresponde a la fase de expansión. |
| Alcance del piloto | Fase de expansión (clubes aliados). |
| Dependencias | [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md), [RF-19 · Clubes de running y membresías](19-clubes-y-membresias.md) |

## Propósito

Que un representante de club proponga rutas de su ciudad, con observaciones de seguridad y horario recomendado, para que los corredores las consulten. Apoya el crecimiento hacia otras ciudades (RNF-22).

Entradas, proceso y salidas del requisito padre en el Excel (RF-11):

- Entradas: ruta, club, observaciones, horario recomendado y fecha de verificación.
- Proceso: asociar la sugerencia al club y a la ruta sin eliminar la ruta al retirarla.
- Salidas: rutas sugeridas por ciudad y club.

## Alcance

**Incluye**

- CRUD de rutas sugeridas por club (RF-11-1 a RF-11-4).

**No incluye**

- Expansión real a otras ciudades y convenios con clubes (fuera del piloto).
- Alta de clubes y membresías: [EP-19](19-clubes-y-membresias.md).

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que el club y la ruta existan.
- Que quien registra sea representante del club.
- Permitir filtrar por ciudad y club.
- Que quien modifica sea representante del club.
- Retirar la sugerencia sin eliminar la ruta de la plataforma.

Decididas por el equipo o derivadas de otros documentos:

- Solo un representante del club propietario crea, modifica o elimina sus sugerencias.
- Una sugerencia apunta a una ruta del catálogo ([EP-05](05-catalogo-de-rutas.md)) y a un club existente.
- Se registra la fecha de la última verificación.

## Modelo de datos y contrato de API

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /club-route-suggestions` | [RF-11-1](#rf-11-1--crear-ruta-sugerida-por-club) Crear ruta sugerida por club | Representante de club |
| `GET /club-route-suggestions` y `GET /club-route-suggestions/{id}` | [RF-11-2](#rf-11-2--leer-rutas-sugeridas-por-club) Leer rutas sugeridas por club | Corredor y Representante de club |
| `PUT /club-route-suggestions/{id}` | [RF-11-3](#rf-11-3--actualizar-ruta-sugerida-por-club) Actualizar ruta sugerida por club | Representante de club |
| `DELETE /club-route-suggestions/{id}` | [RF-11-4](#rf-11-4--eliminar-ruta-sugerida-por-club) Eliminar ruta sugerida por club | Representante de club |

Campos propuestos de «ruta sugerida por club» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Ruta | Sí |
| Club | Sí |
| Fecha de última verificación | Sí |
| Observaciones de seguridad | No |
| Horario recomendado | No |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-11-1](#rf-11-1--crear-ruta-sugerida-por-club) | Crear ruta sugerida por club | Representante de club | Sprint 4 · Semana 9 | Pendiente |
| [RF-11-2](#rf-11-2--leer-rutas-sugeridas-por-club) | Leer rutas sugeridas por club | Corredor y Representante de club | Sprint 4 · Semana 9 | Pendiente |
| [RF-11-3](#rf-11-3--actualizar-ruta-sugerida-por-club) | Actualizar ruta sugerida por club | Representante de club | Sprint 4 · Semana 9 | Pendiente |
| [RF-11-4](#rf-11-4--eliminar-ruta-sugerida-por-club) | Eliminar ruta sugerida por club | Representante de club | Sprint 4 · Semana 9 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-11-1 — Crear ruta sugerida por club

- **Historia de usuario:** Como representante de club · Deseo registrar ruta sugerida por club. Para compartir con la comunidad rutas recomendadas por mi club, con horarios y fecha de revisión.
- **Actor:** Representante de club · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-05, RF-19 · **Caso de uso:** Registrar ruta sugerida por club
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta (obligatorio); Club (obligatorio); Fecha de última verificación (obligatorio); Observaciones de seguridad (opcional); Horario recomendado (opcional) | El sistema debería permitir a los clubes crear rutas sugeridas por ciudad, con observaciones de seguridad, horarios recomendados y fecha de última verificación. | Registro de «ruta sugerida por club» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (ruta, club, fecha de última verificación), el sistema crea el registro de «ruta sugerida por club» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que el club y la ruta existan.
- [ ] Se valida que quien registra sea representante del club.
- [ ] Solo un usuario con el permiso correspondiente al actor «Representante de club» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-11-2 — Leer rutas sugeridas por club

- **Historia de usuario:** Como corredor o representante de club · Deseo consultar rutas sugeridas por club. Para consultar propuestas de clubes de una ciudad y comparar sus observaciones.
- **Actor:** Corredor y Representante de club · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-05, RF-19 · **Caso de uso:** Consultar rutas sugeridas por club
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta (filtro); Club (filtro); Fecha de última verificación (filtro); Observaciones de seguridad (filtro) | El sistema debería permitir leer las rutas sugeridas por los clubes, filtrando por ciudad y club, junto con sus recomendaciones. | Datos de «rutas sugeridas por club» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «rutas sugeridas por club» que cumplen los criterios indicados (ruta, club, fecha de última verificación, observaciones de seguridad), o informa que no hay resultados.
- [ ] El sistema debe permitir filtrar por ciudad y club.
- [ ] Solo un usuario con el permiso correspondiente al actor «Corredor y Representante de club» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-11-3 — Actualizar ruta sugerida por club

- **Historia de usuario:** Como representante de club · Deseo modificar ruta sugerida por club. Para informar cambios en horarios, condiciones o fecha de verificación de una ruta propuesta.
- **Actor:** Representante de club · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-05, RF-19 · **Caso de uso:** Actualizar ruta sugerida por club
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta (obligatorio); Club (obligatorio); Fecha de última verificación (obligatorio); Observaciones de seguridad (opcional); Horario recomendado (opcional) | El sistema debería permitir a los clubes actualizar las observaciones de seguridad, los horarios recomendados y la fecha de verificación de sus rutas sugeridas. | Registro de «ruta sugerida por club» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «ruta sugerida por club» (ruta, club, fecha de última verificación) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] Se valida que quien modifica sea representante del club.
- [ ] Solo un usuario con el permiso correspondiente al actor «Representante de club» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-11-4 — Eliminar ruta sugerida por club

- **Historia de usuario:** Como representante de club · Deseo eliminar ruta sugerida por club. Para retirar una recomendación del club sin borrar el recorrido original del catálogo.
- **Actor:** Representante de club · **Prioridad:** Debería tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-05, RF-19 · **Caso de uso:** Eliminar ruta sugerida por club
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema debería permitir a los clubes eliminar una ruta de sus sugerencias cuando dejen de recomendarla, sin eliminar la ruta de la plataforma. | Registro de «ruta sugerida por club» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «ruta sugerida por club» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe retirar la sugerencia sin eliminar la ruta de la plataforma.
- [ ] Solo un usuario con el permiso correspondiente al actor «Representante de club» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md), [RF-19 · Clubes de running y membresías](19-clubes-y-membresias.md).

## Decisiones de diseño (2026-11-22)

Pedidas por el usuario el 2026-11-22; se adelantan para hacerlas justo después del Sprint 3.

- **Ruta verificada por un club:** una ruta sugerida por un club guarda la fecha de la última verificación. En el piloto, además del representante de club, **el administrador puede marcar desde el admin web que un club verificó una ruta** (o quitar la marca), con fecha y observaciones.
- **Distintivo visible:** las rutas verificadas muestran en la tarjeta y en el detalle un sello «Verificada por <club>» con la fecha; las demás muestran «Sin verificar». El sello se ve en la app del corredor y en el admin.
- **Rutas sugeridas para cada corredor:** el inicio del corredor muestra primero las rutas que su club sugiere (si es miembro de un club, EP-19) y después las que encajan con su perfil deportivo (distancia preferida y nivel), ordenadas por seguridad de la franja actual.

## Supuestos por validar

- Depende de [EP-19](19-clubes-y-membresias.md), que se planifica un sprint después (Sprint 5); el backlog lo declara así y obliga a reordenar o a simular el club.
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
