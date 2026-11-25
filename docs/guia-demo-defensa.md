# Guía de la demo en vivo — RUNCTY

Guía para la defensa individual: qué demostrar, en qué orden y con qué comandos. Todo se ejecuta en **PowerShell** dentro de `D:\RUNCTYINGWEB`.

## 1. Qué tienes que demostrar

La rúbrica califica 4 cosas. La demo prueba cada una en vivo:

| Criterio | Qué mostrar en la demo | Paso |
| --- | --- | --- |
| 1. Backend y base de datos | Las tablas en MySQL, `/api/docs/` y el administrador de Django | 2, 3 y 5 |
| 2. Frontend web | La app en el navegador: lista, formulario y detalle | 4 |
| 3. Android | La app RUNCTY en el emulador, con los datos del backend | 6 |
| 4. CRUD completo | Crear, consultar, editar y eliminar desde la app, más un error 400 | 4 y 6 |

Además, prepárate para **abrir y explicar código** (sección 4): la nota se confirma en la defensa.

## 2. Preparación (15 minutos antes)

Abre **4 terminales** en VS Code (botón `+` de la terminal).

### Terminal 1: MySQL

```powershell
Start-Service MySQL84          # si pide permisos, abre PowerShell como administrador
Get-Service MySQL84            # debe decir Running
```

### Terminal 2: backend (Django)

```powershell
cd D:\RUNCTYINGWEB\backend
.\.venv\Scripts\Activate.ps1
python manage.py check          # System check identified no issues
python manage.py seed           # deja los datos de Loja listos (no duplica nada)
python manage.py runserver 0.0.0.0:8000
```

Déjala abierta: aquí vas a ver cada petición que llega (`GET /api/rutas/ 200`, `POST ... 201`).

### Terminal 3: frontend (Angular + Ionic)

```powershell
cd D:\RUNCTYINGWEB\frontend
npx ng serve --port 8100
```

Espera `Local: http://localhost:8100/` y abre esa dirección en el navegador.

### Terminal 4: Android

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Pixel7_API36
```

Cuando el emulador termine de encender (otra pestaña de la terminal):

```powershell
adb devices                     # debe listar emulator-5554  device
cd D:\RUNCTYINGWEB\frontend
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
adb shell monkey -p ec.runcty.ingweb -c android.intent.category.LAUNCHER 1
```

Si la APK no existe o cambiaste código, vuelve a generarla:

```powershell
cd D:\RUNCTYINGWEB\frontend
npm run build
npx cap sync android
cd android
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
.\gradlew.bat assembleDebug
```

### Pestañas del navegador listas

1. http://localhost:8100/inicio (la app web)
2. http://127.0.0.1:8000/api/docs/ (Swagger)
3. http://127.0.0.1:8000/admin/ (usuario `admin`, contraseña `Admin123!`)

## 3. La demo, paso a paso (unos 5 minutos)

### Paso 1. Presentar en una frase

> "RUNCTY recomienda rutas para correr en Loja con un nivel de seguridad Alto, Medio o Bajo por franja horaria. Está hecha con Django, MySQL, Angular, Ionic y Android."

### Paso 2. Las tablas en MySQL (criterio 1)

En una terminal:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u runcty_app -p -h 127.0.0.1 -P 3307 runcty
```

Contraseña: la de `DB_PASSWORD` en `backend\.env`. Dentro de MySQL:

```sql
SHOW TABLES;
DESCRIBE rutas_ruta;
SELECT id, nombre, distancia_km, dificultad FROM rutas_ruta;
exit
```

**Qué decir:** "Cada modelo de Django es una tabla. Las crearon las migraciones con `python manage.py migrate`. `ciudad_id` es la llave foránea a la ciudad."

### Paso 3. La API y su documentación (criterio 1 y 4)

En Swagger (http://127.0.0.1:8000/api/docs/):

1. Abre `POST /api/rutas/`, pulsa **Try it out** y pega:

   ```json
   {"ciudad": 1, "nombre": "Ruta demo defensa", "descripcion": "Prueba en vivo", "distancia_km": 3.5, "dificultad": "FACIL", "superficie": "ASFALTO", "activa": true}
   ```

   **Execute** → respuesta **201** con el `id` nuevo.
2. Abre `GET /api/rutas/{id}/` con ese id → **200**.
3. Repite el POST con `"nombre": ""` y `"distancia_km": -2` → **400** con el mensaje de cada campo.
4. `GET /api/rutas/9999/` → **404**.
5. `DELETE /api/rutas/{id}/` con la ruta demo → **204**.

**Qué decir:** "Todas las entidades tienen este mismo contrato: GET 200, POST 201, PUT y PATCH 200, DELETE 204, datos inválidos 400 y registro inexistente 404."

### Paso 4. La app web (criterio 2 y 4)

1. **Inicio:** muestra el nivel de seguridad de cada ruta por franja. Señala el Malecón del río Zamora: madrugada 45 puntos → Medio.
2. **Menú → Rutas → `+`:** crea una ruta (ciudad Loja, nombre, distancia) → aviso "Registro creado".
3. Abre su **detalle** → **Editar** → cambia la dificultad → "Cambios guardados".
4. **Eliminar** → confirma → vuelve a la lista sin la ruta.
5. **Error del backend:** Menú → **Franjas horarias → `+`** → Ruta: *Circuito Sauces Norte*, nombre *Solapada*, de **06:00 a 08:00** → **Guardar**. Aparece bajo "Hora de inicio": *"La franja se solapa con otra franja de la ruta…"*.

**Qué decir:** "La regla está en el modelo, en `clean()`. La API responde 400 y `errores.ts` pone el mensaje bajo el campo." Señala en la Terminal 2 la línea `POST /api/franjas-horarias/ 400`.

### Paso 5. El administrador de Django (criterio 1)

http://127.0.0.1:8000/admin/ → **Rutas** → abre *Parque Recreacional Jipiro*: se ven sus **tramos en línea**.

**Qué decir:** "Todos los modelos están registrados en `admin.py`, con búsqueda y filtros."

### Paso 6. Android (criterio 3)

En el emulador, con la app **RUNCTY** abierta:

1. Inicio con los niveles de seguridad (datos que llegan de `10.0.2.2:8000`).
2. Toca una ruta → detalle con el índice por franja.
3. Menú (☰) → **Franjas horarias** → `+` → crea una franja válida (por ejemplo *Mediodía*, 12:00 a 13:00) → "Registro creado".
4. **Eliminar** → confirmar → "Registro eliminado".

**Qué decir:** "Es el mismo código de la web empaquetado con Capacitor. En el emulador, `10.0.2.2` es la PC, por eso está en `ALLOWED_HOSTS`." Señala en la Terminal 2 las peticiones del emulador.

### Paso 7 (opcional). Las pruebas

```powershell
cd D:\RUNCTYINGWEB\backend
python manage.py test
```

Resultado esperado: `Ran 325 tests ... OK` (tarda unos 10 segundos).

## 4. Si te piden explicar el código

| Te preguntan por… | Abre este archivo | Qué explicar |
| --- | --- | --- |
| Un modelo con relaciones | `backend/rutas/models.py` (clase `Ruta`, `Tramo`) | `ForeignKey`, `on_delete`, validadores |
| Una regla de negocio | `backend/seguridad/models.py`, `FranjaHoraria.clean()` | Rechaza franjas que se solapan |
| El índice de seguridad | `backend/seguridad/indice.py` | 100 puntos, −10/−20/−35, peor tramo |
| Serializador | `backend/rutas/serializers.py` | Convierte a JSON y valida |
| Endpoint | `backend/rutas/views.py` (`RutaViewSet`) y `backend/rutas/urls.py` | `ModelViewSet` + `DefaultRouter` = CRUD |
| Rutas de la API | `backend/config/urls.py` | `/api/`, `/api/docs/`, `/admin/` |
| Credenciales | `backend/config/settings.py` y `backend/.env` | Se leen del `.env`, que Git ignora |
| Servicio del frontend | `frontend/src/app/core/crud.service.ts` | `list`, `get`, `create`, `update`, `delete` con `HttpClient` |
| URL web o Android | `frontend/src/app/core/api.config.ts` | `127.0.0.1` en web, `10.0.2.2` en Android |
| Errores del backend | `frontend/src/app/core/errores.ts` | Traduce el 400 a mensajes por campo |
| Una página | `frontend/src/app/paginas/rutas/ruta-lista.page.ts` | Lista, formulario y detalle por entidad |
| Las rutas de la app | `frontend/src/app/app.routes.ts` | `/rutas`, `/rutas/nuevo`, `/rutas/:id`, `/rutas/:id/editar` |

Respuestas cortas a preguntas probables:

- **¿Qué pasa si borro una ruta?** Sus tramos se borran con ella (`on_delete=CASCADE`).
- **¿Y si borro una ciudad que tiene rutas?** No se puede (`PROTECT`): la API responde 409.
- **¿Por qué `ModelViewSet`?** Da las 5 operaciones CRUD con poco código; el router crea las URLs.
- **¿Dónde se valida?** En `Model.clean()`; el serializador lo ejecuta, así vale igual en la API y en el admin.

## 5. Si algo falla en vivo

| Síntoma | Causa | Solución |
| --- | --- | --- |
| `Can't connect to MySQL server` | El servicio está apagado | `Start-Service MySQL84` (como administrador) |
| La web dice "Sin conexión" o la lista no carga | `runserver` detenido | Vuelve a correr la Terminal 2 |
| Error CORS en la consola del navegador | El puerto de la web no está en `CORS_ALLOWED_ORIGINS` | Usa `npx ng serve --port 8100` |
| Android no carga datos | El servidor no está en `0.0.0.0:8000` | `python manage.py runserver 0.0.0.0:8000` |
| `DisallowedHost` en la Terminal 2 | Falta `10.0.2.2` en `ALLOWED_HOSTS` | Revisa `backend\.env` y reinicia `runserver` |
| `adb devices` no lista nada | El emulador no terminó de encender | Espera y repite |
| Pantalla en blanco al abrir la app | Todavía carga | Espera 5 segundos |
| Datos raros después de probar | Quedaron registros de prueba | `python manage.py seed` |

Si algo no se puede arreglar en el momento, muestra la evidencia equivalente en el PDF `docs/RUNCTY_Requisitos_Trazabilidad_Evidencias.pdf`.

## 6. Al terminar

En cada terminal, `Ctrl + C`. Para apagar el emulador: `adb emu kill`. Para detener MySQL: `Stop-Service MySQL84`.
