# RF-05-4 — Eliminar ruta de running

> Spec de Sprint 2 · Épica EP-05 · Debe tener · Estado: **Implementada** (verificación en navegador pendiente de registrar)

## Historia de usuario

Como administrador · Deseo eliminar ruta de running. Para dejar de recomendar recorridos que ya no se usan o no son adecuados.

## Requisito (fuente: backlog final)

El sistema deberá permitir eliminar una ruta que ya no se use o no sea apta, previa confirmación, para que deje de recomendarse.

## Criterios de aceptación

- [ ] Eliminar una ruta pide confirmación con un botón de estilo destructivo.
- [ ] Si se confirma, la ruta sale de la lista y aparece un aviso; si se cancela, no cambia nada.
- [ ] Una ruta eliminada responde 404 `route-not-found` en la API.
- [ ] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [ ] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [ ] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

## Trazabilidad

- Responsable: Pedro Vargas
- Requisito de usuario: UR-13
- RNF: RNF-08, RNF-15 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Eliminar ruta de running
- Dependencia: RF-04

## Implementación

- `frontend/src/app/admin/routes/presentation/routes-admin.page.ts`
- `frontend/src/app/admin/routes/application/admin-routes.store.ts`

## Pruebas

- `frontend/src/app/admin/routes/presentation/routes-admin.page.spec.ts`
- `frontend/src/app/admin/routes/application/admin-routes.store.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/rutas` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
