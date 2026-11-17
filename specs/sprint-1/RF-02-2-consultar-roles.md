# RF-02-2 — Consultar roles de usuario

> Spec de Sprint 1 · Épica EP-02 · Debe tener · Estado: **Implementada** (verificada en el navegador con el stack local)

## Historia de usuario

Como administrador · Deseo consultar roles de usuario. Para verificar los permisos existentes y detectar accesos que no correspondan al rol asignado.

## Requisito (fuente: backlog final)

El sistema deberá permitir leer los roles existentes, sus permisos y el rol asignado a cada usuario, para revisar quién tiene acceso a qué funcionalidades.

## Criterios de aceptación

- [x] `/admin/roles` lista cada rol con su nombre, identificador, descripción y permisos (con su nombre en español), y marca los roles del sistema.
- [x] Hay estados de carga, vacío y error con botón «Reintentar».
- [x] El rol asignado a cada usuario se ve en `/admin/usuarios` (RF-01-2).
- [x] Requiere el permiso `roles.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

## Trazabilidad

- Responsable: William Jadan
- Requisito de usuario: UR-03
- RNF: RNF-03 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Consultar roles y permisos
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
