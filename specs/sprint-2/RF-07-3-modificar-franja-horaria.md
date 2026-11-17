# RF-07-3 — Modificar franja horaria

> Spec de Sprint 2 · Épica EP-07 · Debe tener · Estado: **Implementada** (verificación en navegador pendiente de registrar)

## Historia de usuario

Como administrador · Deseo modificar franja horaria. Para corregir franjas que cambiaron de horario o de período de aplicación.

## Requisito (fuente: backlog final)

El sistema deberá permitir actualizar las horas y fechas de aplicación de una franja horaria de entrenamiento.

## Criterios de aceptación

- [ ] Una franja se edita con valores precargados y la regla de no solapamiento también aplica (se excluye la franja editada).
- [ ] Vaciar la etiqueta la borra (la API recibe la clave ausente, no un valor nulo).
- [ ] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [ ] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [ ] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

## Trazabilidad

- Responsable: Jhordy Camacas
- Requisito de usuario: UR-05, UR-06, UR-13
- RNF: RNF-14 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Actualizar franja horaria
- Dependencia: RF-05, RF-17

## Implementación

- `frontend/src/app/admin/routes/presentation/time-slots-section.ts`
- `frontend/src/app/admin/routes/domain/time-slot-form.ts`

## Pruebas

- `frontend/src/app/admin/routes/domain/time-slot-form.spec.ts`
- `frontend/src/app/admin/routes/presentation/time-slots-section.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/rutas` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
