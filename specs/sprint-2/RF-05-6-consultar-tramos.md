# RF-05-6 — Consultar tramos de ruta

> Spec de Sprint 2 · Épica EP-05 · Debe tener · Estado: **Implementada** (verificación en navegador pendiente de registrar)

## Historia de usuario

Como administrador · Deseo consultar tramos de ruta. Para revisar los segmentos en orden y conocer cómo se compone cada ruta.

## Requisito (fuente: backlog final)

El sistema deberá permitir leer los tramos que componen una ruta junto a su orden, para ver el recorrido segmento por segmento y su nivel de seguridad.

## Criterios de aceptación

- [ ] El detalle lista los tramos en orden, cada uno con su nivel de seguridad por franja ("Sin evaluar" si la API no tiene valor).
- [ ] Los tramos se muestran junto al resumen de la ruta con su nivel por franja.
- [ ] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [ ] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [ ] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

## Trazabilidad

- Responsable: Pedro Vargas
- Requisito de usuario: UR-13
- RNF: RNF-08, RNF-15 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Consultar tramos de ruta
- Dependencia: RF-04

## Implementación

- `frontend/src/app/admin/routes/presentation/segments-section.ts`
- `frontend/src/app/admin/routes/presentation/route-detail.page.ts`
- `frontend/src/app/admin/routes/domain/slot-safety.ts`

## Pruebas

- `frontend/src/app/admin/routes/presentation/route-detail.page.spec.ts`
- `frontend/src/app/admin/routes/domain/slot-safety.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/rutas` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
