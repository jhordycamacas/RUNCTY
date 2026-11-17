# EP-04 — Ciudades y zonas de operación

> Spec de capacidad · Debe tener · **4/4 Hecha, 0 Parcial, 0 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-04 · Ciudades y zonas de operación |
| Requisitos | RF-04-1 a RF-04-4 (4 sub-requisitos) |
| Requisito de usuario (UR) | UR-01 |
| RNF | RNF-22, RNF-24 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | Pedro Vargas |
| Sprint planificado | Sprint 1 · Semana 5 |
| Sprint real | Sprint 1 (semana 5). Backend: 2026-11-13. Administración de ciudades: 2026-11-17. |
| Dependencias | ninguna |

## Propósito

Gestionar las ciudades y zonas donde opera RUNCTY, con su ubicación y su estado de cobertura. El piloto cubre Loja; agregar una ciudad es agregar datos, sin tocar el código de los demás módulos (RNF-22, RNF-24). El registro del corredor y las rutas dependen de esta capacidad.

Entradas, proceso y salidas del requisito padre en el Excel (RF-04):

- Entradas: nombre, ubicación geográfica y estado de cobertura.
- Proceso: validar que no tenga rutas asociadas antes de eliminarla.
- Salidas: ciudades disponibles para elegir y confirmación.

## Alcance

**Incluye**

- Crear, consultar, modificar y eliminar ciudades y zonas (RF-04-1 a RF-04-4).
- Lista pública de ciudades para el registro y el selector de ciudad.

**No incluye**

- Expansión real a otras ciudades y convenios con clubes aliados (fuera del piloto, CONTEXTO sección 8).
- Mapa de las ciudades (depende del proveedor de mapas, pendiente).

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que el nombre de la ciudad no esté repetido.
- Que la ubicación geográfica sea válida.
- Mostrar al corredor solo las ciudades habilitadas.
- Actualizar la disponibilidad al cambiar el estado de cobertura.
- Que la ciudad no tenga rutas asociadas.

Decididas por el equipo o derivadas de otros documentos:

- Una ciudad o zona tiene identificador único (minúsculas, números y `-`, de 2 a 64 caracteres), nombre, provincia, ubicación y cobertura (`active`, `planned` o `suspended`).
- Una zona cuelga siempre de una **ciudad**, nunca de otra zona (`invalid-parent-city`).
- El identificador y el tipo no se pueden cambiar después de crear.
- Una ciudad con zonas (`city-has-zones`) o con rutas (`city-has-routes`) no se puede eliminar.
- `GET /cities` es público porque el registro lo necesita; si se envía un token malo igualmente responde 401.

## Modelo de datos y contrato de API

**Estado: implementado** (`backend/apps/cities`, `frontend/src/app/cities`, `frontend/src/app/admin/cities`).

| Endpoint | Permiso | Descripción |
| --- | --- | --- |
| `GET /cities` | público | Ciudades y zonas; filtro opcional `coverage`. |
| `POST /cities` | `cities.manage` | Crea una ciudad o zona (`201` con la ciudad completa). Cuerpo: `id`, `type`, `name`, `province`, `location {lat,lng}`, `coverage`, `parentCityId` (solo zonas). |
| `PATCH /cities/{id}` | `cities.manage` | Cambio parcial de `name`, `province`, `location`, `coverage`, `parentCityId` (`200` con la ciudad completa). |
| `DELETE /cities/{id}` | `cities.manage` | Elimina una ciudad o zona sin dependientes. |

Respuesta: `id`, `name`, `province`, `country` (`EC`), `type` (`city` o `zone`), `parentCityId`, `location`, `coverage`.

Códigos propios: `city-exists` (409), `city-not-found`, `city-has-zones`, `city-has-routes`, `invalid-city-id`, `invalid-city-name`, `invalid-city-province`, `invalid-city-type`, `invalid-city-location`, `invalid-coverage`, `invalid-parent-city`.

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-04-1](#rf-04-1--crear-ciudad-o-zona-de-operación) | Crear ciudad o zona de operación | Administrador | Sprint 1 · Semana 5 | Hecha |
| [RF-04-2](#rf-04-2--leer-ciudades-y-zonas-de-operación) | Leer ciudades y zonas de operación | Administrador | Sprint 1 · Semana 5 | Hecha |
| [RF-04-3](#rf-04-3--actualizar-ciudad-o-zona-de-operación) | Actualizar ciudad o zona de operación | Administrador | Sprint 1 · Semana 5 | Hecha |
| [RF-04-4](#rf-04-4--eliminar-ciudad-o-zona-de-operación) | Eliminar ciudad o zona de operación | Administrador | Sprint 1 · Semana 5 | Hecha |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-04-1 — Crear ciudad o zona de operación

- **Historia de usuario:** Como administrador · Deseo registrar ciudad o zona de operación. Para incorporar áreas geográficas a la plataforma e indicar si cuentan con cobertura operativa.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 5 · **Dependencia:** N/A · **Caso de uso:** Registrar ciudad o zona de operación
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17). Specs `fe15884`; implementación: `276d66d`, `a03dcc1`; backend `1caa6bd`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (obligatorio); Ubicación geográfica (obligatorio); Estado de cobertura (obligatorio) | El sistema deberá permitir crear una ciudad o zona de operación con su ubicación geográfica y estado de cobertura, para habilitar la plataforma en nuevas ciudades además de Loja. | Registro de «ciudad o zona de operación» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El formulario `/admin/ciudades/nueva` crea una ciudad o una zona con tipo, identificador (minúsculas, números y `-`, 2 a 64 caracteres), nombre, provincia, ubicación (latitud y longitud) y cobertura (activa, planificada o suspendida).
- [x] Una zona exige elegir la ciudad a la que pertenece; una ciudad no envía ciudad padre.
- [x] Una entrada inválida muestra el mensaje del campo en español y no envía nada a la API (latitud de -90 a 90, longitud de -180 a 180).
- [x] Al guardar aparece un aviso de éxito y la lista muestra la ciudad o zona nueva.
- [x] Los códigos `city-exists` e `invalid-parent-city` se muestran en español dentro del formulario sin perder lo escrito.
- [x] Salir del formulario con cambios sin guardar pide confirmación.
- [x] Requiere el permiso `cities.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

**Implementación:** `frontend/src/app/admin/cities/presentation/cities-admin.page.ts`, `frontend/src/app/admin/cities/application/admin-cities.store.ts`, `frontend/src/app/admin/cities/domain/managed-city.ts`, `frontend/src/app/admin/cities/infrastructure/http-city-admin.repository.ts`, `frontend/src/app/admin/cities/presentation/city-form.page.ts`, `frontend/src/app/admin/cities/domain/city-form.ts`, `backend/apps/cities/presentation/views.py`

**Pruebas:** `frontend/src/app/admin/cities/domain/city-form.spec.ts`, `frontend/src/app/admin/cities/infrastructure/http-city-admin.repository.spec.ts`, `frontend/src/app/admin/cities/application/admin-cities.store.spec.ts`, `frontend/src/app/admin/cities/presentation/cities-admin.page.spec.ts`, `frontend/src/app/admin/cities/presentation/city-form.page.spec.ts`

### RF-04-2 — Leer ciudades y zonas de operación

- **Historia de usuario:** Como administrador · Deseo consultar ciudades y zonas de operación. Para conocer qué ciudades tienen información disponible antes de elegir dónde entrenar.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 5 · **Dependencia:** N/A · **Caso de uso:** Consultar ciudades y zonas de operación
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17). Specs `fe15884`; implementación: `276d66d`, `a03dcc1`; backend `1caa6bd`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (filtro); Ubicación geográfica (filtro); Estado de cobertura (filtro) | El sistema deberá permitir leer las ciudades y zonas de operación disponibles y su estado de cobertura, para que el usuario elija dónde correr. | Datos de «ciudades y zonas de operación» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [x] `/admin/ciudades` lista cada ciudad con su provincia y cobertura, y sus zonas anidadas bajo ella.
- [x] Una zona cuya ciudad padre no está en el catálogo igualmente aparece en la lista.
- [x] Hay estados de carga, vacío y error con botón «Reintentar».
- [x] Requiere el permiso `cities.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

**Implementación:** `frontend/src/app/admin/cities/presentation/cities-admin.page.ts`, `frontend/src/app/admin/cities/application/admin-cities.store.ts`, `frontend/src/app/admin/cities/domain/managed-city.ts`, `frontend/src/app/admin/cities/infrastructure/http-city-admin.repository.ts`

**Pruebas:** `frontend/src/app/admin/cities/infrastructure/http-city-admin.repository.spec.ts`, `frontend/src/app/admin/cities/domain/managed-city.spec.ts`, `frontend/src/app/admin/cities/application/admin-cities.store.spec.ts`, `frontend/src/app/admin/cities/presentation/cities-admin.page.spec.ts`

### RF-04-3 — Actualizar ciudad o zona de operación

- **Historia de usuario:** Como administrador · Deseo modificar ciudad o zona de operación. Para reflejar cambios en la cobertura o en los datos geográficos de una ciudad registrada.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 5 · **Dependencia:** N/A · **Caso de uso:** Actualizar ciudad o zona de operación
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17). Specs `fe15884`; implementación: `276d66d`, `a03dcc1`; backend `1caa6bd`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombre (obligatorio); Ubicación geográfica (obligatorio); Estado de cobertura (obligatorio) | El sistema deberá permitir actualizar el nombre, la ubicación o el estado de cobertura de una ciudad o zona, para reflejar la ampliación o suspensión del servicio. | Registro de «ciudad o zona de operación» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El formulario `/admin/ciudades/:id/editar` carga la ciudad o zona, muestra su tipo e identificador sin poder cambiarlos y guarda nombre, provincia, ubicación, cobertura y, en una zona, su ciudad; el foco pasa al título del formulario.
- [x] Al guardar aparece un aviso de éxito y la lista refleja el cambio.
- [x] Los códigos `city-not-found`, `invalid-parent-city` y los de campo inválido se muestran en español.
- [x] Requiere el permiso `cities.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

**Implementación:** `frontend/src/app/admin/cities/presentation/cities-admin.page.ts`, `frontend/src/app/admin/cities/application/admin-cities.store.ts`, `frontend/src/app/admin/cities/domain/managed-city.ts`, `frontend/src/app/admin/cities/infrastructure/http-city-admin.repository.ts`, `frontend/src/app/admin/cities/presentation/city-form.page.ts`, `frontend/src/app/admin/cities/domain/city-form.ts`, `backend/apps/cities/presentation/views.py`

**Pruebas:** `frontend/src/app/admin/cities/domain/city-form.spec.ts`, `frontend/src/app/admin/cities/infrastructure/http-city-admin.repository.spec.ts`, `frontend/src/app/admin/cities/application/admin-cities.store.spec.ts`, `frontend/src/app/admin/cities/presentation/cities-admin.page.spec.ts`, `frontend/src/app/admin/cities/presentation/city-form.page.spec.ts`

### RF-04-4 — Eliminar ciudad o zona de operación

- **Historia de usuario:** Como administrador · Deseo eliminar ciudad o zona de operación. Para retirar del catálogo zonas sin rutas asociadas que ya no serán atendidas.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 5 · **Dependencia:** N/A · **Caso de uso:** Eliminar ciudad o zona de operación
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17). Specs `fe15884`; implementación: `276d66d`, `a03dcc1`; backend `1caa6bd`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar una ciudad o zona de operación que no tenga rutas asociadas, para retirar zonas que ya no se atienden. | Registro de «ciudad o zona de operación» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Eliminar una ciudad o zona pide confirmación con un botón de estilo destructivo.
- [x] Si se confirma, sale de la lista y aparece un aviso; si se cancela, no cambia nada.
- [x] Los códigos `city-has-routes` y `city-has-zones` se muestran en español y la ciudad sigue en la lista.
- [x] Requiere el permiso `cities.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

**Implementación:** `frontend/src/app/admin/cities/presentation/cities-admin.page.ts`, `frontend/src/app/admin/cities/application/admin-cities.store.ts`, `frontend/src/app/admin/cities/domain/managed-city.ts`, `frontend/src/app/admin/cities/infrastructure/http-city-admin.repository.ts`

**Pruebas:** `frontend/src/app/admin/cities/infrastructure/http-city-admin.repository.spec.ts`, `frontend/src/app/admin/cities/application/admin-cities.store.spec.ts`, `frontend/src/app/admin/cities/presentation/cities-admin.page.spec.ts`

## Dependencias

- **Depende de:** ninguna.
- **Dependen de esta capacidad:** [EP-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md), [EP-09 · Generación de rutas seguras](09-rutas-seguras.md), [EP-19 · Clubes de running y membresías](19-clubes-y-membresias.md), [EP-20 · Puntos de encuentro](20-puntos-de-encuentro.md).

## Supuestos por validar

- El Excel pide «ubicación geográfica» y «estado de cobertura»; se modeló como punto (latitud y longitud) y tres estados (inferido). Una zona como polígono queda para cuando exista el mapa.
- El backlog asigna el RF-04 al Sprint 1 (semana 5) con dependencia N/A, y el registro de usuarios ([EP-01](01-gestion-de-usuarios.md)) lo usa: se mantiene así.
