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

## Ronda 3 (2026-11-22)

- [x] T5 — Logo por tema: `app-brand-logo` (`shared/ui/brand-logo.ts`, CSS puro con `data-theme` y `prefers-color-scheme`) en el encabezado del corredor, el menú del admin y el marco de auth. Ruta: delegada (writer).
- [x] T6 — Barra de estado del color de la app: borde a borde en todas las versiones (`EdgeToEdge.enable` en `MainActivity`), `viewport-fit=cover` de vuelta, íconos de la barra según el tema con `SystemBars` de Capacitor, márgenes seguros arriba y abajo. Ruta: delegada (writer).
- [x] T7 — Botón «Correr» completo dentro de la barra (círculo de 3 rem, barra de 4,5 rem). Ruta: delegada (writer).
- [x] T8 — Proporciones en el celular: escala tipográfica del corredor para 360–400 px y banner de verificación en una fila. Ruta: delegada (writer).
- [x] T9 — Mapa en cada ruta (Leaflet + OpenStreetMap detrás del puerto `MAP_RENDERER`/`app-map-view`), en el detalle del admin (Tramos y factores) y en Correr siguiendo al corredor. Ruta: delegada (writer).

- 2026-11-22 T5: dos `<img alt="">` decorativos alternados con `:host-context`; estilos `.logo` muertos eliminados en `tab-header`, `admin-shell` y `auth-layout`; `brand-logo.spec.ts`.
- 2026-11-22 T6: `MainActivity` llama a `EdgeToEdge.enable(this)` antes de `super.onCreate` (dependencia `androidx.activity` explícita); con `viewport-fit=cover` y WebView ≥ 140 el plugin `SystemBars` de Capacitor 8 pasa los insets a la página en vez de rellenar el `DecorView` (la franja gris). Los encabezados de Ionic ya rellenan con `--ion-safe-area-top`; auth, el menú del admin y las páginas de estado lo hacen a mano; la barra de pestañas rellena con `--ion-safe-area-bottom` sobre su propio color. `DocumentPreferencesDisplay` fija el estilo de los íconos (`dark`→`Dark`, `light`→`Light`, `system`→`Default`). Requiere reconstruir el APK.
- 2026-11-22 T7: el `::part(native)` del botón de pestaña tiene `overflow: hidden`, así que el círculo ya no se eleva con margen negativo: 48 px dentro de una barra de 72 px.
- 2026-11-22 T8: corredor con cuerpo 15 px, subtítulo 17 px, título 20 px, display 24 px (escala base desde 40 rem); banner: ícono + «Verifica tu correo» + correo debajo y dos píldoras de 48 px que bajan solo si no caben.
- 2026-11-22 T9: `leaflet@1.9.4` cargado con `import()` solo en las pantallas con mapa; `leaflet.css` como hoja diferida (`inject: false`) enlazada al montar; atribución de OSM visible; tramos coloreados por nivel de la franja (verde/ámbar/rojo, neón sin evaluar); pruebas con `provideFakeMapRenderer`. Pendiente: probar en el celular.
- Checks: `ng test` 100 archivos / 738 pruebas en verde, `ng lint` limpio, `ng build` total inicial 1,18 MB (Leaflet en chunk diferido), `cap sync android` correcto (se restauró `server.url` del live reload en `assets/capacitor.config.json`).
