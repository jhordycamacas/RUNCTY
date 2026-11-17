# Specs — Sprints 1 y 2 (SDD)

Cada historia de los Sprints 1 y 2 que toca al administrador tiene su propio documento. **La spec manda**: si el comportamiento cambia, primero se cambia la spec y después el código y las pruebas.

## Flujo SDD en este repositorio

1. Se escribe o ajusta la spec (`specs/sprint-N/RF-XX-N-*.md`) con criterios de aceptación verificables.
2. Se escribe la prueba que falla (RED) a partir de un criterio.
3. Se implementa hasta que pase (GREEN) y se refactoriza.
4. Se marca el criterio en la spec y se anota la evidencia en `odd/tasks/<feature>.md`.

Fuente de verdad de los requisitos: `D:\Proyecto5to\Docs\RequsitosExcelFInal.xlsx`; backlog: `BacklogRUNCTY_Final.xlsx` (hoja `BKL-G1`). Los criterios por pantalla salen de `odd/tasks/admin-routes-sprint2.md` (Sprint 2) y `odd/tasks/admin-users-roles-cities-sprint1.md` (Sprint 1).

## Cómo ver el sprint funcionando

- Backend y emuladores: `docker compose up -d --build` desde la raíz (Docker Desktop encendido). Espera a que `runcty-seed` quede en `Exited (0)`.
- Frontend: desde `frontend/`, `npm start` → http://localhost:4200/admin
- Usuario administrador del emulador: `admin@runcty.dev` / `Admin123!`.

## Índice

| Spec | Historia | Épica |
| --- | --- | --- |
| [RF-01-2](sprint-1/RF-01-2-consultar-usuarios.md) | Consultar los datos de los usuarios autorizados | EP-01 |
| [RF-02-1](sprint-1/RF-02-1-registrar-rol.md) | Registrar rol de usuario | EP-02 |
| [RF-02-2](sprint-1/RF-02-2-consultar-roles.md) | Consultar roles de usuario | EP-02 |
| [RF-02-3](sprint-1/RF-02-3-modificar-rol.md) | Modificar rol de usuario | EP-02 |
| [RF-02-4](sprint-1/RF-02-4-eliminar-rol.md) | Eliminar rol de usuario | EP-02 |
| [RF-04-1](sprint-1/RF-04-1-registrar-ciudad-o-zona.md) | Registrar ciudad o zona de operación | EP-04 |
| [RF-04-2](sprint-1/RF-04-2-consultar-ciudades-y-zonas.md) | Consultar ciudades y zonas de operación | EP-04 |
| [RF-04-3](sprint-1/RF-04-3-modificar-ciudad-o-zona.md) | Modificar ciudad o zona de operación | EP-04 |
| [RF-04-4](sprint-1/RF-04-4-eliminar-ciudad-o-zona.md) | Eliminar ciudad o zona de operación | EP-04 |
| [RF-05-1](sprint-2/RF-05-1-registrar-ruta.md) | Registrar ruta de running | EP-05 |
| [RF-05-2](sprint-2/RF-05-2-consultar-rutas.md) | Consultar rutas de running | EP-05 |
| [RF-05-3](sprint-2/RF-05-3-modificar-ruta.md) | Modificar ruta de running | EP-05 |
| [RF-05-4](sprint-2/RF-05-4-eliminar-ruta.md) | Eliminar ruta de running | EP-05 |
| [RF-05-5](sprint-2/RF-05-5-registrar-tramo.md) | Registrar tramo de ruta | EP-05 |
| [RF-05-6](sprint-2/RF-05-6-consultar-tramos.md) | Consultar tramos de ruta | EP-05 |
| [RF-05-7](sprint-2/RF-05-7-modificar-tramo.md) | Modificar tramo de ruta | EP-05 |
| [RF-05-8](sprint-2/RF-05-8-eliminar-tramo.md) | Eliminar tramo de ruta | EP-05 |
| [RF-07-1](sprint-2/RF-07-1-registrar-franja-horaria.md) | Registrar franja horaria | EP-07 |
| [RF-07-2](sprint-2/RF-07-2-consultar-franjas-horarias.md) | Consultar franjas horarias | EP-07 |
| [RF-07-3](sprint-2/RF-07-3-modificar-franja-horaria.md) | Modificar franja horaria | EP-07 |
| [RF-07-4](sprint-2/RF-07-4-eliminar-franja-horaria.md) | Eliminar franja horaria | EP-07 |
| [RF-07-5](sprint-2/RF-07-5-registrar-factor-de-riesgo.md) | Registrar factor de riesgo | EP-07 |
| [RF-07-6](sprint-2/RF-07-6-consultar-factores-de-riesgo.md) | Consultar factores de riesgo | EP-07 |
| [RF-07-7](sprint-2/RF-07-7-modificar-factor-de-riesgo.md) | Modificar factor de riesgo | EP-07 |
| [RF-07-8](sprint-2/RF-07-8-eliminar-factor-de-riesgo.md) | Eliminar factor de riesgo | EP-07 |
| [RF-07-9](sprint-2/RF-07-9-calcular-indice-de-seguridad.md) | Calcular el índice de seguridad de cada tramo por franja horaria | EP-07 |
| [RF-07-10](sprint-2/RF-07-10-consultar-indices-de-seguridad.md) | Consultar índices de seguridad | EP-07 |
| [RF-07-11](sprint-2/RF-07-11-recalcular-indice-de-seguridad.md) | Recalcular el índice de seguridad cuando cambian sus factores | EP-07 |
