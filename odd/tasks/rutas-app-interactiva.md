# Rutas del corredor: filtros en hoja, miniatura del recorrido e interacción

## Objetivo

Rediseñar la pestaña «Rutas» de la app del corredor: filtros detrás de un botón «Filtros», una
miniatura de la forma del recorrido en cada tarjeta y una lista más interactiva.

## Alcance autorizado

`frontend/src/app/routes/**`, `frontend/src/app/shared/ui/choice-chips.ts` (entrada `wrap`),
`backend/apps/routes/**`, un cambio mínimo en `backend/apps/seed` (el seed escribe la vista
previa), pruebas, y las docs `specs/05`, `specs/07`, `frontend/CONTEXTO-FRONTEND.md`,
`backend/README.md`, `backend/CONTEXTO-BACKEND.md`.

## Decisiones

- La lista de la API no traía geometría: se añade `preview` a los ítems de `GET /routes`
  (máx. 40 pares `[lat, lng]`, primero y último siempre). Se guarda en el documento de la ruta
  (lista de `{lat, lng}`, Firestore no admite arreglos anidados) y se reescribe con `segmentCount`
  en cada cambio de tramos y en el seed, para no leer los tramos de cada ruta al listar.
- La miniatura usa una línea con el nivel de la ruta en la franja elegida: la lista no trae
  niveles por tramo (el detalle sí y ya dibuja el mapa con ellos).
- Orden: se añadió «Ordenar» con `ActionSheetController` (nativo, sin librerías nuevas).
- La franja no cuenta en el contador «Filtros · N» (es contexto de color, siempre hay una).
- Conservar filtros y scroll al volver del detalle: la pila de Ionic mantiene viva la página.

## Tareas

- [x] T1 Backend: `preview_polyline` (función pura) y pruebas.
- [x] T2 Backend: `preview` en el documento de la ruta, el seed y `GET /routes` (no en el detalle).
- [x] T3 Dominio: proyección de la miniatura (`route-preview.ts`), `Route.preview` y su mapper
  tolerante.
- [x] T4 Dominio: búsqueda sin tildes, orden, superficie y conteo de filtros activos.
- [x] T5 Componente `app-route-preview` (SVG con variables CSS, inicio y fin, ícono si falta).
- [x] T6 Tarjeta: miniatura, efecto al tocar, entrada escalonada (sin animación con movimiento
  reducido); se quitó la curva decorativa antigua.
- [x] T7 Hoja de filtros (`app-routes-filter-sheet`) con borrador, «Limpiar» y «Ver N rutas».
- [x] T8 Página: buscador, «Filtros · N», «Ordenar», fichas activas, conteo, esqueletos, vacío con
  «Quitar filtros»; se quitaron las fichas de arriba.
- [x] T9 Docs.

## Ruta de implementación

Todo en línea (un solo escritor): el trabajo ya estaba mapeado por el padre y cada pieza se
verificó en su propio ciclo.

## Evidencia

- Backend: `.venv/Scripts/python -m pytest tests -q`: 1382 passed; `ruff check apps tests`: All
  checks passed; `ruff format --check apps tests`: sin cambios pendientes.
- RED observado: `test_route_geo.py` (error de importación de `preview_polyline`),
  `route-preview.spec.ts` del dominio (módulo inexistente), `catalog.spec.ts`/`mappers.spec.ts`,
  `route-card.spec.ts` (4 pruebas) y `routes-filter-sheet.spec.ts` (6 pruebas) antes de
  implementar. `route-preview.spec.ts` del componente se escribió junto con el componente (sin RED
  separado).
- Frontend de rutas: `npx ng test --watch=false --include='src/app/routes/**/*.spec.ts'`: 14
  archivos, 127 pruebas pasan.
- Verificación completa en un árbol de trabajo limpio con mis archivos (otro escritor dejaba el
  panel de resumen sin compilar en el árbol compartido): `npx ng test --watch=false`: 129
  archivos, 1031 pruebas pasan; `npx tsc --noEmit -p tsconfig.app.json` y `-p tsconfig.spec.json`:
  sin errores; `npm run lint`: All files pass linting; `npx ng build -c real`: build completo.
- Commit backend: `feat(routes): add a down-sampled preview ...` (ver `git log`).

## Pendiente

- Verificar en un teléfono real: hoja inferior (arrastre y botón atrás de Android), jalar para
  actualizar, color de las miniaturas en tema claro/oscuro y 360 px de ancho.
- Espejo en Engram `odd/rutas-app-interactiva/tasks`: pendiente (sin herramienta de memoria en
  este agente).
