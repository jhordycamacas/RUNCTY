# EP-09 — Generación de rutas seguras

> Spec de capacidad · Debe tener · **0/3 Hecha, 3 Parcial, 0 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-09 · Generación de rutas seguras |
| Requisitos | RF-09-1 a RF-09-3 (3 sub-requisitos) |
| Requisito de usuario (UR) | UR-04, UR-06 |
| RNF | RNF-07, RNF-09, RNF-15, RNF-18, RNF-24 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | Jhordy Camacas |
| Sprint planificado | Sprint 3 · Semana 7 |
| Sprint real | Sprint 3 (semana 7). Backend: 2026-11-22 (commit `9387ea1`); la recomendación ya se calcula en el servidor. Falta la pantalla de solicitud del corredor; el catálogo todavía filtra y ordena en el cliente. |
| Dependencias | [RF-04 · Ciudades y zonas de operación](04-ciudades-y-zonas.md), [RF-07 · Evaluación de seguridad de rutas y zonas de riesgo](07-evaluacion-de-seguridad.md) |

## Propósito

Que el corredor pida rutas para una ciudad, una distancia aproximada y una franja horaria, y reciba las rutas **ordenadas de mayor a menor nivel de seguridad** con los factores que lo explican, o un aviso si no hay coincidencias. Es la propuesta de valor central de RUNCTY: elegir dónde y a qué hora correr.

Entradas, proceso y salidas del requisito padre en el Excel (RF-09):

- Entradas: ciudad, distancia aproximada y franja horaria.
- Proceso: filtrar rutas por ciudad y distancia y ordenarlas por su nivel de seguridad en la franja.
- Salidas: rutas recomendadas con su nivel de seguridad, o aviso de que no hay coincidencias.

## Alcance

**Incluye**

- Crear, consultar y eliminar solicitudes de ruta segura (RF-09-1 a RF-09-3).
- Recomendar rutas del catálogo ([EP-05](05-catalogo-de-rutas.md)) ordenadas por el índice de la franja ([EP-07](07-evaluacion-de-seguridad.md)).

**No incluye**

- **Generar** rutas nuevas: por ahora se ordena un catálogo predefinido (CONTEXTO sección 10 punto 3; decisión abierta).
- Garantía absoluta de seguridad (fuera del piloto): siempre se muestra el nivel, nunca «segura» o «insegura».
- Mapa y proveedor de mapas.

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que la ciudad esté habilitada.
- Que la distancia sea mayor a cero.
- Mostrar las rutas ordenadas del mayor al menor nivel de seguridad.
- Que el corredor elimine solo sus propias solicitudes.

Decididas por el equipo o derivadas de otros documentos:

- Las rutas recomendadas se presentan en ≤ 10 s en el 95 % de las solicitudes con 4G (RNF-07).
- El resultado se ordena por el puntaje de la franja pedida (mayor primero) y luego por distancia; las rutas sin dato para la franja van al final (comportamiento ya implementado en el catálogo del corredor).
- La distancia aproximada debe ser mayor a cero y la ciudad debe estar habilitada.

## Modelo de datos y contrato de API

**Estado: backend implementado** (2026-11-22, commit `9387ea1`; código en `backend/apps/safe_routes`). El contrato definitivo está en «Decisiones de diseño»; la pantalla del corredor está pendiente. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /safe-route-requests` | [RF-09-1](#rf-09-1--crear-solicitud-de-ruta-segura) Crear solicitud de ruta segura | Corredor |
| `GET /safe-route-requests` y `GET /safe-route-requests/{id}` | [RF-09-2](#rf-09-2--leer-solicitudes-de-ruta-segura) Leer solicitudes de ruta segura | Corredor |
| `DELETE /safe-route-requests/{id}` | [RF-09-3](#rf-09-3--eliminar-solicitud-de-ruta-segura) Eliminar solicitud de ruta segura | Corredor |

Campos propuestos de «solicitud de ruta segura» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Ciudad | Sí |
| Distancia aproximada | Sí |
| Franja horaria | Sí |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-09-1](#rf-09-1--crear-solicitud-de-ruta-segura) | Crear solicitud de ruta segura | Corredor | Sprint 3 · Semana 7 | Parcial |
| [RF-09-2](#rf-09-2--leer-solicitudes-de-ruta-segura) | Leer solicitudes de ruta segura | Corredor | Sprint 3 · Semana 7 | Parcial |
| [RF-09-3](#rf-09-3--eliminar-solicitud-de-ruta-segura) | Eliminar solicitud de ruta segura | Corredor | Sprint 3 · Semana 7 | Parcial |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-09-1 — Crear solicitud de ruta segura

- **Historia de usuario:** Como corredor · Deseo registrar solicitud de ruta segura. Para solicitar recomendaciones indicando la ciudad, la distancia deseada y el horario del entrenamiento.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-04, RF-07 · **Caso de uso:** Solicitar ruta segura
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `POST /safe-route-requests`: guarda la solicitud y devuelve las rutas activas de la ciudad dentro de ±20 % de la distancia, ordenadas por el puntaje de la franja. Antes ya existía la parte de lectura del catálogo del corredor, que filtra y ordena en el cliente (commits `21f094c`, `00920a1`). Falta la pantalla de solicitud del corredor y medir RNF-07.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ciudad (obligatorio); Distancia aproximada (obligatorio); Franja horaria (obligatorio) | El sistema deberá permitir crear una solicitud de ruta segura con la ciudad, la distancia aproximada y la franja horaria. | Registro de «solicitud de ruta segura» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Con ciudad, distancia aproximada y franja horaria completas y válidas, el servidor crea la solicitud y devuelve las rutas recomendadas.
- [x] Solo se ofrecen las rutas **activas** de la ciudad del corredor, que debe estar en el catálogo vigente (`RunnerCity`).
- [x] Las rutas se filtran por distancia (hasta 5 km, 5–10 km, más de 10 km) y dificultad, y se ordenan de mayor a menor puntaje en la franja elegida y luego por distancia; las rutas sin dato van al final.
- [x] Cada ruta muestra su nivel (Alto, Medio o Bajo) con ícono, texto y el factor principal; nunca «segura» o «insegura».
- [x] Si la ciudad no tiene rutas se muestra un estado vacío en español; un fallo de carga muestra un reintento, no un catálogo vacío.
- [x] La distancia aproximada es un valor numérico mayor a cero (lo valida la API; la pantalla del catálogo todavía usa tramos fijos de distancia).
- [ ] Las rutas recomendadas se presentan en ≤ 10 s en el 95 % de las solicitudes con 4G (RNF-07; no medido).

**Implementación:** `frontend/src/app/routes/domain/catalog.ts`, `frontend/src/app/routes/application/city-routes.ts`, `frontend/src/app/routes/application/runner-city.ts`, `frontend/src/app/routes/presentation/routes-list.page.ts`, `frontend/src/app/routes/presentation/recommended-routes.ts`, `frontend/src/app/runner/home.page.ts`, `backend/apps/safe_routes/domain/models.py`, `backend/apps/safe_routes/application/use_cases.py`, `backend/apps/safe_routes/presentation/views.py`

**Pruebas:** `backend/tests/test_safe_routes.py`, `frontend/src/app/routes/domain/catalog.spec.ts`, `frontend/src/app/routes/application/runner-city.spec.ts`, `frontend/src/app/routes/presentation/routes-list.page.spec.ts`, `frontend/src/app/runner/home.page.spec.ts`

### RF-09-2 — Leer solicitudes de ruta segura

- **Historia de usuario:** Como corredor · Deseo consultar solicitudes de ruta segura. Para revisar mis solicitudes y las alternativas ordenadas por su índice de seguridad disponible.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-04, RF-07 · **Caso de uso:** Consultar solicitudes de ruta
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `GET /safe-route-requests` (solo las del corredor, más recientes primero) y `GET /safe-route-requests/{id}` (recalcula la recomendación al momento). La lista no tiene filtros. Falta la pantalla del corredor.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ciudad (filtro); Distancia aproximada (filtro); Franja horaria (filtro) | El sistema deberá permitir leer las solicitudes de ruta segura y las rutas recomendadas para cada una, ordenadas por su índice de seguridad. | Datos de «solicitudes de ruta segura» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «solicitudes de ruta segura» que cumplen los criterios indicados (ciudad, distancia aproximada, franja horaria), o informa que no hay resultados.
- [x] El sistema debe mostrar las rutas ordenadas del mayor al menor nivel de seguridad.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/safe_routes/domain/models.py`, `backend/apps/safe_routes/application/use_cases.py`, `backend/apps/safe_routes/presentation/views.py`

**Pruebas:** `backend/tests/test_safe_routes.py`

### RF-09-3 — Eliminar solicitud de ruta segura

- **Historia de usuario:** Como corredor · Deseo eliminar solicitud de ruta segura. Para quitar de mi historial una búsqueda de recorrido que ya no necesito conservar.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-04, RF-07 · **Caso de uso:** Eliminar solicitud de ruta
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `DELETE /safe-route-requests/{id}`, solo para el dueño. Falta la pantalla del corredor con la confirmación previa.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar una solicitud de ruta segura que el corredor ya no necesite conservar. | Registro de «solicitud de ruta segura» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El sistema elimina el registro de «solicitud de ruta segura» indicado y confirma al actor.
- [x] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [x] Se valida que el corredor elimine solo sus propias solicitudes.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/safe_routes/application/use_cases.py`, `backend/apps/safe_routes/presentation/views.py`

**Pruebas:** `backend/tests/test_safe_routes.py`

## Dependencias

- **Depende de:** [RF-04 · Ciudades y zonas de operación](04-ciudades-y-zonas.md), [RF-07 · Evaluación de seguridad de rutas y zonas de riesgo](07-evaluacion-de-seguridad.md).

## Decisiones de diseño (2026-11-22)

Tomadas para implementar el Sprint 3 sin bloquearlo; se revisan con Gacelas en la demo.

- **Solicitud:** `cityId`, `distanceKm` (> 0) y la franja como `startTime`/`endTime`. Se guarda por corredor como historial.
- **Recomendación:** rutas activas de la ciudad cuya distancia esté dentro de ±20 % de la pedida, ordenadas por el puntaje de la franja que se solapa con la pedida (mayor primero), después por cercanía a la distancia pedida; las rutas sin índice para esa franja van al final. La regla pasa al servidor; el cliente deja de ordenar por su cuenta.
- **API:** `POST /safe-route-requests` responde `201 {id, routes}` (extiende el `201 {id}` habitual para no hacer una segunda llamada); `GET /safe-route-requests` (las del corredor), `GET /safe-route-requests/{id}` (recalcula la recomendación al momento), `DELETE /safe-route-requests/{id}` (solo el dueño).
- **Generar frente a recomendar:** en el piloto se recomiendan rutas del catálogo; no se trazan rutas nuevas (sin proveedor de mapas).

## Supuestos por validar

- La tolerancia de la distancia aproximada no está definida en el Excel; se tomó ±20 % (ver Decisiones de diseño).
- La recomendación ya está en el servidor (`backend/apps/safe_routes`); el catálogo del corredor (`frontend/src/app/routes/domain/catalog.ts`) todavía ordena en el cliente y debe pasar a consumir `POST /safe-route-requests` para no duplicar la regla.
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
