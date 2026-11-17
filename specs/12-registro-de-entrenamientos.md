# EP-12 — Registro de entrenamientos

> Spec de capacidad · Debe tener · **0/9 Hecha, 0 Parcial, 9 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-12 · Registro de entrenamientos |
| Requisitos | RF-12-1 a RF-12-9 (9 sub-requisitos) |
| Requisito de usuario (UR) | UR-07, UR-08 |
| RNF | RNF-08, RNF-12, RNF-13, RNF-20, RNF-25 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | Santiago Matute |
| Sprint planificado | Sprint 4 · Semana 9 / Sprint 5 · Semana 10 |
| Sprint real | Planificada: Sprint 4 (semana 9) para RF-12-1 a RF-12-6 y Sprint 5 (semana 10) para RF-12-7 a RF-12-9. Sin implementar. |
| Dependencias | [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md) |

## Propósito

Que el corredor registre su entrenamiento por GPS (iniciar, pausar y finalizar), vea su recorrido y sus métricas (distancia, tiempo, ritmo, velocidad y desnivel) y consulte estadísticas por día, semana y mes. Es una de las tres funciones que deben verse el día de la presentación.

Entradas, proceso y salidas del requisito padre en el Excel (RF-12):

- Entradas: fecha y horas del entrenamiento, coordenadas con marcas de tiempo.
- Proceso: registrar el recorrido durante el entrenamiento, calcular métricas y acumular estadísticas.
- Salidas: historial, recorrido en el mapa, métricas y estadísticas por día, semana y mes.

## Alcance

**Incluye**

- CRUD de entrenamientos (RF-12-1 a RF-12-4).
- Recorrido GPS del entrenamiento: crear, leer y eliminar (RF-12-5 a RF-12-7).
- Métricas de entrenamiento: calcular y consultar (RF-12-8, RF-12-9).

**No incluye**

- Integración con dispositivos deportivos, rankings y retos (fuera del piloto).
- Ubicación compartida con contactos: [EP-16](16-ubicacion-compartida.md).

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que la hora de fin sea posterior a la hora de inicio.
- Que la fecha no sea posterior a la actual.
- Que el corredor consulte solo su propio historial.
- Que la hora de fin siga siendo posterior a la hora de inicio.
- Eliminar también el recorrido y las métricas del entrenamiento.
- Que el entrenamiento exista.
- Que las marcas de tiempo estén en orden creciente.
- Mostrar el recorrido sobre el mapa junto a la ruta recomendada.
- Solicitar confirmación del usuario.
- Calcular las métricas a partir del recorrido del entrenamiento.
- Mostrar acumulados por día, semana y mes.

Decididas por el equipo o derivadas de otros documentos:

- El entrenamiento funciona **sin conexión** y se sincroniza al recuperarla, sin pérdida de datos (RNF-12).
- Error de posición ≤ 10 m en el 90 % de los puntos en espacios abiertos (RNF-13); consumo de batería ≤ 10 % por hora con GPS activo (RNF-25).
- Las marcas de tiempo del recorrido están en orden creciente.
- Se requiere consentimiento explícito antes de recolectar la ubicación (RNF-02) y ubicación en segundo plano durante el entrenamiento.
- Un solo entrenamiento activo por corredor a la vez (inferido).

## Modelo de datos y contrato de API

**Estado: propuesto** (sin implementar). Contrato REST propuesto; cambia con la spec antes que el código. Las respuestas siguen las reglas de [Arquitectura](transversal/arquitectura.md#contrato-de-la-api): `201 {"id"}` al crear, `204` al modificar o eliminar, errores `{error:{reason,message}}`.

| Endpoint | Historia | Actor |
| --- | --- | --- |
| `POST /trainings` | [RF-12-1](#rf-12-1--crear-entrenamiento) Crear entrenamiento | Corredor |
| `GET /trainings` y `GET /trainings/{id}` | [RF-12-2](#rf-12-2--leer-entrenamientos) Leer entrenamientos | Corredor |
| `PUT /trainings/{id}` | [RF-12-3](#rf-12-3--actualizar-entrenamiento) Actualizar entrenamiento | Corredor |
| `DELETE /trainings/{id}` | [RF-12-4](#rf-12-4--eliminar-entrenamiento) Eliminar entrenamiento | Corredor |
| `POST /trainings/{id}/track` | [RF-12-5](#rf-12-5--crear-recorrido-gps) Crear recorrido GPS | Corredor |
| `GET /trainings/{id}/track` y `GET /trainings/{id}/track/{id}` | [RF-12-6](#rf-12-6--leer-recorridos-gps) Leer recorridos GPS | Corredor |
| `DELETE /trainings/{id}/track/{id}` | [RF-12-7](#rf-12-7--eliminar-recorrido-gps) Eliminar recorrido GPS | Corredor |
| `POST /trainings/{id}/metrics` | [RF-12-8](#rf-12-8--crear-métricas-de-entrenamiento) Crear métricas de entrenamiento | Sistema |
| `GET /trainings/{id}/metrics` y `GET /trainings/{id}/metrics/{id}` | [RF-12-9](#rf-12-9--leer-métricas-de-entrenamiento) Leer métricas de entrenamiento | Corredor |

Campos propuestos de «entrenamiento» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Fecha | Sí |
| Hora de inicio | Sí |
| Hora de fin | Sí |
| Distancia | Sí |
| Duración | Sí |
| Ritmo promedio | No |
| Ruta utilizada | No |

Campos propuestos de «recorrido GPS» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Entrenamiento | Sí |
| Coordenadas | Sí |
| Marcas de tiempo | Sí |

Campos propuestos de «métricas de entrenamiento» (de la hoja MODULOS):

| Campo | Obligatorio |
| --- | --- |
| Distancia | Sí |
| Tiempo | Sí |
| Ritmo | Sí |
| Velocidad | Sí |
| Desnivel acumulado | Sí |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-12-1](#rf-12-1--crear-entrenamiento) | Crear entrenamiento | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-12-2](#rf-12-2--leer-entrenamientos) | Leer entrenamientos | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-12-3](#rf-12-3--actualizar-entrenamiento) | Actualizar entrenamiento | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-12-4](#rf-12-4--eliminar-entrenamiento) | Eliminar entrenamiento | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-12-5](#rf-12-5--crear-recorrido-gps) | Crear recorrido GPS | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-12-6](#rf-12-6--leer-recorridos-gps) | Leer recorridos GPS | Corredor | Sprint 4 · Semana 9 | Pendiente |
| [RF-12-7](#rf-12-7--eliminar-recorrido-gps) | Eliminar recorrido GPS | Corredor | Sprint 5 · Semana 10 | Pendiente |
| [RF-12-8](#rf-12-8--crear-métricas-de-entrenamiento) | Crear métricas de entrenamiento | Sistema | Sprint 5 · Semana 10 | Pendiente |
| [RF-12-9](#rf-12-9--leer-métricas-de-entrenamiento) | Leer métricas de entrenamiento | Corredor | Sprint 5 · Semana 10 | Pendiente |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-12-1 — Crear entrenamiento

- **Historia de usuario:** Como corredor · Deseo registrar mi entrenamiento. Para guardar la fecha, duración, distancia y ritmo de cada sesión de running.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01 · **Caso de uso:** Registrar entrenamiento
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Fecha (obligatorio); Hora de inicio (obligatorio); Hora de fin (obligatorio); Distancia (obligatorio); Duración (obligatorio); Ritmo promedio (opcional); Ruta utilizada (opcional) | El sistema deberá permitir al corredor crear un entrenamiento con su fecha, horas de inicio y finalización, distancia, duración y ritmo promedio. | Registro de «entrenamiento» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (fecha, hora de inicio, hora de fin, distancia, duración), el sistema crea el registro de «entrenamiento» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que la hora de fin sea posterior a la hora de inicio.
- [ ] Se valida que la fecha no sea posterior a la actual.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.
- [ ] La operación termina en ≤ 5 s en el 95 % de los casos con conexión 4G (RNF-08).

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-12-2 — Leer entrenamientos

- **Historia de usuario:** Como corredor · Deseo consultar mis entrenamientos. Para revisar cuándo entrené y consultar el detalle de cada sesión anterior.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01 · **Caso de uso:** Consultar entrenamientos
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Fecha (filtro); Hora de inicio (filtro); Hora de fin (filtro); Distancia (filtro) | El sistema deberá permitir al corredor leer su historial de entrenamientos y los detalles de cada sesión. | Datos de «entrenamientos» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «entrenamientos» que cumplen los criterios indicados (fecha, hora de inicio, hora de fin, distancia), o informa que no hay resultados.
- [ ] Se valida que el corredor consulte solo su propio historial.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.
- [ ] La operación termina en ≤ 5 s en el 95 % de los casos con conexión 4G (RNF-08).

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-12-3 — Actualizar entrenamiento

- **Historia de usuario:** Como corredor · Deseo modificar mi entrenamiento. Para corregir valores registrados y mantener fiable mi historial deportivo.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01 · **Caso de uso:** Actualizar entrenamiento
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Fecha (obligatorio); Hora de inicio (obligatorio); Hora de fin (obligatorio); Distancia (obligatorio); Duración (obligatorio); Ritmo promedio (opcional); Ruta utilizada (opcional) | El sistema deberá permitir al corredor actualizar los datos de un entrenamiento registrado, para mantener vigente su historial deportivo. | Registro de «entrenamiento» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema guarda los cambios de «entrenamiento» (fecha, hora de inicio, hora de fin, distancia, duración) y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] Se valida que los datos modificados cumplan las validaciones del registro.
- [ ] Se valida que la hora de fin siga siendo posterior a la hora de inicio.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.
- [ ] La operación termina en ≤ 5 s en el 95 % de los casos con conexión 4G (RNF-08).

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-12-4 — Eliminar entrenamiento

- **Historia de usuario:** Como corredor · Deseo eliminar mi entrenamiento. Para quitar una sesión de mi historial cuando la registré por error o ya no deseo conservarla.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01 · **Caso de uso:** Eliminar entrenamiento
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir al corredor eliminar un entrenamiento de su historial, previa confirmación. | Registro de «entrenamiento» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «entrenamiento» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe eliminar también el recorrido y las métricas del entrenamiento.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.
- [ ] La operación termina en ≤ 5 s en el 95 % de los casos con conexión 4G (RNF-08).

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-12-5 — Crear recorrido GPS

- **Historia de usuario:** Como corredor · Deseo registrar recorrido GPS. Para conservar el trazado recorrido junto con sus coordenadas y tiempos registrados.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01 · **Caso de uso:** Registrar recorrido GPS
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Entrenamiento (obligatorio); Coordenadas (obligatorio); Marcas de tiempo (obligatorio) | El sistema deberá permitir crear el recorrido GPS de un entrenamiento, con su secuencia de coordenadas y marcas de tiempo. | Registro de «recorrido GPS» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (entrenamiento, coordenadas, marcas de tiempo), el sistema crea el registro de «recorrido GPS» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] Se valida que el entrenamiento exista.
- [ ] Se valida que las marcas de tiempo estén en orden creciente.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.
- [ ] La operación termina en ≤ 5 s en el 95 % de los casos con conexión 4G (RNF-08).

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-12-6 — Leer recorridos GPS

- **Historia de usuario:** Como corredor · Deseo consultar recorridos GPS. Para comparar en el mapa el trayecto realizado con la ruta que se me había recomendado.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 4 · Semana 9 · **Dependencia:** RF-01 · **Caso de uso:** Consultar recorridos GPS
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 4 · Semana 9.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Entrenamiento (filtro); Coordenadas (filtro); Marcas de tiempo (filtro) | El sistema deberá permitir leer el recorrido GPS de un entrenamiento sobre un mapa, mostrando también la ruta recomendada para compararlos. | Datos de «recorridos GPS» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «recorridos GPS» que cumplen los criterios indicados (entrenamiento, coordenadas, marcas de tiempo), o informa que no hay resultados.
- [ ] El sistema debe mostrar el recorrido sobre el mapa junto a la ruta recomendada.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.
- [ ] La operación termina en ≤ 5 s en el 95 % de los casos con conexión 4G (RNF-08).

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-12-7 — Eliminar recorrido GPS

- **Historia de usuario:** Como corredor · Deseo eliminar recorrido GPS. Para retirar los puntos GPS de una sesión cuando lo decida y confirme.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01 · **Caso de uso:** Eliminar recorrido GPS
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar el recorrido GPS asociado a un entrenamiento, previa confirmación del usuario. | Registro de «recorrido GPS» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] El sistema elimina el registro de «recorrido GPS» indicado y confirma al actor.
- [ ] Se valida que el registro exista.
- [ ] El sistema debe solicitar confirmación previa.
- [ ] El sistema debe solicitar confirmación del usuario.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.
- [ ] La operación termina en ≤ 5 s en el 95 % de los casos con conexión 4G (RNF-08).

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-12-8 — Crear métricas de entrenamiento

- **Historia de usuario:** Como sistema · Deseo calcular las métricas de cada entrenamiento a partir de su recorrido. Para calcular distancia, tiempo, velocidad, ritmo y desnivel de una sesión a partir del recorrido.
- **Actor:** Sistema · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01 · **Caso de uso:** Calcular métricas de entrenamiento
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Distancia (obligatorio); Tiempo (obligatorio); Ritmo (obligatorio); Velocidad (obligatorio); Desnivel acumulado (obligatorio) | El sistema deberá permitir crear las métricas de un entrenamiento (distancia, tiempo, ritmo, velocidad y desnivel acumulado) a partir de su recorrido. | Registro de «métricas de entrenamiento» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [ ] Con los datos obligatorios completos y válidos (distancia, tiempo, ritmo, velocidad, desnivel acumulado), el sistema crea el registro de «métricas de entrenamiento» y confirma al actor.
- [ ] Se valida que los datos obligatorios estén completos.
- [ ] El sistema debe calcular las métricas a partir del recorrido del entrenamiento.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.
- [ ] La operación termina en ≤ 5 s en el 95 % de los casos con conexión 4G (RNF-08).

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

### RF-12-9 — Leer métricas de entrenamiento

- **Historia de usuario:** Como corredor · Deseo consultar métricas de entrenamiento. Para analizar mi evolución deportiva con estadísticas agrupadas por día, semana y mes.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 5 · Semana 10 · **Dependencia:** RF-01 · **Caso de uso:** Consultar estadísticas de entrenamiento
- **Estado:** `Pendiente` — Sin implementar. Planificada en Sprint 5 · Semana 10.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Distancia (filtro); Tiempo (filtro); Ritmo (filtro); Velocidad (filtro) | El sistema deberá permitir leer las métricas de cada entrenamiento y las estadísticas acumuladas por día, semana y mes. | Datos de «métricas de entrenamiento» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [ ] El sistema devuelve los registros de «métricas de entrenamiento» que cumplen los criterios indicados (distancia, tiempo, ritmo, velocidad), o informa que no hay resultados.
- [ ] El sistema debe mostrar acumulados por día, semana y mes.
- [ ] Si una validación o regla de negocio falla, el sistema informa el motivo en español y no modifica los datos.
- [ ] La operación termina en ≤ 5 s en el 95 % de los casos con conexión 4G (RNF-08).

**Implementación y pruebas:** aún no existen; la prueba que falla (RED) se escribe a partir de los criterios de arriba.

## Dependencias

- **Depende de:** [RF-01 · Gestión de usuarios](01-gestion-de-usuarios.md).
- **Dependen de esta capacidad:** [EP-13 · Metas personales](13-metas-personales.md), [EP-14 · Retos entre corredores](14-retos-entre-corredores.md), [EP-16 · Ubicación compartida en tiempo real](16-ubicacion-compartida.md).

## Supuestos por validar

- RF-12-8 tiene como actor al Sistema: las métricas se calculan al finalizar y al sincronizar el entrenamiento.
- No existe «actualizar recorrido» en el Excel (solo crear, leer y eliminar), ni «actualizar/eliminar métricas»: se mantienen así.
- La biblioteca de mapas y de ubicación en segundo plano de Capacitor no está elegida; es una decisión técnica previa.
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
