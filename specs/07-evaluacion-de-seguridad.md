# EP-07 — Evaluación de seguridad de rutas y zonas de riesgo

> Spec de capacidad · Debe tener · **11/15 Hecha, 4 Parcial, 0 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-07 · Evaluación de seguridad de rutas y zonas de riesgo |
| Requisitos | RF-07-1 a RF-07-15 (15 sub-requisitos) |
| Requisito de usuario (UR) | UR-05, UR-06, UR-13 |
| RNF | RNF-14 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | Jhordy Camacas |
| Sprint planificado | Sprint 2 · Semana 6 / Sprint 3 · Semana 7 |
| Sprint real | Sprint 2 (semana 6) para RF-07-1 a RF-07-11; Sprint 3 (semana 7) para las alertas de zona RF-07-12 a RF-07-15. Backend: 2026-11-13. Administración: 2026-11-16, verificada en navegador el 2026-11-17; accesibilidad medida el 2026-11-22. Alertas de zona: backend 2026-11-22 (commit `9387ea1`) y página Alertas del corredor (`1c75a42`, `4fcdb46`); falta la administración de alertas. |
| Dependencias | [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md), [RF-17 · Reportes comunitarios](17-reportes-comunitarios.md) |

## Propósito

Gestionar la información de riesgo de las rutas para que cada ruta tenga un **nivel de seguridad por franja horaria**: franjas, factores de riesgo, índice (calculado y recalculado por el sistema) y alertas de zona. **Principio clave:** nunca se declara una ruta «segura» o «insegura» de forma absoluta; se muestra el nivel (Alto, Medio o Bajo) por franja junto con los factores que lo explican.

Entradas, proceso y salidas del requisito padre en el Excel (RF-07):

- Entradas: franjas horarias, factores de riesgo, alertas de zona y reportes validados.
- Proceso: asociar factores y alertas a la ruta, calcular el nivel por franja y recalcularlo cuando cambien los datos.
- Salidas: nivel de seguridad (alto, medio o bajo) por ruta y franja, y alertas vigentes para el corredor.

## Alcance

**Incluye**

- CRUD de franjas horarias de una ruta, sin solapamiento (RF-07-1 a RF-07-4).
- CRUD de factores de riesgo por tramo (RF-07-5 a RF-07-8).
- Cálculo, consulta y recálculo del índice de seguridad (RF-07-9 a RF-07-11).
- Alertas de zona de riesgo para el corredor (RF-07-12 a RF-07-15; backend implementado, administración pendiente).

**No incluye**

- Reportes comunitarios que penalizan el índice: [EP-17](17-reportes-comunitarios.md) (la fórmula ya tiene el punto de extensión `extraPenalties`).
- Incidentes y fuentes de información: [EP-08](08-incidentes-y-fuentes.md).
- Garantía absoluta de seguridad (fuera del piloto, Documento de Visión).

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que la hora de fin sea posterior a la hora de inicio.
- Que no se solape con otra franja vigente.
- Mostrar las franjas con sus fechas de aplicación.
- Que la franja no esté en uso en la evaluación vigente.
- Que la ruta o el tramo exista.
- Que la franja horaria exista.
- Mostrar los factores de un tramo con sus horarios.
- Que la franja horaria siga existiendo.
- Eliminar solo factores que dejaron de aplicar o se ingresaron por error.
- Que existan factores de riesgo o reportes validados para la ruta o el tramo.
- Que el nivel sea Alto, Medio o Bajo.
- Mostrar el nivel según la franja horaria elegida.
- Recalcular cuando cambien factores, incidentes, puntos de apoyo o reportes validados.
- Que el nivel de severidad sea Alta, Media o Baja.
- Mostrar las alertas vigentes por zona o ruta.
- Mantener la alerta acorde con la situación actual.
- Dejar de mostrar la alerta al eliminarla.

Decididas por el equipo o derivadas de otros documentos:

- Índice: cada tramo parte de 100 puntos por franja; cada factor activo en esa franja resta 10 (baja), 20 (media) o 35 (alta), con mínimo 0. Estos valores son los **parámetros por defecto** del sistema (`penaltyLow`, `penaltyMedium`, `penaltyHigh`); el administrador los edita en la [configuración del sistema](27-configuracion-del-sistema.md) y al guardar se recalculan todas las rutas.
- Niveles: **Alto ≥ 70, Medio 40–69, Bajo < 40** (umbrales `thresholdHigh` y `thresholdMedium`, también configurables). La ruta toma el nivel de su **peor tramo** y siempre se muestran los factores que lo explican.
- Las franjas de una ruta no se solapan (`time-slot-overlap`); las fechas de vigencia (`validFrom`, `validTo`) son de las franjas, no de los factores.
- Un factor tiene tipo (texto libre de 1 a 40 caracteres, `invalid-factor-type`), severidad, descripción y una ventana diaria opcional (`startTime` y `endTime`, ambas o ninguna = todo el día).
- El cliente nunca calcula el puntaje: el servidor recalcula en la misma transacción de cada cambio y el cliente recarga `GET /routes/{id}`. No hay endpoint del índice.
- El índice se actualiza en ≤ 24 h tras un cambio (RNF-14); hoy es inmediato.
- Franjas de entrenamiento de referencia del negocio: 05:00–07:00 y 18:00–20:00. La aplicación no las fija: las franjas de cada ruta las define el administrador y el catálogo del corredor abre en la que está en curso (o la siguiente).
- El radio máximo de una alerta de zona (5000 m por defecto), el máximo de franjas por ruta (12), de tramos (50) y de factores por tramo (20), y la zona horaria (`America/Guayaquil`) son parámetros del sistema ([configuración](27-configuracion-del-sistema.md)).

## Modelo de datos y contrato de API

**Estado: RF-07-1 a RF-07-11 implementados**; alertas de zona con **backend implementado** (2026-11-22, `backend/apps/risk_alerts`) y página Alertas del corredor (`frontend/src/app/alerts`); falta la pantalla de administración. Código: `backend/apps/routes` (`domain/safety.py`, `domain/time.py`), `frontend/src/app/admin/routes`, `frontend/src/app/routes`.

| Endpoint | Permiso | Descripción |
| --- | --- | --- |
| `POST /routes/{id}/time-slots` | `routes.manage` | Crea una franja: `label?`, `startTime`, `endTime` (`HH:MM`), `validFrom`, `validTo` (`201 {id}`). |
| `PUT` · `DELETE /routes/{id}/time-slots/{slotId}` | `routes.manage` | Modifica o elimina la franja (`204`). |
| `POST /routes/{id}/segments/{segmentId}/risk-factors` | `routes.manage` | Crea un factor: `type`, `severity`, `description`, `startTime?`, `endTime?` (`201 {id}`). |
| `PUT` · `DELETE …/risk-factors/{factorId}` | `routes.manage` | Modifica o elimina el factor (`204`). |
| `GET /routes`, `GET /routes/{id}` | sesión | Devuelven `safety` por franja y por tramo con el puntaje, el nivel y los factores que lo explican. |
| `POST/GET/PUT/DELETE /risk-zone-alerts` | `routes.manage` para escribir; sesión para leer | Alertas de zona: ver «Decisiones de diseño de las alertas de zona». |

Códigos propios: `time-slot-not-found`, `time-slot-overlap`, `too-many-time-slots`, `invalid-time-slot-id`, `invalid-slot-label`, `invalid-start-time`, `invalid-end-time`, `invalid-time-range`, `invalid-valid-from`, `invalid-valid-to`, `invalid-date-range`, `risk-factor-not-found`, `too-many-risk-factors`, `invalid-risk-factor-id`, `invalid-factor-type`, `invalid-severity`, `invalid-factor-description`.

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-07-1](#rf-07-1--crear-franja-horaria) | Crear franja horaria | Administrador | Sprint 2 · Semana 6 | Hecha |
| [RF-07-2](#rf-07-2--leer-franjas-horarias) | Leer franjas horarias | Administrador | Sprint 2 · Semana 6 | Hecha |
| [RF-07-3](#rf-07-3--actualizar-franja-horaria) | Actualizar franja horaria | Administrador | Sprint 2 · Semana 6 | Hecha |
| [RF-07-4](#rf-07-4--eliminar-franja-horaria) | Eliminar franja horaria | Administrador | Sprint 2 · Semana 6 | Hecha |
| [RF-07-5](#rf-07-5--crear-factor-de-riesgo) | Crear factor de riesgo | Administrador | Sprint 2 · Semana 6 | Hecha |
| [RF-07-6](#rf-07-6--leer-factores-de-riesgo) | Leer factores de riesgo | Administrador | Sprint 2 · Semana 6 | Hecha |
| [RF-07-7](#rf-07-7--actualizar-factor-de-riesgo) | Actualizar factor de riesgo | Administrador | Sprint 2 · Semana 6 | Hecha |
| [RF-07-8](#rf-07-8--eliminar-factor-de-riesgo) | Eliminar factor de riesgo | Administrador | Sprint 2 · Semana 6 | Hecha |
| [RF-07-9](#rf-07-9--crear-índice-de-seguridad-calcular) | Crear índice de seguridad (calcular) | Sistema | Sprint 2 · Semana 6 | Hecha |
| [RF-07-10](#rf-07-10--leer-índices-de-seguridad) | Leer índices de seguridad | Corredor y Administrador | Sprint 2 · Semana 6 | Hecha |
| [RF-07-11](#rf-07-11--actualizar-índice-de-seguridad-recalcular) | Actualizar índice de seguridad (recalcular) | Sistema | Sprint 2 · Semana 6 | Hecha |
| [RF-07-12](#rf-07-12--crear-alerta-de-zona-de-riesgo) | Crear alerta de zona de riesgo | Administrador | Sprint 3 · Semana 7 | Parcial |
| [RF-07-13](#rf-07-13--leer-alertas-de-zonas-de-riesgo) | Leer alertas de zonas de riesgo | Corredor | Sprint 3 · Semana 7 | Parcial |
| [RF-07-14](#rf-07-14--actualizar-alerta-de-zona-de-riesgo) | Actualizar alerta de zona de riesgo | Administrador | Sprint 3 · Semana 7 | Parcial |
| [RF-07-15](#rf-07-15--eliminar-alerta-de-zona-de-riesgo) | Eliminar alerta de zona de riesgo | Administrador | Sprint 3 · Semana 7 | Parcial |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-07-1 — Crear franja horaria

- **Historia de usuario:** Como administrador · Deseo registrar franja horaria. Para disponer de períodos definidos al comparar las condiciones de una ruta según el horario.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-05, RF-17 · **Caso de uso:** Registrar franja horaria
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Hora de inicio (obligatorio); Hora de fin (obligatorio); Fecha de inicio de vigencia (obligatorio); Fecha de fin de vigencia (opcional) | El sistema deberá permitir crear franjas horarias de entrenamiento, indicando la hora de inicio, la hora de finalización y sus fechas de aplicación. | Registro de «franja horaria» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El detalle de la ruta permite agregar una franja con hora de inicio y fin mediante campos de hora (no texto libre), etiqueta opcional y fechas de vigencia opcionales.
- [x] Una franja que se solapa con otra se rechaza con un mensaje en español, tanto en el cliente como con el código `time-slot-overlap` de la API.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `frontend/src/app/admin/routes/presentation/time-slots-section.ts`, `frontend/src/app/admin/routes/domain/time-slot-form.ts`, `backend/apps/routes/domain/time.py`

**Pruebas:** `frontend/src/app/admin/routes/domain/time-slot-form.spec.ts`, `frontend/src/app/admin/routes/presentation/time-slots-section.spec.ts`

### RF-07-2 — Leer franjas horarias

- **Historia de usuario:** Como administrador · Deseo consultar franjas horarias. Para escoger una franja de entrenamiento con fechas válidas al evaluar un recorrido.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-05, RF-17 · **Caso de uso:** Consultar franjas horarias
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Hora de inicio (filtro); Hora de fin (filtro); Fecha de inicio de vigencia (filtro); Fecha de fin de vigencia (filtro) | El sistema deberá permitir leer las franjas horarias disponibles y sus fechas de aplicación para evaluar la seguridad de las rutas. | Datos de «franjas horarias» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [x] El detalle lista las franjas de la ruta ordenadas por hora de inicio, con su ventana y su vigencia ("Todos los días" si no tiene límites).
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `frontend/src/app/admin/routes/presentation/time-slots-section.ts`

**Pruebas:** `frontend/src/app/admin/routes/presentation/time-slots-section.spec.ts`

### RF-07-3 — Actualizar franja horaria

- **Historia de usuario:** Como administrador · Deseo modificar franja horaria. Para corregir franjas que cambiaron de horario o de período de aplicación.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-05, RF-17 · **Caso de uso:** Actualizar franja horaria
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Hora de inicio (obligatorio); Hora de fin (obligatorio); Fecha de inicio de vigencia (obligatorio); Fecha de fin de vigencia (opcional) | El sistema deberá permitir actualizar las horas y fechas de aplicación de una franja horaria de entrenamiento. | Registro de «franja horaria» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Una franja se edita con valores precargados y la regla de no solapamiento también aplica (se excluye la franja editada).
- [x] Vaciar la etiqueta la borra (la API recibe la clave ausente, no un valor nulo).
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `frontend/src/app/admin/routes/presentation/time-slots-section.ts`, `frontend/src/app/admin/routes/domain/time-slot-form.ts`

**Pruebas:** `frontend/src/app/admin/routes/domain/time-slot-form.spec.ts`, `frontend/src/app/admin/routes/presentation/time-slots-section.spec.ts`

### RF-07-4 — Eliminar franja horaria

- **Historia de usuario:** Como administrador · Deseo eliminar franja horaria. Para retirar franjas que ya no deben intervenir en la evaluación de rutas.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-05, RF-17 · **Caso de uso:** Eliminar franja horaria
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar una franja horaria que deje de utilizarse en la evaluación de las rutas, previa confirmación. | Registro de «franja horaria» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Eliminar una franja pide confirmación (botón destructivo).
- [x] Al eliminarse, la franja y su entrada de seguridad desaparecen del detalle.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `frontend/src/app/admin/routes/presentation/time-slots-section.ts`, `frontend/src/app/admin/routes/application/route-detail.store.ts`

**Pruebas:** `frontend/src/app/admin/routes/presentation/time-slots-section.spec.ts`, `frontend/src/app/admin/routes/application/route-detail.store.spec.ts`

### RF-07-5 — Crear factor de riesgo

- **Historia de usuario:** Como administrador · Deseo registrar factor de riesgo. Para registrar el tipo de riesgo presente en un tramo y el horario en que corresponde considerarlo.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-05, RF-17 · **Caso de uso:** Registrar factor de riesgo
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta o tramo (obligatorio); Tipo (texto libre, 1 a 40 caracteres; obligatorio); Franja horaria (obligatorio); Descripción (opcional) | El sistema deberá permitir crear los factores de riesgo de un tramo, indicando su tipo, descripción y horario de aplicación. | Registro de «factor de riesgo» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Desde cada tramo se agrega un factor con tipo, severidad (baja, media, alta), descripción y una ventana diaria opcional con campos de hora (ambas horas o ninguna = todo el día).
- [x] Las fechas de vigencia pertenecen a las franjas, no a los factores (decisión del contrato de la API).
- [x] Los errores de campo y de la API salen en español.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `frontend/src/app/admin/routes/presentation/risk-factors-section.ts`, `frontend/src/app/admin/routes/domain/risk-factor-form.ts`

**Pruebas:** `frontend/src/app/admin/routes/domain/risk-factor-form.spec.ts`, `frontend/src/app/admin/routes/presentation/risk-factors-section.spec.ts`

### RF-07-6 — Leer factores de riesgo

- **Historia de usuario:** Como administrador · Deseo consultar factores de riesgo. Para identificar qué riesgos se han registrado en un segmento y cuándo se presentan.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-05, RF-17 · **Caso de uso:** Consultar factores de riesgo
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta o tramo (filtro); Tipo (filtro); Franja horaria (filtro); Descripción (filtro) | El sistema deberá permitir leer los factores de riesgo asociados a un tramo y los horarios en que se presentan. | Datos de «factores de riesgo» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [x] Cada tramo lista sus factores con tipo, "Severidad Baja/Media/Alta", descripción y ventana diaria ("Todo el día" si no tiene).
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `frontend/src/app/admin/routes/presentation/risk-factors-section.ts`

**Pruebas:** `frontend/src/app/admin/routes/presentation/risk-factors-section.spec.ts`

### RF-07-7 — Actualizar factor de riesgo

- **Historia de usuario:** Como administrador · Deseo modificar factor de riesgo. Para mantener actualizada la descripción de los riesgos y las horas en que aplican.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-05, RF-17 · **Caso de uso:** Actualizar factor de riesgo
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta o tramo (obligatorio); Tipo (texto libre, 1 a 40 caracteres; obligatorio); Franja horaria (obligatorio); Descripción (opcional) | El sistema deberá permitir actualizar la información y los horarios de los factores de riesgo de un tramo. | Registro de «factor de riesgo» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Un factor se edita en el formulario en línea con valores precargados y foco en el encabezado.
- [x] Al guardar, el índice de seguridad mostrado se actualiza sin recargar la página.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `frontend/src/app/admin/routes/presentation/risk-factors-section.ts`, `frontend/src/app/admin/routes/application/route-detail.store.ts`

**Pruebas:** `frontend/src/app/admin/routes/presentation/risk-factors-section.spec.ts`, `frontend/src/app/admin/routes/application/route-detail.store.spec.ts`

### RF-07-8 — Eliminar factor de riesgo

- **Historia de usuario:** Como administrador · Deseo eliminar factor de riesgo. Para dejar de considerar condiciones de riesgo que ya no existen o fueron registradas por error.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-05, RF-17 · **Caso de uso:** Eliminar factor de riesgo
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar un factor de riesgo registrado en un tramo cuando deje de aplicar o haya sido ingresado por error. | Registro de «factor de riesgo» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Eliminar un factor pide confirmación (botón destructivo).
- [x] Al eliminarse, el nivel de seguridad se recalcula y el detalle lo refleja.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `frontend/src/app/admin/routes/presentation/risk-factors-section.ts`, `frontend/src/app/admin/routes/application/route-detail.store.ts`

**Pruebas:** `frontend/src/app/admin/routes/presentation/risk-factors-section.spec.ts`, `frontend/src/app/admin/routes/application/route-detail.store.spec.ts`

### RF-07-9 — Crear índice de seguridad (calcular)

- **Historia de usuario:** Como sistema · Deseo calcular el índice de seguridad de cada tramo por franja horaria. Para obtener una valoración de las condiciones de una ruta por tramo y horario con base en datos disponibles.
- **Actor:** Sistema · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-05, RF-17 · **Caso de uso:** Calcular índice de seguridad
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta o tramo (obligatorio); Franja horaria (obligatorio); Nivel {Alto, Medio, Bajo} (obligatorio) | El sistema deberá permitir crear (calcular) el índice de seguridad de una ruta o tramo por franja horaria, a partir de los factores de riesgo y de los reportes validados. | Registro de «índice de seguridad» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El servidor calcula el índice por tramo y franja: parte de 100 puntos y cada factor activo en la franja resta 10 (severidad baja), 20 (media) o 35 (alta).
- [x] Niveles: Alto ≥ 70, Medio 40–69, Bajo < 40. La ruta toma el nivel de su peor tramo.
- [x] La penalización por severidad y los umbrales salen de los parámetros del sistema; cambiarlos recalcula el índice almacenado de todas las rutas (`backend/tests/test_system_settings_api.py`, `backend/tests/test_route_safety.py`).
- [x] El cliente nunca calcula el índice: lo lee de `GET /routes/{id}`.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `backend/apps/routes/domain/safety.py`, `backend/apps/routes/application/use_cases.py`, `frontend/src/app/admin/routes/domain/mappers.ts`

**Pruebas:** `frontend/src/app/admin/routes/domain/mappers.spec.ts`

### RF-07-10 — Leer índices de seguridad

- **Historia de usuario:** Como corredor o administrador · Deseo consultar índices de seguridad. Para comparar niveles alto, medio o bajo del índice registrado sin asumir seguridad absoluta.
- **Actor:** Corredor y Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-05, RF-17 · **Caso de uso:** Consultar índice de seguridad
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`. El mismo día, el detalle de ruta del corredor (`/app/rutas/:id`) mostró el mismo índice por franja que el administrador (Malecón del Río Zamora, 05:00–07:00: Medio, 65 de 100).

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta o tramo (filtro); Franja horaria (filtro); Nivel (filtro) | El sistema deberá permitir leer el índice de seguridad de una ruta o tramo según el horario, mostrando su nivel alto, medio o bajo. | Datos de «índices de seguridad» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [x] El detalle muestra un resumen de seguridad: por franja, el nivel de la ruta, el puntaje, el "Tramo más expuesto" y los factores que lo explican.
- [x] El corredor ve el nivel de seguridad en el catálogo y en el detalle de ruta (área del corredor).
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `frontend/src/app/admin/routes/presentation/safety-summary-section.ts`, `frontend/src/app/admin/routes/domain/slot-safety.ts`, `frontend/src/app/routes/presentation/safety-badge.ts`, `frontend/src/app/routes/presentation/factor-list.ts`, `frontend/src/app/routes/presentation/route-card.ts`, `frontend/src/app/routes/presentation/route-detail.page.ts`

**Pruebas:** `frontend/src/app/admin/routes/presentation/safety-summary-section.spec.ts`, `frontend/src/app/admin/routes/domain/slot-safety.spec.ts`, `frontend/src/app/routes/presentation/route-card.spec.ts`, `frontend/src/app/routes/presentation/route-detail.page.spec.ts`, `backend/tests/test_route_safety.py`

### RF-07-11 — Actualizar índice de seguridad (recalcular)

- **Historia de usuario:** Como sistema · Deseo recalcular el índice de seguridad cuando cambian sus factores. Para reflejar cambios en incidentes, reportes y puntos de apoyo al recalcular la evaluación.
- **Actor:** Sistema · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 2 · Semana 6 · **Dependencia:** RF-05, RF-17 · **Caso de uso:** Recalcular índice de seguridad
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17, 22 de 22 pasos); commits `25b11c4`, `c7a98bb`, `517f5d5`, `31a162a`, `8b87d17`, corrección `646deb8`. Accesibilidad medida en Chrome el 2026-11-22 (360 px y 1492 px, tema claro y oscuro): todo control con etiqueta y 48 px de alto, texto con contraste 4,5:1 y sin scroll horizontal; corrección `abbc02c`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ruta o tramo (obligatorio); Franja horaria (obligatorio); Nivel {Alto, Medio, Bajo} (obligatorio) | El sistema deberá permitir actualizar (recalcular) el índice de seguridad cuando cambien los factores de riesgo, los incidentes, los puntos de apoyo o los reportes validados. | Registro de «índice de seguridad» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Editar o eliminar un tramo, una franja o un factor recalcula el índice en el servidor.
- [x] El detalle se recarga tras cada cambio (`mutate`) y el resumen se actualiza sin recarga manual.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

**Implementación:** `frontend/src/app/admin/routes/application/route-detail.store.ts`, `backend/apps/routes/application/use_cases.py`

**Pruebas:** `frontend/src/app/admin/routes/application/route-detail.store.spec.ts`

### RF-07-12 — Crear alerta de zona de riesgo

- **Historia de usuario:** Como administrador · Deseo registrar alerta de zona de riesgo. Para advertir sobre una situación localizada durante el período y con la severidad que corresponda.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05, RF-17 · **Caso de uso:** Registrar alerta de zona de riesgo
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `POST /risk-zone-alerts`. Falta la pantalla de administración; los mensajes de error en español dependen de esa pantalla.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ubicación (obligatorio); Tipo (texto libre, 1 a 40 caracteres; obligatorio); Horario de vigencia (obligatorio); Nivel de severidad {Alta, Media, Baja} (obligatorio) | El sistema deberá permitir crear una alerta de zona de riesgo con su ubicación, tipo, horario de vigencia y nivel de severidad, para avisar al corredor al planificar o realizar un entrenamiento. | Registro de «alerta de zona de riesgo» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Con los datos obligatorios completos y válidos (ubicación, tipo, horario de vigencia, nivel de severidad {alta, media, baja}), el sistema crea el registro de «alerta de zona de riesgo» y confirma al actor.
- [x] Se valida que los datos obligatorios estén completos.
- [x] Se valida que el nivel de severidad sea Alta, Media o Baja.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/risk_alerts/domain/models.py`, `backend/apps/risk_alerts/application/use_cases.py`, `backend/apps/risk_alerts/presentation/views.py`

**Pruebas:** `backend/tests/test_risk_alerts_api.py`

### RF-07-13 — Leer alertas de zonas de riesgo

- **Historia de usuario:** Como corredor · Deseo consultar alertas de zonas de riesgo. Para conocer las alertas vigentes antes de decidir qué calles o senderos utilizar.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05, RF-17 · **Caso de uso:** Consultar alertas de zonas de riesgo
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `GET /risk-zone-alerts` (filtros `cityId`, `routeId`, `active`) y `GET /risk-zone-alerts/{id}`. La página Alertas del corredor (campana de la barra superior, `frontend/src/app/alerts/`) muestra las alertas vigentes de su ciudad. No filtra por tipo ni por severidad; falta la verificación en el celular.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ubicación (filtro); Tipo (filtro); Horario de vigencia (filtro); Nivel de severidad (filtro) | El sistema deberá permitir leer las alertas vigentes en una zona o ruta, para que el corredor las tenga en cuenta al decidir por dónde correr. | Datos de «alertas de zonas de riesgo» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «alertas de zonas de riesgo» que cumplen los criterios indicados (ubicación, tipo, horario de vigencia, nivel de severidad), o informa que no hay resultados.
- [x] El sistema debe mostrar las alertas vigentes por zona o ruta.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/risk_alerts/application/use_cases.py`, `backend/apps/risk_alerts/presentation/views.py`, `frontend/src/app/alerts/presentation/alerts.page.ts`, `frontend/src/app/alerts/application/risk-zone-alerts.store.ts`, `frontend/src/app/alerts/infrastructure/http-risk-zone-alert.repository.ts`

**Pruebas:** `backend/tests/test_risk_alerts_api.py`, `frontend/src/app/alerts/presentation/alerts.page.spec.ts`, `frontend/src/app/alerts/infrastructure/http-risk-zone-alert.repository.spec.ts`

### RF-07-14 — Actualizar alerta de zona de riesgo

- **Historia de usuario:** Como administrador · Deseo modificar alerta de zona de riesgo. Para que una alerta refleje su horario, alcance y severidad actuales.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05, RF-17 · **Caso de uso:** Actualizar alerta de zona de riesgo
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `PUT /risk-zone-alerts/{id}`; el cambio se refleja en la página Alertas del corredor. Las validaciones al modificar no tienen prueba propia. Falta la pantalla de administración.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Ubicación (obligatorio); Tipo (texto libre, 1 a 40 caracteres; obligatorio); Horario de vigencia (obligatorio); Nivel de severidad {Alta, Media, Baja} (obligatorio) | El sistema deberá permitir actualizar el horario, la severidad o el alcance de una alerta, para mantenerla acorde con la situación actual. | Registro de «alerta de zona de riesgo» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El sistema guarda los cambios de «alerta de zona de riesgo» (ubicación, tipo, horario de vigencia, nivel de severidad {alta, media, baja}) y confirma al actor.
- [x] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [x] El sistema debe mantener la alerta acorde con la situación actual.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/risk_alerts/application/use_cases.py`, `backend/apps/risk_alerts/presentation/views.py`

**Pruebas:** `backend/tests/test_risk_alerts_api.py`

### RF-07-15 — Eliminar alerta de zona de riesgo

- **Historia de usuario:** Como administrador · Deseo eliminar alerta de zona de riesgo. Para evitar mostrar advertencias de zonas que ya no tienen esa alerta vigente.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 3 · Semana 7 · **Dependencia:** RF-05, RF-17 · **Caso de uso:** Eliminar alerta de zona de riesgo
- **Estado:** `Parcial` — 2026-11-22: API implementada y con pruebas automáticas en el backend (commit `9387ea1`), `DELETE /risk-zone-alerts/{id}`; la alerta eliminada deja de aparecer en la página Alertas del corredor. Falta la pantalla de administración con la confirmación previa.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar una alerta que ya no aplica, para que deje de mostrarse. | Registro de «alerta de zona de riesgo» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El sistema elimina el registro de «alerta de zona de riesgo» indicado y confirma al actor.
- [x] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [x] El sistema debe dejar de mostrar la alerta al eliminarla.
- [x] Solo un usuario con el permiso correspondiente al actor «Administrador» puede ejecutarla; cualquier otro recibe un rechazo por falta de permiso (RNF-03).
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.

**Implementación:** `backend/apps/risk_alerts/application/use_cases.py`, `backend/apps/risk_alerts/presentation/views.py`

**Pruebas:** `backend/tests/test_risk_alerts_api.py`

## Dependencias

- **Depende de:** [RF-05 · Catálogo de rutas y tramos](05-catalogo-de-rutas.md), [RF-17 · Reportes comunitarios](17-reportes-comunitarios.md).
- **Dependen de esta capacidad:** [EP-09 · Generación de rutas seguras](09-rutas-seguras.md).

## Decisiones de diseño de las alertas de zona (2026-11-22)

Tomadas para implementar RF-07-12 a RF-07-15 en el Sprint 3; se revisan con Gacelas en la demo.

- **Modelo:** `type`, `severity` (`alta`, `media`, `baja`), `description`, `location {lat, lng}`, `radiusM` (zona circular), `cityId`, `routeId` opcional, vigencia `validFrom`/`validTo` y franja diaria opcional `startTime`/`endTime`.
- **Vigente:** hoy está entre `validFrom` y `validTo` y, si tiene franja, la hora actual cae dentro. `GET /risk-zone-alerts?cityId=…&active=true` devuelve solo las vigentes (lo que ve el corredor en la pestaña Alertas).
- **Efecto en el índice:** las alertas se muestran; no cambian el puntaje en el Sprint 3 (las penalizaciones vienen de factores e incidentes).
- **Permisos:** escritura con `routes.manage`; lectura con sesión iniciada.
- **API:** `GET/POST /risk-zone-alerts`, `GET/PUT/DELETE /risk-zone-alerts/{id}`.

## Supuestos por validar

- Las alertas de zona (RF-07-12 a RF-07-15) tienen modelo y API desde el 2026-11-22; el contrato sale del Excel («ubicación, tipo, horario de vigencia, nivel de severidad») y se revisa con Gacelas.
- El Excel pide que el índice cuente también «reportes validados»: llega con [EP-17](17-reportes-comunitarios.md) mediante `extraPenalties`.
- RF-07-9 y RF-07-11 tienen como actor al Sistema; sus criterios se verifican en el servidor y en la pantalla de detalle de la ruta, no hay acción manual del usuario.
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
