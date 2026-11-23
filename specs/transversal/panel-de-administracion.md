# Panel de administración

> Spec transversal · Área `/admin` del frontend único · Estado: **Hecha** (Resumen, tema y estructura verificados en el navegador con el stack local) · Sprint: apoyo de los Sprints 1 y 2 (implementado el 2026-11-16 y 2026-11-17)

Reúne lo que el panel necesita aparte de las historias de cada capacidad: la estructura de la sección, el tema, el **Resumen** (pantalla y endpoint). Las pantallas de gestión viven en la spec de su capacidad: [Gestión de usuarios](../01-gestion-de-usuarios.md), [Roles y permisos](../02-roles-y-permisos.md), [Ciudades y zonas](../04-ciudades-y-zonas.md), [Catálogo de rutas](../05-catalogo-de-rutas.md) y [Evaluación de seguridad](../07-evaluacion-de-seguridad.md). El aspecto visual está en [Sistema de diseño](sistema-de-diseno.md) y las decisiones técnicas en [Arquitectura](arquitectura.md).

## Propósito

Dar al personal de Gacelas (administrador y, en la expansión, representante de club) un panel web de escritorio que no repita la app del corredor: menú lateral, secciones por permiso y un resumen con cifras reales del uso de la aplicación.

## Estructura del panel

| Sección | Ruta | Permiso | Spec |
| --- | --- | --- | --- |
| Resumen | `/admin/resumen` | `admin.access` | este documento |
| Usuarios | `/admin/usuarios` | `users.read` | [EP-01](../01-gestion-de-usuarios.md) |
| Roles | `/admin/roles` | `roles.manage` | [EP-02](../02-roles-y-permisos.md) |
| Ciudades | `/admin/ciudades` | `cities.manage` | [EP-04](../04-ciudades-y-zonas.md) |
| Rutas | `/admin/rutas` | `routes.manage` | [EP-05](../05-catalogo-de-rutas.md) y [EP-07](../07-evaluacion-de-seguridad.md) |

### Criterios de aceptación de la estructura

- [x] El menú lista las secciones en ese orden y solo las que el usuario puede abrir (`ADMIN_SECTIONS`); `/admin` aterriza en la primera permitida y, si no hay ninguna, muestra un estado vacío en español (`NoSectionsPage`).
- [x] Cada sección carga de forma diferida y la protege un guard por permiso; sin el permiso se muestra la página de acceso denegado.
- [x] La autoridad del permiso es el servidor (`perms` del token, verificado en la API); el guard del cliente solo evita pantallas inútiles.
- [x] Por debajo de 768 px la barra lateral se pliega en el menú de Ionic.
- [x] Las secciones cuyas pantallas todavía no existen (reportes, publicidad, clubes) no aparecen en el menú: no hay enlaces a pantallas «no disponibles».

Implementación: `frontend/src/app/admin/admin-shell.ts`, `admin-sections.ts`, `admin.routes.ts`, `admin-landing.guard.ts`, `no-sections.page.ts`, `frontend/src/app/core/guards/auth.guards.ts`. Pruebas: `frontend/src/app/core/guards/guards.spec.ts`.

## Tema del panel

Reutiliza la preferencia de apariencia del usuario ([RF-01-13 y RF-01-15](../26-preferencias-de-usuario.md)): el panel no define un almacenamiento propio.

- [x] El menú del panel, junto a «Cerrar sesión», tiene un selector «Tema» con las opciones «Según el sistema», «Claro» y «Oscuro».
- [x] El selector muestra la apariencia guardada del usuario (claro por defecto) y la sigue si cambia.
- [x] Al elegir una opción se guarda con el caso de uso de preferencias y se aplica al instante, sin recargar.
- [x] La elección persiste tras recargar la página.
- [x] Si el guardado falla, aparece un aviso de error en español y el selector vuelve a la apariencia guardada.
- [x] El selector tiene etiqueta visible y objetivo táctil mínimo del área (48 px en pantallas táctiles).

Implementación:

- `frontend/src/app/admin/theme-selector.ts`
- `frontend/src/app/admin/admin-shell.ts`
- `frontend/src/app/preferences/application/preferences.store.ts` (solo se consume)

Pruebas:

- `frontend/src/app/admin/theme-selector.spec.ts`

## Pantalla «Resumen»

Historia: como administrador, deseo que al entrar al panel lo primero que vea sea un Resumen con analíticas de la app móvil, para tener el pulso del producto de un vistazo. La sección **Resumen** es la primera del menú y la pantalla de aterrizaje de `/admin`. Consume `GET /api/v1/admin/summary` (ver más abajo).

### Contenido

1. Saludo con la fecha de hoy en español.
2. Fichas KPI (números grandes, etiqueta pequeña en mayúsculas): Usuarios, Altas en 7 días, Rutas activas, Rutas con nivel Bajo, Ciudades y zonas.
3. Altas por semana (últimas 8 semanas): gráfico de barras verticales con valor sobre cada barra, categorías debajo, líneas de guía y base.
4. Gráficos de pastel (anillo con total al centro y leyenda con cantidad y porcentaje): rutas por dificultad y por superficie (agrupadas por el texto guardado; más de cinco valores distintos se suman en «Otras»), factores de riesgo por severidad, usuarios por rol y nivel de seguridad de las rutas (Alto, Medio, Bajo, Sin índice; nunca «segura» ni «insegura»).
5. Gráficos de barras verticales: rutas por ciudad y rutas más largas (km, hasta 6 rutas).
6. Perfil deportivo completado: barra de progreso con porcentaje; preferencias de apariencia y notificaciones activas.
7. Fichas «Próximamente» (sin cifras): Entrenamientos registrados, Alertas SOS y Eventos.

### Criterios de aceptación

- [x] «Resumen» es la primera sección del menú y `/admin` aterriza en ella para quien tiene `admin.access`; con otro permiso solo, aterriza en su primera sección permitida.
- [x] Muestra solo cifras que devuelve el endpoint; los bloques `null` no se pintan; las métricas inexistentes son fichas «Próximamente», sin números.
- [x] Estado de carga con esqueleto, estado de error con «Reintentar» y estado vacío (sin datos todavía) legible.
- [x] Cada gráfico tiene alternativa textual (`aria-label` y lista equivalente visualmente oculta); el color nunca es la única señal (hay etiqueta y número).
- [x] Contraste de texto 4,5:1 en claro y oscuro; sin scroll horizontal de la página a 360 px; las tarjetas se reacomodan.
- [x] Si `truncated` es `true`, un aviso indica que las cifras son un mínimo.
- [x] Los gráficos de pastel y de barras son SVG y CSS propios; los porcentajes de cada anillo suman 100 (resto mayor); un anillo sin datos muestra un aro neutro y «Sin datos»; un solo dato llena el anillo; los nombres largos se recortan con el nombre completo en el título.
- [x] Cada gráfico tiene `role="img"` con `aria-label` y una tabla oculta con los datos; la animación de entrada respeta `prefers-reduced-motion`; los colores de las porciones salen de los tokens y se ven a 3:1 sobre la tarjeta.
- [x] A 360 px los gráficos pasan a una columna con la leyenda debajo.
- [x] Todo el texto está en español; sin gráficos externos (SVG y CSS propios).

Implementación:

- `frontend/src/app/admin/summary/` (dominio, infraestructura, aplicación y presentación)
- `frontend/src/app/admin/admin-sections.ts` y `admin.routes.ts`

Pruebas:

- `frontend/src/app/admin/summary/**/*.spec.ts`
- `frontend/src/app/core/guards/guards.spec.ts`

## Endpoint del resumen (`GET /api/v1/admin/summary`)

Historia: como administrador, deseo ver en un solo lugar cifras reales de uso de la app (usuarios, rutas, seguridad, perfiles), para saber cómo crece el producto sin abrir cada sección.

### Principios

- **Solo datos reales.** Cada cifra sale de Firestore en el momento de la consulta. Lo que todavía no existe (entrenamientos, alertas SOS, eventos; Sprint 3 en adelante) **no se inventa ni se estima**: el endpoint no lo incluye y la pantalla muestra «Próximamente».
- **Solo agregados.** Nunca devuelve datos personales de una cuenta (ni correos, nombres, ids de usuario ni valores individuales del perfil deportivo o de las preferencias).
- **Se calcula en el servidor** y se responde en camelCase, como el resto de la API.

### Contrato

`GET /api/v1/admin/summary` (sin parámetros).

```json
{
  "generatedAt": "2026-11-17T15:04:05Z",
  "truncated": false,
  "users": {
    "total": 12,
    "byRole": { "runner": 10, "admin": 1, "club_rep": 1 },
    "registeredLast7Days": 3,
    "registeredLast30Days": 9,
    "registrationsByWeek": [{ "weekStart": "2026-09-28", "count": 0 }],
    "sportProfiles": { "completed": 7, "percentage": 58 },
    "preferences": {
      "saved": 8,
      "appearance": { "system": 2, "light": 5, "dark": 1 },
      "units": { "metric": 8, "imperial": 0 },
      "notificationsEnabled": 6
    }
  },
  "routes": {
    "total": 5, "active": 4, "inactive": 1, "totalKm": 41.3,
    "byDifficulty": { "Principiante": 2, "Intermedio": 2, "Avanzado": 1 },
    "bySurface": { "Asfalto": 3, "Sendero": 1, "Mixto": 1 },
    "byCity": [{ "cityId": "loja", "cityName": "Loja", "count": 5 }],
    "safetyLevels": { "high": 2, "medium": 2, "low": 1, "unrated": 0 },
    "distances": [{ "name": "Parque Jipiro", "distanceKm": 10.8 }],
    "timeSlots": 8,
    "riskFactors": { "total": 6, "bySeverity": { "low": 2, "medium": 3, "high": 1 } }
  },
  "cities": { "cities": 1, "zones": 2 }
}
```

- `registrationsByWeek`: exactamente 8 semanas, de la más antigua a la actual. Semana = lunes a domingo en UTC; `weekStart` es el lunes (`YYYY-MM-DD`). Se cuenta con `createdAt` del perfil; una cuenta sin `createdAt` no entra en las series ni en los conteos de 7 y 30 días, pero sí en `total`.
- `registeredLast7Days` / `registeredLast30Days`: ventanas móviles hasta `generatedAt`.
- `sportProfiles.percentage`: entero redondeado de `completed / total * 100`; `0` si no hay usuarios.
- `routes.safetyLevels`: cuenta cada ruta una vez, por su **peor nivel** entre las franjas guardadas (Bajo < Medio < Alto). Una ruta sin índice guardado cuenta en `unrated`. Son niveles, nunca «segura» o «insegura».
- `routes.distances`: las 8 rutas más largas (nombre y km), de mayor a menor; solo nombre de la ruta, nunca datos de cuentas.
- `routes.byCity`: orden descendente por cantidad y luego por nombre; el nombre sale del catálogo de ciudades (si la ciudad ya no existe, se usa el id).
- Las claves de los diccionarios `by*` aparecen siempre (con `0`), salvo `users.byRole`, que solo trae los roles presentes.

### Permisos (regla)

La ruta exige **`admin.access`** (la misma que da entrada al panel; el rol `admin` la tiene siempre). Además, cada bloque se devuelve solo si quien consulta puede ver esa sección:

| Bloque | Permiso adicional |
| --- | --- |
| `users` | `users.read` |
| `routes` | `routes.manage` |
| `cities` | `cities.manage` |

Un bloque no permitido llega como `null`; el cliente no lo muestra. Sin sesión: 401 `unauthenticated`. Con sesión pero sin `admin.access`: 403 `missing-permission`.

### Límites y costo

- Los recorridos de `users`, del grupo `private` y de factores de riesgo leen como máximo **5000** documentos cada uno; `routes`, **2000**. Si alguno alcanza el tope, `truncated` es `true` y las cifras son un mínimo (la pantalla lo avisa). Las franjas horarias se cuentan con una consulta de agregación `count()`.
- Solo lectura.

### Criterios de aceptación

- [x] Sin sesión responde 401; con un corredor (sin `admin.access`) responde 403.
- [x] Un administrador recibe los tres bloques; un delegado recibe solo los bloques de sus permisos y `null` en los demás.
- [x] Los conteos de usuarios, roles, perfiles deportivos y preferencias coinciden con los documentos guardados.
- [x] `registrationsByWeek` tiene 8 semanas ordenadas y cuenta cada alta en su semana UTC; las ventanas de 7 y 30 días son móviles.
- [x] `safetyLevels` usa el peor nivel por ruta y `unrated` para rutas sin índice.
- [x] La respuesta no contiene ningún dato personal (prueba que busca correos, nombres y uids).
- [x] `truncated` pasa a `true` al alcanzar el tope de lectura.
- [x] `ruff check .` y `ruff format --check .` limpios y toda la suite de pytest en verde.

Trazabilidad: panel de administración (apoyo); RNF transversales RNF-10 y RNF-11 (privacidad: solo agregados). Depende de [EP-01](../01-gestion-de-usuarios.md), [EP-02](../02-roles-y-permisos.md), [EP-04](../04-ciudades-y-zonas.md), [EP-05](../05-catalogo-de-rutas.md) y [EP-07](../07-evaluacion-de-seguridad.md).

Implementación:

- `backend/apps/summary/domain/metrics.py` (cálculo puro)
- `backend/apps/summary/application/` (puerto y caso de uso)
- `backend/apps/summary/infrastructure/firestore_summary_source.py`
- `backend/apps/summary/presentation/` (vista y ruta)

Pruebas:

- `backend/tests/test_summary_metrics.py`
- `backend/tests/test_summary_api.py`

## Verificación manual (navegador)

1. Levantar el stack (ver [README de specs](../README.md#cómo-ver-el-sistema-funcionando)) e iniciar sesión como `admin@runcty.dev`: `/admin` abre el Resumen.
2. Revisar claro y oscuro, 1280 px y 360 px; apagar la API y comprobar el error con «Reintentar».
3. Elegir «Oscuro» en «Tema», recargar y comprobar que persiste.
4. Pedir el endpoint con el token y comparar cada cifra con las pantallas Usuarios, Rutas y Ciudades.

## Supuestos por validar

- Las fichas «Próximamente» (Entrenamientos, Alertas SOS, Eventos) se reemplazarán por cifras reales cuando existan las capacidades [EP-12](../12-registro-de-entrenamientos.md), [EP-15](../15-boton-de-panico.md) y [EP-23](../23-eventos-y-carreras.md); ese cambio exige actualizar primero esta spec.
