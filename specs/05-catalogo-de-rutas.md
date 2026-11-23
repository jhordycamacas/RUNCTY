# EP-05 — Catálogo de rutas y tramos

> Spec de capacidad · Debe tener · **8/8 Hecha, 0 Parcial, 0 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-05 · Catálogo de rutas y tramos |
| Requisitos | RF-05-1 a RF-05-8 (8 sub-requisitos) |
| Requisito de usuario (UR) | UR-13 |
| RNF | RNF-08, RNF-15 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | Pedro Vargas |
| Sprint planificado | Sprint 2 · Semana 6 |
| Sprint real | Sprint 2 (semana 6). Backend: 2026-11-13. Administración de rutas: 2026-11-16, verificada en navegador el 2026-11-17; accesibilidad medida el 2026-11-22. |
| Dependencias | [RF-04 · Ciudades y zonas de operación](04-ciudades-y-zonas.md) |

## Propósito

Que el personal de Gacelas mantenga el catálogo de rutas de running de cada ciudad y los **tramos** que las componen. Es la base sobre la que se evalúa la seguridad ([EP-07](07-evaluacion-de-seguridad.md)), se recomienda ([EP-09](09-rutas-seguras.md)) y se entrena ([EP-12](12-registro-de-entrenamientos.md)). Los corredores consultan el mismo catálogo en el área `/app`.

Entradas, proceso y salidas del requisito padre en el Excel (RF-05):

- Entradas: datos de la ruta y de cada tramo (coordenadas, longitud y orden).
- Proceso: validar que la ciudad esté habilitada y ordenar los tramos.
- Salidas: rutas y tramos disponibles para recomendar y mostrar en el mapa.

## Alcance

**Incluye**

- CRUD de rutas con ciudad, puntos de inicio y fin, distancia, desnivel, superficie y dificultad (RF-05-1 a RF-05-4).
- CRUD de tramos con coordenadas, longitud y orden (RF-05-5 a RF-05-8).
- Consulta del catálogo por el corredor: filtros por distancia y dificultad, detalle con tramos y enlace «Abrir en Google Maps».

**No incluye**

- Posiciones en tiempo real de otros corredores sobre el mapa: llegan con la ubicación compartida ([EP-16](16-ubicacion-compartida.md)).
- Evaluación de seguridad de la ruta: [EP-07](07-evaluacion-de-seguridad.md).
- Rutas propuestas por clubes: [EP-11](11-rutas-de-clubes.md).

## Mapa de la ruta

El mapa dibuja cada tramo con el color de su nivel de seguridad, los marcadores de inicio y fin, y se encuadra solo sobre la ruta. Aparece en el detalle de la ruta del administrador (incluida la pestaña «Tramos y factores»), en el detalle del corredor y, con la posición en vivo, en la pestaña Correr. La información de la ruta sigue disponible como texto junto al mapa y el mapa tiene nombre accesible.

El proveedor se elige al arrancar la app, detrás del puerto `MapRenderer` (`frontend/src/app/shared/map/map-renderer.ts`):

- Con `googleMapsApiKey` en el entorno: **Google Maps** (Maps JavaScript API, estilo oscuro derivado de los tokens del tema).
- Sin clave: **OpenStreetMap con Leaflet**, que es el respaldo real, no código muerto.
- Si Google no carga (sin red, script bloqueado, tiempo agotado) o rechaza la clave (`gm_authFailure`), el mapa pasa a Leaflet en caliente y muestra el aviso «No pudimos cargar Google Maps; mostramos el mapa de OpenStreetMap.». Nunca queda en blanco.

**Habilitar Google Maps (a cargo del responsable del proyecto)**

1. En https://console.cloud.google.com/apis/credentials crear una clave de API y habilitar **Maps JavaScript API** en el proyecto.
2. Restringir la clave por API (solo Maps JavaScript API) y por referente HTTP:
   - `http://127.0.0.1:4200/*` y `http://localhost:4200/*` (desarrollo en el navegador y APK con recarga en vivo mediante `adb reverse`, cuya URL es `http://localhost:4200`).
   - `https://runcty-73d70.web.app/*` y `https://runcty-73d70.firebaseapp.com/*` (producción).
   - `https://localhost/*` para el APK instalado: Capacitor 8 sirve los archivos empaquetados desde `https://localhost` (`androidScheme` por defecto `https`; `capacitor.config.ts` no define `server`).
   - Recarga en vivo desde el teléfono sin `adb reverse` (`ionic cap run android -l --external`): el origen es `http://<IP-de-la-PC>:4200`; añadir ese referente exacto (ej. `http://192.168.1.20:4200/*`).
3. Pegar la clave en `frontend/src/environments/environment.real.ts` y `environment.prod.ts` en `googleMapsApiKey` (en `null` por defecto; la clave de navegador es pública por diseño, pero la restricción por referente es obligatoria y no se versiona una clave sin restringir).

Fuera de alcance: las posiciones de otros corredores en tiempo real (ubicación compartida, EP-16, Sprint 4). El mapa ya actualiza la posición propia en vivo en la pestaña Correr.

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que la ciudad esté habilitada.
- Que la distancia sea mayor a cero.
- Permitir filtrar por ciudad, distancia o dificultad.
- Que la ciudad siga habilitada.
- Dejar de recomendar la ruta al eliminarla.
- Que la ruta exista.
- Que el orden no esté repetido dentro de la ruta.
- Mostrar los tramos de una ruta en su orden.
- Que el orden siga sin repetirse dentro de la ruta.
- Reordenar los tramos restantes de la ruta.

Decididas por el equipo o derivadas de otros documentos:

- Una ruta inactiva responde `404 route-not-found` a quien no tiene `routes.manage`; el listado del corredor solo trae rutas activas de la ciudad pedida.
- Los tramos se ordenan por posición; reordenar desplaza los demás. Máximo de tramos por ruta (`too-many-segments`).
- Los campos opcionales vacíos se omiten del cuerpo de la petición; nunca se envían como `null`.
- Un repositorio cubre todo el agregado de la ruta (ruta, tramos, franjas y factores) porque cada cambio necesita una sola transacción.
- No hay endpoint de tramos independiente para leer: `GET /routes/{id}` ya incluye los tramos.

## Modelo de datos y contrato de API

**Estado: implementado** (`backend/apps/routes`, `frontend/src/app/routes` para el corredor, `frontend/src/app/admin/routes` para el administrador).

| Endpoint | Permiso | Descripción |
| --- | --- | --- |
| `GET /routes?cityId=` | sesión | Lista del catálogo (el administrador ve también las inactivas); incluye el nivel de seguridad por franja y `preview`, el recorrido reducido a 40 pares `[lat, lng]` como máximo para dibujar la miniatura. |
| `GET /routes/{id}` | sesión | Detalle con `segments`; las franjas y los factores solo con `routes.manage`. |
| `POST /routes` | `routes.manage` | Crea una ruta (`201 {id}`). Cuerpo: `name`, `cityId`, `description`, `start`, `end`, `distanceKm`, `elevationGainM`, `surface` y `difficulty` (texto libre, 1 a 40 caracteres, los escribe el administrador), `active`. |
| `PUT /routes/{id}` · `DELETE /routes/{id}` | `routes.manage` | Reemplaza los datos de la ruta o la elimina en cascada con sus tramos, franjas y factores (`204`). |
| `POST /routes/{id}/segments` | `routes.manage` | Agrega un tramo: `name`, `coordinates[]`, `order` opcional (`201 {id}`). |
| `PUT` · `DELETE /routes/{id}/segments/{segmentId}` | `routes.manage` | Modifica o elimina el tramo (`204`). |

Códigos propios: `route-not-found`, `segment-not-found`, `invalid-route-name`, `invalid-route-description`, `invalid-route-start`, `invalid-route-end`, `invalid-distance`, `invalid-elevation-gain`, `invalid-surface`, `invalid-difficulty`, `invalid-active`, `invalid-coordinates`, `invalid-segment-name`, `invalid-segment-order`, `too-many-segments`.

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-05-1](#rf-05-1--crear-ruta-de-running) | Crear ruta de running | Administrador | Sprint 2 · Semana 6 | Hecha |
| [RF-05-2](#rf-05-2--leer-rutas-de-running) | Leer rutas de running | Administrador | Sprint 2 · Semana 6 | Hecha |
| [RF-05-3](#rf-05-3--actualizar-ruta-de-running) | Actualizar ruta de running | Administrador | Sprint 2 · Semana 6 | Hecha |
| [RF-05-4](#rf-05-4--eliminar-ruta-de-running) | Eliminar ruta de running | Administrador | Sprint 2 · Semana 6 | Hecha |
| [RF-05-5](#rf-05-5--crear-tramo-de-ruta) | Crear tramo de ruta | Administrador | Sprint 2 · Semana 6 | Hecha |
| [RF-05-6](#rf-05-6--leer-tramos-de-ruta) | Leer tramos de ruta | Administrador | Sprint 2 · Semana 6 | Hecha |
| [RF-05-7](#rf-05-7--actualizar-tramo-de-ruta) | Actualizar tramo de ruta | Administrador | Sprint 2 · Semana 6 | Hecha |
| [RF-05-8](#rf-05-8--eliminar-tramo-de-ruta) | Eliminar tramo de ruta | Administrador | Sprint 2 · Semana 6 | Hecha |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-05-1 — Crear ruta de running

- **Historia de usuario:** Como administrador · Deseo registrar ruta de running. Para disponer de recorridos identificados por distancia, superficie, desnivel y dificultad al recomendar rutas.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-04 · **Caso de uso:** Registrar ruta de running
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (obligatorio); Ciudad (obligatorio); Punto de inicio (obligatorio); Punto de fin (obligatorio); Distancia (obligatorio); Desnivel (opcional); Tipo de superficie (opcional); Dificultad (opcional) | El sistema deberá permitir crear una ruta de running con su nombre, ciudad, punto de inicio y fin, distancia, desnivel, tipo de superficie y dificultad, para incluirla en las recomendaciones. | Registro de «ruta de running» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El formulario `/admin/rutas/nueva` crea una ruta con nombre, ciudad, punto de inicio y fin, distancia, desnivel, superficie, dificultad, descripción y estado activo.
- [x] Una entrada inválida muestra el mensaje del campo en español y no envía nada a la API.
- [x] Al guardar, aparece un aviso de éxito y la lista muestra la ruta nueva.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `frontend/src/app/admin/routes/presentation/route-form.page.ts`, `frontend/src/app/admin/routes/domain/route-form.ts`, `frontend/src/app/admin/routes/infrastructure/http-route-admin.repository.ts`, `backend/apps/routes/presentation/views.py`

**Pruebas:** `frontend/src/app/admin/routes/domain/route-form.spec.ts`, `frontend/src/app/admin/routes/presentation/route-form.page.spec.ts`

### RF-05-2 — Leer rutas de running

- **Historia de usuario:** Como administrador · Deseo consultar rutas de running. Para encontrar rutas que se ajusten a la ciudad, distancia o dificultad que busco.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-04 · **Caso de uso:** Consultar rutas de running
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (filtro); Ciudad (filtro); Punto de inicio (filtro); Punto de fin (filtro) | El sistema deberá permitir leer las rutas registradas y sus características, filtrándolas por ciudad, distancia o dificultad, para que el corredor encuentre una acorde a su objetivo. | Datos de «rutas de running» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [x] `/admin/rutas` lista las rutas de la ciudad elegida, incluidas las inactivas, con nombre, distancia, dificultad, estado y nivel de seguridad por franja.
- [x] Permite elegir ciudad o zona (por defecto "Todas las ciudades") y filtrar por texto.
- [x] Existen los estados de carga, vacío y error; el de error ofrece reintentar.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.
- [x] El corredor consulta las rutas activas de su ciudad en `/app/rutas` y en el inicio (cubierto por pruebas unitarias; sin verificación manual).
- [x] En `/app/rutas` arriba solo hay la ciudad, un buscador por nombre (sin distinguir mayúsculas ni tildes) y los botones «Filtros» (con el número de filtros activos, p. ej. «Filtros · 2») y «Ordenar» (Más segura, Distancia, Nombre).
- [x] «Filtros» abre una hoja inferior con franja horaria, distancia, dificultad y superficie (las dos últimas salen de las rutas cargadas), «Limpiar» y «Ver N rutas» con el conteo en vivo; los filtros activos se ven como fichas que se quitan una a una y, si no queda ninguna ruta, «Quitar filtros» limpia filtros y búsqueda.
- [x] Cada tarjeta muestra una miniatura de la forma del recorrido (SVG dibujado con `preview`, sin mapa ni red), con la línea del color del nivel de seguridad de la franja elegida; sin `preview` muestra un ícono.
- [x] La lista tiene jalar para actualizar, esqueletos de carga, conteo («5 rutas · Loja»), efecto al tocar y entrada escalonada de las tarjetas (sin animación si el dispositivo pide reducir movimiento).

**Implementación:** `frontend/src/app/admin/routes/presentation/routes-admin.page.ts`, `frontend/src/app/admin/routes/application/admin-routes.store.ts`, `frontend/src/app/admin/routes/domain/route-places.ts`, `frontend/src/app/routes/presentation/routes-list.page.ts`, `frontend/src/app/routes/presentation/route-card.ts`, `frontend/src/app/routes/presentation/route-preview.ts`, `frontend/src/app/routes/presentation/routes-filter-sheet.ts`, `frontend/src/app/routes/domain/catalog.ts`, `frontend/src/app/routes/domain/route-preview.ts`, `frontend/src/app/routes/infrastructure/http-route.repository.ts`, `backend/apps/routes/domain/geo.py`

**Pruebas:** `frontend/src/app/admin/routes/presentation/routes-admin.page.spec.ts`, `frontend/src/app/admin/routes/application/admin-routes.store.spec.ts`, `frontend/src/app/admin/routes/domain/route-places.spec.ts`, `frontend/src/app/routes/presentation/routes-list.page.spec.ts`, `frontend/src/app/routes/presentation/routes-filter-sheet.spec.ts`, `frontend/src/app/routes/presentation/route-preview.spec.ts`, `frontend/src/app/routes/domain/catalog.spec.ts`, `frontend/src/app/routes/domain/route-preview.spec.ts`, `backend/tests/test_route_geo.py`, `frontend/src/app/routes/infrastructure/http-route.repository.spec.ts`, `backend/tests/test_routes_api.py`

### RF-05-3 — Actualizar ruta de running

- **Historia de usuario:** Como administrador · Deseo modificar ruta de running. Para corregir características del recorrido y evitar que se consulten datos de una ruta desactualizados.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-04 · **Caso de uso:** Actualizar ruta de running
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (obligatorio); Ciudad (obligatorio); Punto de inicio (obligatorio); Punto de fin (obligatorio); Distancia (obligatorio); Desnivel (opcional); Tipo de superficie (opcional); Dificultad (opcional) | El sistema deberá permitir actualizar los datos de una ruta (por ejemplo, distancia, superficie o dificultad), para mantener su información correctamente actualizada. | Registro de «ruta de running» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El mismo formulario edita una ruta (`/admin/rutas/:id/editar`) con sus valores actuales precargados.
- [x] Salir con cambios sin guardar pide confirmación.
- [x] Guardar una ruta de otra ciudad cambia la lista a esa ciudad.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `frontend/src/app/admin/routes/presentation/route-form.page.ts`, `frontend/src/app/admin/routes/application/admin-routes.store.ts`

**Pruebas:** `frontend/src/app/admin/routes/presentation/route-form.page.spec.ts`, `frontend/src/app/admin/routes/application/admin-routes.store.spec.ts`

### RF-05-4 — Eliminar ruta de running

- **Historia de usuario:** Como administrador · Deseo eliminar ruta de running. Para dejar de recomendar recorridos que ya no se usan o no son adecuados.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-04 · **Caso de uso:** Eliminar ruta de running
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar una ruta que ya no se use o no sea apta, previa confirmación, para que deje de recomendarse. | Registro de «ruta de running» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Eliminar una ruta pide confirmación con un botón de estilo destructivo.
- [x] Si se confirma, la ruta sale de la lista y aparece un aviso; si se cancela, no cambia nada.
- [x] Una ruta eliminada responde 404 `route-not-found` en la API.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `frontend/src/app/admin/routes/presentation/routes-admin.page.ts`, `frontend/src/app/admin/routes/application/admin-routes.store.ts`

**Pruebas:** `frontend/src/app/admin/routes/presentation/routes-admin.page.spec.ts`, `frontend/src/app/admin/routes/application/admin-routes.store.spec.ts`

### RF-05-5 — Crear tramo de ruta

- **Historia de usuario:** Como administrador · Deseo registrar tramo de ruta. Para dividir cada recorrido en segmentos geográficos que puedan evaluarse de manera independiente.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-04 · **Caso de uso:** Registrar tramo de ruta
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta (obligatorio); Coordenadas (obligatorio); Longitud (obligatorio); Orden (obligatorio) | El sistema deberá permitir crear un tramo de una ruta con sus coordenadas, longitud y orden dentro de la ruta, para poder evaluar la seguridad de cada segmento por separado. | Registro de «tramo de ruta» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Desde el detalle de la ruta (`/admin/rutas/:id`), un formulario en línea agrega un tramo con nombre, orden y puntos/longitud según el contrato.
- [x] Los errores de campo y de la API salen en español.
- [x] Cancelar con cambios pide confirmación de descarte.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `frontend/src/app/admin/routes/presentation/segments-section.ts`, `frontend/src/app/admin/routes/domain/segment-form.ts`, `frontend/src/app/admin/routes/application/route-detail.store.ts`

**Pruebas:** `frontend/src/app/admin/routes/domain/segment-form.spec.ts`, `frontend/src/app/admin/routes/application/route-detail.store.spec.ts`, `frontend/src/app/admin/routes/presentation/route-detail.page.spec.ts`

### RF-05-6 — Leer tramos de ruta

- **Historia de usuario:** Como administrador · Deseo consultar tramos de ruta. Para revisar los segmentos en orden y conocer cómo se compone cada ruta.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-04 · **Caso de uso:** Consultar tramos de ruta
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta (filtro); Coordenadas (filtro); Longitud (filtro); Orden (filtro) | El sistema deberá permitir leer los tramos que componen una ruta junto a su orden, para ver el recorrido segmento por segmento y su nivel de seguridad. | Datos de «tramos de ruta» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [x] El detalle lista los tramos en orden, cada uno con su nivel de seguridad por franja ("Sin evaluar" si la API no tiene valor).
- [x] Los tramos se muestran junto al resumen de la ruta con su nivel por franja.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.
- [x] El corredor ve los tramos de la ruta en orden en el detalle, con su nivel por franja (cubierto por pruebas unitarias; sin verificación manual).

**Implementación:** `frontend/src/app/admin/routes/presentation/segments-section.ts`, `frontend/src/app/admin/routes/presentation/route-detail.page.ts`, `frontend/src/app/admin/routes/domain/slot-safety.ts`, `frontend/src/app/routes/presentation/route-detail.page.ts`, `frontend/src/app/routes/domain/maps.ts`, `frontend/src/app/shared/map/map-renderer-provider.ts`, `frontend/src/app/shared/map/google-map-renderer.ts`

**Pruebas:** `frontend/src/app/admin/routes/presentation/route-detail.page.spec.ts`, `frontend/src/app/admin/routes/domain/slot-safety.spec.ts`, `frontend/src/app/routes/presentation/route-detail.page.spec.ts`, `frontend/src/app/routes/domain/maps.spec.ts`, `frontend/src/app/shared/map/google-map-renderer.spec.ts`, `frontend/src/app/shared/map/google-maps-loader.spec.ts`, `frontend/src/app/shared/map/map-renderer-provider.spec.ts`, `backend/tests/test_routes_api.py`

### RF-05-7 — Actualizar tramo de ruta

- **Historia de usuario:** Como administrador · Deseo modificar tramo de ruta. Para corregir coordenadas, longitudes o el orden de los segmentos de un recorrido.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-04 · **Caso de uso:** Actualizar tramo de ruta
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta (obligatorio); Coordenadas (obligatorio); Longitud (obligatorio); Orden (obligatorio) | El sistema deberá permitir actualizar las coordenadas, la longitud o el orden de un tramo, para corregir el trazado de la ruta. | Registro de «tramo de ruta» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Un tramo se edita en el mismo formulario en línea, con valores precargados y foco en el encabezado del formulario.
- [x] Los cambios de coordenadas, longitud u orden se guardan y el detalle se recarga.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `frontend/src/app/admin/routes/presentation/segments-section.ts`, `frontend/src/app/admin/routes/application/route-detail.store.ts`

**Pruebas:** `frontend/src/app/admin/routes/domain/segment-form.spec.ts`, `frontend/src/app/admin/routes/application/route-detail.store.spec.ts`

### RF-05-8 — Eliminar tramo de ruta

- **Historia de usuario:** Como administrador · Deseo eliminar tramo de ruta. Para retirar un segmento incorrecto y conservar el orden de los tramos restantes.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-04 · **Caso de uso:** Eliminar tramo de ruta
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar un tramo de una ruta y reordenar los datos restantes, para retirar segmentos que ya no forman parte del recorrido. | Registro de «tramo de ruta» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Eliminar un tramo pide confirmación (botón destructivo).
- [x] Si la API rechaza la operación, el motivo se muestra en español en el diálogo.
- [x] Al eliminarse, el detalle se recarga y el orden de los tramos restantes se conserva.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `frontend/src/app/admin/routes/presentation/segments-section.ts`, `frontend/src/app/admin/routes/application/route-detail.store.ts`, `backend/apps/routes/domain/reorder.py`

**Pruebas:** `frontend/src/app/admin/routes/application/route-detail.store.spec.ts`, `frontend/src/app/admin/routes/presentation/route-detail.page.spec.ts`

## Dependencias

- **Depende de:** [RF-04 · Ciudades y zonas de operación](04-ciudades-y-zonas.md).
- **Dependen de esta capacidad:** [EP-06 · Puntos de apoyo y senderos con resguardo policial](06-puntos-de-apoyo.md), [EP-07 · Evaluación de seguridad de rutas y zonas de riesgo](07-evaluacion-de-seguridad.md), [EP-08 · Incidentes y fuentes de información de seguridad](08-incidentes-y-fuentes.md), [EP-10 · Rutas favoritas y valoraciones](10-favoritas-y-valoraciones.md), [EP-11 · Rutas sugeridas por clubes](11-rutas-de-clubes.md), [EP-17 · Reportes comunitarios](17-reportes-comunitarios.md), [EP-21 · Salidas grupales](21-salidas-grupales.md), [EP-23 · Eventos y carreras](23-eventos-y-carreras.md).

## Supuestos por validar

- El Excel llama «Longitud» del tramo al largo; la API lo calcula a partir de las coordenadas (`lengthM`) en lugar de pedirlo (inferido).
- El corredor lee las rutas en `/app/rutas` (no en el admin); el Excel asigna RF-05-2 y RF-05-6 al actor Administrador, pero el corredor también las consulta para recomendarlas.
- Queda abierto el criterio de accesibilidad medida (objetivo táctil de 48 px y contraste) de las pantallas de rutas del panel: no se midió en pantalla.
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
- Nota de diseño (2026-11-23): la lista del corredor se rediseñó (filtros en una hoja inferior, buscador, orden, miniatura del recorrido). La miniatura usa una sola línea con el nivel de la ruta en la franja elegida, no un color por tramo: la lista no trae los niveles por tramo y el detalle ya dibuja el mapa con ellos. Cambio de presentación: no cambia el estado de ninguna historia.
- Nota de diseño (2026-11-22): el detalle de ruta del corredor (`/app/rutas/:id`) lista los tramos en solo lectura, con su largo y su nivel en la franja elegida; el detalle del panel (`/admin/rutas/:id`) organiza la ruta en pestañas («Resumen», «Franjas horarias», «Tramos y factores») y la lista del panel muestra el número de tramos con un acceso «Tramos» que abre esa pestaña (`?seccion=tramos`). Es un cambio de presentación: no cambia el estado de ninguna historia.
