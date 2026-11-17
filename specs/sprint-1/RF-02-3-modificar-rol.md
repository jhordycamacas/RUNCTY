# RF-02-3 — Modificar rol de usuario

> Spec de Sprint 1 · Épica EP-02 · Debe tener · Estado: **Pendiente**

## Historia de usuario

Como administrador · Deseo modificar rol de usuario. Para ajustar los accesos de una persona cuando cambien sus responsabilidades en la plataforma.

## Requisito (fuente: backlog final)

El sistema deberá permitir actualizar los permisos de un rol o el rol asignado a un usuario, para ajustar su acceso a las funcionalidades.

## Criterios de aceptación

- [x] El formulario `/admin/roles/:id/editar` carga el rol, muestra su identificador sin poder cambiarlo y guarda nombre, descripción y permisos; el foco pasa al título del formulario.
- [x] Al guardar aparece un aviso de éxito que indica a cuántos usuarios se les actualizó el acceso (`syncedUsers`).
- [x] Los códigos `admin-permissions` (el rol Administrador conserva todos los permisos), `permission-escalation`, `admin-only` y `role-not-found` se muestran en español.
- [ ] En `/admin/usuarios`, un usuario con rol puede cambiar de rol eligiendo uno de la lista; antes de cambiarlo se pide confirmación.
- [ ] Los códigos `last-admin`, `self-lockout`, `user-not-found` y `user-profile-missing` se muestran en español y la fila del usuario no cambia.
- [ ] La asignación de rol solo se ofrece a quien tiene `roles.manage`.
- [x] Requiere el permiso `roles.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

## Trazabilidad

- Responsable: William Jadan
- Requisito de usuario: UR-03
- RNF: RNF-03 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Actualizar permisos de un rol; Asignar rol a un usuario
- Dependencia: RF-01

## Implementación

- `frontend/src/app/admin/roles/presentation/roles-admin.page.ts`
- `frontend/src/app/admin/roles/application/admin-roles.store.ts`
- `frontend/src/app/admin/roles/domain/role.ts`
- `frontend/src/app/admin/roles/infrastructure/http-role-admin.repository.ts`
- `frontend/src/app/admin/roles/presentation/role-form.page.ts`
- `frontend/src/app/admin/roles/domain/role-form.ts`
- `frontend/src/app/admin/users/presentation/users-admin.page.ts`
- `frontend/src/app/admin/users/application/admin-users.store.ts`
- `backend/apps/roles/presentation/views.py`

## Pruebas

- `frontend/src/app/admin/roles/domain/role-form.spec.ts`
- `frontend/src/app/admin/roles/infrastructure/http-role-admin.repository.spec.ts`
- `frontend/src/app/admin/roles/application/admin-roles.store.spec.ts`
- `frontend/src/app/admin/roles/presentation/roles-admin.page.spec.ts`
- `frontend/src/app/admin/roles/presentation/role-form.page.spec.ts`
- `frontend/src/app/admin/users/presentation/users-admin.page.spec.ts`
- `frontend/src/app/admin/users/application/admin-users.store.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/roles y /admin/usuarios` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
