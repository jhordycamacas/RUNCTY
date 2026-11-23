# Contexto del frontend

Documento vivo y corto. Para el detalle técnico y los comandos ver `README.md`; para el contexto del proyecto, `../CONTEXTO.md`.

## Arquitectura

- Una sola app Angular 22 + Ionic 9 + Capacitor 8 para web y Android (`src/app`). El backend Django es la única fuente de datos; Firebase Auth solo se usa en el cliente para registro, ingreso, reautenticación y correos.
- Cada carpeta de funcionalidad tiene capas: `domain` (tipos, reglas y puertos como clases abstractas), `application` (casos de uso y stores con signals), `infrastructure` (repositorios HTTP, almacenamiento local, DOM) y `presentation` (páginas). Los puertos se enlazan a sus adaptadores en `app.config.ts`; las pruebas los cambian por dobles.
- Dos áreas cargadas bajo demanda: `/app` (corredor, mobile-first, pestañas Inicio, Rutas, Correr, Clubes, Cuenta) y `/admin` (escritorio, menú lateral). Los guards leen rol y permisos de `GET /me`.

## Tema y accesibilidad

- Colores solo mediante tokens CSS (`src/theme`); la preferencia de apariencia pone `data-theme` en `<html>` (`light`, `dark`, `system`) y el tamaño de letra mueve `--rc-font-scale`.
- Objetivo táctil de 48 px, contraste de texto 4,5:1, textos en español. Todo lo que dibuja un mapa también existe como texto junto a él.

## Entornos y cómo correr

| Entorno | Archivo | Uso |
| --- | --- | --- |
| Desarrollo | `environment.ts` | emuladores de Firebase y API local; `npm start` |
| Real | `environment.real.ts` | proyecto Firebase real contra la API local; `npm run start:real` |
| Producción | `environment.prod.ts` | `npm run build`; la API es un marcador hasta el despliegue |

- Emuladores: `firebase emulators:start`, luego `python manage.py seed` y `runserver` en `backend/` (o `docker compose up`).
- `googleMapsApiKey` es `null` en los tres entornos; el responsable pega la clave del navegador (nunca una sin restringir en git). La clave todavía no está creada y el renderizador de Google no se verificó en un navegador real ni en el celular.
- La configuración web de Firebase de `environment.prod.ts` y `environment.real.ts` es pública y ya está en git; `apiBaseUrl` de producción es un marcador (`https://api.example.com/api/v1`) que `deploy/deploy-web.ps1 -ApiUrl` reescribe.

## Mapas

- Puerto `MapRenderer` (`src/app/shared/map/map-renderer.ts`): las pantallas solo pasan líneas, marcadores y `follow` a `<app-map-view>`.
- `provideMapRenderer(environment.googleMapsApiKey)` elige el proveedor al arrancar: con clave, `GoogleMapRenderer` (Maps JavaScript API cargada una sola vez por `GoogleMapsLoader`, `loading=async`, `language=es`, estilo oscuro derivado de los tokens); sin clave, `LeafletMapRenderer` con OpenStreetMap.
- Leaflet es el respaldo real: también entra si Google no carga (red, bloqueo, tiempo agotado) o rechaza la clave (`gm_authFailure`), con el aviso en el mapa. Un mapa nunca queda en blanco.
- Los colores de líneas y marcadores salen de los tokens (`--rc-primary`, `--rc-success`, `--rc-warning`, `--rc-danger`); Google los recibe ya resueltos porque no entiende variables CSS.
- `google.maps.Marker` está marcado como obsoleto por Google pero sigue soportado; se usa porque `AdvancedMarkerElement` exige un `mapId` y eso anula el estilo oscuro por JSON.
- Pendiente (Sprint 4, EP-16): posiciones de otros corredores en tiempo real; hoy solo se actualiza la posición propia en Correr.
- Cómo habilitar Google (clave, restricciones por referente, APK): `../specs/05-catalogo-de-rutas.md`, sección «Mapa de la ruta».

## Configuración y catálogos

- Los límites de los formularios vienen de `GET /settings` y las opciones (superficies, dificultades, tipos, etc.) de los catálogos del backend (`src/app/core/settings`, `src/app/core/catalogs`); no hay listas escritas en el código.
- Foto de perfil (`profilePhotoMaxKb` 20-500, por defecto 100; `profilePhotoMaxPx` 64-1024, por defecto 256): grupo «Foto de perfil» en Configuración del admin y lectura tolerante en `core/settings`.

## Foto de perfil

- Pantalla Cuenta (`account/presentation/profile-home.page.ts`), sin módulo ni título «Tu cuenta» ni lista de datos personales: la cabecera del perfil muestra el avatar (solo lectura, sin botones de foto), el nombre y el correo, con un lápiz pequeño «Editar perfil» que abre `datos`; debajo, «Perfil deportivo», «Preferencias» y «Cambiar contraseña» son opciones de lista simples y, al final, «Cerrar sesión» y «Eliminar cuenta».
- Pantalla «Editar perfil» (`edit-personal-data.page.ts`): contiene todo lo editable. Arriba el avatar con «Cambiar foto» (un `<input type="file" accept="image/*">` oculto; en Android el WebView ofrece cámara o galería, sin plugin nuevo) y «Quitar foto» (con confirmación); la foto se guarda sola desde esa pantalla (propio flujo, «Guardando foto…», error en español junto al avatar, toast «Foto actualizada.» / «Foto eliminada.») y no cuenta como cambio sin guardar del formulario. `ProfilePhotoStore` es único, así que el avatar de Cuenta se refresca al volver.
- `resizeToSquareJpeg(file, maxPx, maxKb)` (`shared/images`): rechaza lo que no es imagen y archivos de más de 15 MB, recorta al centro un cuadrado, lo reduce a `maxPx` sin agrandar, baja la calidad JPEG de 0.9 a 0.5 y, si aún pesa más de `maxKb`, reduce el lado un 20 % por vuelta. La parte del DOM (decodificar con `createImageBitmap` o `Image`, canvas) está detrás del puerto `ImageCodec`; los specs usan un códec falso (token `IMAGE_CODEC`).
- `ProfilePhotoStore` (señales `photo`, `loading`, `saving`, `error`) usa `ProfilePhotoRepository` (`GET|PUT|DELETE /users/me/photo`); la foto se descarta si cambia el usuario. El motivo `fields.photo` de la API (`invalid-format`, `invalid-image`, `too-large`) se traduce en `photoReasonMessage`.
- `<app-avatar>` (`shared/ui/avatar.ts`): foto o iniciales sobre `--rc-primary`; decorativo salvo `labelled`.
- No verificado en un celular real: la cámara/galería del WebView y el peso final de fotos grandes.

## Administración de usuarios

- Lista (`admin/users/presentation/users-admin.page.ts`): una sola barra `ion-input type="search"` («Buscar por cédula, correo o nombre»); Enter o «Buscar» envía el texto como `q` a `GET /users`, «Limpiar» vuelve a listar a todos. El nombre de cada fila enlaza a `/admin/usuarios/:uid`. No quedan filtros por campo ni `cityOptions`.
- Ficha (`user-detail.page.ts`, `UserDetailStore`, `GET /users/{uid}`): tres paneles (perfil personal, perfil deportivo, valoración); quien tiene `users.manage` ve un lápiz en los dos primeros que los cambia por un formulario en el mismo panel (`user-personal-edit.ts` con `PersonalDataFields` y las reglas del corredor, `user-sport-edit.ts` con `SportOptionsStore`; reglas y mapeo de errores por campo en `domain/user-edit.ts`) y una zona «Eliminar usuario» al final, deshabilitada en la propia cuenta. Cada guardado actualiza `UserDetailStore` con la respuesta, sin recargar. El correo no se edita. Los lápices son botones solo de icono: Ionic mueve su `aria-label` al botón nativo, así que las pruebas los buscan por clase. Las etiquetas de nivel y objetivos salen de `SportOptionsStore` (catálogos, inactivos incluidos; un código desconocido se muestra tal cual). `toUserDetail` lee con tolerancia: `emailVerified`, `createdAt` y `rating` son opcionales. Un 404 se muestra como «No encontramos a este usuario.»
- `<app-rating-stars [average] [count]>` (`admin/users/presentation/rating-stars.ts`) es genérico: cinco estrellas rellenas en proporción (`starFills`) y un texto alternativo único. Vive aquí porque `shared/ui` lo llevaba otro cambio; moverlo allí cuando otra pantalla lo necesite. La API manda `rating: null` hasta que existan las calificaciones de las salidas grupales.

## Resumen del panel

`admin/summary` usa palabras llanas (sin «KPI»): cuatro tarjetas (Rutas activas, Usuarios registrados, Ciudades con rutas, Usuarios con perfil deportivo), «Rutas y usuarios por ciudad» (`grouped-bars.ts`, barras horizontales agrupadas con leyenda, número en cada barra, texto alternativo y tabla oculta; solo si la API manda `byCity`), «Usuarios por nivel deportivo» (etiquetas del catálogo `sportLevels` vía `SummaryStore.levelLabel`; un código desconocido o un fallo del catálogo muestra el código tal cual, más «Sin perfil deportivo» = total − completados), seguridad de las rutas (Alta/Media/Baja/Sin evaluar) y usuarios nuevos por semana. «Más detalles» (cerrado) guarda las rutas más largas. Se borraron las gráficas de dificultad, superficie, factores de riesgo, roles y apariencia (el backend aún las devuelve). El mapper tolera la ausencia de `bySportLevel` y `byCity`. Falta «usuarios por ruta» hasta tener entrenamientos (EP-12).

## Android (notas aprendidas)

- Orientación bloqueada en vertical (`screenOrientation="portrait"` en `AndroidManifest.xml`).
- Sin barra de acción: tema `AppTheme.NoActionBar` y `AppTheme.NoActionBarLaunch` para el arranque.
- Fondo de ventana `#0B0B0F` (`windowBackground`) para que no haya destello blanco antes de que cargue la web.
- Edge-to-edge activado en `MainActivity` (`EdgeToEdge.enable`); la web respeta las áreas seguras.
- Con el APK en recarga en vivo, `adb reverse tcp:4200 tcp:4200` (y 8000, 9099 si se usan) hace que `localhost` del teléfono apunte a la PC.
- Depuración del WebView: `chrome://inspect` en Chrome de escritorio, o por CDP reenviando el socket `webview_devtools_remote_<pid>` con `adb forward`.
- Ruta corta (`D:\RUNCTY`): Gradle falla con rutas largas en Windows.

### Solución de problemas en el celular (2026-11-22)

| Síntoma | Causa | Qué hacer |
| --- | --- | --- |
| Franja blanca con garabatos azules arriba | No era la web: era la barra de acción nativa del tema de arranque y el splash blanco por defecto de Capacitor, visibles detrás del WebView transparente (borde a borde). Corregido en `db0ea21` (`AndroidManifest.xml`, `res/values/styles.xml`, `res/values/window_colors.xml`) | Reinstalar el APK reciente. Para diagnosticar: `adb shell uiautomator dump` y buscar `android:id/action_bar_container`; una captura del WebView por CDP sin franja confirma que no es la web |
| La app aparece en horizontal | No había bloqueo de orientación | Ya está `android:screenOrientation="portrait"` |
| «Error de conexión al servidor» | El cable USB se cortó y se perdieron los `adb reverse` (4200, 8000, 9099) | Repetir los tres `adb reverse` |
| Las llamadas públicas (ciudades) fallan con 400 | Sesión de Firebase guardada de un usuario inexistente; `getIdToken` fallaba y abortaba la llamada | Corregido en `12431ac` (`core/auth/sdk-firebase-auth.gateway.ts`): un token no renovable cuenta como «sin token» |

### Probar contra el proyecto real en el navegador

- `npm run start:real` sirve en `http://127.0.0.1:4200`. Abrir esa dirección (no `localhost`) en una ventana de incógnito: si queda otro `ng serve` (emuladores) escuchando en `[::1]:4200`, `localhost` abre ese y el ingreso de la cuenta real da «Correo o contraseña incorrectos». Ver quién escucha: `netstat -ano`.

## Pruebas

- `npx ng test --watch=false` (Vitest + jsdom), `npx tsc --noEmit -p tsconfig.app.json`, `npx tsc --noEmit -p tsconfig.spec.json`, `npm run lint`, `npx ng build -c real`.
- Sin red real en las pruebas: los mapas usan `FakeMapRenderer` o `fakeGoogleMaps()` (`src/app/shared/map/testing`).
- Totales conocidos: 857 pruebas en 117 archivos (`odd/tasks/google-maps.md`). Algunas pruebas con `ion-input` que leen el texto de error con `textContent` fallan a veces; la causa no está confirmada: repetir el archivo solo antes de dar un fallo por real.
- Diseño del admin (`3153394`): sección activa con tinte fucsia, botón primario fucsia (`--rc-primary`), `color-scheme` por tema para `<select>` y autocompletado nativos, y la regla global de foco con `:where` para no duplicar la caja en `app-select-field`.

## Botón Volver

- Los botones de volver (`app-subpage-header` del corredor y `app-admin-header` del admin) son solo la flecha: `<ion-back-button text="" aria-label="Volver">`, sin la palabra «Atrás». El estilo vive en un solo lugar (`src/theme/_ionic.scss`, `ion-back-button`): objetivo de 48 px centrado, flecha de 1,5 rem y margen negativo para que la flecha quede alineada con el margen lateral que da el padding de la barra.
