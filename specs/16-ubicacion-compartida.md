# EP-16 — Ubicación compartida en tiempo real

> Spec de capacidad · Debe tener · **0/4 Hecha, 0 Parcial, 4 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-16 · Ubicación compartida en tiempo real |
| Requisitos | RF-16-1 a RF-16-4 (4 sub-requisitos) |
| Requisito de usuario (UR) | no definido en el Excel |
| RNF | RNF-05 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | Jhordy Camacas |
| Sprint planificado | Sprint 4 · Semana 9 |
| Sprint real | Planificada: Sprint 4 (semana 9). Sin implementar. |
| Dependencias | [RF-03 · Contactos de confianza](03-contactos-de-confianza.md), [RF-12 · Registro de entrenamientos](12-registro-de-entrenamientos.md) |

## Propósito

Que el corredor comparta su ubicación en tiempo real con los contactos de confianza que elija, solo mientras dure la sesión, durante un entrenamiento.

Entradas, proceso y salidas del requisito padre en el Excel (RF-16):

- Entradas: contactos elegidos y duración de la sesión.
- Proceso: compartir la ubicación solo con los contactos elegidos mientras dure la sesión.
- Salidas: ubicación visible para los contactos e historial de sesiones.

## Alcance

**Incluye**

- CRUD de sesiones de ubicación compartida (RF-16-1 a RF-16-4).

**No incluye**

- Envío de alertas de pánico: [EP-15](15-boton-de-panico.md).
- Que cualquier otro usuario vea la ubicación.

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que los contactos estén registrados como de confianza.
- Que la duración sea mayor a cero.
- Mostrar las sesiones activas y pasadas y quién las ve.
- Que la nueva duración sea mayor a cero.
- Dejar de mostrar la ubicación al finalizar la sesión.

Decididas por el equipo o derivadas de otros documentos:

- La ubicación en tiempo real solo la ven los contactos seleccionados y únicamente mientras dure la sesión compartida (RNF-05).
- Las posiciones de los otros corredores se dibujarán sobre el mapa existente con el puerto `MapRenderer` (Google Maps o Leaflet, ver [EP-05](05-catalogo-de-rutas.md#mapa-de-la-ruta)); hoy el mapa solo muestra la posición propia en la pestaña Correr.
- La sesión pertenece a un entrenamiento del propio corredor ([EP-12](12-registro-de-entrenamientos.md)).
- La preferencia de privacidad de la ubicación ([EP-26](26-preferencias-de-usuario.md)) puede apagar el uso compartido.

## Modelo de datos y contrato de API

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /shared-location-sessions` | [RF-16-1](#rf-16-1--crear-sesión-de-ubicación-compartida) Crear sesión de ubicación compartida | Corredor |
| `GET /shared-location-sessions` y `GET /shared-location-sessions/{id}` | [RF-16-2](#rf-16-2--leer-sesiones-de-ubicación-compartida) Leer sesiones de ubicación compartida | Corredor |
| `PUT /shared-location-sessions/{id}` | [RF-16-3](#rf-16-3--actualizar-sesión-de-ubicación-compartida) Actualizar sesión de ubicación compartida | Corredor |
| `DELETE /shared-location-sessions/{id}` | [RF-16-4](#rf-16-4--eliminar-sesión-de-ubicación-compartida) Eliminar sesión de ubicación compartida | Corredor |

Campos propuestos de «sesión de ubicación compartida» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Entrenamiento | Sí |
| Contactos seleccionados | Sí |
| Duración | Sí |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-16-1](#rf-16-1--crear-sesión-de-ubicación-compartida) | Crear sesión de ubicación compartida | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-16-2](#rf-16-2--leer-sesiones-de-ubicación-compartida) | Leer sesiones de ubicación compartida | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-16-3](#rf-16-3--actualizar-sesión-de-ubicación-compartida) | Actualizar sesión de ubicación compartida | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-16-4](#rf-16-4--eliminar-sesión-de-ubicación-compartida) | Eliminar sesión de ubicación compartida | Corredor | Sprint 4 · Semana 9 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-16-1 — Crear sesión de ubicación compartida

- **Historia de usuario:** Como corredor · Deseo registrar sesión de ubicación compartida. Para que solo mis contactos elegidos puedan seguir mi ubicación durante un tiempo determinado.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-03, RF-12 · **Caso de uso:** Compartir ubicación en tiempo real
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Entrenamiento (obligatorio); Contactos seleccionados (obligatorio); Duración (obligatorio) | El sistema deberá permitir crear una sesión de ubicación compartida en tiempo real durante un entrenamiento, con los contactos que el usuario elija y por un tiempo determinado. | Registro de «sesión de ubicación compartida» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (entrenamiento, contactos seleccionados, duración), el sistema crea el registro de «sesión de ubicación compartida» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que los contactos estén registrados como de confianza.
- [ ] Se valida que la duración sea mayor a cero.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-16-2 — Leer sesiones de ubicación compartida

- **Historia de usuario:** Como corredor · Deseo consultar sesiones de ubicación compartida. Para saber con quién estoy compartiendo mi ubicación y revisar las sesiones anteriores.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-03, RF-12 · **Caso de uso:** Consultar sesiones de ubicación compartida
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Entrenamiento (filtro); Contactos seleccionados (filtro); Duración (filtro) | El sistema deberá permitir leer las sesiones de ubicación compartida activas y pasadas y quién las ve, para que el usuario controle con quién comparte su ubicación. | Datos de «sesiones de ubicación compartida» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «sesiones de ubicación compartida» que cumplen los criterios indicados (entrenamiento, contactos seleccionados, duración), o informa que no hay resultados.
- [ ] El sistema debe mostrar las sesiones activas y pasadas y quién las ve.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-16-3 — Actualizar sesión de ubicación compartida

- **Historia de usuario:** Como corredor · Deseo modificar sesión de ubicación compartida. Para cambiar las personas autorizadas o la duración del seguimiento mientras entreno.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-03, RF-12 · **Caso de uso:** Actualizar sesión de ubicación compartida
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Entrenamiento (obligatorio); Contactos seleccionados (obligatorio); Duración (obligatorio) | El sistema deberá permitir actualizar los contactos con los que se comparte o la duración de la sesión, para ajustarla a lo que necesita el corredor. | Registro de «sesión de ubicación compartida» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «sesión de ubicación compartida» (entrenamiento, contactos seleccionados, duración) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] Se valida que la nueva duración sea mayor a cero.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-16-4 — Eliminar sesión de ubicación compartida

- **Historia de usuario:** Como corredor · Deseo eliminar sesión de ubicación compartida. Para finalizar el acceso a mi ubicación cuando termine el entrenamiento o así lo decida.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-03, RF-12 · **Caso de uso:** Finalizar ubicación compartida
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar una sesión de ubicación compartida cuando termina el entrenamiento o cuando el usuario lo decida. | Registro de «sesión de ubicación compartida» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «sesión de ubicación compartida» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe dejar de mostrar la ubicación al finalizar la sesión.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-03 · Contactos de confianza](03-contactos-de-confianza.md), [RF-12 · Registro de entrenamientos](12-registro-de-entrenamientos.md).

## Supuestos por validar

- La tecnología de tiempo real (Firestore `onSnapshot` en el cliente o un canal propio de la API) no está elegida; la arquitectura actual evita que el cliente lea Firestore directamente, por lo que requiere una decisión.
- Al terminar la duración la sesión se cierra sola y los contactos dejan de ver la ubicación (inferido de RNF-05).
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
