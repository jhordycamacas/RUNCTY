# RF-02-1 — Registrar rol de usuario

> Spec de Sprint 1 · Épica EP-02 · Debe tener · Estado: **Pendiente**

## Historia de usuario

Como administrador · Deseo registrar rol de usuario. Para definir qué acciones puede realizar cada tipo de usuario dentro de RUNCTY.

## Requisito (fuente: backlog final)

El sistema deberá permitir crear un rol (corredor, administrador o representante de club) con los permisos que tendrá disponibles, para definir el límite de acciones que puede realizar.

## Criterios de aceptación

- [ ] El formulario `/admin/roles/nuevo` crea un rol con identificador (minúsculas, números y `_`, 2 a 32 caracteres), nombre (máximo 60), descripción opcional (máximo 200) y permisos elegidos en una lista agrupada por área.
- [ ] Una entrada inválida muestra el mensaje del campo en español y no envía nada a la API; la descripción vacía no se envía.
- [ ] Al guardar aparece un aviso de éxito y la lista muestra el rol nuevo.
- [ ] Los códigos `role-exists`, `permission-escalation` y `admin-only` se muestran en español dentro del formulario sin perder lo escrito.
- [ ] Salir del formulario con cambios sin guardar pide confirmación.
- [ ] Requiere el permiso `roles.manage`; sin él la pantalla no es accesible.
- [ ] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

## Trazabilidad

- Responsable: William Jadan
- Requisito de usuario: UR-03
- RNF: RNF-03 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Registrar rol
- Dependencia: RF-01

## Implementación

- `frontend/src/app/admin/roles/presentation/roles-admin.page.ts`
- `frontend/src/app/admin/roles/application/admin-roles.store.ts`
- `frontend/src/app/admin/roles/domain/role.ts`
- `frontend/src/app/admin/roles/infrastructure/http-role-admin.repository.ts`
- `frontend/src/app/admin/roles/presentation/role-form.page.ts`
- `frontend/src/app/admin/roles/domain/role-form.ts`
- `backend/apps/roles/presentation/views.py`

## Pruebas

- `frontend/src/app/admin/roles/domain/role-form.spec.ts`
- `frontend/src/app/admin/roles/infrastructure/http-role-admin.repository.spec.ts`
- `frontend/src/app/admin/roles/application/admin-roles.store.spec.ts`
- `frontend/src/app/admin/roles/presentation/roles-admin.page.spec.ts`
- `frontend/src/app/admin/roles/presentation/role-form.page.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/roles` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
