# RF-07-9 — Calcular el índice de seguridad de cada tramo por franja horaria

> Spec de Sprint 2 · Épica EP-07 · Debe tener · Estado: **Verificada en navegador (2026-11-17)**

## Historia de usuario

Como sistema · Deseo calcular el índice de seguridad de cada tramo por franja horaria. Para obtener una valoración de las condiciones de una ruta por tramo y horario con base en datos disponibles.

## Requisito (fuente: backlog final)

El sistema deberá permitir crear (calcular) el índice de seguridad de una ruta o tramo por franja horaria, a partir de los factores de riesgo y de los reportes validados.

## Criterios de aceptación

- [x] El servidor calcula el índice por tramo y franja: parte de 100 puntos y cada factor activo en la franja resta 10 (severidad baja), 20 (media) o 35 (alta).
- [x] Niveles: Alto ≥ 70, Medio 40–69, Bajo < 40. La ruta toma el nivel de su peor tramo.
- [x] El cliente nunca calcula el índice: lo lee de `GET /routes/{id}`.
- [x] Requiere el permiso `routes.manage`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español y nunca llama a una ruta "segura" o "insegura": muestra el nivel (Alto, Medio, Bajo) por franja con los factores que lo explican.
- [x] Un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [ ] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas.

## Trazabilidad

- Responsable: Jhordy Camacas
- Requisito de usuario: UR-05, UR-06, UR-13
- RNF: RNF-14 (transversales: RNF-10, RNF-11, RNF-21, RNF-23)
- Caso de uso: Calcular índice de seguridad
- Dependencia: RF-05, RF-17

## Implementación

- `backend/apps/routes/domain/safety.py`
- `backend/apps/routes/application/use_cases.py`
- `frontend/src/app/admin/routes/domain/mappers.ts`

## Pruebas

- `frontend/src/app/admin/routes/domain/mappers.spec.ts`
- `backend/tests (pruebas del cálculo en la app routes)`

## Verificación manual (navegador)

1. Levantar el stack (ver `specs/README.md`) e iniciar sesión como `admin@runcty.dev`.
2. Recorrer los criterios de arriba en `/admin/rutas` y marcar cada casilla.
3. Repetir en un ancho de unos 360 px.
