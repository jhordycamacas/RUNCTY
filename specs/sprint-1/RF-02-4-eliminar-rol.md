# RF-02-4 — Eliminar rol de usuario

> Spec de Sprint 1 · Épica EP-02 · Debe tener · Estado: **Pendiente**

## Historia de usuario

Como administrador · Deseo eliminar rol de usuario. Para retirar roles sin usuarios asignados y evitar permisos innecesarios.

## Requisito (fuente: backlog final)

El sistema deberá permitir eliminar un rol que no tenga usuarios asignados, para evitar permisos innecesarios.

## Criterios de aceptación

- [ ] Eliminar un rol pide confirmación con un botón de estilo destructivo; los roles del sistema no ofrecen el botón.
- [ ] Si se confirma, el rol sale de la lista y aparece un aviso; si se cancela, no cambia nada.
- [ ] Los códigos `role-has-users` y `system-role` se muestran en español y el rol sigue en la lista.
- [ ] Requiere el permiso `roles.manage`; sin él la pantalla no es accesible.
- [ ] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

## Trazabilidad

- Responsable: William Jadan
- Requisito de usuario: UR-03
- RNF: RNF-03 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Eliminar rol
- Dependencia: RF-01

## Implementación

- `frontend/src/app/admin/roles/presentation/roles-admin.page.ts`
- `frontend/src/app/admin/roles/application/admin-roles.store.ts`
- `frontend/src/app/admin/roles/domain/role.ts`
- `frontend/src/app/admin/roles/infrastructure/http-role-admin.repository.ts`

## Pruebas

- `frontend/src/app/admin/roles/infrastructure/http-role-admin.repository.spec.ts`
- `frontend/src/app/admin/roles/application/admin-roles.store.spec.ts`
- `frontend/src/app/admin/roles/presentation/roles-admin.page.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/roles` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
