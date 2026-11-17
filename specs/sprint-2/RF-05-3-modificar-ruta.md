# RF-05-3 — Modificar ruta de running

> Spec de Sprint 2 · Épica EP-05 · Debe tener · Estado: **Implementada** (verificación en navegador pendiente de registrar)

## Historia de usuario

Como administrador · Deseo modificar ruta de running. Para corregir características del recorrido y evitar que se consulten datos de una ruta desactualizados.

## Requisito (fuente: backlog final)

El sistema deberá permitir actualizar los datos de una ruta (por ejemplo, distancia, superficie o dificultad), para mantener su información correctamente actualizada.

## Criterios de aceptación

- [ ] El mismo formulario edita una ruta (`/admin/rutas/:id/editar`) con sus valores actuales precargados.
- [ ] Salir con cambios sin guardar pide confirmación.
- [ ] Guardar una ruta de otra ciudad cambia la lista a esa ciudad.
- [ ] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [ ] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [ ] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

## Trazabilidad

- Responsable: Pedro Vargas
- Requisito de usuario: UR-13
- RNF: RNF-08, RNF-15 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Actualizar ruta de running
- Dependencia: RF-04

## Implementación

- `frontend/src/app/admin/routes/presentation/route-form.page.ts`
- `frontend/src/app/admin/routes/application/admin-routes.store.ts`

## Pruebas

- `frontend/src/app/admin/routes/presentation/route-form.page.spec.ts`
- `frontend/src/app/admin/routes/application/admin-routes.store.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/rutas` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
