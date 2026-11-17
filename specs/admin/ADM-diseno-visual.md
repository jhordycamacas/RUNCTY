# ADM-4 — Sistema visual del panel y del área del corredor

> Spec de apoyo · Estado: **En implementación**

## Historia de usuario

Como administrador · Deseo un panel con un diseño más limpio y reconocible de Gacelas Running Team. Para trabajar a gusto y que el producto se vea cuidado.

## Dirección

Referencia: tablero con lienzo suave tintado, barra lateral flotante redondeada, tarjetas blancas con radios amplios y **columnas y fichas en colores pastel**. Marca: magenta Gacelas (acción primaria), negro ciruela y blanco.

## Decisiones

- Los tokens viven en `frontend/src/theme/` y tienen valor claro y oscuro. Se añaden tokens semánticos pastel (rosa, durazno, cielo, lavanda) y un verde azulado de progreso.
- El texto sobre cada pastel usa un token de tinta propio (ciruela oscuro en claro; claro sobre pasteles oscuros en el tema oscuro).
- Tipografía Plus Jakarta Sans incluida en el paquete (sin red en ejecución).
- Componentes de gráficos propios, sin librería: ficha KPI, barras, barra apilada, barra de progreso y barras semanales.

## Criterios de aceptación

- [ ] Todo par texto/superficie del tema cumple 4,5:1 en claro y oscuro (`frontend/src/theme/tokens.spec.ts`), incluida la tinta sobre cada pastel.
- [ ] Barra lateral flotante, barra superior con título, buscador discreto y perfil; chips en forma de píldora.
- [ ] Resumen, Usuarios, Roles, Ciudades, Rutas y el inicio del corredor (`/app`, 390 px) se ven coherentes en claro y oscuro.
- [ ] El tema por defecto es Claro y el selector «Tema» sigue funcionando.
- [ ] El paquete inicial sigue por debajo de 1,2 MB (`ng build` sin avisos de presupuesto).

## Implementación

- `frontend/src/theme/*`, `frontend/src/styles.scss`
- `frontend/src/app/admin/admin-shell.ts` y componentes de `frontend/src/app/shared/ui/`

## Pruebas

- `frontend/src/theme/tokens.spec.ts`
