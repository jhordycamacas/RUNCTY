# ADM-2 — Endpoint del resumen del panel (`GET /api/v1/admin/summary`)

> Spec de apoyo · Panel de administración · Estado: **En implementación**

## Historia de usuario

Como administrador · Deseo ver en un solo lugar cifras reales de uso de la app móvil (usuarios, rutas, seguridad, perfiles). Para saber cómo está creciendo el producto sin abrir cada sección.

## Principios

- **Solo datos reales.** Cada cifra sale de Firestore en el momento de la consulta. Lo que todavía no existe (entrenamientos, alertas SOS, eventos; Sprint 3 en adelante) **no se inventa ni se estima**: el endpoint no lo incluye y la pantalla muestra «Próximamente».
- **Solo agregados.** Nunca devuelve datos personales de una cuenta (ni correos, nombres, ids de usuario ni valores individuales del perfil deportivo o de las preferencias).
- **Se calcula en el servidor** y se responde en camelCase, como el resto de la API.

## Contrato

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
    "byDifficulty": { "beginner": 2, "intermediate": 2, "advanced": 1 },
    "bySurface": { "asphalt": 3, "trail": 1, "mixed": 1, "track": 0 },
    "byCity": [{ "cityId": "loja", "cityName": "Loja", "count": 5 }],
    "safetyLevels": { "high": 2, "medium": 2, "low": 1, "unrated": 0 },
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
- `routes.byCity`: orden descendente por cantidad y luego por nombre; el nombre sale del catálogo de ciudades (si la ciudad ya no existe, se usa el id).
- Las claves de los diccionarios `by*` aparecen siempre (con `0`), salvo `users.byRole`, que solo trae los roles presentes.

## Permisos (regla)

La ruta exige **`admin.access`** (la misma que da entrada al panel; el rol `admin` la tiene siempre). Además, cada bloque se devuelve solo si quien consulta puede ver esa sección:

| Bloque | Permiso adicional |
| --- | --- |
| `users` | `users.read` |
| `routes` | `routes.manage` |
| `cities` | `cities.manage` |

Un bloque no permitido llega como `null`; el cliente no lo muestra. Sin sesión: 401 `unauthenticated`. Con sesión pero sin `admin.access`: 403 `missing-permission`.

## Límites y costo

- Los recorridos de `users`, del grupo `private` y de factores de riesgo leen como máximo **5000** documentos cada uno; `routes`, **2000**. Si alguno alcanza el tope, `truncated` es `true` y las cifras son un mínimo (la pantalla lo avisa). Las franjas horarias se cuentan con una consulta de agregación `count()`.
- Solo lectura.

## Criterios de aceptación

- [ ] Sin sesión responde 401; con un corredor (sin `admin.access`) responde 403.
- [ ] Un administrador recibe los tres bloques; un delegado recibe solo los bloques de sus permisos y `null` en los demás.
- [ ] Los conteos de usuarios, roles, perfiles deportivos y preferencias coinciden con los documentos guardados.
- [ ] `registrationsByWeek` tiene 8 semanas ordenadas y cuenta cada alta en su semana UTC; las ventanas de 7 y 30 días son móviles.
- [ ] `safetyLevels` usa el peor nivel por ruta y `unrated` para rutas sin índice.
- [ ] La respuesta no contiene ningún dato personal (prueba que busca correos, nombres y uids).
- [ ] `truncated` pasa a `true` al alcanzar el tope de lectura.
- [ ] `ruff check .` y `ruff format --check .` limpios y toda la suite de pytest en verde.

## Trazabilidad

- Panel de administración (apoyo); RNF transversales: RNF-10, RNF-11 (privacidad: solo agregados).
- Depende de: RF-01 (usuarios), RF-02 (roles y permisos), RF-04 (ciudades), RF-05 y RF-07 (rutas e índice de seguridad).

## Implementación

- `backend/apps/summary/domain/metrics.py` (cálculo puro)
- `backend/apps/summary/application/` (puerto y caso de uso)
- `backend/apps/summary/infrastructure/firestore_summary_source.py`
- `backend/apps/summary/presentation/` (vista y ruta)

## Pruebas

- `backend/tests/test_summary_metrics.py`
- `backend/tests/test_summary_api.py`

## Verificación manual

1. Levantar el stack (ver `specs/README.md`), iniciar sesión como `admin@runcty.dev` y pedir el endpoint con el token.
2. Comparar cada cifra con las pantallas Usuarios, Rutas y Ciudades.
