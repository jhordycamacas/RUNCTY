# Rediseño de la interfaz (app del corredor y admin web)

**Objetivo:** que la app del corredor y el admin web sigan el estilo de dos referencias del usuario, conservando los colores del club (fucsia `#D6006F` y el logo rojo de Gacelas).

**Referencias (fuera del repo):**
- App del corredor: `C:\Users\usuario\Downloads\diseñoapp.jpg`. Cabecera en píldora blanca, tarjetas blancas muy redondeadas sobre fondo claro, números grandes y finos, una sección inferior oscura con tarjetas en degradado del color de acento, tipografía geométrica fina.
- Admin web: `C:\Users\usuario\Downloads\adminwebdiseño.jpg`. Fondo gris cálido, paneles blancos muy redondeados, barra lateral con el ítem activo en píldora negra, botón principal negro en píldora, tarjetas de indicadores con un número grande y una tarjeta destacada en el color de acento, chips redondeados, tipografía grotesca limpia.

**Decisión del usuario (2026-11-22):** colores del club, no los acentos de las referencias (verde lima y amarillo): el fucsia ocupa el lugar del acento.

**Problema adicional:** el usuario no encontró los tramos. Existen en `/admin/rutas/:id`, pero quedan al fondo del detalle, después del resumen y las franjas. El corredor no los ve como lista.

**Restricciones:** objetivo táctil de 48 px, contraste 4,5:1 en claro y oscuro, textos de la interfaz en español, sin código zombie, las pruebas existentes siguen en verde.

## Tareas

- [x] T1 — Tokens y tipografía: radios, superficies, fondo gris cálido del admin, píldoras y fuentes autoalojadas. Ruta: delegada (un escritor; varios archivos de tema).
- [x] T2 — Admin: barra lateral, barra superior, tarjetas de indicadores del resumen, listas y detalle de ruta con pestañas (Resumen, Franjas, Tramos y factores) para que los tramos se encuentren. Ruta: delegada.
- [x] T3 — Corredor: cabecera en píldora, inicio con tarjetas y números grandes, catálogo y detalle de ruta con la lista de tramos (solo lectura). Ruta: delegada.
- [x] T4 — Verificación: pruebas, lint, build, auditoría de accesibilidad en Chrome y vista en el celular.

## Checks

- `npx.cmd ng test --watch=false`, `npx.cmd ng lint`, `npx.cmd ng build` desde `frontend/`.

## Progreso

- 2026-11-22: documento creado. Rama `feat/rediseno-ui` (sale de `feat/sprint2-cierre-accesibilidad`).
- 2026-11-22 T1: radios 12/20/24 px y píldoras; fondo gris cálido del admin (`#eceae6`, oscuro `#141311`), barra lateral blanca; botón principal del admin en píldora negra; Outfit (corredor) y Geist (admin) variables desde `@fontsource-variable/*`, por área con `--rc-font-family`; tokens de la banda oscura (`--rc-inverse`, `--rc-feature-start/end`, clase `.rc-inverse`) con prueba de contraste nueva en `tokens.spec.ts`.
- 2026-11-22 T2: barra lateral con logo, secciones, ítem activo en píldora oscura y tarjeta de usuario; barra superior con título grande y acciones en píldora; resumen con tarjetas de indicadores de número fino y una en fucsia; listas como paneles blancos. Detalle `/admin/rutas/:id` en pestañas (Resumen, Franjas horarias, Tramos y factores; teclado con flechas, Inicio y Fin; `?seccion=tramos`); la lista de rutas muestra el número de tramos y el acceso «Tramos».
- 2026-11-22 T3: cabecera en píldora con logo y título centrado (`shared/ui/tab-header.ts`) en Inicio, Rutas y Cuenta; SOS centrado en la píldora; inicio con tarjeta de saludo y número fino de rutas activas, y banda oscura con las rutas recomendadas en tarjetas con degradado fucsia; tarjetas del catálogo, del detalle y de Cuenta blancas y redondeadas; el detalle del corredor ya listaba los tramos en solo lectura (de `GET /routes/{id}`), ahora con números finos y una línea que explica la franja. Nota fechada en `specs/05-catalogo-de-rutas.md`.
- 2026-11-22 checks: `ng test` 92 archivos, 693 pruebas en verde; `ng lint` sin errores; `ng build` total inicial 1,16 MB (presupuesto 1,2 MB). Pendiente T4 (Chrome y celular).
- 2026-11-22 T4: auditoría en Chrome (script en la página) de `/admin/resumen`, `/admin/rutas`, `/admin/rutas/:id?seccion=tramos`, `/admin/rutas/nueva`, `/app/inicio`, `/app/rutas`, `/app/rutas/:id` y `/app/cuenta`, a 360 px (iframe) y 1492 px, claro y oscuro: controles ≥ 48 px con etiqueta, texto ≥ 4,5:1 y sin scroll horizontal. Corregido en T4: la tabla oculta de los gráficos del resumen desbordaba a 360 px (ahora va dentro de un `div.sr-only`); los párrafos de `ion-label` en oscuro daban 2,77:1 (`--ion-text-color-step-400` → `--rc-text-muted`); el SOS usaba otro margen seguro que la cabecera y quedaba desalineado en Android (ahora `--ion-safe-area-top`). Fuentes Plus Jakarta Sans sin uso eliminadas de `frontend/public/fonts/`. Checks: `ng test` 693/693, `ng lint` limpio, `ng build` 1,16 MB. En el celular (Infinix, recarga en vivo) se vio el inicio nuevo; la alineación del SOS tras el arreglo queda por confirmar en el celular.
