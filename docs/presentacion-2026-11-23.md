# Guía para la defensa de RUNCTY (lunes 2026-11-23)

Duración: **12 minutos por grupo**. La defensa es **individual**: cada integrante debe poder explicar cualquier parte.

Reglas del docente que cubre esta guía:

- Todos los diagramas UML están en el anexo del Documento de Visión.
- Hay trazabilidad entre requisitos funcionales (módulos), épicas e historias de usuario.
- Los Sprints 1 y 2 funcionan en vivo.

---

## 1. Antes de la clase (checklist)

Hacerlo **30 minutos antes**, en la computadora que se va a proyectar.

- [ ] Docker Desktop encendido (ícono de la ballena en verde).
- [ ] En una terminal, en `D:\RUNCTY`: `docker compose up -d --build`.
- [ ] Esperar a que `runcty-seed` diga **Exited (0)**. Comprobar con `docker ps -a`. Eso significa que ya se cargaron Loja, los roles, el administrador, las 5 rutas de ejemplo y los datos del Sprint 3.
- [ ] En otra terminal, en `D:\RUNCTY\frontend`: `npx ng serve --host 127.0.0.1`. Esperar el mensaje «Application bundle generation complete».
- [ ] Abrir el navegador en http://localhost:4200.
- [ ] Probar el usuario administrador: `admin@runcty.dev` / `Admin123!`.
- [ ] Crear antes una cuenta de corredor de respaldo (por ejemplo `corredor@runcty.dev`), aunque en la demo se cree otra en vivo.
- [ ] Celular (opcional): conectar por cable USB y ejecutar
  - `adb reverse tcp:4200 tcp:4200`
  - `adb reverse tcp:8000 tcp:8000`
  - `adb reverse tcp:9099 tcp:9099`
- [ ] Tener abiertos en pestañas: `docs/trazabilidad-diagramas.md`, el Excel `Trazabilidad diagramas RUNCTY.xlsx` y el Documento de Visión en el anexo de diagramas.
- [ ] Tener a mano la carpeta `D:\Proyecto5to\Docs\Entregables` (plan B).

> **Cuidado:** si se reinicia el contenedor `runcty-firebase`, **se borran todos los usuarios** (también el corredor creado). El administrador vuelve solo si se ejecuta de nuevo el seed. No reiniciar Docker durante la clase.

---

## 2. Guion minuto a minuto (12 minutos)

| Minuto | Tema | Quién |
| --- | --- | --- |
| 0:00–1:30 | Problema y solución | Integrante 1 |
| 1:30–3:00 | Trazabilidad | Integrante 2 |
| 3:00–5:00 | Diagramas UML | Integrante 3 |
| 5:00–7:30 | Demo del Sprint 1 | Integrante 4 |
| 7:30–10:00 | Demo del Sprint 2 | Integrante 1 |
| 10:00–11:15 | Avance del Sprint 3 y rediseño | Integrante 2 |
| 11:15–12:00 | Cierre | Integrante 3 |

### 2.1 Problema y solución (1:30)

- El cliente es **Gacelas Running Team**, de Loja.
- Problema: los corredores no saben qué rutas son más seguras ni a qué hora conviene correr.
- Solución: RUNCTY muestra un **índice de seguridad** de cada ruta **por franja horaria**.
- El índice se calcula con factores de riesgo e incidentes reales.
- Nunca decimos «ruta segura» o «insegura»: mostramos el nivel (Alto, Medio o Bajo) y el motivo.

### 2.2 Trazabilidad (1:30)

Mostrar la cadena: **requisito → épica → historia → sprint**.

1. Requisitos: `Requisitos de usuario - RUNCTY.csv`, `Requisitos funcionales - RUNCTY.csv` y `Requisitos no funcionales - RUNCTY.csv` (carpeta `Entregables\Final`).
2. Cada requisito funcional RF-XX es un módulo y una **épica** EP-XX.
3. Cada sub-requisito RF-XX-N es una **historia de usuario** con criterios de aceptación (153 historias).
4. Cada historia tiene su **sprint** (Sprints 1 a 5).
5. Abrir `docs/trazabilidad-diagramas.md`: una fila por épica con su sprint, estado, diagramas, clases, código y pantalla.
6. Abrir el Excel `Trazabilidad diagramas RUNCTY.xlsx`: el detalle de las 153 historias.
7. Mencionar la hoja **«Jira vs Excel final»**: Jira difiere en 15 historias; la versión vigente es el Excel y las specs.

### 2.3 Diagramas UML (2:00)

Todo está en el **anexo del Documento de Visión** (anotar aquí la página: ______).

- [ ] **Casos de uso general** (`cu_404_Diagrama_de_casos_de_uso_general.png`): cada paquete enlaza a su diagrama específico (40 diagramas, uno por módulo).
- [ ] **Diagrama de clases único, en español** (`clases_modelo_de_dominio_completo.png`): 44 clases; cada asociación tiene multiplicidad, rol y nombre. Señalar `Ruta`, `Tramo`, `FranjaHoraria`, `FactorDeRiesgo`, `IndiceSeguridad` y `CalculadoraIndiceSeguridad`.
- [ ] **Secuencia y actividad por épica** (52 imágenes en `Diagramas secuencia y actividad`): mostrar el par de una épica, por ejemplo «Recalcular índice de seguridad» (EP-07).

### 2.4 Demo del Sprint 1 (2:30)

Clics exactos en http://localhost:4200:

1. **Registro:** en la pantalla de inicio de sesión, «Crear cuenta» → nombres, apellidos, fecha de nacimiento, ciudad **Loja** (la cédula es opcional), correo, contraseña y su confirmación, aceptar el consentimiento LOPDP → «Crear cuenta». Entra a la app del corredor.
2. **Perfil:** pestaña **Cuenta** → «Datos personales» → cambiar el nombre → «Guardar».
3. **Perfil deportivo:** **Cuenta** → «Perfil deportivo» → distancia preferida y ritmo habitual → «Guardar».
4. **Preferencias:** **Cuenta** → «Preferencias» → cambiar tema o tamaño de letra; se aplica al momento.
5. Cerrar sesión e **iniciar sesión** como `admin@runcty.dev` / `Admin123!`.
6. **Usuarios:** menú «Usuarios» → buscar el corredor recién creado.
7. **Roles:** menú «Roles» → abrir un rol y mostrar sus permisos.
8. **Ciudades:** menú «Ciudades» → mostrar Loja y sus zonas.

### 2.5 Demo del Sprint 2 (2:30)

Como administrador:

1. Menú «Rutas» → «Nueva ruta» → nombre, ciudad Loja, inicio, fin, distancia → «Guardar».
2. Abrir la ruta → pestaña **Tramos y factores** → agregar un **tramo**.
3. Pestaña **Franjas horarias** → agregar una franja (por ejemplo 18:00–20:00).
4. En el tramo → agregar un **factor de riesgo** de severidad **alta**.
5. Pestaña **Resumen**: el índice **se recalcula solo** (100 − 35 = 65, nivel Medio).

Como corredor:

6. Pestaña **Rutas** → catálogo de Loja con filtros por franja, distancia y dificultad.
7. Abrir una ruta → nivel de seguridad **por franja**, los factores que lo explican y el **mapa**.

### 2.6 Extra: Sprint 3 y rediseño (1:15)

- El **backend del Sprint 3 está completo** y probado: incidentes, fuentes de información, puntos de apoyo, senderos con resguardo policial, alertas de zona y solicitudes de ruta segura.
- Mostrar el efecto: como corredor abrir **Parque Recreacional Jipiro** → la franja de la tarde está en **Medio 65** por un **robo registrado** (incidente del seed).
- Tocar la **campana** → alertas de zona vigentes en Loja.
- Rediseño: tema oscuro con el fucsia del club, 5 pestañas (Inicio, Rutas, Correr con GPS y mapa, Clubes, Cuenta).
- Decir con honestidad: las **pantallas** de administración del Sprint 3 todavía faltan.

### 2.7 Cierre (0:45)

- Sprint 1 y Sprint 2 funcionando (Sprint 2: 19 de 19 historias terminadas).
- Siguiente: pantallas del Sprint 3; luego valoraciones y favoritas (EP-10) y rutas verificadas por clubes (EP-11); después el Sprint 4 (contactos de confianza, botón de pánico, ubicación compartida, entrenamientos).

---

## 3. Quién dice qué

Completar con los nombres. Cada uno debe ensayar **también** las partes de los demás (la defensa es individual).

| Integrante | Partes que presenta | Debe dominar además |
| --- | --- | --- |
| Integrante 1: __________ | Problema y solución; demo del Sprint 2 | Cálculo del índice |
| Integrante 2: __________ | Trazabilidad; Sprint 3 y rediseño | Jira frente al Excel |
| Integrante 3: __________ | Diagramas UML; cierre | Diagrama de clases |
| Integrante 4: __________ | Demo del Sprint 1 | Roles y permisos |

### Preguntas probables y respuestas cortas

**¿Por qué antes había dos diagramas de clases y ahora uno?**
Se unificó en un solo modelo de dominio en español (44 clases) para no repetir clases ni contradecirse. Las vistas por área y el diagrama aparte de RF-07-9 se eliminaron; `CalculadoraIndiceSeguridad` está dentro del modelo completo.

**¿Por qué Jira no coincide con el Excel?**
Jira quedó con una versión anterior del backlog: difiere en 15 historias. La versión vigente es el Excel final y las specs; la hoja «Jira vs Excel final» explica cada diferencia.

**¿Cómo se calcula el índice de seguridad?**
- Cada tramo empieza con **100** puntos en cada franja horaria.
- Cada factor o incidente activo en esa franja resta según su severidad: **baja 10, media 20, alta 35** (mínimo 0).
- Niveles: **Alto ≥ 70**, **Medio 40–69**, **Bajo < 40**.
- La ruta toma el nivel de su **peor tramo**.
- Se recalcula en el servidor con cada cambio.

**¿Por qué OpenStreetMap y no Google Maps?**
Falta la clave de Google Maps. OpenStreetMap es libre y no necesita clave; el mapa está detrás de una abstracción, así que cambiar de proveedor no obliga a reescribir la app.

**¿Qué es SDD y qué son las specs?**
SDD es desarrollo guiado por especificaciones: antes del código se escribe la spec de cada épica (carpeta `specs/`) con sus historias y criterios de aceptación. Después se escribe la prueba, luego el código, y se marca cada criterio con evidencia. Estados: `Hecha`, `Parcial` y `Pendiente`.

**¿Qué pasó con el botón SOS?**
Se quitó de la pantalla. El pánico se activará con los botones de volumen del celular en el Sprint 4 (spec 15), para que se pueda usar sin mirar la pantalla.

---

## 4. Plan B (si algo falla)

| Problema | Qué hacer |
| --- | --- |
| La app no abre en el navegador | Revisar que `ng serve` siga corriendo; volver a ejecutar `npx ng serve --host 127.0.0.1` en `frontend/`. |
| No hay datos o el login falla | Volver a cargar el seed: `docker compose up -d --build` y esperar `runcty-seed` en Exited (0). Crear de nuevo el corredor. |
| El celular no conecta | Presentar en el navegador. Si se quiere vista móvil: F12 → icono de dispositivo móvil. |
| El celular muestra una franja blanca arriba | Estaba corregido en `db0ea21` (barra de acción nativa y splash por defecto); si reaparece, hay que reinstalar el APK reciente. Mientras tanto, seguir en el navegador. Ver `docs/bitacora-2026-11-22.md`. |
| La app muestra «error de conexión al servidor» en el celular | Se cortó el cable USB y se perdieron los túneles: repetir los tres `adb reverse` del checklist. |
| Se quiere demostrar contra el proyecto real y no contra los emuladores | Detener `runcty-api`; `manage.py runserver 8000` en `backend/` y `npm run start:real` en `frontend/`; abrir `http://127.0.0.1:4200` en incógnito. Solo hay el administrador, Loja, parámetros, catálogos y roles (sin rutas hasta `seed --data-only`). No dejar otro `ng serve` encendido. |
| Docker no arranca | Mostrar las capturas y los diagramas PNG de `D:\Proyecto5to\Docs\Entregables` y explicar el flujo con los diagramas de secuencia. |
| No abre el Documento de Visión | Abrir los PDF de `Entregables\Final` (casos de uso, clases, contexto). |
