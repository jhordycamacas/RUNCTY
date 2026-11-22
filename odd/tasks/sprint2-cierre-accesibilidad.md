# Cierre del Sprint 2: criterio de accesibilidad

**Objetivo:** pasar a `Hecha` las 19 historias del Sprint 2 (RF-05-1 a RF-05-8, RF-07-1 a RF-07-11).

**Problema:** todas están en `Parcial` por un único criterio sin marcar: "Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas". La funcionalidad, el código y las pruebas ya están (mapeo del 2026-11-22).

**Por qué:** el ingeniero revisa el lunes 23 de noviembre que los Sprints 1 y 2 funcionen; el usuario pidió cerrar el Sprint 2 con SDD (specs) antes de seguir con el Sprint 3.

**Alcance:** tema del admin (`frontend/src/theme/_areas.scss`), medición en el navegador de `/admin/rutas` (lista, nueva, editar, detalle con tramos, franjas y factores) y del corredor (`/app/rutas` y detalle), specs 05 y 07, `specs/README.md`, `CONTEXTO.md`.

**Fuera de alcance:** prueba en un celular real (la hace el equipo; se deja anotada). Los "reportes validados" del índice llegan con EP-17.

## Tareas

- [ ] T1 — El admin usa el objetivo táctil de 48 px en todos los punteros (quitar el 40 px y la media query que lo restauraba). Ruta: inline (un archivo mecánico).
- [ ] T2 — Medir en Chrome, a 1280 px y 360 px y en tema claro y oscuro: etiquetas, objetivos ≥ 48 px, contraste ≥ 4,5:1, sin scroll horizontal. Corregir lo que falle. Ruta: inline con el navegador.
- [ ] T3 — Marcar el criterio con evidencia en las 19 historias, pasarlas a `Hecha` y actualizar contadores de las specs 05 y 07, `specs/README.md` y `CONTEXTO.md`.

## Checks

- `npx.cmd ng test --watch=false`, `npx.cmd ng lint`, `npx.cmd ng build` desde `frontend/`.

## Progreso

- 2026-11-22: documento creado. Rama `feat/sprint2-cierre-accesibilidad`.
