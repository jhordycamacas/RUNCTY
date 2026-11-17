# RF-05-5 — Registrar tramo de ruta

> Spec de Sprint 2 · Épica EP-05 · Debe tener · Estado: **Implementada** (verificación en navegador pendiente de registrar)

## Historia de usuario

Como administrador · Deseo registrar tramo de ruta. Para dividir cada recorrido en segmentos geográficos que puedan evaluarse de manera independiente.

## Requisito (fuente: backlog final)

El sistema deberá permitir crear un tramo de una ruta con sus coordenadas, longitud y orden dentro de la ruta, para poder evaluar la seguridad de cada segmento por separado.

## Criterios de aceptación

- [ ] Desde el detalle de la ruta (`/admin/rutas/:id`), un formulario en línea agrega un tramo con nombre, orden y puntos/longitud según el contrato.
- [ ] Los errores de campo y de la API salen en español.
- [ ] Cancelar con cambios pide confirmación de descarte.
- [ ] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [ ] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [ ] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

## Trazabilidad

- Responsable: Pedro Vargas
- Requisito de usuario: UR-13
- RNF: RNF-08, RNF-15 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Registrar tramo de ruta
- Dependencia: RF-04

## Implementación

- `frontend/src/app/admin/routes/presentation/segments-section.ts`
- `frontend/src/app/admin/routes/domain/segment-form.ts`
- `frontend/src/app/admin/routes/application/route-detail.store.ts`

## Pruebas

- `frontend/src/app/admin/routes/domain/segment-form.spec.ts`
- `frontend/src/app/admin/routes/application/route-detail.store.spec.ts`
- `frontend/src/app/admin/routes/presentation/route-detail.page.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/rutas` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
