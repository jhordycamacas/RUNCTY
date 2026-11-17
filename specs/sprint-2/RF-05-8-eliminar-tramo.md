# RF-05-8 — Eliminar tramo de ruta

> Spec de Sprint 2 · Épica EP-05 · Debe tener · Estado: **Implementada** (verificación en navegador pendiente de registrar)

## Historia de usuario

Como administrador · Deseo eliminar tramo de ruta. Para retirar un segmento incorrecto y conservar el orden de los tramos restantes.

## Requisito (fuente: backlog final)

El sistema deberá permitir eliminar un tramo de una ruta y reordenar los datos restantes, para retirar segmentos que ya no forman parte del recorrido.

## Criterios de aceptación

- [ ] Eliminar un tramo pide confirmación (botón destructivo).
- [ ] Si la API rechaza la operación, el motivo se muestra en español en el diálogo.
- [ ] Al eliminarse, el detalle se recarga y el orden de los tramos restantes se conserva.
- [ ] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [ ] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [ ] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

## Trazabilidad

- Responsable: Pedro Vargas
- Requisito de usuario: UR-13
- RNF: RNF-08, RNF-15 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Eliminar tramo de ruta
- Dependencia: RF-04

## Implementación

- `frontend/src/app/admin/routes/presentation/segments-section.ts`
- `frontend/src/app/admin/routes/application/route-detail.store.ts`
- `backend/apps/routes/domain/reorder.py`

## Pruebas

- `frontend/src/app/admin/routes/application/route-detail.store.spec.ts`
- `frontend/src/app/admin/routes/presentation/route-detail.page.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/rutas` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
