# Cambios de la rama `PedroV` (2026-11-23)

Correcciones para que un corredor pueda registrarse desde el celular Android. Se probaron en un Samsung Galaxy A56 (SM-A566E, Android 16) por cable USB, contra los emuladores de Firebase (sin costo en Google Cloud).

## 1. Problemas que se corrigieron

| Problema en el celular | Causa | Archivo |
| --- | --- | --- |
| Franja blanca arriba de cada pantalla, con «RUNCTY» casi invisible. Tapaba el menú ☰, así que no se podía cerrar sesión en el panel de administración. | `EdgeToEdge.enable(this)` se llamaba **antes** de `super.onCreate`. En ese momento la ventana todavía tenía el tema del splash, y Android la creó con su barra de título. El tema sin barra (`AppTheme.NoActionBar`) se aplicaba después y ya no la quitaba. | `frontend/android/app/src/main/java/ec/runcty/app/MainActivity.java` |
| Al tocar un campo para escribir, aparecía una franja negra vacía entre el formulario y el teclado (registro e inicio de sesión). | El plugin SystemBars de Capacitor 8 ya sube la vista por encima del teclado, rellenando la ventana con su alto. Además se le seguía pasando el alto del teclado al WebView, y el WebView 139+ achicaba la página otra vez. El teclado se descontaba dos veces. | `MainActivity.java` |
| «Crear cuenta» parecía no hacer nada. | El formulario sí validaba (por ejemplo, una contraseña sin número), pero el mensaje no se mostraba. `ion-input` (Ionic 9) vuelve a dibujar sus propias clases cuando cambia `errorText` y borraba `ion-invalid` e `ion-touched`, que se ponían con `[class.*]`. Ionic solo muestra el error con esas dos clases. | `frontend/src/app/shared/ui/text-field.ts` |

## 2. Qué cambió en el código

### `MainActivity.java`

1. `super.onCreate(savedInstanceState)` se llama primero, y `EdgeToEdge.enable(this)` después. La ventana se crea con el tema sin barra de título. El plugin SystemBars sigue poniendo el estilo de los íconos de la barra de estado, porque se ejecuta en el siguiente turno del hilo principal.
2. Se registra un `OnApplyWindowInsetsListener` en el WebView que pone en cero el inset del teclado (`WindowInsetsCompat.Type.ime()`). Los insets de las barras del sistema siguen llegando al WebView, y con ellos `env(safe-area-inset-*)`. Con esto, la ventana se achica una sola vez y la página sube el campo enfocado por encima del teclado.

### `text-field.ts`

- Se quitaron los enlaces `[class.ion-invalid]` y `[class.ion-touched]`.
- Un `afterRenderEffect` pone o quita las dos clases sobre el `ion-input` después de cada render, según haya o no un error. Así sobreviven al re-render de Ionic, y el mensaje («La contraseña debe incluir al menos un número.», etc.) aparece bajo el campo.
- Afecta a todos los formularios que usan `app-text-field`: registro, inicio de sesión, cuenta y panel de administración.

## 3. Verificación

- Pruebas unitarias del frontend: `npx ng test --watch=false` → 100 archivos, 738 pruebas en verde.
- `eslint` y `prettier` sin observaciones en `text-field.ts`.
- En el Galaxy A56:
  - La cabecera se ve con el color de la app, y el menú ☰ y «Cerrar sesión» funcionan.
  - El teclado ya no deja la franja negra.
  - Con una contraseña sin número aparece el mensaje de error bajo el campo.
  - Con una contraseña válida, la cuenta de corredor se creó (`POST /api/v1/users` → 201) y la app entró a **Inicio**.

## 4. Cómo levantar todo en Windows sin Docker

Esta forma sirve cuando Docker Desktop no está instalado. Todo corre en los emuladores de Firebase, sin costo.

1. **Java y rutas con espacios.** Si la carpeta del usuario tiene un espacio (por ejemplo `C:\Users\Usuario iTC`), Java falla con `Unable to establish loopback connection`. Afecta al emulador de Firestore y a Gradle. Hay que crear `C:\jdktmp` y usar `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:\jdktmp`.
2. **Emuladores**, desde la raíz: `npx firebase emulators:start --project demo-runcty --only auth,firestore,storage`.
3. **API**, desde `backend/` con su `.venv`: `DJANGO_DEBUG=true FIREBASE_PROJECT_ID=demo-runcty FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199 python manage.py runserver 127.0.0.1:8000`.
4. **Datos de ejemplo:** el mismo entorno con `python manage.py seed`.
5. **Frontend**, desde `frontend/`: `npx ng serve --host 127.0.0.1`.
6. **Celular:** `adb reverse tcp:4200 tcp:4200`, `adb reverse tcp:8000 tcp:8000` y `adb reverse tcp:9099 tcp:9099`.
7. **APK:**
   - `npx ng build --configuration development` y `npx cap sync android`.
   - Poner `"server": { "url": "http://localhost:4200", "cleartext": true }` en `frontend/android/app/src/main/assets/capacitor.config.json`.
   - Desde `frontend/android`, compilar con `JAVA_HOME` en un **JDK 21**. El JBR de Android Studio recientes es Java 25, y Gradle 8.14 no lo admite (`Unsupported class file major version 69`). El comando es `gradlew.bat assembleDebug`.
   - Instalar con `adb install -r app/build/outputs/apk/debug/app-debug.apk`.

## 5. Costos de Google Cloud

Nada de lo anterior genera cobros:

- **Cuentas y datos:** se usan los emuladores locales de Firebase (`demo-runcty`). Un proyecto `demo-*` no puede llegar a servicios reales.
- **Mapas:** la app usa teselas de OpenStreetMap con Leaflet (`shared/map/leaflet-map-renderer.ts`), que son gratis. El botón de Google Maps solo abre un enlace público (`google.com/maps/search/?api=1&query=...`), sin clave ni API de pago. La API de Google Maps (`GOOGLE_MAPS_API_KEY`) no se llama en ninguna parte del código.
