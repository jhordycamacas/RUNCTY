# EP-24 — Publicidad: anunciantes y campañas

> Spec de capacidad · Debe tener · **0/8 Hecha, 0 Parcial, 8 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-24 · Publicidad: anunciantes y campañas |
| Requisitos | RF-24-1 a RF-24-8 (8 sub-requisitos) |
| Requisito de usuario (UR) | UR-14, UR-15 |
| RNF | RNF-26 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | William Jadan |
| Sprint planificado | Sprint 5 · Semana 10 |
| Sprint real | Planificada: Sprint 5 (semana 10). Sin implementar. Es una de las tres funciones que deben verse en la presentación. |
| Dependencias | [RF-02 · Roles y permisos](02-roles-y-permisos.md) |

## Propósito

Que el administrador gestione anunciantes y campañas publicitarias por vigencia, y que la app muestre la publicidad en espacios definidos para la autosostenibilidad. La plataforma no tiene fines de lucro.

Entradas, proceso y salidas del requisito padre en el Excel (RF-24):

- Entradas: datos del anunciante y de la campaña (título, imagen, enlace, fechas de vigencia, ciudad).
- Proceso: asociar cada campaña a un anunciante y mostrarla en su vigencia.
- Salidas: banners visibles y campañas vigentes o programadas.

## Alcance

**Incluye**

- CRUD de anunciantes (RF-24-1 a RF-24-4).
- CRUD de campañas publicitarias (RF-24-5 a RF-24-8).
- Mostrar el banner activo en los espacios de la app.

**No incluye**

- Cobros, facturación y pagos (fuera del piloto).
- Publicidad personalizada con datos personales.

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que el nombre no esté repetido.
- Que solo el administrador consulte a los anunciantes.
- Mantener vigentes los datos de contacto.
- Que el anunciante no tenga campañas vigentes.
- Que el anunciante exista.
- Que la fecha de fin sea posterior a la de inicio.
- Mostrar las campañas vigentes y programadas.
- Que la fecha de fin siga siendo posterior a la de inicio.
- Dejar de mostrar la campaña en la aplicación.

Decididas por el equipo o derivadas de otros documentos:

- La publicidad solo se presenta en los espacios definidos y **nunca interrumpe** el registro del entrenamiento, la consulta de rutas ni el botón de pánico (RNF-26).
- Una campaña se muestra solo dentro de su vigencia (fecha de inicio y de fin) y para su ciudad objetivo, si la tiene.
- Categorías de anunciante: tienda deportiva, gimnasio o comercio.
- Requiere el permiso `ads.manage`.
- Las imágenes se guardan en Firebase Storage.

## Modelo de datos y contrato de API

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /advertisers` | [RF-24-1](#rf-24-1--crear-anunciante) Crear anunciante | Administrador |
| `GET /advertisers` y `GET /advertisers/{id}` | [RF-24-2](#rf-24-2--leer-anunciantes) Leer anunciantes | Administrador |
| `PUT /advertisers/{id}` | [RF-24-3](#rf-24-3--actualizar-anunciante) Actualizar anunciante | Administrador |
| `DELETE /advertisers/{id}` | [RF-24-4](#rf-24-4--eliminar-anunciante) Eliminar anunciante | Administrador |
| `POST /campaigns` | [RF-24-5](#rf-24-5--crear-campaña-publicitaria) Crear campaña publicitaria | Administrador |
| `GET /campaigns` y `GET /campaigns/{id}` | [RF-24-6](#rf-24-6--leer-campañas-publicitarias) Leer campañas publicitarias | Administrador |
| `PUT /campaigns/{id}` | [RF-24-7](#rf-24-7--actualizar-campaña-publicitaria) Actualizar campaña publicitaria | Administrador |
| `DELETE /campaigns/{id}` | [RF-24-8](#rf-24-8--eliminar-campaña-publicitaria) Eliminar campaña publicitaria | Administrador |

Campos propuestos de «anunciante» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Nombre | Sí |
| Categoría {Tienda deportiva, Gimnasio, Comercio} | Sí |
| Datos de contacto | Sí |

Campos propuestos de «campaña publicitaria» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Anunciante | Sí |
| Título | Sí |
| Imagen | Sí |
| Espacio de la aplicación | Sí |
| Fecha de inicio | Sí |
| Fecha de fin | Sí |
| Enlace | No |
| Ciudad objetivo | No |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-24-1](#rf-24-1--crear-anunciante) | Crear anunciante | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-24-2](#rf-24-2--leer-anunciantes) | Leer anunciantes | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-24-3](#rf-24-3--actualizar-anunciante) | Actualizar anunciante | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-24-4](#rf-24-4--eliminar-anunciante) | Eliminar anunciante | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-24-5](#rf-24-5--crear-campaña-publicitaria) | Crear campaña publicitaria | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-24-6](#rf-24-6--leer-campañas-publicitarias) | Leer campañas publicitarias | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-24-7](#rf-24-7--actualizar-campaña-publicitaria) | Actualizar campaña publicitaria | Administrador | Sprint 5 · Semana 10 | Pendiente |
| [RF-24-8](#rf-24-8--eliminar-campaña-publicitaria) | Eliminar campaña publicitaria | Administrador | Sprint 5 · Semana 10 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-24-1 — Crear anunciante

- **Historia de usuario:** Como administrador · Deseo registrar anunciante. Para identificar y contactar a los comercios o aliados que apoyan la plataforma.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-02 · **Caso de uso:** Registrar anunciante
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (obligatorio); Categoría {Tienda deportiva, Gimnasio, Comercio} (obligatorio); Datos de contacto (obligatorio) | El sistema deberá permitir crear un anunciante o auspiciante (tienda deportiva, gimnasio o comercio) con sus datos de contacto y categoría, para vincularlo a la plataforma. | Registro de «anunciante» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (nombre, categoría {tienda deportiva, gimnasio, comercio}, datos de contacto), el sistema crea el registro de «anunciante» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que el nombre no esté repetido.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-24-2 — Leer anunciantes

- **Historia de usuario:** Como administrador · Deseo consultar anunciantes. Para consultar el directorio de anunciantes y gestionar sus datos de forma organizada.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-02 · **Caso de uso:** Consultar anunciantes
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (filtro); Categoría (filtro); Datos de contacto (filtro) | El sistema deberá permitir leer los anunciantes registrados y sus datos, para su gestión por parte del administrador. | Datos de «anunciantes» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «anunciantes» que cumplen los criterios indicados (nombre, categoría, datos de contacto), o informa que no hay resultados.
- [ ] Se valida que solo el administrador consulte a los anunciantes.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-24-3 — Actualizar anunciante

- **Historia de usuario:** Como administrador · Deseo modificar anunciante. Para conservar actualizados los medios de contacto y la categoría de un aliado.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-02 · **Caso de uso:** Actualizar anunciante
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (obligatorio); Categoría {Tienda deportiva, Gimnasio, Comercio} (obligatorio); Datos de contacto (obligatorio) | El sistema deberá permitir actualizar los datos de contacto o categoría de un anunciante, para mantenerlos actualizados. | Registro de «anunciante» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «anunciante» (nombre, categoría {tienda deportiva, gimnasio, comercio}, datos de contacto) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] El sistema debe mantener vigentes los datos de contacto.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-24-4 — Eliminar anunciante

- **Historia de usuario:** Como administrador · Deseo eliminar anunciante. Para retirar anunciantes sin campañas vigentes que ya no formen parte de la plataforma.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-02 · **Caso de uso:** Eliminar anunciante
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar un anunciante que no tenga campañas vigentes. | Registro de «anunciante» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «anunciante» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] Se valida que el anunciante no tenga campañas vigentes.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-24-5 — Crear campaña publicitaria

- **Historia de usuario:** Como administrador · Deseo registrar campaña publicitaria. Para publicar anuncios con contenido, ubicación en la app, ciudad objetivo y vigencia definidos.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-02 · **Caso de uso:** Registrar campaña publicitaria
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Anunciante (obligatorio); Título (obligatorio); Imagen (obligatorio); Espacio de la aplicación (obligatorio); Fecha de inicio (obligatorio); Fecha de fin (obligatorio); Enlace (opcional); Ciudad objetivo (opcional) | El sistema deberá permitir crear una campaña publicitaria con su título, imagen, enlace, espacio de la aplicación, fechas de vigencia y ciudad objetivo, para mostrarla en los espacios publicitarios. | Registro de «campaña publicitaria» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (anunciante, título, imagen, espacio de la aplicación, fecha de inicio, fecha de fin), el sistema crea el registro de «campaña publicitaria» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que el anunciante exista.
- [ ] Se valida que la fecha de fin sea posterior a la de inicio.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-24-6 — Leer campañas publicitarias

- **Historia de usuario:** Como administrador · Deseo consultar campañas publicitarias. Para saber qué anuncios están activos o programados y en qué espacios aparecerán.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-02 · **Caso de uso:** Consultar campañas publicitarias
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Anunciante (filtro); Título (filtro); Imagen (filtro); Espacio de la aplicación (filtro) | El sistema deberá permitir leer las campañas vigentes y programadas, con su espacio y sus fechas, para controlar qué publicidad se muestra. | Datos de «campañas publicitarias» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «campañas publicitarias» que cumplen los criterios indicados (anunciante, título, imagen, espacio de la aplicación), o informa que no hay resultados.
- [ ] El sistema debe mostrar las campañas vigentes y programadas.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-24-7 — Actualizar campaña publicitaria

- **Historia de usuario:** Como administrador · Deseo modificar campaña publicitaria. Para adaptar el anuncio, la ciudad objetivo o su período de exhibición según las necesidades de la campaña.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-02 · **Caso de uso:** Actualizar campaña publicitaria
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Anunciante (obligatorio); Título (obligatorio); Imagen (obligatorio); Espacio de la aplicación (obligatorio); Fecha de inicio (obligatorio); Fecha de fin (obligatorio); Enlace (opcional); Ciudad objetivo (opcional) | El sistema deberá permitir actualizar el contenido, el espacio, las fechas o la ciudad de una campaña, para ajustarla. | Registro de «campaña publicitaria» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «campaña publicitaria» (anunciante, título, imagen, espacio de la aplicación, fecha de inicio, fecha de fin) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] Se valida que la fecha de fin siga siendo posterior a la de inicio.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-24-8 — Eliminar campaña publicitaria

- **Historia de usuario:** Como administrador · Deseo eliminar campaña publicitaria. Para dejar de mostrar una campaña publicitaria que ha sido retirada.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-02 · **Caso de uso:** Eliminar campaña publicitaria
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar una campaña, para que deje de mostrarse en la aplicación. | Registro de «campaña publicitaria» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «campaña publicitaria» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe dejar de mostrar la campaña en la aplicación.
- [ ] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-02 · Roles y permisos](02-roles-y-permisos.md).

## Supuestos por validar

- Los espacios de la app (por ejemplo inicio y detalle de ruta) no están enumerados en el Excel; se definen con el diseño.
- Eliminar un anunciante con campañas vigentes: se rechaza (inferido).
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
