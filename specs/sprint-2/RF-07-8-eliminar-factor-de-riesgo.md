# RF-07-8 — Eliminar factor de riesgo

> Spec de Sprint 2 · Épica EP-07 · Debe tener · Estado: **Verificada en navegador (2026-11-17)**

## Historia de usuario

Como administrador · Deseo eliminar factor de riesgo. Para dejar de considerar condiciones de riesgo que ya no existen o fueron registradas por error.

## Requisito (fuente: backlog final)

El sistema deberá permitir eliminar un factor de riesgo registrado en un tramo cuando deje de aplicar o haya sido ingresado por error.

## Criterios de aceptación

- [x] Eliminar un factor pide confirmación (botón destructivo).
- [x] Al eliminarse, el nivel de seguridad se recalcula y el detalle lo refleja.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

## Trazabilidad

- Responsable: Jhordy Camacas
- Requisito de usuario: UR-05, UR-06, UR-13
- RNF: RNF-14 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Eliminar factor de riesgo
- Dependencia: RF-05, RF-17

## Implementación

- `frontend/src/app/admin/routes/presentation/risk-factors-section.ts`
- `frontend/src/app/admin/routes/application/route-detail.store.ts`

## Pruebas

- `frontend/src/app/admin/routes/presentation/risk-factors-section.spec.ts`
- `frontend/src/app/admin/routes/application/route-detail.store.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/rutas` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
