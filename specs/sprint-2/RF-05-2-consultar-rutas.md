# RF-05-2 — Consultar rutas de running

> Spec de Sprint 2 · Épica EP-05 · Debe tener · Estado: **Verificada en navegador (2026-11-17)**

## Historia de usuario

Como administrador · Deseo consultar rutas de running. Para encontrar rutas que se ajusten a la ciudad, distancia o dificultad que busco.

## Requisito (fuente: backlog final)

El sistema deberá permitir leer las rutas registradas y sus características, filtrándolas por ciudad, distancia o dificultad, para que el corredor encuentre una acorde a su objetivo.

## Criterios de aceptación

- [x] `/admin/rutas` lista las rutas de la ciudad elegida, incluidas las inactivas, con nombre, distancia, dificultad, estado y nivel de seguridad por franja.
- [x] Permite elegir ciudad o zona (por defecto "Todas las ciudades") y filtrar por texto.
- [x] Existen los estados de carga, vacío y error; el de error ofrece reintentar.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

## Trazabilidad

- Responsable: Pedro Vargas
- Requisito de usuario: UR-13
- RNF: RNF-08, RNF-15 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Consultar rutas de running
- Dependencia: RF-04

## Implementación

- `frontend/src/app/admin/routes/presentation/routes-admin.page.ts`
- `frontend/src/app/admin/routes/application/admin-routes.store.ts`
- `frontend/src/app/admin/routes/domain/route-places.ts`

## Pruebas

- `frontend/src/app/admin/routes/presentation/routes-admin.page.spec.ts`
- `frontend/src/app/admin/routes/application/admin-routes.store.spec.ts`
- `frontend/src/app/admin/routes/domain/route-places.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/rutas` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
