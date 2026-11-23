# EP-02 — Roles y permisos

> Spec de capacidad · Debe tener · **4/4 Hecha, 0 Parcial, 0 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-02 · Roles y permisos |
| Requisitos | RF-02-1 a RF-02-4 (4 sub-requisitos) |
| Requisito de usuario (UR) | UR-03 |
| RNF | RNF-03 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | William Jadan |
| Sprint planificado | Sprint 1 · Semana 4 |
| Sprint real | Sprint 1 (semana 4). Backend: 2026-11-12. Administración de roles: 2026-11-17. |
| Dependencias | [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md) |

## Propósito

Que cada usuario acceda solo a las funciones y datos de su rol (corredor, administrador o representante de club) y que el administrador pueda crear, consultar, modificar y eliminar roles y asignarlos a usuarios. Los permisos viajan en el token y los verifica el servidor (RNF-03).

Entradas, proceso y salidas del requisito padre en el Excel (RF-02):

- Entradas: nombre del rol, permisos y usuario al que se asigna.
- Proceso: validar que el rol no tenga usuarios asignados antes de eliminarlo y aplicar los permisos.
- Salidas: roles y permisos vigentes, o mensaje de acceso denegado.

## Alcance

**Incluye**

- CRUD de roles con su lista de permisos del catálogo (RF-02-1, RF-02-2, RF-02-3, RF-02-4).
- Asignar un rol a un usuario desde `/admin/usuarios` (parte de RF-02-3, «Usuario asignado»).

**No incluye**

- Cambiar permisos individuales de un usuario sin pasar por un rol.
- Reglas de acceso de las capacidades futuras: cada una declara su permiso en su spec.

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que el nombre del rol no esté repetido.
- Que el rol tenga al menos un permiso.
- Mostrar los permisos de cada rol y el rol asignado a cada usuario.
- Que los cambios de permisos apliquen a todos los usuarios con ese rol.
- Que el rol no tenga usuarios asignados.

Decididas por el equipo o derivadas de otros documentos:

- Roles del sistema: `runner`, `admin` y `club_rep`. No se pueden eliminar (`system-role`).
- Un rol con usuarios asignados no se puede eliminar (`role-has-users`).
- El rol Administrador conserva todos los permisos (`admin-permissions`).
- Solo un administrador asigna o quita el rol `admin` o incluye `roles.manage` en un rol; nadie concede permisos que no tiene (`admin-only`, `permission-escalation`).
- No se puede dejar al sistema sin administradores (`last-admin`) ni quitarse a uno mismo el acceso (`self-lockout`).
- Un cambio de rol revoca los tokens de refresco y actualiza los claims; se aplica al renovar el token.

## Modelo de datos y contrato de API

**Estado: implementado** (`backend/apps/roles`, `frontend/src/app/admin/roles`).

| Endpoint | Permiso | Descripción |
| --- | --- | --- |
| `GET /roles` | `roles.manage` | Lista de roles con `id`, `name`, `description`, `permissions[]`, `system`. |
| `POST /roles` | `roles.manage` | Crea un rol (`id`, `name`, `description?`, `permissions[]`). |
| `PUT /roles/{id}` | `roles.manage` | Reemplaza nombre, descripción y permisos; responde `{syncedUsers}`: a cuántos usuarios se les actualizó el acceso. |
| `DELETE /roles/{id}` | `roles.manage` | Elimina un rol sin usuarios y no del sistema. |
| `PUT /users/{uid}/role` | `roles.manage` | Asigna un rol (`roleId`) a un usuario; responde `{uid, role}`. |

Catálogo de permisos y reglas de escalada: [Arquitectura](transversal/arquitectura.md#autenticación-y-autorización). El permiso `users.manage` (2026-11-22) permite editar y eliminar cuentas ajenas ([EXT-01-3](01-gestion-de-usuarios.md#ext-01-3--el-administrador-edita-y-elimina-usuarios)); el rol de sistema `admin` lo recibe porque siempre tiene todo el catálogo, pero un administrador que ya tenía sesión abierta debe renovar su token (cerrar sesión y volver a entrar) para que su claim `perms` lo incluya. Los roles personalizados lo reciben solo si se les agrega. El catálogo no es un endpoint: el cliente lo nombra y agrupa por área (`frontend/src/app/admin/roles/domain/role.ts`).

Códigos propios: `role-exists`, `role-not-found`, `role-has-users`, `system-role`, `admin-permissions`, `admin-only`, `permission-escalation`, `last-admin`, `self-lockout`, `invalid-role-id`, `invalid-role-name`, `invalid-role-description`, `invalid-permissions`.

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-02-1](#rf-02-1--crear-rol-de-usuario) | Crear rol de usuario | Administrador | Sprint 1 · Semana 4 | Hecha |
| [RF-02-2](#rf-02-2--leer-roles-de-usuario) | Leer roles de usuario | Administrador | Sprint 1 · Semana 4 | Hecha |
| [RF-02-3](#rf-02-3--actualizar-rol-de-usuario) | Actualizar rol de usuario | Administrador | Sprint 1 · Semana 4 | Hecha |
| [RF-02-4](#rf-02-4--eliminar-rol-de-usuario) | Eliminar rol de usuario | Administrador | Sprint 1 · Semana 4 | Hecha |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-02-1 — Crear rol de usuario

- **Historia de usuario:** Como administrador · Deseo registrar rol de usuario. Para definir qué acciones puede realizar cada tipo de usuario dentro de RUNCTY.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 4 · **Dependencia:** RF-01 · **Caso de uso:** Registrar rol
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17). Specs `fe15884`; implementación: `b3b2a16`, `c2d1b3f`; backend `df41091`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre del rol {Corredor, Administrador, Representante de club} (obligatorio); Permisos (obligatorio); Usuario asignado (opcional) | El sistema deberá permitir crear un rol (corredor, administrador o representante de club) con los permisos que tendrá disponibles, para definir el límite de acciones que puede realizar. | Registro de «rol de usuario» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El formulario `/admin/roles/nuevo` crea un rol con identificador (minúsculas, números y `_`, 2 a 32 caracteres), nombre (máximo 60), descripción opcional (máximo 200) y permisos elegidos en una lista agrupada por área.
- [x] Una entrada inválida muestra el mensaje del campo en español y no envía nada a la API; la descripción vacía no se envía.
- [x] Al guardar aparece un aviso de éxito y la lista muestra el rol nuevo.
- [x] Los códigos `role-exists`, `permission-escalation` y `admin-only` se muestran en español dentro del formulario sin perder lo escrito.
- [x] Salir del formulario con cambios sin guardar pide confirmación.
- [x] Requiere el permiso `roles.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

**Implementación:** `frontend/src/app/admin/roles/presentation/roles-admin.page.ts`, `frontend/src/app/admin/roles/application/admin-roles.store.ts`, `frontend/src/app/admin/roles/domain/role.ts`, `frontend/src/app/admin/roles/infrastructure/http-role-admin.repository.ts`, `frontend/src/app/admin/roles/presentation/role-form.page.ts`, `frontend/src/app/admin/roles/domain/role-form.ts`, `backend/apps/roles/presentation/views.py`

**Pruebas:** `frontend/src/app/admin/roles/domain/role-form.spec.ts`, `frontend/src/app/admin/roles/domain/role.spec.ts`, `frontend/src/app/admin/roles/infrastructure/http-role-admin.repository.spec.ts`, `frontend/src/app/admin/roles/application/admin-roles.store.spec.ts`, `frontend/src/app/admin/roles/presentation/roles-admin.page.spec.ts`, `frontend/src/app/admin/roles/presentation/role-form.page.spec.ts`

### RF-02-2 — Leer roles de usuario

- **Historia de usuario:** Como administrador · Deseo consultar roles de usuario. Para verificar los permisos existentes y detectar accesos que no correspondan al rol asignado.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 4 · **Dependencia:** RF-01 · **Caso de uso:** Consultar roles y permisos
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17). Specs `fe15884`; implementación: `b3b2a16`, `c2d1b3f`; backend `df41091`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre del rol (filtro); Permisos (filtro); Usuario asignado (filtro) | El sistema deberá permitir leer los roles existentes, sus permisos y el rol asignado a cada usuario, para revisar quién tiene acceso a qué funcionalidades. | Datos de «roles de usuario» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [x] `/admin/roles` lista cada rol con su nombre, identificador, descripción y permisos (con su nombre en español), y marca los roles del sistema.
- [x] Hay estados de carga, vacío y error con botón «Reintentar».
- [x] El rol asignado a cada usuario se ve en `/admin/usuarios` (RF-01-2).
- [x] Requiere el permiso `roles.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

**Implementación:** `frontend/src/app/admin/roles/presentation/roles-admin.page.ts`, `frontend/src/app/admin/roles/application/admin-roles.store.ts`, `frontend/src/app/admin/roles/domain/role.ts`, `frontend/src/app/admin/roles/infrastructure/http-role-admin.repository.ts`

**Pruebas:** `frontend/src/app/admin/roles/infrastructure/http-role-admin.repository.spec.ts`, `frontend/src/app/admin/roles/domain/role.spec.ts`, `frontend/src/app/admin/roles/application/admin-roles.store.spec.ts`, `frontend/src/app/admin/roles/presentation/roles-admin.page.spec.ts`

### RF-02-3 — Actualizar rol de usuario

- **Historia de usuario:** Como administrador · Deseo modificar rol de usuario. Para ajustar los accesos de una persona cuando cambien sus responsabilidades en la plataforma.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 4 · **Dependencia:** RF-01 · **Caso de uso:** Actualizar permisos de un rol; Asignar rol a un usuario
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17). Specs `fe15884`; implementación: `b3b2a16`, `83c9d18`; backend `df41091`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre del rol {Corredor, Administrador, Representante de club} (obligatorio); Permisos (obligatorio); Usuario asignado (opcional) | El sistema deberá permitir actualizar los permisos de un rol o el rol asignado a un usuario, para ajustar su acceso a las funcionalidades. | Registro de «rol de usuario» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El formulario `/admin/roles/:id/editar` carga el rol, muestra su identificador sin poder cambiarlo y guarda nombre, descripción y permisos; el foco pasa al título del formulario.
- [x] Al guardar aparece un aviso de éxito que indica a cuántos usuarios se les actualizó el acceso (`syncedUsers`).
- [x] Los códigos `admin-permissions` (el rol Administrador conserva todos los permisos), `permission-escalation`, `admin-only` y `role-not-found` se muestran en español.
- [x] En `/admin/usuarios`, un usuario con rol puede cambiar de rol eligiendo uno de la lista; antes de cambiarlo se pide confirmación.
- [x] Los códigos `last-admin`, `self-lockout`, `user-not-found` y `user-profile-missing` se muestran en español y la fila del usuario no cambia.
- [x] La asignación de rol solo se ofrece a quien tiene `roles.manage`.
- [x] Requiere el permiso `roles.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

**Implementación:** `frontend/src/app/admin/roles/presentation/roles-admin.page.ts`, `frontend/src/app/admin/roles/application/admin-roles.store.ts`, `frontend/src/app/admin/roles/domain/role.ts`, `frontend/src/app/admin/roles/infrastructure/http-role-admin.repository.ts`, `frontend/src/app/admin/roles/presentation/role-form.page.ts`, `frontend/src/app/admin/roles/domain/role-form.ts`, `frontend/src/app/admin/users/presentation/users-admin.page.ts`, `frontend/src/app/admin/users/application/admin-users.store.ts`, `backend/apps/roles/presentation/views.py`

**Pruebas:** `frontend/src/app/admin/roles/domain/role-form.spec.ts`, `frontend/src/app/admin/roles/infrastructure/http-role-admin.repository.spec.ts`, `frontend/src/app/admin/roles/application/admin-roles.store.spec.ts`, `frontend/src/app/admin/roles/presentation/roles-admin.page.spec.ts`, `frontend/src/app/admin/roles/presentation/role-form.page.spec.ts`, `frontend/src/app/admin/users/presentation/users-admin.page.spec.ts`, `frontend/src/app/admin/users/application/admin-users.store.spec.ts`

### RF-02-4 — Eliminar rol de usuario

- **Historia de usuario:** Como administrador · Deseo eliminar rol de usuario. Para retirar roles sin usuarios asignados y evitar permisos innecesarios.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 4 · **Dependencia:** RF-01 · **Caso de uso:** Eliminar rol
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17). Specs `fe15884`; implementación: `b3b2a16`; backend `df41091`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar un rol que no tenga usuarios asignados, para evitar permisos innecesarios. | Registro de «rol de usuario» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Eliminar un rol pide confirmación con un botón de estilo destructivo; los roles del sistema no ofrecen el botón.
- [x] Si se confirma, el rol sale de la lista y aparece un aviso; si se cancela, no cambia nada.
- [x] Los códigos `role-has-users` y `system-role` se muestran en español y el rol sigue en la lista.
- [x] Requiere el permiso `roles.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

**Implementación:** `frontend/src/app/admin/roles/presentation/roles-admin.page.ts`, `frontend/src/app/admin/roles/application/admin-roles.store.ts`, `frontend/src/app/admin/roles/domain/role.ts`, `frontend/src/app/admin/roles/infrastructure/http-role-admin.repository.ts`

**Pruebas:** `frontend/src/app/admin/roles/infrastructure/http-role-admin.repository.spec.ts`, `frontend/src/app/admin/roles/application/admin-roles.store.spec.ts`, `frontend/src/app/admin/roles/presentation/roles-admin.page.spec.ts`

## Dependencias

- **Depende de:** [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md).
- **Dependen de esta capacidad:** [EP-17 · Reportes comunitarios](17-reportes-comunitarios.md), [EP-24 · Publicidad: anunciantes y campañas](24-publicidad.md).

## Supuestos por validar

- El Excel indica el nombre del rol como {Corredor, Administrador, Representante de club}; la implementación permite crear roles adicionales con permisos del catálogo (más flexible, necesario para delegar).
- Los permisos concretos de `club_rep` se definirán con la capacidad de clubes ([EP-19](19-clubes-y-membresias.md)).
