# RF-04-3 — Modificar ciudad o zona de operación

> Spec de Sprint 1 · Épica EP-04 · Debe tener · Estado: **Implementada** (verificada en el navegador con el stack local)

## Historia de usuario

Como administrador · Deseo modificar ciudad o zona de operación. Para reflejar cambios en la cobertura o en los datos geográficos de una ciudad registrada.

## Requisito (fuente: backlog final)

El sistema deberá permitir actualizar el nombre, la ubicación o el estado de cobertura de una ciudad o zona, para reflejar la ampliación o suspensión del servicio.

## Criterios de aceptación

- [x] El formulario `/admin/ciudades/:id/editar` carga la ciudad o zona, muestra su tipo e identificador sin poder cambiarlos y guarda nombre, provincia, ubicación, cobertura y, en una zona, su ciudad; el foco pasa al título del formulario.
- [x] Al guardar aparece un aviso de éxito y la lista refleja el cambio.
- [x] Los códigos `city-not-found`, `invalid-parent-city` y los de campo inválido se muestran en español.
- [x] Requiere el permiso `cities.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

## Trazabilidad

- Responsable: Pedro Vargas
- Requisito de usuario: UR-01
- RNF: RNF-22, RNF-24 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Actualizar ciudad o zona de operación
- Dependencia: N/A

## Implementación

- `frontend/src/app/admin/cities/presentation/cities-admin.page.ts`
- `frontend/src/app/admin/cities/application/admin-cities.store.ts`
- `frontend/src/app/admin/cities/domain/managed-city.ts`
- `frontend/src/app/admin/cities/infrastructure/http-city-admin.repository.ts`
- `frontend/src/app/admin/cities/presentation/city-form.page.ts`
- `frontend/src/app/admin/cities/domain/city-form.ts`
- `backend/apps/cities/presentation/views.py`

## Pruebas

- `frontend/src/app/admin/cities/domain/city-form.spec.ts`
- `frontend/src/app/admin/cities/infrastructure/http-city-admin.repository.spec.ts`
- `frontend/src/app/admin/cities/application/admin-cities.store.spec.ts`
- `frontend/src/app/admin/cities/presentation/cities-admin.page.spec.ts`
- `frontend/src/app/admin/cities/presentation/city-form.page.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/ciudades` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
