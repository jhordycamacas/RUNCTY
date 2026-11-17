# RF-07-6 — Consultar factores de riesgo

> Spec de Sprint 2 · Épica EP-07 · Debe tener · Estado: **Implementada** (verificación en navegador pendiente de registrar)

## Historia de usuario

Como administrador · Deseo consultar factores de riesgo. Para identificar qué riesgos se han registrado en un segmento y cuándo se presentan.

## Requisito (fuente: backlog final)

El sistema deberá permitir leer los factores de riesgo asociados a un tramo y los horarios en que se presentan.

## Criterios de aceptación

- [ ] Cada tramo lista sus factores con tipo, "Severidad Baja/Media/Alta", descripción y ventana diaria ("Todo el día" si no tiene).
- [ ] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [ ] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [ ] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

## Trazabilidad

- Responsable: Jhordy Camacas
- Requisito de usuario: UR-05, UR-06, UR-13
- RNF: RNF-14 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Consultar factores de riesgo
- Dependencia: RF-05, RF-17

## Implementación

- `frontend/src/app/admin/routes/presentation/risk-factors-section.ts`

## Pruebas

- `frontend/src/app/admin/routes/presentation/risk-factors-section.spec.ts`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/rutas` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
