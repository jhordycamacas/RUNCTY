# RF-04-4 — Eliminar ciudad o zona de operación

> Spec de Sprint 1 · Épica EP-04 · Debe tener · Estado: **Pendiente**

## Historia de usuario

Como administrador · Deseo eliminar ciudad o zona de operación. Para retirar del catálogo zonas sin rutas asociadas que ya no serán atendidas.

## Requisito (fuente: backlog final)

El sistema deberá permitir eliminar una ciudad o zona de operación que no tenga rutas asociadas, para retirar zonas que ya no se atienden.

## Criterios de aceptación

- [ ] Eliminar una ciudad o zona pide confirmación con un botón de estilo destructivo.
- [ ] Si se confirma, sale de la lista y aparece un aviso; si se cancela, no cambia nada.
- [ ] Los códigos `city-has-routes` y `city-has-zones` se muestran en español y la ciudad sigue en la lista.
- [ ] Requiere el permiso `cities.manage`; sin él la pantalla no es accesible.
- [ ] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

## Trazabilidad

- Responsable: Pedro Vargas
- Requisito de usuario: UR-01
- RNF: RNF-22, RNF-24 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Eliminar ciudad o zona de operación
- Dependencia: N/A

## Implementación

- `frontend/src/app/admin/cities/presentation/cities-admin.page.ts`
- `frontend/src/app/admin/cities/application/admin-cities.store.ts`
- `frontend/src/app/admin/cities/domain/managed-city.ts`
- `frontend/src/app/admin/cities/infrastructure/http-city-admin.repository.ts`

## Pruebas

- `frontend/src/app/admin/cities/infrastructure/http-city-admin.repository.spec.ts`
- `frontend/src/app/admin/cities/application/admin-cities.store.spec.ts`
- `frontend/src/app/admin/cities/presentation/cities-admin.page.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/ciudades` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
