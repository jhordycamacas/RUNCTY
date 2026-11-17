# EP-19 — Clubes de running y membresías

> Spec de capacidad · Debe tener · **0/8 Hecha, 0 Parcial, 8 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-19 · Clubes de running y membresías |
| Requisitos | RF-19-1 a RF-19-8 (8 sub-requisitos) |
| Requisito de usuario (UR) | no definido en el Excel |
| RNF | sin RNF específico (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | Santiago Matute |
| Sprint planificado | Sprint 5 · Semana 10 |
| Sprint real | Planificada: Sprint 5 (semana 10). Sin implementar. |
| Alcance del piloto | Convenios y expansión real fuera del piloto. |
| Dependencias | [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md), [RF-04 · Ciudades y zonas de operación](04-ciudades-y-zonas.md) |

## Propósito

Que el administrador registre clubes de running (con su representante) y que los corredores soliciten membresía, con un ciclo de estados que el representante de club gestiona. Sostiene el rol `club_rep` y la fase de expansión.

Entradas, proceso y salidas del requisito padre en el Excel (RF-19):

- Entradas: datos del club y solicitud de membresía del corredor.
- Proceso: recibir solicitudes y actualizar el estado de cada una.
- Salidas: clubes por ciudad y miembros con el estado de su membresía.

## Alcance

**Incluye**

- CRUD de clubes de running (RF-19-1 a RF-19-4).
- CRUD de membresías de club (RF-19-5 a RF-19-8).

**No incluye**

- Convenios con clubes aliados y expansión real (fuera del piloto).
- Pagos o cuotas del club (fuera del piloto).

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que el nombre no esté repetido en la ciudad.
- Que el representante sea un usuario registrado.
- Permitir filtrar por ciudad.
- Mantener vigentes la descripción, el representante y el contacto.
- Solicitar la confirmación del representante.
- Que el club exista.
- Que el corredor no sea ya miembro del club.
- Mostrar los miembros y el estado de cada membresía.
- Que el estado sea uno de los definidos.
- Desvincular al corredor del club.

Decididas por el equipo o derivadas de otros documentos:

- Estados de membresía: Pendiente, Aceptada, Activa, Suspendida.
- Un corredor tiene a lo sumo una membresía por club.
- Solo el representante del club cambia el estado de una membresía; el corredor puede retirarse (eliminar).
- Requiere el permiso `clubs.manage` para administrar clubes.

## Modelo de datos y contrato de API

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /clubs` | [RF-19-1](#rf-19-1--crear-club-de-running) Crear club de running | Administrador |
| `GET /clubs` y `GET /clubs/{id}` | [RF-19-2](#rf-19-2--leer-clubes-de-running) Leer clubes de running | Corredor |
| `PUT /clubs/{id}` | [RF-19-3](#rf-19-3--actualizar-club-de-running) Actualizar club de running | Administrador |
| `DELETE /clubs/{id}` | [RF-19-4](#rf-19-4--eliminar-club-de-running) Eliminar club de running | Administrador |
| `POST /clubs/{id}/memberships` | [RF-19-5](#rf-19-5--crear-membresía-de-club) Crear membresía de club | Corredor |
| `GET /clubs/{id}/memberships` y `GET /clubs/{id}/memberships/{id}` | [RF-19-6](#rf-19-6--leer-membresías-de-club) Leer membresías de club | Representante de club |
| `PUT /clubs/{id}/memberships/{id}` | [RF-19-7](#rf-19-7--actualizar-membresía-de-club) Actualizar membresía de club | Representante de club |
| `DELETE /clubs/{id}/memberships/{id}` | [RF-19-8](#rf-19-8--eliminar-membresía-de-club) Eliminar membresía de club | Corredor y Representante de club |

Campos propuestos de «club de running» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Nombre | Sí |
| Ciudad | Sí |
| Representante | Sí |
| Datos de contacto | Sí |
| Descripción | No |

Campos propuestos de «membresía de club» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Club | Sí |
| Corredor | Sí |
| Estado {Pendiente, Aceptada, Activa, Suspendida} | Sí |
| Rol dentro del club | No |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-19-1](#rf-19-1--crear-club-de-running) | Crear club de running | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-19-2](#rf-19-2--leer-clubes-de-running) | Leer clubes de running | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-19-3](#rf-19-3--actualizar-club-de-running) | Actualizar club de running | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-19-4](#rf-19-4--eliminar-club-de-running) | Eliminar club de running | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-19-5](#rf-19-5--crear-membresía-de-club) | Crear membresía de club | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-19-6](#rf-19-6--leer-membresías-de-club) | Leer membresías de club | Representante de club | Sprint 5 · Semana 10 | Pendiente |
| [RF-19-7](#rf-19-7--actualizar-membresía-de-club) | Actualizar membresía de club | Representante de club | Sprint 5 · Semana 10 | Pendiente |
| [RF-19-8](#rf-19-8--eliminar-membresía-de-club) | Eliminar membresía de club | Corredor y Representante de club | Sprint 5 · Semana 10 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-19-1 — Crear club de running

- **Historia de usuario:** Como administrador · Deseo registrar club de running. Para incorporar clubes identificados por ciudad, representante y datos de contacto.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-04 · **Caso de uso:** Registrar club de running
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (obligatorio); Ciudad (obligatorio); Representante (obligatorio); Datos de contacto (obligatorio); Descripción (opcional) | El sistema deberá permitir crear un club de running con su nombre, ciudad, representante, descripción y datos de contacto, para incorporarlo a la comunidad de corredores. | Registro de «club de running» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (nombre, ciudad, representante, datos de contacto), el sistema crea el registro de «club de running» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que el nombre no esté repetido en la ciudad.
- [ ] Se valida que el representante sea un usuario registrado.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-19-2 — Leer clubes de running

- **Historia de usuario:** Como corredor · Deseo consultar clubes de running. Para localizar clubes de distintas ciudades y conocer cómo contactar con ellos.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-04 · **Caso de uso:** Consultar clubes de running
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (filtro); Ciudad (filtro); Representante (filtro); Datos de contacto (filtro) | El sistema deberá permitir leer los clubes por ciudad y su información, para que el corredor los conozca y se una a uno. | Datos de «clubes de running» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «clubes de running» que cumplen los criterios indicados (nombre, ciudad, representante, datos de contacto), o informa que no hay resultados.
- [ ] El sistema debe permitir filtrar por ciudad.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-19-3 — Actualizar club de running

- **Historia de usuario:** Como administrador · Deseo modificar club de running. Para conservar vigentes los datos públicos y del representante de cada club.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-04 · **Caso de uso:** Actualizar club de running
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (obligatorio); Ciudad (obligatorio); Representante (obligatorio); Datos de contacto (obligatorio); Descripción (opcional) | El sistema deberá permitir actualizar los datos de un club, como su descripción, representante o contacto, para mantenerlos actualizados. | Registro de «club de running» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «club de running» (nombre, ciudad, representante, datos de contacto) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] El sistema debe mantener vigentes la descripción, el representante y el contacto.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-19-4 — Eliminar club de running

- **Historia de usuario:** Como administrador · Deseo eliminar club de running. Para dar de baja un club que dejó de participar, previa confirmación correspondiente.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-04 · **Caso de uso:** Eliminar club de running
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar o dar de baja un club, con la confirmación de su representante, cuando ya no participe en la plataforma. | Registro de «club de running» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «club de running» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe solicitar la confirmación del representante.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-19-5 — Crear membresía de club

- **Historia de usuario:** Como corredor · Deseo solicitar mi ingreso a un club. Para gestionar la solicitud de ingreso de un corredor y vincularlo al club si es aceptado.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-04 · **Caso de uso:** Solicitar ingreso a un club
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Club (obligatorio); Corredor (obligatorio); Estado {Pendiente, Aceptada, Activa, Suspendida} (obligatorio); Rol dentro del club (opcional) | El sistema deberá permitir crear la solicitud de un corredor para unirse a un club, que el club puede aceptar, para vincularlo como miembro. | Registro de «membresía de club» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (club, corredor, estado {pendiente, aceptada, activa, suspendida}), el sistema crea el registro de «membresía de club» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que el club exista.
- [ ] Se valida que el corredor no sea ya miembro del club.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-19-6 — Leer membresías de club

- **Historia de usuario:** Como representante de club · Deseo consultar membresías de club. Para conocer los miembros de un club y el estado de sus solicitudes de participación.
- **Actor:** Representante de club · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-04 · **Caso de uso:** Consultar miembros del club
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Club (filtro); Corredor (filtro); Estado (filtro); Rol dentro del club (filtro) | El sistema deberá permitir leer los miembros de un club y el estado de cada membresía, para que el representante conozca a su comunidad. | Datos de «membresías de club» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «membresías de club» que cumplen los criterios indicados (club, corredor, estado, rol dentro del club), o informa que no hay resultados.
- [ ] El sistema debe mostrar los miembros y el estado de cada membresía.
- [ ] Solo un usuario con el permiso correspondiente al actor «Representante de club» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-19-7 — Actualizar membresía de club

- **Historia de usuario:** Como representante de club · Deseo modificar membresía de club. Para ajustar la función o situación de un miembro cuando cambie su participación en el club.
- **Actor:** Representante de club · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-04 · **Caso de uso:** Actualizar membresía
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Club (obligatorio); Corredor (obligatorio); Estado {Pendiente, Aceptada, Activa, Suspendida} (obligatorio); Rol dentro del club (opcional) | El sistema deberá permitir actualizar el rol o el estado de una membresía (por ejemplo, aceptada, activa o suspendida), para gestionar la participación en el club. | Registro de «membresía de club» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «membresía de club» (club, corredor, estado {pendiente, aceptada, activa, suspendida}) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] Se valida que el estado sea uno de los definidos.
- [ ] Solo un usuario con el permiso correspondiente al actor «Representante de club» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-19-8 — Eliminar membresía de club

- **Historia de usuario:** Como corredor o representante de club · Deseo eliminar membresía de club. Para desvincular a una persona que se retira o deja de pertenecer al club.
- **Actor:** Corredor y Representante de club · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01, RF-04 · **Caso de uso:** Retirar membresía del club
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar la membresía de un corredor cuando se retira o es retirado del club, para desvincularlo. | Registro de «membresía de club» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «membresía de club» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe desvincular al corredor del club.
- [ ] Solo un usuario con el permiso correspondiente al actor «Corredor y Representante de club» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md), [RF-04 · Ciudades y zonas de operación](04-ciudades-y-zonas.md).
- **Dependen de esta capacidad:** [EP-11 · Rutas sugeridas por clubes](11-rutas-de-clubes.md), [EP-21 · Salidas grupales](21-salidas-grupales.md).

## Supuestos por validar

- El Excel deja «Rol dentro del club» como opcional sin catálogo de valores (inferido).
- RF-19-5 (crear membresía) y RF-19-6 mezclan actores (corredor y representante): se separa la solicitud (corredor) de la aceptación (representante).
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
