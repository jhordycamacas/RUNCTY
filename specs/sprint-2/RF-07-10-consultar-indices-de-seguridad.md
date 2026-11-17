# RF-07-10 — Consultar índices de seguridad

> Spec de Sprint 2 · Épica EP-07 · Debe tener · Estado: **Verificada en navegador (2026-11-17)**

## Historia de usuario

Como corredor o administrador · Deseo consultar índices de seguridad. Para comparar niveles alto, medio o bajo del índice registrado sin asumir seguridad absoluta.

## Requisito (fuente: backlog final)

El sistema deberá permitir leer el índice de seguridad de una ruta o tramo según el horario, mostrando su nivel alto, medio o bajo.

## Criterios de aceptación

- [x] El detalle muestra un resumen de seguridad: por franja, el nivel de la ruta, el puntaje, el "Tramo más expuesto" y los factores que lo explican.
- [x] El corredor ve el nivel de seguridad en el catálogo y en el detalle de ruta (área del corredor).
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

## Trazabilidad

- Responsable: Jhordy Camacas
- Requisito de usuario: UR-05, UR-06, UR-13
- RNF: RNF-14 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Consultar índice de seguridad
- Dependencia: RF-05, RF-17

## Implementación

- `frontend/src/app/admin/routes/presentation/safety-summary-section.ts`
- `frontend/src/app/admin/routes/domain/slot-safety.ts`

## Pruebas

- `frontend/src/app/admin/routes/presentation/safety-summary-section.spec.ts`
- `frontend/src/app/admin/routes/domain/slot-safety.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/rutas` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
