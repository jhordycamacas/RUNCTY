# RF-01-2 — Consultar los datos de los usuarios autorizados

> Spec de Sprint 1 · Épica EP-01 · Debe tener · Estado: **Implementada** (verificada en el navegador con el stack local)

## Historia de usuario

Como administrador · Deseo consultar los datos de los usuarios autorizados. Para localizar información de usuarios mediante filtros concretos cuando tenga autorización para consultarla.

## Requisito (fuente: backlog final)

El sistema deberá permitir leer los datos de los usuarios, filtrándolos por nombres, apellidos, correo electrónico, identificación, fecha de nacimiento o ciudad de residencia. Reglas: permitir filtrar por esos campos; que solo el administrador consulte los datos de otros usuarios.

## Criterios de aceptación

- [x] `/admin/usuarios` lista los usuarios con nombre, correo, ciudad y rol, con estados de carga, vacío y error con botón «Reintentar».
- [x] Se puede filtrar por nombres, apellidos, correo, identificación, fecha de nacimiento y ciudad; solo se envían a la API los filtros con valor.
- [x] Una identificación que no tiene 10 dígitos o una fecha que no es AAAA-MM-DD muestra un aviso en español y no envía nada a la API.
- [x] Si la API devuelve `nextCursor`, aparece «Cargar más» y añade la página siguiente; sin cursor no aparece. Un cursor inválido (`invalid-cursor`) muestra un mensaje y permite volver a buscar.
- [x] La lista no muestra la identificación (minimización de datos): la API tampoco la devuelve.
- [x] Cada usuario muestra el nombre de su rol (RF-02-2).
- [x] Requiere el permiso `users.read`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

## Trazabilidad

- Responsable: William Jadan
- Requisito de usuario: UR-01
- RNF: RNF-01, RNF-02, RNF-08, RNF-18 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Consultar usuarios
- Dependencia: N/A

## Implementación

- `frontend/src/app/admin/users/presentation/users-admin.page.ts`
- `frontend/src/app/admin/users/application/admin-users.store.ts`
- `frontend/src/app/admin/users/domain/user-search.ts`
- `frontend/src/app/admin/users/domain/managed-user.ts`
- `frontend/src/app/admin/users/infrastructure/http-user-admin.repository.ts`
- `backend/apps/users/presentation/views.py`

## Pruebas

- `frontend/src/app/admin/users/domain/user-search.spec.ts`
- `frontend/src/app/admin/users/infrastructure/http-user-admin.repository.spec.ts`
- `frontend/src/app/admin/users/application/admin-users.store.spec.ts`
- `frontend/src/app/admin/users/presentation/users-admin.page.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/usuarios` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
