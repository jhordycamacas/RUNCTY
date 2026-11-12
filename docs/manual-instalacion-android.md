# Manual: instalar RUNCTY en un celular Android (por cable USB)

Este manual explica cómo compilar la app móvil e instalarla en un celular Android físico conectado por USB, usando npm. La app se conecta a los **emuladores de Firebase** que corren en la computadora, así que no se necesitan claves reales.

Probado con un Infinix X678B (Android, XOS) en Windows 11.

## 1. Requisitos en la computadora

| Herramienta | Versión | Cómo comprobarla |
| --- | --- | --- |
| Node.js | 22 | `node -v` |
| npm | 10 | `npm -v` |
| Java (JDK) | 17 o superior (recomendado 21) | `java -version` |
| Android SDK + platform-tools (`adb`) | Se instala con Android Studio | `adb version` |

La variable de entorno `ANDROID_HOME` debe apuntar al SDK. En Windows suele ser `C:\Users\<usuario>\AppData\Local\Android\Sdk`. La carpeta `%ANDROID_HOME%\platform-tools` debe estar en el `PATH` para poder usar `adb`.

## 2. Preparar el celular

1. Activá las **Opciones de desarrollador**: en *Ajustes → Mi teléfono* (o *Acerca del teléfono*), tocá **Número de compilación** 7 veces.
2. En *Ajustes → Sistema → Opciones de desarrollador*, activá:
   - **Depuración USB**.
   - **Instalar vía USB**, si aparece (lo tienen Infinix, Xiaomi y otras marcas).
3. Conectá el celular por cable y elegí el modo **Transferencia de archivos**.
4. Cuando aparezca el aviso **"¿Permitir depuración USB?"**, marcá *Permitir siempre desde esta computadora* y aceptá.
5. Comprobá la conexión:

   ```bash
   adb devices -l
   ```

   El celular debe aparecer con el estado `device`. Si aparece como `unauthorized`, falta aceptar el aviso del paso 4.

## 3. Instalar las dependencias (solo la primera vez)

Desde la raíz del repositorio:

```bash
npm run install:all
```

## 4. Levantar los emuladores de Firebase

Dejá corriendo los emuladores en una terminal:

```bash
npm run functions:build
npm run emulators
```

Cuando aparezca `All emulators ready`, cargá los datos de prueba en **otra terminal**:

```bash
npm run seed
```

El seed crea la ciudad Loja, los roles del sistema y un administrador de prueba:

- Correo: `admin@runcty.dev`
- Contraseña: `Admin123!`

> Los datos de los emuladores se borran al cerrarlos. Para conservarlos, usá `npm run emulators:persist` en lugar de `npm run emulators`.

## 5. Conectar el celular con la computadora por USB

El celular necesita llegar a Metro (el servidor de JavaScript) y a los emuladores. `adb reverse` hace que `127.0.0.1` dentro del celular apunte a la computadora a través del cable:

```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:9099 tcp:9099
adb reverse tcp:8080 tcp:8080
adb reverse tcp:5001 tcp:5001
adb reverse tcp:9199 tcp:9199
```

| Puerto | Servicio |
| --- | --- |
| 8081 | Metro (código JavaScript de la app) |
| 9099 | Emulador de Auth |
| 8080 | Emulador de Firestore |
| 5001 | Emulador de Functions |
| 9199 | Emulador de Storage |

> Hay que repetir estos comandos cada vez que se desconecta el cable o se reinicia el celular.

## 6. Configurar la app para usar los emuladores

Creá el archivo `frontend/mobile/.env` a partir del ejemplo (git ya lo ignora):

```bash
cp frontend/mobile/.env.example frontend/mobile/.env
```

En `frontend/mobile/.env`, dejá estas dos líneas así:

```env
EXPO_PUBLIC_USE_EMULATORS=true
EXPO_PUBLIC_EMULATOR_HOST=127.0.0.1
```

`127.0.0.1` funciona gracias al `adb reverse` del paso 5. Si preferís usar Wi-Fi en lugar del cable, poné la IP de la computadora en la red local (por ejemplo `192.168.1.20`) y conectá ambos equipos a la misma red.

## 7. Compilar e instalar la app

Desde la carpeta `frontend/mobile/`:

```bash
cd frontend/mobile
npm run android
```

`npm run android` ejecuta `expo run:android`. Si hay más de un dispositivo conectado, indicá cuál con su ID (el que muestra `adb devices`):

```bash
npm run android -- --device <ID_DEL_DISPOSITIVO>
```

Este comando hace lo siguiente:

1. Genera la carpeta nativa `frontend/mobile/android/` (git la ignora y se puede regenerar en cualquier momento).
2. Compila el APK con Gradle. **La primera vez tarda entre 5 y 15 minutos**; las siguientes son mucho más rápidas.
3. Instala la app **RUNCTY** en el celular y la abre.
4. Deja corriendo Metro. Los cambios en el código se ven en el celular al guardar.

Si el celular pregunta si querés instalar la app por USB, aceptá.

## 8. Uso diario (después de la primera instalación)

La app ya queda instalada. Para volver a trabajar:

```bash
# Terminal 1 (raíz del repo)
npm run emulators

# Terminal 2 (raíz del repo), solo si los emuladores arrancaron vacíos
npm run seed

# Terminal 3
adb reverse tcp:8081 tcp:8081   # y el resto de puertos del paso 5
cd frontend/mobile
npm start
```

Abrí la app RUNCTY en el celular y se conecta sola a Metro.

Solo hay que volver a ejecutar `npm run android` cuando se agrega una dependencia nativa o se cambia `app.config.ts`.

## 9. Problemas frecuentes

| Problema | Solución |
| --- | --- |
| `adb devices` muestra `unauthorized` | Desbloqueá el celular y aceptá el aviso de depuración USB. Si no aparece, desactivá y volvé a activar la depuración USB. |
| `adb devices` no muestra nada | Probá otro cable (algunos solo cargan) y elegí el modo *Transferencia de archivos*. |
| `INSTALL_FAILED_USER_RESTRICTED` | Activá **Instalar vía USB** en las Opciones de desarrollador y aceptá el aviso en el celular. |
| La app muestra "Unable to load script" o la pantalla roja de Metro | Revisá que Metro esté corriendo y repetí `adb reverse tcp:8081 tcp:8081`. |
| No se puede iniciar sesión o registrarse (error de red) | Revisá que los emuladores estén corriendo, que estén hechos los `adb reverse` del paso 5 y que `EXPO_PUBLIC_USE_EMULATORS=true`. |
| Cambié el `.env` y la app no lo toma | Reiniciá Metro limpiando la caché: `npm start -- --clear`. |
| Error de Gradle sobre la versión de Java | Usá JDK 17 o 21 y revisá que `JAVA_HOME` apunte a esa versión. |
| `SDK location not found` | Definí `ANDROID_HOME` (ver sección 1) y abrí una terminal nueva. |
| `Filename longer than 260 characters` (Windows) | Ver la sección 10. |
| Quiero empezar de cero | Borrá `frontend/mobile/android/` y volvé a ejecutar `npm run android`. |

## 10. Windows: errores de ruta larga al compilar

Windows limita el largo de las rutas (260 caracteres para archivos y 248 para crear carpetas). El código nativo en C++ de React Native genera rutas muy largas, y la versión de ninja que trae el SDK de Android (1.10.2) no admite rutas largas. La compilación falla con errores como estos:

```text
ninja: error: Stat(...ComponentDescriptors.cpp.o): Filename longer than 260 characters
ninja: error: mkdir(...): No such file or directory
```

El repositorio ya trae dos medidas para evitarlo:

1. **Plugin `frontend/mobile/plugins/with-short-cxx-dir.js`** (registrado en `app.config.ts`). En Windows, mueve la carpeta temporal de CMake de `frontend\mobile\android\app\.cxx` a `<unidad>:\.rcx` (por ejemplo `D:\.rcx`). Se aplica solo cada vez que se genera `android/`. La carpeta `.rcx` se puede borrar sin problema; se vuelve a crear al compilar.
2. **Clonar el repositorio en una ruta corta.** La ruta usada es `D:\RUNCTY`. Como regla práctica, la carpeta `frontend/mobile/` no debería superar unos 25 caracteres de ruta (`D:\RUNCTY\frontend\mobile` tiene 25, justo en el límite). Con `D:\Proyecto5to\RunCity\RUNCTY` falla incluso con el plugin.

Si cambiaste de ruta o la compilación vieja quedó a medias, regenerá la carpeta nativa:

```bash
cd frontend/mobile
npx expo prebuild -p android --clean
npm run android
```

### Lo que NO funciona

- **`subst` (unidad virtual):** Node resuelve la unidad a su ruta real, así que CMake recibe igual la ruta larga.
- **Activar `LongPathsEnabled` en Windows:** ninja 1.10.2, del SDK, no lo respeta.
