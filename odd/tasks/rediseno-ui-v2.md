# Rediseño v2: app para corredores y admin cuadrado

**Objetivo:** una app que se sienta hecha para corredores y un admin web alineado con la referencia, a partir de las observaciones del usuario del 2026-11-22.

**Observaciones del usuario (2026-11-22):**
- El diseño v1 no se parece a las referencias; tomar la idea, no copiarla. Referencias de Pinterest (apps de correr): fondo casi negro, un solo acento neón, números grandes condensados, botón grande «Empezar »», mapa con la ruta en neón, controles redondos de pausa y parar.
- El fucsia debe ser más fosforescente (sigue siendo el color del club).
- «Rutas» se ve en negro en la barra inferior; la barra solo tiene 3 opciones; falta notificaciones/alertas y una opción para correr con mapa.
- El SOS en pantalla no tiene sentido: el pánico será por botón físico (Sprint 4, ver spec 15). Ya se quitó (`505dd33`), junto con «Accesos rápidos».
- El admin web se ve descuadrado: dejarlo como la foto (`C:\Users\usuario\Downloads\adminwebdiseño.jpg`).

**Decisiones:**
- Corredor en tema oscuro por defecto (el claro sigue disponible en Preferencias), acento fucsia neón con texto negro encima (el blanco sobre neón no llega a 4,5:1).
- Barra inferior: Inicio, Rutas, Correr (destacada al centro), Alertas, Cuenta.
- Correr: seguimiento GPS en vivo (tiempo, distancia, ritmo; empezar, pausar, terminar) con `@capacitor/geolocation`. El mapa se agrega cuando el usuario entregue las claves de Google Cloud; guardar el entrenamiento es EP-12 (Sprint 4).
- Alertas: alertas de zona de riesgo vigentes (RF-07-12 a RF-07-15, Sprint 3); las notificaciones de EP-18 (Sprint 5) se sumarán ahí.

## Tareas

- [x] T1 — Tokens v2: fucsia neón, tema oscuro del corredor, tipografía condensada para cifras. Ruta: delegada.
- [x] T2 — Corredor: barra de 5 pestañas, inicio para corredores, catálogo y detalle, pestaña Correr con GPS en vivo, pestaña Alertas (con estado vacío hasta que exista la API del Sprint 3). Ruta: delegada.
- [x] T3 — Admin cuadrado como la foto en 1280, 1366, 1492 y 1920 px. Ruta: delegada.
- [x] T4 — Verificación: pruebas, lint, build, auditoría en Chrome, vista en el celular. Ruta: inline (padre).

## Checks

- `npx.cmd ng test --watch=false`, `npx.cmd ng lint`, `npx.cmd ng build` desde `frontend/`.

## Progreso

- 2026-11-22: documento creado en la rama `feat/rediseno-ui`.
- 2026-11-22 T1: fucsia neón `#ff2d95` (`--rc-primary`) con texto casi negro encima (5,6:1), capas oscuras `#0b0b0f`/`#15151b`/`#1e1e26`, token `--rc-page`, Oswald Variable para cifras (`--rc-font-family-display`); apariencia por defecto: oscuro. `tokens.spec.ts` en verde (texto ≥ 4,5:1 en ambos temas). Ruta: delegada (writer).
- 2026-11-22 T2: barra de 5 pestañas con «Correr» como círculo neón; inicio con héroe «Empezar a correr», cifras de la ciudad y ruta más segura de la franja; pestaña Correr (`app/run`, GPS con `@capacitor/geolocation`, tiempo/distancia/ritmo, pausa excluida, sin guardar en servidor); pestaña Alertas (`app/alerts`, `GET /risk-zone-alerts`, 404 = estado vacío); catálogo, detalle y Cuenta en estilo oscuro; permisos de ubicación en el manifiesto y `cap sync android`. Ruta: delegada (writer).
- 2026-11-22 T3: barra superior del admin como fila flex dentro del marco (`app-admin-header`, acciones entregadas por el shell), sin `--padding-end` mágicos; un solo margen `--rc-admin-gutter` (16 px) en marco, menú y paneles; Resumen en una grilla de 10 columnas (KPI 5×2, paneles 6+4 y 3+3+4). Falta revisar en Chrome a 1280/1366/1492/1920 (T4). Ruta: delegada (writer).
- Checks del writer: `ng test` 96 archivos / 721 pruebas en verde, `ng lint` limpio, `ng build` total inicial 1,18 MB (presupuesto 1,2 MB; Correr y Alertas en chunks diferidos), `cap sync android` correcto.
- 2026-11-22 T4 (padre): en Chrome el admin a 1492 px queda en una sola fila de título y acciones, con un margen y la grilla alineada; auditoría a 360 px en claro y oscuro de `/app/inicio`, `/app/correr`, `/app/alertas`, `/app/rutas`, `/app/rutas/:id`, `/app/cuenta`, `/admin/resumen` y `/admin/rutas/:id?seccion=tramos`: 0 problemas (controles ≥ 48 px con nombre, texto ≥ 4,5:1, sin scroll horizontal). El APK se reinstala para incluir el plugin de geolocalización.
