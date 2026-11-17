# Requisitos no funcionales

> Spec transversal · Fuente: Excel `RequsitosExcelFInal.xlsx`, hoja «Req. No Funcionales» (ISO 9126), y `CONTEXTO.md` sección 7 · Estado: **3 verificados, 8 parciales, 15 pendientes** de 26

Los RNF no se implementan en una historia propia: cada historia del backlog los referencia (columna «RNF» en su spec) y los cumple o no. Este documento fija el criterio medible de cada uno y dice con honestidad cuál está verificado. Un RNF solo pasa a «Verificado» con una prueba o una medición documentada; lo que depende de un despliegue real o de capacidades que no existen aún queda «Pendiente».

## Propósito

Que la calidad esperada del producto (seguridad, rendimiento, fiabilidad, usabilidad) sea comprobable y no una promesa. Los RNF transversales RNF-10, RNF-11, RNF-21 y RNF-23 aplican a todas las historias.

## Leyenda

- **Verificado:** hay prueba automática o medición documentada en el repositorio.
- **Parcial:** una parte está cumplida y verificada y otra falta.
- **Pendiente:** no se cumple todavía o no se midió.

## Resumen

| RNF | Atributo | Prioridad | RF asociado | Estado | Specs |
| --- | --- | --- | --- | --- | --- |
| RNF-01 | Seguridad (confidencialidad) | Debe tener | RF-01 | Parcial | [EP-25](../25-autenticacion-y-credenciales.md) |
| RNF-02 | Seguridad (confidencialidad) | Debe tener | RF-01 | Parcial | [EP-01](../01-gestion-de-usuarios.md) |
| RNF-03 | Seguridad (confidencialidad) | Debe tener | RF-02 | Verificado | [EP-02](../02-roles-y-permisos.md) |
| RNF-04 | Seguridad (confidencialidad) | Debe tener | RF-17 | Pendiente | [EP-17](../17-reportes-comunitarios.md) |
| RNF-05 | Seguridad (confidencialidad) | Debería tener | RF-03, RF-16 | Pendiente | [EP-03](../03-contactos-de-confianza.md), [EP-16](../16-ubicacion-compartida.md) |
| RNF-06 | Eficiencia de desempeño (comportamiento temporal) | Debe tener | RF-15 | Pendiente | [EP-15](../15-boton-de-panico.md) |
| RNF-07 | Eficiencia de desempeño (comportamiento temporal) | Debe tener | RF-09 | Pendiente | [EP-09](../09-rutas-seguras.md) |
| RNF-08 | Eficiencia de desempeño (comportamiento temporal) | Debería tener | RF-01, RF-05, RF-12 | Pendiente | [EP-01](../01-gestion-de-usuarios.md), [EP-05](../05-catalogo-de-rutas.md), [EP-12](../12-registro-de-entrenamientos.md) |
| RNF-09 | Fiabilidad (disponibilidad) | Debe tener | RF-09, RF-15 | Pendiente | [EP-09](../09-rutas-seguras.md), [EP-15](../15-boton-de-panico.md) |
| RNF-10 | Fiabilidad (capacidad de recuperación) | Debería tener | Todos los RF | Pendiente | transversal |
| RNF-11 | Fiabilidad (capacidad de recuperación) | Debería tener | Todos los RF | Pendiente | transversal |
| RNF-12 | Fiabilidad (tolerancia a fallos) | Debe tener | RF-12 | Pendiente | [EP-12](../12-registro-de-entrenamientos.md) |
| RNF-13 | Adecuación funcional (corrección funcional) | Debería tener | RF-12 | Pendiente | [EP-12](../12-registro-de-entrenamientos.md) |
| RNF-14 | Adecuación funcional (corrección funcional) | Debería tener | RF-07, RF-17 | Parcial | [EP-07](../07-evaluacion-de-seguridad.md), [EP-17](../17-reportes-comunitarios.md) |
| RNF-15 | Compatibilidad (interoperabilidad) | Debe tener | RF-05, RF-09 | Parcial | [EP-05](../05-catalogo-de-rutas.md), [EP-09](../09-rutas-seguras.md) |
| RNF-16 | Compatibilidad (interoperabilidad) | Podría tener | RF-08 | Pendiente | [EP-08](../08-incidentes-y-fuentes.md) |
| RNF-17 | Capacidad de interacción (operabilidad) | Debe tener | RF-15 | Parcial | [EP-15](../15-boton-de-panico.md) |
| RNF-18 | Capacidad de interacción (capacidad de aprendizaje) | Debería tener | RF-01, RF-09 | Parcial | [EP-01](../01-gestion-de-usuarios.md), [EP-09](../09-rutas-seguras.md) |
| RNF-19 | Capacidad de interacción (inclusividad) | Debería tener | RF-01 | Parcial | [EP-26](../26-preferencias-de-usuario.md), [EP-01](../01-gestion-de-usuarios.md) |
| RNF-20 | Capacidad de interacción (estética de la interfaz) | Podría tener | RF-01, RF-12 | Verificado | [EP-26](../26-preferencias-de-usuario.md) |
| RNF-21 | Flexibilidad (adaptabilidad) | Debe tener | Todos los RF | Parcial | transversal |
| RNF-22 | Mantenibilidad (modularidad) | Debería tener | RF-04, RF-11 | Verificado | [EP-04](../04-ciudades-y-zonas.md) |
| RNF-23 | Mantenibilidad (analizabilidad) | Debería tener | Todos los RF | Pendiente | transversal |
| RNF-24 | Flexibilidad (escalabilidad) | Debería tener | RF-04, RF-09 | Pendiente | [EP-04](../04-ciudades-y-zonas.md), [EP-09](../09-rutas-seguras.md) |
| RNF-25 | Eficiencia de desempeño (utilización de recursos) | Debería tener | RF-12 | Pendiente | [EP-12](../12-registro-de-entrenamientos.md) |
| RNF-26 | Adecuación funcional (pertinencia funcional) | Debería tener | RF-24 | Pendiente | [EP-24](../24-publicidad.md) |

## Detalle por requisito

### RNF-01 — Seguridad (confidencialidad)

- **Requisito (Excel):** El sistema deberá cumplir con el almacenamiento cifrado de las contraseñas y con el cifrado de las comunicaciones entre la aplicación móvil y el almacenamiento de datos, sin que ninguna contraseña sea visible en texto plano.
- **Prioridad:** Debe tener · **RF asociado:** RF-01 · **Estado:** `Parcial`
- [ ] **Criterio medible:** Ninguna contraseña se almacena ni se ve en texto plano; toda comunicación cliente-API va por HTTPS en producción.
- **Evidencia o pendiente:** Las contraseñas las guarda Firebase Auth (la API nunca las recibe ni las guarda); en producción Django redirige a HTTPS y envía HSTS (`backend/tests/test_security_settings.py`). Falta el despliegue real con TLS.

### RNF-02 — Seguridad (confidencialidad)

- **Requisito (Excel):** El sistema deberá cumplir con la Ley Orgánica de Protección de Datos Personales del Ecuador, solicitando el consentimiento explícito del usuario antes de recolectar su ubicación y sus datos personales.
- **Prioridad:** Debe tener · **RF asociado:** RF-01 · **Estado:** `Parcial`
- [ ] **Criterio medible:** El registro exige el consentimiento explícito LOPDP (`consent.lopdp = true`) antes de guardar el perfil; la ubicación se pide con consentimiento antes de recolectarla.
- **Evidencia o pendiente:** Consentimiento del registro verificado (`test_consent_is_required` en `backend/tests/test_users_api.py`, `register.page.spec.ts`). El texto legal es provisional y falta el consentimiento de ubicación (llega con [EP-12](../12-registro-de-entrenamientos.md)).

### RNF-03 — Seguridad (confidencialidad)

- **Requisito (Excel):** El sistema deberá cumplir con que cada usuario acceda únicamente a las funciones y datos autorizados para su rol, rechazando cualquier acceso no autorizado.
- **Prioridad:** Debe tener · **RF asociado:** RF-02 · **Estado:** `Verificado`
- [x] **Criterio medible:** Cada endpoint exige el permiso de su rol; sin sesión 401, sin permiso 403; el cliente no decide por sí solo.
- **Evidencia o pendiente:** `backend/tests/test_permissions.py`, `test_permission_catalogue.py`, `test_roles_api.py` y `frontend/src/app/core/guards/guards.spec.ts`.

### RNF-04 — Seguridad (confidencialidad)

- **Requisito (Excel):** El sistema deberá cumplir con la reserva de la identidad de quienes realizan reportes de acoso o de incidentes, de modo que ningún otro usuario pueda visualizarla.
- **Prioridad:** Debe tener · **RF asociado:** RF-17 · **Estado:** `Pendiente`
- [ ] **Criterio medible:** Ningún usuario distinto del administrador puede ver la identidad de quien reporta.
- **Evidencia o pendiente:** Depende de [EP-17](../17-reportes-comunitarios.md); no hay reportes todavía.

### RNF-05 — Seguridad (confidencialidad)

- **Requisito (Excel):** El sistema deberá cumplir con que la ubicación en tiempo real solo la visualicen los contactos de confianza seleccionados y únicamente mientras dure la sesión compartida.
- **Prioridad:** Debería tener · **RF asociado:** RF-03, RF-16 · **Estado:** `Pendiente`
- [ ] **Criterio medible:** La ubicación en tiempo real solo la leen los contactos elegidos y solo mientras dure la sesión.
- **Evidencia o pendiente:** Depende de [EP-03](../03-contactos-de-confianza.md) y [EP-16](../16-ubicacion-compartida.md).

### RNF-06 — Eficiencia de desempeño (comportamiento temporal)

- **Requisito (Excel):** El sistema deberá cumplir con el envío de la alerta del botón de pánico a los contactos de confianza en un máximo de 5 segundos desde su activación, cuando exista conexión de datos o mensajería.
- **Prioridad:** Debe tener · **RF asociado:** RF-15 · **Estado:** `Pendiente`
- [ ] **Criterio medible:** La alerta de pánico llega a los contactos en ≤ 5 s desde la activación, con conexión.
- **Evidencia o pendiente:** Depende de [EP-15](../15-boton-de-panico.md). Hoy el botón SOS solo abre el marcador `tel:911` (sin medir).

### RNF-07 — Eficiencia de desempeño (comportamiento temporal)

- **Requisito (Excel):** El sistema deberá cumplir con la presentación de las rutas recomendadas en un máximo de 10 segundos en el 95 % de las solicitudes realizadas con conexión 4G.
- **Prioridad:** Debe tener · **RF asociado:** RF-09 · **Estado:** `Pendiente`
- [ ] **Criterio medible:** Las rutas recomendadas se presentan en ≤ 10 s en el 95 % de las solicitudes con 4G.
- **Evidencia o pendiente:** No medido; depende de [EP-09](../09-rutas-seguras.md) y de un despliegue real.

### RNF-08 — Eficiencia de desempeño (comportamiento temporal)

- **Requisito (Excel):** El sistema deberá cumplir con que el 95 % de las operaciones de consulta y edición de datos se completen en un máximo de 5 segundos con conexión 4G.
- **Prioridad:** Debería tener · **RF asociado:** RF-01, RF-05, RF-12 · **Estado:** `Pendiente`
- [ ] **Criterio medible:** El 95 % de las consultas y ediciones termina en ≤ 5 s con 4G.
- **Evidencia o pendiente:** No medido: solo se probó en local. Requiere una prueba de carga en el despliegue.

### RNF-09 — Fiabilidad (disponibilidad)

- **Requisito (Excel):** El sistema deberá cumplir con una disponibilidad mínima del 99 % mensual, con especial énfasis en las franjas de 05:00 a 07:00 y de 18:00 a 20:00.
- **Prioridad:** Debe tener · **RF asociado:** RF-09, RF-15 · **Estado:** `Pendiente`
- [ ] **Criterio medible:** Disponibilidad mensual ≥ 99 %, con énfasis en 05:00–07:00 y 18:00–20:00.
- **Evidencia o pendiente:** Requiere despliegue y monitoreo; hoy solo hay entorno local.

### RNF-10 — Fiabilidad (capacidad de recuperación)

- **Requisito (Excel):** El sistema deberá cumplir con la generación automática de respaldos diarios de los datos, almacenados fuera del lugar principal y conservados al menos 30 días.
- **Prioridad:** Debería tener · **RF asociado:** Todos los RF · **Estado:** `Pendiente`
- [ ] **Criterio medible:** Respaldo diario fuera del sitio principal, conservado ≥ 30 días.
- **Evidencia o pendiente:** A configurar con el proveedor al desplegar (exportación programada de Firestore).

### RNF-11 — Fiabilidad (capacidad de recuperación)

- **Requisito (Excel):** El sistema deberá cumplir con la restauración del servicio y de los datos en un máximo de 4 horas ante una falla de los servicios de almacenamiento.
- **Prioridad:** Debería tener · **RF asociado:** Todos los RF · **Estado:** `Pendiente`
- [ ] **Criterio medible:** Servicio y datos restaurados en ≤ 4 h tras una falla del almacenamiento.
- **Evidencia o pendiente:** Requiere el procedimiento de restauración probado una vez desplegado.

### RNF-12 — Fiabilidad (tolerancia a fallos)

- **Requisito (Excel):** El sistema deberá cumplir con el registro de entrenamientos sin conexión a internet y con su sincronización automática al recuperar la conexión, sin pérdida de datos.
- **Prioridad:** Debe tener · **RF asociado:** RF-12 · **Estado:** `Pendiente`
- [ ] **Criterio medible:** Un entrenamiento se registra sin conexión y se sincroniza al volver, sin pérdida de datos.
- **Evidencia o pendiente:** Depende de [EP-12](../12-registro-de-entrenamientos.md).

### RNF-13 — Adecuación funcional (corrección funcional)

- **Requisito (Excel):** El sistema deberá cumplir con un error de posicionamiento no mayor a 10 metros en el 90 % de los puntos registrados en espacios abiertos.
- **Prioridad:** Debería tener · **RF asociado:** RF-12 · **Estado:** `Pendiente`
- [ ] **Criterio medible:** Error de posición ≤ 10 m en el 90 % de los puntos en espacios abiertos.
- **Evidencia o pendiente:** Depende de [EP-12](../12-registro-de-entrenamientos.md).

### RNF-14 — Adecuación funcional (corrección funcional)

- **Requisito (Excel):** El sistema deberá cumplir con la actualización del índice de seguridad de una ruta en un máximo de 24 horas luego de validarse un reporte o modificarse un factor de riesgo.
- **Prioridad:** Debería tener · **RF asociado:** RF-07, RF-17 · **Estado:** `Parcial`
- [ ] **Criterio medible:** El índice de seguridad se actualiza ≤ 24 h después de modificarse un factor de riesgo o validarse un reporte.
- **Evidencia o pendiente:** Al cambiar tramos, franjas o factores el servidor recalcula el índice en la misma transacción (inmediato; `backend/tests/test_route_use_cases.py`, `test_route_safety.py`). Falta la parte de reportes validados ([EP-17](../17-reportes-comunitarios.md)).

### RNF-15 — Compatibilidad (interoperabilidad)

- **Requisito (Excel):** El sistema deberá cumplir con el intercambio de datos de mapas y geolocalización con servicios externos mediante interfaces estándar documentadas, sin depender de un único proveedor.
- **Prioridad:** Debe tener · **RF asociado:** RF-05, RF-09 · **Estado:** `Parcial`
- [ ] **Criterio medible:** Mapas y geolocalización por interfaces estándar documentadas, sin depender de un único proveedor.
- **Evidencia o pendiente:** Hoy solo hay un enlace «Abrir en Google Maps» (`frontend/src/app/routes/domain/maps.ts`); las coordenadas se cargan a mano. Falta el puerto `MapProvider` y un proveedor integrado.

### RNF-16 — Compatibilidad (interoperabilidad)

- **Requisito (Excel):** El sistema deberá cumplir con la importación de información de fuentes externas de seguridad y movilidad en formatos estructurados abiertos.
- **Prioridad:** Podría tener · **RF asociado:** RF-08 · **Estado:** `Pendiente`
- [ ] **Criterio medible:** La información de fuentes externas se importa en formatos estructurados abiertos.
- **Evidencia o pendiente:** Depende de [EP-08](../08-incidentes-y-fuentes.md).

### RNF-17 — Capacidad de interacción (operabilidad)

- **Requisito (Excel):** El sistema deberá cumplir con que el botón de pánico sea accesible desde la pantalla principal y durante un entrenamiento en un máximo de 2 toques.
- **Prioridad:** Debe tener · **RF asociado:** RF-15 · **Estado:** `Parcial`
- [ ] **Criterio medible:** El botón de pánico es accesible desde la pantalla principal y durante un entrenamiento en ≤ 2 toques.
- **Evidencia o pendiente:** El botón SOS está en todas las pestañas del corredor y pide una confirmación antes de abrir `tel:911` (2 toques; `frontend/src/app/emergency/emergency-button.spec.ts`). No es todavía la alerta a contactos ([EP-15](../15-boton-de-panico.md)) y no se probó en un celular.

### RNF-18 — Capacidad de interacción (capacidad de aprendizaje)

- **Requisito (Excel):** El sistema deberá cumplir con que un usuario nuevo complete su registro y solicite su primera ruta segura en menos de 5 minutos, con textos en español.
- **Prioridad:** Debería tener · **RF asociado:** RF-01, RF-09 · **Estado:** `Parcial`
- [ ] **Criterio medible:** Un usuario nuevo completa el registro y pide su primera ruta en < 5 min, con textos en español.
- **Evidencia o pendiente:** Textos en español verificados por pruebas de las pantallas; el tiempo de punta a punta no se midió con usuarios.

### RNF-19 — Capacidad de interacción (inclusividad)

- **Requisito (Excel):** El sistema deberá cumplir con criterios de accesibilidad: tamaño de letra ajustable, contraste mínimo de 4,5:1 y botones de al menos 48 dp, para uso por adultos mayores y menores de edad.
- **Prioridad:** Debería tener · **RF asociado:** RF-01 · **Estado:** `Parcial`
- [ ] **Criterio medible:** Tamaño de letra ajustable, contraste ≥ 4,5:1 y botones de ≥ 48 dp.
- **Evidencia o pendiente:** Letra ajustable (preferencia de tamaño), contraste comprobado por `frontend/src/theme/tokens.spec.ts` y objetivo táctil de 48 px en los tokens. No se midió el contraste ni el objetivo táctil de los controles en pantalla real (ver el criterio abierto de [EP-05](../05-catalogo-de-rutas.md) y [EP-07](../07-evaluacion-de-seguridad.md)).

### RNF-20 — Capacidad de interacción (estética de la interfaz)

- **Requisito (Excel):** El sistema deberá cumplir con una visualización legible a la luz del sol y en baja iluminación, ofreciendo modo oscuro, durante el registro de un entrenamiento.
- **Prioridad:** Podría tener · **RF asociado:** RF-01, RF-12 · **Estado:** `Verificado`
- [x] **Criterio medible:** La interfaz ofrece modo oscuro legible, además del claro.
- **Evidencia o pendiente:** Tema oscuro con contraste 4,5:1 comprobado en `frontend/src/theme/tokens.spec.ts`; selector «Según el sistema / Claro / Oscuro» en el panel y preferencia en el área del corredor.

### RNF-21 — Flexibilidad (adaptabilidad)

- **Requisito (Excel):** El sistema deberá cumplir con la compatibilidad con Android 9 o superior e iOS 14 o superior, adaptando su interfaz a distintos tamaños de pantalla de teléfonos móviles.
- **Prioridad:** Debe tener · **RF asociado:** Todos los RF · **Estado:** `Parcial`
- [ ] **Criterio medible:** Compatible con Android 9 o superior e iOS 14 o superior y con distintos tamaños de pantalla.
- **Evidencia o pendiente:** Android: `minSdkVersion` 24 (cubre Android 9+) y APK de depuración compilada; diseño responsivo probado a 360 px. iOS no está incluido (el piloto es Android y web).

### RNF-22 — Mantenibilidad (modularidad)

- **Requisito (Excel):** El sistema deberá cumplir con una estructura modular que permita agregar nuevas ciudades y funcionalidades sin modificar el comportamiento de los módulos existentes.
- **Prioridad:** Debería tener · **RF asociado:** RF-04, RF-11 · **Estado:** `Verificado`
- [x] **Criterio medible:** Se pueden agregar ciudades y funcionalidades sin modificar el comportamiento de los módulos existentes.
- **Evidencia o pendiente:** Las ciudades son datos (CRUD, [EP-04](../04-ciudades-y-zonas.md)) y cada capacidad es una app con capas propias ([Arquitectura](arquitectura.md)); `backend/tests/test_city_use_cases.py`.

### RNF-23 — Mantenibilidad (analizabilidad)

- **Requisito (Excel):** El sistema deberá cumplir con el registro de eventos y errores críticos (fecha, módulo y usuario) durante al menos 90 días, para facilitar el diagnóstico de fallas.
- **Prioridad:** Debería tener · **RF asociado:** Todos los RF · **Estado:** `Pendiente`
- [ ] **Criterio medible:** Eventos y errores críticos (fecha, módulo, usuario) se registran ≥ 90 días.
- **Evidencia o pendiente:** Hoy hay `LOGGING` básico en `backend/config/settings.py`; falta la retención de 90 días con el proveedor al desplegar.

### RNF-24 — Flexibilidad (escalabilidad)

- **Requisito (Excel):** El sistema deberá cumplir con atender al menos 5.000 usuarios concurrentes sin superar los tiempos de respuesta definidos, para soportar su crecimiento desde Loja hacia otras ciudades del país.
- **Prioridad:** Debería tener · **RF asociado:** RF-04, RF-09 · **Estado:** `Pendiente`
- [ ] **Criterio medible:** Soporta ≥ 5.000 usuarios concurrentes sin superar los tiempos definidos.
- **Evidencia o pendiente:** No medido; requiere prueba de carga.

### RNF-25 — Eficiencia de desempeño (utilización de recursos)

- **Requisito (Excel):** El sistema deberá cumplir con un consumo de batería no mayor al 10 % por hora de entrenamiento registrado con GPS activo.
- **Prioridad:** Debería tener · **RF asociado:** RF-12 · **Estado:** `Pendiente`
- [ ] **Criterio medible:** Consumo de batería ≤ 10 % por hora de entrenamiento con GPS activo.
- **Evidencia o pendiente:** Depende de [EP-12](../12-registro-de-entrenamientos.md).

### RNF-26 — Adecuación funcional (pertinencia funcional)

- **Requisito (Excel):** El sistema deberá cumplir con presentar la publicidad solo en los espacios definidos, sin interrumpir el registro del entrenamiento, la consulta de rutas ni el botón de pánico.
- **Prioridad:** Debería tener · **RF asociado:** RF-24 · **Estado:** `Pendiente`
- [ ] **Criterio medible:** La publicidad aparece solo en los espacios definidos, sin interrumpir el entrenamiento, la consulta de rutas ni el botón de pánico.
- **Evidencia o pendiente:** Depende de [EP-24](../24-publicidad.md).

## Supuestos por validar

- Los umbrales (5 s, 10 s, 99 %, 5.000 usuarios) vienen literalmente del Excel; falta definir con Gacelas dónde y cómo se miden (herramienta de carga, entorno de pruebas).
- RNF-21 pide iOS 14+; el Documento de Visión limita el piloto a Android y web, por lo que iOS queda fuera del piloto.
- RNF-17 se cumple en 2 toques solo para el atajo `tel:911` actual; el botón de pánico real se mide cuando exista ([EP-15](../15-boton-de-panico.md)).
