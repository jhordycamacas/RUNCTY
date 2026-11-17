# RF-04-1 — Registrar ciudad o zona de operación

> Spec de Sprint 1 · Épica EP-04 · Debe tener · Estado: **Pendiente**

## Historia de usuario

Como administrador · Deseo registrar ciudad o zona de operación. Para incorporar áreas geográficas a la plataforma e indicar si cuentan con cobertura operativa.

## Requisito (fuente: backlog final)

El sistema deberá permitir crear una ciudad o zona de operación con su ubicación geográfica y estado de cobertura, para habilitar la plataforma en nuevas ciudades además de Loja.

## Criterios de aceptación

- [ ] El formulario `/admin/ciudades/nueva` crea una ciudad o una zona con tipo, identificador (minúsculas, números y `-`, 2 a 64 caracteres), nombre, provincia, ubicación (latitud y longitud) y cobertura (activa, planificada o suspendida).
- [ ] Una zona exige elegir la ciudad a la que pertenece; una ciudad no envía ciudad padre.
- [ ] Una entrada inválida muestra el mensaje del campo en español y no envía nada a la API (latitud de -90 a 90, longitud de -180 a 180).
- [ ] Al guardar aparece un aviso de éxito y la lista muestra la ciudad o zona nueva.
- [ ] Los códigos `city-exists` e `invalid-parent-city` se muestran en español dentro del formulario sin perder lo escrito.
- [ ] Salir del formulario con cambios sin guardar pide confirmación.
- [ ] Requiere el permiso `cities.manage`; sin él la pantalla no es accesible.
- [ ] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

## Trazabilidad

- Responsable: Pedro Vargas
- Requisito de usuario: UR-01
- RNF: RNF-22, RNF-24 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Registrar ciudad o zona de operación
- Dependencia: N/A

## Implementación

- `frontend/src/app/admin/cities/presentation/cities-admin.page.ts`
- `frontend/src/app/admin/cities/application/admin-cities.store.ts`
- `frontend/src/app/admin/cities/domain/managed-city.ts`
- `frontend/src/app/admin/cities/infrastructure/http-city-admin.repository.ts`
- `frontend/src/app/admin/cities/presentation/city-form.page.ts`
- `frontend/src/app/admin/cities/domain/city-form.ts`
- `backend/apps/cities/presentation/views.py`

## Pruebas

- `frontend/src/app/admin/cities/domain/city-form.spec.ts`
- `frontend/src/app/admin/cities/infrastructure/http-city-admin.repository.spec.ts`
- `frontend/src/app/admin/cities/application/admin-cities.store.spec.ts`
- `frontend/src/app/admin/cities/presentation/cities-admin.page.spec.ts`
- `frontend/src/app/admin/cities/presentation/city-form.page.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/ciudades` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
