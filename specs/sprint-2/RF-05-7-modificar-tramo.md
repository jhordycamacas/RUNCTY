# RF-05-7 — Modificar tramo de ruta

> Spec de Sprint 2 · Épica EP-05 · Debe tener · Estado: **Verificada en navegador (2026-11-17)**

## Historia de usuario

Como administrador · Deseo modificar tramo de ruta. Para corregir coordenadas, longitudes o el orden de los segmentos de un recorrido.

## Requisito (fuente: backlog final)

El sistema deberá permitir actualizar las coordenadas, la longitud o el orden de un tramo, para corregir el trazado de la ruta.

## Criterios de aceptación

- [x] Un tramo se edita en el mismo formulario en línea, con valores precargados y foco en el encabezado del formulario.
- [x] Los cambios de coordenadas, longitud u orden se guardan y el detalle se recarga.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

## Trazabilidad

- Responsable: Pedro Vargas
- Requisito de usuario: UR-13
- RNF: RNF-08, RNF-15 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Actualizar tramo de ruta
- Dependencia: RF-04

## Implementación

- `frontend/src/app/admin/routes/presentation/segments-section.ts`
- `frontend/src/app/admin/routes/application/route-detail.store.ts`

## Pruebas

- `frontend/src/app/admin/routes/domain/segment-form.spec.ts`
- `frontend/src/app/admin/routes/application/route-detail.store.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/rutas` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
