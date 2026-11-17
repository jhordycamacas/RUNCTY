# RF-05-1 — Registrar ruta de running

> Spec de Sprint 2 · Épica EP-05 · Debe tener · Estado: **Verificada en navegador (2026-11-17)**

## Historia de usuario

Como administrador · Deseo registrar ruta de running. Para disponer de recorridos identificados por distancia, superficie, desnivel y dificultad al recomendar rutas.

## Requisito (fuente: backlog final)

El sistema deberá permitir crear una ruta de running con su nombre, ciudad, punto de inicio y fin, distancia, desnivel, tipo de superficie y dificultad, para incluirla en las recomendaciones.

## Criterios de aceptación

- [x] El formulario `/admin/rutas/nueva` crea una ruta con nombre, ciudad, punto de inicio y fin, distancia, desnivel, superficie, dificultad, descripción y estado activo.
- [x] Una entrada inválida muestra el mensaje del campo en español y no envía nada a la API.
- [x] Al guardar, aparece un aviso de éxito y la lista muestra la ruta nueva.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

## Trazabilidad

- Responsable: Pedro Vargas
- Requisito de usuario: UR-13
- RNF: RNF-08, RNF-15 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Registrar ruta de running
- Dependencia: RF-04

## Implementación

- `frontend/src/app/admin/routes/presentation/route-form.page.ts`
- `frontend/src/app/admin/routes/domain/route-form.ts`
- `frontend/src/app/admin/routes/infrastructure/http-route-admin.repository.ts`
- `backend/apps/routes/presentation/views.py`

## Pruebas

- `frontend/src/app/admin/routes/domain/route-form.spec.ts`
- `frontend/src/app/admin/routes/presentation/route-form.page.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/rutas` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
