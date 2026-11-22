# Specs de RUNCTY (SDD)

Las specs describen **qué** debe hacer RUNCTY antes de escribir código. Están agrupadas por **capacidad** (una por épica del backlog), no por sprint: cada spec reúne todos los sub-requisitos `RF-XX-N` de su capacidad. Hoy hay 26 specs de capacidad y 4 transversales que cubren los 153 sub-requisitos del backlog: **28 Hecha, 38 Parcial y 87 Pendiente**.

## Flujo SDD en este repositorio

1. **Spec.** Se escribe o ajusta la spec de la capacidad con criterios de aceptación verificables. La spec manda: si el comportamiento cambia, primero cambia la spec.
2. **RED.** De un criterio sale la prueba que falla (pytest en `backend/tests/`, Vitest en `frontend/src/**/*.spec.ts`). Se observa el fallo antes de implementar.
3. **GREEN.** Se implementa lo mínimo hasta que pase y se refactoriza con las pruebas en verde.
4. **Marcar.** Se marca el criterio (`- [x]`) solo con evidencia: una prueba, un commit o una verificación manual documentada.
5. **Evidencia.** Se anota en `odd/tasks/<feature>.md` qué se hizo, el commit y las comprobaciones observadas, y se actualiza el estado de la historia.

Reglas: no se marca un criterio que no se haya observado; si un criterio no se cumple o no se pudo verificar, queda sin marcar y la historia queda `Parcial`; no se deja código ni spec que no se usa (regla de no código zombie de `CONTEXTO.md`).

## Fuentes de verdad

- Requisitos: `D:\Proyecto5to\Docs\RequsitosExcelFInal.xlsx` (hojas Req. Funcionales, MODULOS, UserReq. y Req. No Funcionales). No se modifica.
- Backlog: `D:\Proyecto5to\Docs\BacklogRUNCTY_Final.xlsx` (hoja `BKL-G1`): 26 épicas y 153 historias, una por sub-requisito `RF-XX-N`.
- Contexto del proyecto y decisiones: `CONTEXTO.md` (secciones 6 a 8 requisitos, 11 backlog, 12 estado, 17 arquitectura vigente).

## Leyenda de estados

| Estado | Significado |
| --- | --- |
| `Hecha` | Todos los criterios están marcados y cada uno tiene evidencia (prueba, commit o verificación manual). |
| `Parcial` | Está implementada, pero algún criterio no se cumple, no se pudo verificar (por ejemplo, falta la prueba en navegador o celular) o depende de otra capacidad. |
| `Pendiente` | No está implementada; la spec ya tiene criterios completos para empezar por la prueba que falla. |

## Specs de capacidad

| Spec | Épica | RF cubiertos | Hecha / Parcial / Pendiente | Sprint planificado | Sprint real |
| --- | --- | --- | --- | --- | --- |
| [01-gestion-de-usuarios.md](01-gestion-de-usuarios.md) | EP-01 · Gestión de usuarios | RF-01-1 a RF-01-12 (8) | 1 / 7 / 0 | Sprint 1 (sem. 4) / Sprint 1 (sem. 5) | Sprint 1 (semanas 4–5) |
| [02-roles-y-permisos.md](02-roles-y-permisos.md) | EP-02 · Roles y permisos | RF-02-1 a RF-02-4 (4) | 4 / 0 / 0 | Sprint 1 (sem. 4) | Sprint 1 (semana 4) |
| [03-contactos-de-confianza.md](03-contactos-de-confianza.md) | EP-03 · Contactos de confianza | RF-03-1 a RF-03-4 (4) | 0 / 0 / 4 | Sprint 4 (sem. 9) | Planificada: Sprint 4 (semana 9) |
| [04-ciudades-y-zonas.md](04-ciudades-y-zonas.md) | EP-04 · Ciudades y zonas de operación | RF-04-1 a RF-04-4 (4) | 4 / 0 / 0 | Sprint 1 (sem. 5) | Sprint 1 (semana 5) |
| [05-catalogo-de-rutas.md](05-catalogo-de-rutas.md) | EP-05 · Catálogo de rutas y tramos | RF-05-1 a RF-05-8 (8) | 8 / 0 / 0 | Sprint 2 (sem. 6) | Sprint 2 (semana 6) |
| [06-puntos-de-apoyo.md](06-puntos-de-apoyo.md) | EP-06 · Puntos de apoyo y senderos con resguardo policial | RF-06-1 a RF-06-8 (8) | 0 / 8 / 0 | Sprint 3 (sem. 7) | Sprint 3 (semana 7): backend 2026-11-22; interfaz pendiente |
| [07-evaluacion-de-seguridad.md](07-evaluacion-de-seguridad.md) | EP-07 · Evaluación de seguridad de rutas y zonas de riesgo | RF-07-1 a RF-07-15 (15) | 11 / 4 / 0 | Sprint 2 (sem. 6) / Sprint 3 (sem. 7) | Sprint 2 (semana 6) para RF-07-1 a RF-07-11; Sprint 3 (semana 7) para las alertas de zona RF-07-12 a RF-07-15 (backend y página Alertas del corredor 2026-11-22; administración pendiente) |
| [08-incidentes-y-fuentes.md](08-incidentes-y-fuentes.md) | EP-08 · Incidentes y fuentes de información de seguridad | RF-08-1 a RF-08-8 (8) | 0 / 8 / 0 | Sprint 3 (sem. 7) | Sprint 3 (semana 7): backend 2026-11-22; interfaz pendiente |
| [09-rutas-seguras.md](09-rutas-seguras.md) | EP-09 · Generación de rutas seguras | RF-09-1 a RF-09-3 (3) | 0 / 3 / 0 | Sprint 3 (sem. 7) | Sprint 3 (semana 7): backend 2026-11-22; pantalla del corredor pendiente |
| [10-favoritas-y-valoraciones.md](10-favoritas-y-valoraciones.md) | EP-10 · Rutas favoritas y valoraciones | RF-10-1 a RF-10-7 (7) | 0 / 0 / 7 | Sprint 4 (sem. 9) | Planificada: Sprint 4 (semana 9) |
| [11-rutas-de-clubes.md](11-rutas-de-clubes.md) | EP-11 · Rutas sugeridas por clubes | RF-11-1 a RF-11-4 (4) | 0 / 0 / 4 | Sprint 4 (sem. 9) | Planificada: Sprint 4 (semana 9) |
| [12-registro-de-entrenamientos.md](12-registro-de-entrenamientos.md) | EP-12 · Registro de entrenamientos | RF-12-1 a RF-12-9 (9) | 0 / 0 / 9 | Sprint 4 (sem. 9) / Sprint 5 (sem. 10) | Planificada: Sprint 4 (semana 9) para RF-12-1 a RF-12-6 y Sprint 5 (semana 10) para RF-12-7 a RF-12-9 |
| [13-metas-personales.md](13-metas-personales.md) | EP-13 · Metas personales | RF-13-1 a RF-13-4 (4) | 0 / 0 / 4 | Sprint 5 (sem. 10) | Planificada: Sprint 5 (semana 10) |
| [14-retos-entre-corredores.md](14-retos-entre-corredores.md) | EP-14 · Retos entre corredores | RF-14-1 a RF-14-4 (4) | 0 / 0 / 4 | Sprint 5 (sem. 10) | Planificada: Sprint 5 (semana 10) |
| [15-boton-de-panico.md](15-boton-de-panico.md) | EP-15 · Botón de pánico | RF-15-1 a RF-15-4 (4) | 0 / 0 / 4 | Sprint 4 (sem. 9) | Planificada: Sprint 4 (semana 9) |
| [16-ubicacion-compartida.md](16-ubicacion-compartida.md) | EP-16 · Ubicación compartida en tiempo real | RF-16-1 a RF-16-4 (4) | 0 / 0 / 4 | Sprint 4 (sem. 9) | Planificada: Sprint 4 (semana 9) |
| [17-reportes-comunitarios.md](17-reportes-comunitarios.md) | EP-17 · Reportes comunitarios | RF-17-1 a RF-17-7 (7) | 0 / 0 / 7 | Sprint 5 (sem. 10) | Planificada: Sprint 5 (semana 10) |
| [18-notificaciones.md](18-notificaciones.md) | EP-18 · Notificaciones | RF-18-1 a RF-18-4 (4) | 0 / 0 / 4 | Sprint 5 (sem. 10) | Planificada: Sprint 5 (semana 10) |
| [19-clubes-y-membresias.md](19-clubes-y-membresias.md) | EP-19 · Clubes de running y membresías | RF-19-1 a RF-19-8 (8) | 0 / 0 / 8 | Sprint 5 (sem. 10) | Planificada: Sprint 5 (semana 10) |
| [20-puntos-de-encuentro.md](20-puntos-de-encuentro.md) | EP-20 · Puntos de encuentro | RF-20-1 a RF-20-4 (4) | 0 / 0 / 4 | Sprint 5 (sem. 10) | Planificada: Sprint 5 (semana 10) |
| [21-salidas-grupales.md](21-salidas-grupales.md) | EP-21 · Salidas grupales | RF-21-1 a RF-21-4 (4) | 0 / 0 / 4 | Sprint 5 (sem. 10) | Planificada: Sprint 5 (semana 10) |
| [22-companeros-para-correr.md](22-companeros-para-correr.md) | EP-22 · Compañeros para correr | RF-22-1 a RF-22-4 (4) | 0 / 0 / 4 | Sprint 5 (sem. 10) | Planificada: Sprint 5 (semana 10) |
| [23-eventos-y-carreras.md](23-eventos-y-carreras.md) | EP-23 · Eventos y carreras | RF-23-1 a RF-23-8 (8) | 0 / 0 / 8 | Sprint 5 (sem. 10) | Planificada: Sprint 5 (semana 10) |
| [24-publicidad.md](24-publicidad.md) | EP-24 · Publicidad: anunciantes y campañas | RF-24-1 a RF-24-8 (8) | 0 / 0 / 8 | Sprint 5 (sem. 10) | Planificada: Sprint 5 (semana 10) |
| [25-autenticacion-y-credenciales.md](25-autenticacion-y-credenciales.md) | EP-25 · Autenticación y credenciales | RF-01-5 a RF-01-8 (4) | 0 / 4 / 0 | Sprint 1 (sem. 4) / Sprint 1 (sem. 5) | Sprint 1 (semanas 4–5) |
| [26-preferencias-de-usuario.md](26-preferencias-de-usuario.md) | EP-26 · Preferencias de usuario | RF-01-13 a RF-01-16 (4) | 0 / 4 / 0 | Sprint 1 (sem. 5) | Sprint 1 (semana 5) |
| **Total** | 26 épicas | 153 | **28 / 38 / 87** | | |

Notas: EP-01, EP-25 y EP-26 comparten los IDs `RF-01-N` (el backlog dividió RF-01 en tres épicas); la numeración de las épicas EP-01 a EP-24 coincide con RF-01 a RF-24. Lo que el producto difiere a propósito (fuera del piloto según el Documento de Visión) está marcado en el campo «Alcance del piloto» de cada spec: [EP-14](14-retos-entre-corredores.md), [EP-15](15-boton-de-panico.md) y [EP-23](23-eventos-y-carreras.md), además de la expansión de [EP-11](11-rutas-de-clubes.md) y [EP-19](19-clubes-y-membresias.md).

## Specs transversales

| Spec | Qué fija |
| --- | --- |
| [Requisitos no funcionales](transversal/rnf-requisitos-no-funcionales.md) | Los 26 RNF con criterio medible y estado de verificación. |
| [Arquitectura](transversal/arquitectura.md) | Estructura `backend/` + `frontend/`, capas, autenticación, permisos y contrato de la API. |
| [Sistema de diseño](transversal/sistema-de-diseno.md) | Paleta blanco, gris y fucsia, tokens, temas, tipografía y reglas de accesibilidad. |
| [Panel de administración](transversal/panel-de-administracion.md) | Estructura del panel, tema, pantalla Resumen y endpoint `GET /admin/summary`. |

## Plan de sprints: planificado frente a real

| Sprint | Semana | Historias planificadas | Hecha | Parcial | Pendiente | Real |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 4–5 | 24 | 9 | 15 | 0 | Implementado entre 2026-11-12 y 2026-11-17 (backend, área del corredor y administración). |
| 2 | 6 | 19 | 19 | 0 | 0 | Implementado entre 2026-11-13 y 2026-11-17; verificado en el navegador el 2026-11-17; accesibilidad medida y corregida el 2026-11-22 (`abbc02c`). |
| 3 | 7 | 23 | 0 | 23 | 0 | Backend completo el 2026-11-22 (`9387ea1`, 974 pruebas del backend en verde); en la interfaz solo existe la página Alertas del corredor. Faltan las pantallas de administración (incidentes, fuentes, puntos de apoyo, senderos con resguardo, alertas) y las del corredor (puntos de apoyo, senderos, solicitud de ruta segura). |
| 4 | 9 | 29 | 0 | 0 | 29 | No iniciado. |
| 5 | 10 | 58 | 0 | 0 | 58 | No iniciado. |

La semana 8 no tiene actividad y la 11 queda fuera de los sprints (calendario del equipo, `CONTEXTO.md` sección 11). La cuenta por sprint usa el sprint asignado a cada historia en el backlog.

## Matriz de trazabilidad RF → spec → estado

| RF | Historia | Spec | Estado |
| --- | --- | --- | --- |
| RF-01-1 | Crear usuario | [EP-01](01-gestion-de-usuarios.md#rf-01-1--crear-usuario) | Parcial |
| RF-01-2 | Leer usuarios | [EP-01](01-gestion-de-usuarios.md#rf-01-2--leer-usuarios) | Hecha |
| RF-01-3 | Actualizar usuario | [EP-01](01-gestion-de-usuarios.md#rf-01-3--actualizar-usuario) | Parcial |
| RF-01-4 | Eliminar usuario | [EP-01](01-gestion-de-usuarios.md#rf-01-4--eliminar-usuario) | Parcial |
| RF-01-5 | Crear credencial de acceso | [EP-25](25-autenticacion-y-credenciales.md#rf-01-5--crear-credencial-de-acceso) | Parcial |
| RF-01-6 | Leer credenciales de acceso (iniciar sesión) | [EP-25](25-autenticacion-y-credenciales.md#rf-01-6--leer-credenciales-de-acceso-iniciar-sesión) | Parcial |
| RF-01-7 | Actualizar credencial de acceso | [EP-25](25-autenticacion-y-credenciales.md#rf-01-7--actualizar-credencial-de-acceso) | Parcial |
| RF-01-8 | Eliminar credencial de acceso | [EP-25](25-autenticacion-y-credenciales.md#rf-01-8--eliminar-credencial-de-acceso) | Parcial |
| RF-01-9 | Crear perfil deportivo | [EP-01](01-gestion-de-usuarios.md#rf-01-9--crear-perfil-deportivo) | Parcial |
| RF-01-10 | Leer perfiles deportivos | [EP-01](01-gestion-de-usuarios.md#rf-01-10--leer-perfiles-deportivos) | Parcial |
| RF-01-11 | Actualizar perfil deportivo | [EP-01](01-gestion-de-usuarios.md#rf-01-11--actualizar-perfil-deportivo) | Parcial |
| RF-01-12 | Eliminar perfil deportivo | [EP-01](01-gestion-de-usuarios.md#rf-01-12--eliminar-perfil-deportivo) | Parcial |
| RF-01-13 | Crear preferencia de usuario | [EP-26](26-preferencias-de-usuario.md#rf-01-13--crear-preferencia-de-usuario) | Parcial |
| RF-01-14 | Leer preferencias de usuario | [EP-26](26-preferencias-de-usuario.md#rf-01-14--leer-preferencias-de-usuario) | Parcial |
| RF-01-15 | Actualizar preferencia de usuario | [EP-26](26-preferencias-de-usuario.md#rf-01-15--actualizar-preferencia-de-usuario) | Parcial |
| RF-01-16 | Eliminar preferencias de usuario (restablecer) | [EP-26](26-preferencias-de-usuario.md#rf-01-16--eliminar-preferencias-de-usuario-restablecer) | Parcial |
| RF-02-1 | Crear rol de usuario | [EP-02](02-roles-y-permisos.md#rf-02-1--crear-rol-de-usuario) | Hecha |
| RF-02-2 | Leer roles de usuario | [EP-02](02-roles-y-permisos.md#rf-02-2--leer-roles-de-usuario) | Hecha |
| RF-02-3 | Actualizar rol de usuario | [EP-02](02-roles-y-permisos.md#rf-02-3--actualizar-rol-de-usuario) | Hecha |
| RF-02-4 | Eliminar rol de usuario | [EP-02](02-roles-y-permisos.md#rf-02-4--eliminar-rol-de-usuario) | Hecha |
| RF-03-1 | Crear contacto de confianza | [EP-03](03-contactos-de-confianza.md#rf-03-1--crear-contacto-de-confianza) | Pendiente |
| RF-03-2 | Leer contactos de confianza | [EP-03](03-contactos-de-confianza.md#rf-03-2--leer-contactos-de-confianza) | Pendiente |
| RF-03-3 | Actualizar contacto de confianza | [EP-03](03-contactos-de-confianza.md#rf-03-3--actualizar-contacto-de-confianza) | Pendiente |
| RF-03-4 | Eliminar contacto de confianza | [EP-03](03-contactos-de-confianza.md#rf-03-4--eliminar-contacto-de-confianza) | Pendiente |
| RF-04-1 | Crear ciudad o zona de operación | [EP-04](04-ciudades-y-zonas.md#rf-04-1--crear-ciudad-o-zona-de-operación) | Hecha |
| RF-04-2 | Leer ciudades y zonas de operación | [EP-04](04-ciudades-y-zonas.md#rf-04-2--leer-ciudades-y-zonas-de-operación) | Hecha |
| RF-04-3 | Actualizar ciudad o zona de operación | [EP-04](04-ciudades-y-zonas.md#rf-04-3--actualizar-ciudad-o-zona-de-operación) | Hecha |
| RF-04-4 | Eliminar ciudad o zona de operación | [EP-04](04-ciudades-y-zonas.md#rf-04-4--eliminar-ciudad-o-zona-de-operación) | Hecha |
| RF-05-1 | Crear ruta de running | [EP-05](05-catalogo-de-rutas.md#rf-05-1--crear-ruta-de-running) | Hecha |
| RF-05-2 | Leer rutas de running | [EP-05](05-catalogo-de-rutas.md#rf-05-2--leer-rutas-de-running) | Hecha |
| RF-05-3 | Actualizar ruta de running | [EP-05](05-catalogo-de-rutas.md#rf-05-3--actualizar-ruta-de-running) | Hecha |
| RF-05-4 | Eliminar ruta de running | [EP-05](05-catalogo-de-rutas.md#rf-05-4--eliminar-ruta-de-running) | Hecha |
| RF-05-5 | Crear tramo de ruta | [EP-05](05-catalogo-de-rutas.md#rf-05-5--crear-tramo-de-ruta) | Hecha |
| RF-05-6 | Leer tramos de ruta | [EP-05](05-catalogo-de-rutas.md#rf-05-6--leer-tramos-de-ruta) | Hecha |
| RF-05-7 | Actualizar tramo de ruta | [EP-05](05-catalogo-de-rutas.md#rf-05-7--actualizar-tramo-de-ruta) | Hecha |
| RF-05-8 | Eliminar tramo de ruta | [EP-05](05-catalogo-de-rutas.md#rf-05-8--eliminar-tramo-de-ruta) | Hecha |
| RF-06-1 | Crear punto de apoyo | [EP-06](06-puntos-de-apoyo.md#rf-06-1--crear-punto-de-apoyo) | Parcial |
| RF-06-2 | Leer puntos de apoyo | [EP-06](06-puntos-de-apoyo.md#rf-06-2--leer-puntos-de-apoyo) | Parcial |
| RF-06-3 | Actualizar punto de apoyo | [EP-06](06-puntos-de-apoyo.md#rf-06-3--actualizar-punto-de-apoyo) | Parcial |
| RF-06-4 | Eliminar punto de apoyo | [EP-06](06-puntos-de-apoyo.md#rf-06-4--eliminar-punto-de-apoyo) | Parcial |
| RF-06-5 | Crear sendero con resguardo policial | [EP-06](06-puntos-de-apoyo.md#rf-06-5--crear-sendero-con-resguardo-policial) | Parcial |
| RF-06-6 | Leer senderos con resguardo policial | [EP-06](06-puntos-de-apoyo.md#rf-06-6--leer-senderos-con-resguardo-policial) | Parcial |
| RF-06-7 | Actualizar sendero con resguardo policial | [EP-06](06-puntos-de-apoyo.md#rf-06-7--actualizar-sendero-con-resguardo-policial) | Parcial |
| RF-06-8 | Eliminar sendero con resguardo policial | [EP-06](06-puntos-de-apoyo.md#rf-06-8--eliminar-sendero-con-resguardo-policial) | Parcial |
| RF-07-1 | Crear franja horaria | [EP-07](07-evaluacion-de-seguridad.md#rf-07-1--crear-franja-horaria) | Hecha |
| RF-07-2 | Leer franjas horarias | [EP-07](07-evaluacion-de-seguridad.md#rf-07-2--leer-franjas-horarias) | Hecha |
| RF-07-3 | Actualizar franja horaria | [EP-07](07-evaluacion-de-seguridad.md#rf-07-3--actualizar-franja-horaria) | Hecha |
| RF-07-4 | Eliminar franja horaria | [EP-07](07-evaluacion-de-seguridad.md#rf-07-4--eliminar-franja-horaria) | Hecha |
| RF-07-5 | Crear factor de riesgo | [EP-07](07-evaluacion-de-seguridad.md#rf-07-5--crear-factor-de-riesgo) | Hecha |
| RF-07-6 | Leer factores de riesgo | [EP-07](07-evaluacion-de-seguridad.md#rf-07-6--leer-factores-de-riesgo) | Hecha |
| RF-07-7 | Actualizar factor de riesgo | [EP-07](07-evaluacion-de-seguridad.md#rf-07-7--actualizar-factor-de-riesgo) | Hecha |
| RF-07-8 | Eliminar factor de riesgo | [EP-07](07-evaluacion-de-seguridad.md#rf-07-8--eliminar-factor-de-riesgo) | Hecha |
| RF-07-9 | Crear índice de seguridad (calcular) | [EP-07](07-evaluacion-de-seguridad.md#rf-07-9--crear-índice-de-seguridad-calcular) | Hecha |
| RF-07-10 | Leer índices de seguridad | [EP-07](07-evaluacion-de-seguridad.md#rf-07-10--leer-índices-de-seguridad) | Hecha |
| RF-07-11 | Actualizar índice de seguridad (recalcular) | [EP-07](07-evaluacion-de-seguridad.md#rf-07-11--actualizar-índice-de-seguridad-recalcular) | Hecha |
| RF-07-12 | Crear alerta de zona de riesgo | [EP-07](07-evaluacion-de-seguridad.md#rf-07-12--crear-alerta-de-zona-de-riesgo) | Parcial |
| RF-07-13 | Leer alertas de zonas de riesgo | [EP-07](07-evaluacion-de-seguridad.md#rf-07-13--leer-alertas-de-zonas-de-riesgo) | Parcial |
| RF-07-14 | Actualizar alerta de zona de riesgo | [EP-07](07-evaluacion-de-seguridad.md#rf-07-14--actualizar-alerta-de-zona-de-riesgo) | Parcial |
| RF-07-15 | Eliminar alerta de zona de riesgo | [EP-07](07-evaluacion-de-seguridad.md#rf-07-15--eliminar-alerta-de-zona-de-riesgo) | Parcial |
| RF-08-1 | Crear incidente de seguridad | [EP-08](08-incidentes-y-fuentes.md#rf-08-1--crear-incidente-de-seguridad) | Parcial |
| RF-08-2 | Leer incidentes de seguridad | [EP-08](08-incidentes-y-fuentes.md#rf-08-2--leer-incidentes-de-seguridad) | Parcial |
| RF-08-3 | Actualizar incidente de seguridad | [EP-08](08-incidentes-y-fuentes.md#rf-08-3--actualizar-incidente-de-seguridad) | Parcial |
| RF-08-4 | Eliminar incidente de seguridad | [EP-08](08-incidentes-y-fuentes.md#rf-08-4--eliminar-incidente-de-seguridad) | Parcial |
| RF-08-5 | Crear fuente de información | [EP-08](08-incidentes-y-fuentes.md#rf-08-5--crear-fuente-de-información) | Parcial |
| RF-08-6 | Leer fuentes de información | [EP-08](08-incidentes-y-fuentes.md#rf-08-6--leer-fuentes-de-información) | Parcial |
| RF-08-7 | Actualizar fuente de información | [EP-08](08-incidentes-y-fuentes.md#rf-08-7--actualizar-fuente-de-información) | Parcial |
| RF-08-8 | Eliminar fuente de información | [EP-08](08-incidentes-y-fuentes.md#rf-08-8--eliminar-fuente-de-información) | Parcial |
| RF-09-1 | Crear solicitud de ruta segura | [EP-09](09-rutas-seguras.md#rf-09-1--crear-solicitud-de-ruta-segura) | Parcial |
| RF-09-2 | Leer solicitudes de ruta segura | [EP-09](09-rutas-seguras.md#rf-09-2--leer-solicitudes-de-ruta-segura) | Parcial |
| RF-09-3 | Eliminar solicitud de ruta segura | [EP-09](09-rutas-seguras.md#rf-09-3--eliminar-solicitud-de-ruta-segura) | Parcial |
| RF-10-1 | Crear ruta favorita (guardar) | [EP-10](10-favoritas-y-valoraciones.md#rf-10-1--crear-ruta-favorita-guardar) | Pendiente |
| RF-10-2 | Leer rutas favoritas | [EP-10](10-favoritas-y-valoraciones.md#rf-10-2--leer-rutas-favoritas) | Pendiente |
| RF-10-3 | Eliminar ruta favorita | [EP-10](10-favoritas-y-valoraciones.md#rf-10-3--eliminar-ruta-favorita) | Pendiente |
| RF-10-4 | Crear valoración de ruta | [EP-10](10-favoritas-y-valoraciones.md#rf-10-4--crear-valoración-de-ruta) | Pendiente |
| RF-10-5 | Leer valoraciones de ruta | [EP-10](10-favoritas-y-valoraciones.md#rf-10-5--leer-valoraciones-de-ruta) | Pendiente |
| RF-10-6 | Actualizar valoración de ruta | [EP-10](10-favoritas-y-valoraciones.md#rf-10-6--actualizar-valoración-de-ruta) | Pendiente |
| RF-10-7 | Eliminar valoración de ruta | [EP-10](10-favoritas-y-valoraciones.md#rf-10-7--eliminar-valoración-de-ruta) | Pendiente |
| RF-11-1 | Crear ruta sugerida por club | [EP-11](11-rutas-de-clubes.md#rf-11-1--crear-ruta-sugerida-por-club) | Pendiente |
| RF-11-2 | Leer rutas sugeridas por club | [EP-11](11-rutas-de-clubes.md#rf-11-2--leer-rutas-sugeridas-por-club) | Pendiente |
| RF-11-3 | Actualizar ruta sugerida por club | [EP-11](11-rutas-de-clubes.md#rf-11-3--actualizar-ruta-sugerida-por-club) | Pendiente |
| RF-11-4 | Eliminar ruta sugerida por club | [EP-11](11-rutas-de-clubes.md#rf-11-4--eliminar-ruta-sugerida-por-club) | Pendiente |
| RF-12-1 | Crear entrenamiento | [EP-12](12-registro-de-entrenamientos.md#rf-12-1--crear-entrenamiento) | Pendiente |
| RF-12-2 | Leer entrenamientos | [EP-12](12-registro-de-entrenamientos.md#rf-12-2--leer-entrenamientos) | Pendiente |
| RF-12-3 | Actualizar entrenamiento | [EP-12](12-registro-de-entrenamientos.md#rf-12-3--actualizar-entrenamiento) | Pendiente |
| RF-12-4 | Eliminar entrenamiento | [EP-12](12-registro-de-entrenamientos.md#rf-12-4--eliminar-entrenamiento) | Pendiente |
| RF-12-5 | Crear recorrido GPS | [EP-12](12-registro-de-entrenamientos.md#rf-12-5--crear-recorrido-gps) | Pendiente |
| RF-12-6 | Leer recorridos GPS | [EP-12](12-registro-de-entrenamientos.md#rf-12-6--leer-recorridos-gps) | Pendiente |
| RF-12-7 | Eliminar recorrido GPS | [EP-12](12-registro-de-entrenamientos.md#rf-12-7--eliminar-recorrido-gps) | Pendiente |
| RF-12-8 | Crear métricas de entrenamiento | [EP-12](12-registro-de-entrenamientos.md#rf-12-8--crear-métricas-de-entrenamiento) | Pendiente |
| RF-12-9 | Leer métricas de entrenamiento | [EP-12](12-registro-de-entrenamientos.md#rf-12-9--leer-métricas-de-entrenamiento) | Pendiente |
| RF-13-1 | Crear meta personal | [EP-13](13-metas-personales.md#rf-13-1--crear-meta-personal) | Pendiente |
| RF-13-2 | Leer metas personales | [EP-13](13-metas-personales.md#rf-13-2--leer-metas-personales) | Pendiente |
| RF-13-3 | Actualizar meta personal | [EP-13](13-metas-personales.md#rf-13-3--actualizar-meta-personal) | Pendiente |
| RF-13-4 | Eliminar meta personal | [EP-13](13-metas-personales.md#rf-13-4--eliminar-meta-personal) | Pendiente |
| RF-14-1 | Crear reto entre corredores | [EP-14](14-retos-entre-corredores.md#rf-14-1--crear-reto-entre-corredores) | Pendiente |
| RF-14-2 | Leer retos entre corredores | [EP-14](14-retos-entre-corredores.md#rf-14-2--leer-retos-entre-corredores) | Pendiente |
| RF-14-3 | Actualizar reto entre corredores | [EP-14](14-retos-entre-corredores.md#rf-14-3--actualizar-reto-entre-corredores) | Pendiente |
| RF-14-4 | Eliminar reto entre corredores | [EP-14](14-retos-entre-corredores.md#rf-14-4--eliminar-reto-entre-corredores) | Pendiente |
| RF-15-1 | Crear alerta de pánico | [EP-15](15-boton-de-panico.md#rf-15-1--crear-alerta-de-pánico) | Pendiente |
| RF-15-2 | Leer alertas de pánico | [EP-15](15-boton-de-panico.md#rf-15-2--leer-alertas-de-pánico) | Pendiente |
| RF-15-3 | Actualizar estado de alerta de pánico | [EP-15](15-boton-de-panico.md#rf-15-3--actualizar-estado-de-alerta-de-pánico) | Pendiente |
| RF-15-4 | Eliminar alerta de pánico | [EP-15](15-boton-de-panico.md#rf-15-4--eliminar-alerta-de-pánico) | Pendiente |
| RF-16-1 | Crear sesión de ubicación compartida | [EP-16](16-ubicacion-compartida.md#rf-16-1--crear-sesión-de-ubicación-compartida) | Pendiente |
| RF-16-2 | Leer sesiones de ubicación compartida | [EP-16](16-ubicacion-compartida.md#rf-16-2--leer-sesiones-de-ubicación-compartida) | Pendiente |
| RF-16-3 | Actualizar sesión de ubicación compartida | [EP-16](16-ubicacion-compartida.md#rf-16-3--actualizar-sesión-de-ubicación-compartida) | Pendiente |
| RF-16-4 | Eliminar sesión de ubicación compartida | [EP-16](16-ubicacion-compartida.md#rf-16-4--eliminar-sesión-de-ubicación-compartida) | Pendiente |
| RF-17-1 | Crear reporte comunitario | [EP-17](17-reportes-comunitarios.md#rf-17-1--crear-reporte-comunitario) | Pendiente |
| RF-17-2 | Leer reportes comunitarios | [EP-17](17-reportes-comunitarios.md#rf-17-2--leer-reportes-comunitarios) | Pendiente |
| RF-17-3 | Actualizar reporte comunitario | [EP-17](17-reportes-comunitarios.md#rf-17-3--actualizar-reporte-comunitario) | Pendiente |
| RF-17-4 | Eliminar reporte comunitario | [EP-17](17-reportes-comunitarios.md#rf-17-4--eliminar-reporte-comunitario) | Pendiente |
| RF-17-5 | Crear validación de reporte | [EP-17](17-reportes-comunitarios.md#rf-17-5--crear-validación-de-reporte) | Pendiente |
| RF-17-6 | Leer validaciones de reportes | [EP-17](17-reportes-comunitarios.md#rf-17-6--leer-validaciones-de-reportes) | Pendiente |
| RF-17-7 | Actualizar validación de reporte | [EP-17](17-reportes-comunitarios.md#rf-17-7--actualizar-validación-de-reporte) | Pendiente |
| RF-18-1 | Crear notificación | [EP-18](18-notificaciones.md#rf-18-1--crear-notificación) | Pendiente |
| RF-18-2 | Leer notificaciones | [EP-18](18-notificaciones.md#rf-18-2--leer-notificaciones) | Pendiente |
| RF-18-3 | Actualizar notificación | [EP-18](18-notificaciones.md#rf-18-3--actualizar-notificación) | Pendiente |
| RF-18-4 | Eliminar notificación | [EP-18](18-notificaciones.md#rf-18-4--eliminar-notificación) | Pendiente |
| RF-19-1 | Crear club de running | [EP-19](19-clubes-y-membresias.md#rf-19-1--crear-club-de-running) | Pendiente |
| RF-19-2 | Leer clubes de running | [EP-19](19-clubes-y-membresias.md#rf-19-2--leer-clubes-de-running) | Pendiente |
| RF-19-3 | Actualizar club de running | [EP-19](19-clubes-y-membresias.md#rf-19-3--actualizar-club-de-running) | Pendiente |
| RF-19-4 | Eliminar club de running | [EP-19](19-clubes-y-membresias.md#rf-19-4--eliminar-club-de-running) | Pendiente |
| RF-19-5 | Crear membresía de club | [EP-19](19-clubes-y-membresias.md#rf-19-5--crear-membresía-de-club) | Pendiente |
| RF-19-6 | Leer membresías de club | [EP-19](19-clubes-y-membresias.md#rf-19-6--leer-membresías-de-club) | Pendiente |
| RF-19-7 | Actualizar membresía de club | [EP-19](19-clubes-y-membresias.md#rf-19-7--actualizar-membresía-de-club) | Pendiente |
| RF-19-8 | Eliminar membresía de club | [EP-19](19-clubes-y-membresias.md#rf-19-8--eliminar-membresía-de-club) | Pendiente |
| RF-20-1 | Crear punto de encuentro | [EP-20](20-puntos-de-encuentro.md#rf-20-1--crear-punto-de-encuentro) | Pendiente |
| RF-20-2 | Leer puntos de encuentro | [EP-20](20-puntos-de-encuentro.md#rf-20-2--leer-puntos-de-encuentro) | Pendiente |
| RF-20-3 | Actualizar punto de encuentro | [EP-20](20-puntos-de-encuentro.md#rf-20-3--actualizar-punto-de-encuentro) | Pendiente |
| RF-20-4 | Eliminar punto de encuentro | [EP-20](20-puntos-de-encuentro.md#rf-20-4--eliminar-punto-de-encuentro) | Pendiente |
| RF-21-1 | Crear salida grupal | [EP-21](21-salidas-grupales.md#rf-21-1--crear-salida-grupal) | Pendiente |
| RF-21-2 | Leer salidas grupales | [EP-21](21-salidas-grupales.md#rf-21-2--leer-salidas-grupales) | Pendiente |
| RF-21-3 | Actualizar salida grupal | [EP-21](21-salidas-grupales.md#rf-21-3--actualizar-salida-grupal) | Pendiente |
| RF-21-4 | Eliminar salida grupal | [EP-21](21-salidas-grupales.md#rf-21-4--eliminar-salida-grupal) | Pendiente |
| RF-22-1 | Crear solicitud de compañía | [EP-22](22-companeros-para-correr.md#rf-22-1--crear-solicitud-de-compañía) | Pendiente |
| RF-22-2 | Leer solicitudes de compañía | [EP-22](22-companeros-para-correr.md#rf-22-2--leer-solicitudes-de-compañía) | Pendiente |
| RF-22-3 | Actualizar solicitud de compañía | [EP-22](22-companeros-para-correr.md#rf-22-3--actualizar-solicitud-de-compañía) | Pendiente |
| RF-22-4 | Eliminar solicitud de compañía | [EP-22](22-companeros-para-correr.md#rf-22-4--eliminar-solicitud-de-compañía) | Pendiente |
| RF-23-1 | Crear evento o carrera | [EP-23](23-eventos-y-carreras.md#rf-23-1--crear-evento-o-carrera) | Pendiente |
| RF-23-2 | Leer eventos y carreras | [EP-23](23-eventos-y-carreras.md#rf-23-2--leer-eventos-y-carreras) | Pendiente |
| RF-23-3 | Actualizar evento o carrera | [EP-23](23-eventos-y-carreras.md#rf-23-3--actualizar-evento-o-carrera) | Pendiente |
| RF-23-4 | Eliminar evento o carrera | [EP-23](23-eventos-y-carreras.md#rf-23-4--eliminar-evento-o-carrera) | Pendiente |
| RF-23-5 | Crear inscripción a evento | [EP-23](23-eventos-y-carreras.md#rf-23-5--crear-inscripción-a-evento) | Pendiente |
| RF-23-6 | Leer inscripciones a eventos | [EP-23](23-eventos-y-carreras.md#rf-23-6--leer-inscripciones-a-eventos) | Pendiente |
| RF-23-7 | Actualizar inscripción a evento | [EP-23](23-eventos-y-carreras.md#rf-23-7--actualizar-inscripción-a-evento) | Pendiente |
| RF-23-8 | Eliminar inscripción a evento | [EP-23](23-eventos-y-carreras.md#rf-23-8--eliminar-inscripción-a-evento) | Pendiente |
| RF-24-1 | Crear anunciante | [EP-24](24-publicidad.md#rf-24-1--crear-anunciante) | Pendiente |
| RF-24-2 | Leer anunciantes | [EP-24](24-publicidad.md#rf-24-2--leer-anunciantes) | Pendiente |
| RF-24-3 | Actualizar anunciante | [EP-24](24-publicidad.md#rf-24-3--actualizar-anunciante) | Pendiente |
| RF-24-4 | Eliminar anunciante | [EP-24](24-publicidad.md#rf-24-4--eliminar-anunciante) | Pendiente |
| RF-24-5 | Crear campaña publicitaria | [EP-24](24-publicidad.md#rf-24-5--crear-campaña-publicitaria) | Pendiente |
| RF-24-6 | Leer campañas publicitarias | [EP-24](24-publicidad.md#rf-24-6--leer-campañas-publicitarias) | Pendiente |
| RF-24-7 | Actualizar campaña publicitaria | [EP-24](24-publicidad.md#rf-24-7--actualizar-campaña-publicitaria) | Pendiente |
| RF-24-8 | Eliminar campaña publicitaria | [EP-24](24-publicidad.md#rf-24-8--eliminar-campaña-publicitaria) | Pendiente |

## Cómo ver el sistema funcionando

- Backend y emuladores: `docker compose up -d --build` desde la raíz (Docker Desktop encendido). Espera a que `runcty-seed` quede en `Exited (0)`.
- Frontend: desde `frontend/`, `npm start` y abrir http://localhost:4200 (área del corredor) o http://localhost:4200/admin (panel).
- Usuario administrador del emulador: `admin@runcty.dev` / `Admin123!`.
- Comprobaciones: backend desde `backend/` con el entorno `.venv` (`python -m pytest -q`, `ruff check .`, `ruff format --check .`); frontend desde `frontend/` (`npx.cmd ng test --watch=false`, `npx.cmd ng lint`, `npx.cmd ng build`).

## Cómo agregar o cambiar una spec

1. **Ubicar la capacidad.** Cada historia vive en la spec de su épica (`NN-<capacidad>.md`). Una funcionalidad nueva que no encaja en ninguna se discute primero: si es de verdad una capacidad nueva, se agrega la épica al backlog y se crea `NN-<slug>.md` con el número siguiente; si es una restricción que afecta a todas, va a `transversal/`.
2. **Usar el esqueleto.** Título y tabla de datos de la épica; «Propósito», «Alcance» (incluye y no incluye), «Reglas de negocio», «Modelo de datos y contrato de API» (marcado «propuesto» si no está implementado), la tabla de historias y, por cada `### RF-XX-N — título`: historia de usuario, actor, estado con evidencia, entrada–proceso–salida, criterios de aceptación como casillas, y las rutas reales de implementación y pruebas. Cierra con «Dependencias» y «Supuestos por validar».
3. **Criterios verificables.** Cada criterio se puede comprobar con una prueba o una observación concreta. Lo que no sale del Excel, del backlog o de una decisión escrita se marca `(inferido)` y se lista en «Supuestos por validar».
4. **Cambiar primero la spec.** Si cambia el comportamiento, se edita el criterio, se escribe la prueba que falla y recién entonces se cambia el código.
5. **Estado honesto.** Una historia pasa a `Hecha` solo con todos sus criterios marcados; si queda uno abierto es `Parcial`. Se actualizan la tabla de historias de la spec, la fila de la matriz de este índice y los conteos de la tabla de specs.
6. **Rutas reales.** Las rutas de implementación y de pruebas deben existir; los enlaces relativos entre specs no se rompen al renombrar (se corrigen en el mismo cambio).

Los documentos de feature por tarea (`odd/tasks/*.md`) enlazan su spec y guardan la evidencia observada de cada tarea.
