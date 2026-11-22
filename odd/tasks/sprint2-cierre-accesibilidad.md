# Cierre del Sprint 2: criterio de accesibilidad

**Objetivo:** pasar a `Hecha` las 19 historias del Sprint 2 (RF-05-1 a RF-05-8, RF-07-1 a RF-07-11).

**Problema:** todas están en `Parcial` por un único criterio sin marcar: "Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas". La funcionalidad, el código y las pruebas ya están (mapeo del 2026-11-22).

**Por qué:** el ingeniero revisa el lunes 23 de noviembre que los Sprints 1 y 2 funcionen; el usuario pidió cerrar el Sprint 2 con SDD (specs) antes de seguir con el Sprint 3.

**Alcance:** tema del admin (`frontend/src/theme/_areas.scss`), medición en el navegador de `/admin/rutas` (lista, nueva, editar, detalle con tramos, franjas y factores) y del corredor (`/app/rutas` y detalle), specs 05 y 07, `specs/README.md`, `CONTEXTO.md`.

**Fuera de alcance:** prueba en un celular real (la hace el equipo; se deja anotada). Los "reportes validados" del índice llegan con EP-17.

## Tareas

- [x] T1 — El admin usa el objetivo táctil de 48 px en todos los punteros (quitar el 40 px y la media query que lo restauraba). Ruta: inline (un archivo mecánico).
- [x] T2 — Medir en Chrome, a 1280 px y 360 px y en tema claro y oscuro: etiquetas, objetivos ≥ 48 px, contraste ≥ 4,5:1, sin scroll horizontal. Corregir lo que falle. Ruta: inline con el navegador.
- [x] T3 — Marcar el criterio con evidencia en las 19 historias, pasarlas a `Hecha` y actualizar contadores de las specs 05 y 07, `specs/README.md` y `CONTEXTO.md`.

## Checks

- `npx.cmd ng test --watch=false`, `npx.cmd ng lint`, `npx.cmd ng build` desde `frontend/`.

## Progreso

- 2026-11-22: documento creado. Rama `feat/sprint2-cierre-accesibilidad`.
- 2026-11-22, T1 y T2 (`abbc02c`): el admin usa 48 px en todos los punteros (`frontend/src/theme/_areas.scss`; se quitó también el 36 px forzado del selector de tema); `ion-back-button` («Atrás») pasó de 32 a 48 px y `--ion-text-color-step-300` se asignó a `--rc-text-muted`, con lo que las ayudas de campo pasaron de 1,88:1 a 4,5:1 en tema oscuro (`frontend/src/theme/_ionic.scss`; contraste cubierto por `frontend/src/theme/tokens.spec.ts`).
- 2026-11-22, medición (T2): script de auditoría en la página, en Chrome contra el stack local (Docker + `npm start`), sobre `/admin/rutas`, `/admin/rutas/nueva`, `/admin/rutas/:id` (formularios de tramo, franja y factor abiertos), `/admin/rutas/:id/editar`, `/app/rutas` y `/app/rutas/:id`, a 1492 px y a 360 px (iframe de 360 px), tema claro y oscuro. Resultado: todo control interactivo con etiqueta y ≥ 48 px de alto, todo texto ≥ 4,5:1 (3:1 el grande), sin scroll horizontal. El detalle del corredor muestra el mismo índice por franja que el admin (Malecón del Río Zamora, 05:00–07:00: Medio, 65 de 100), lo que cubre RF-07-10 para ambos actores. Se midió a 1492 px en lugar de 1280 px (ancho de la ventana disponible).
- 2026-11-22, checks tras la corrección: `ng test` 688/688 (92 archivos), `ng lint` sin errores, `ng build` correcto (inicial 1,16 MB, presupuesto 1,2 MB).
- 2026-11-22, T3: criterio marcado en las 19 historias, que pasan a `Hecha`; specs 05 (8/0/0) y 07 (11/0/4), `specs/README.md` (28 Hecha, 16 Parcial, 109 Pendiente; Sprint 2: 19 Hecha) y `CONTEXTO.md` (17.4 y 17.7) actualizados.
- Pendiente fuera de alcance: comprobación en un celular Android real (la hace el equipo).
