# ADM-4 — Sistema visual del panel y del área del corredor

> Spec de apoyo · Estado: **Implementada**

## Historia de usuario

Como administrador · Deseo un panel con aspecto de administración web de verdad, sobrio y con la identidad de Gacelas. Para trabajar a gusto y que el producto represente al club.

## Dirección

Paleta única: **blanco, grises y el fucsia de Gacelas** (`#D6006F`). El fucsia es el color de acción y de énfasis (botones, navegación activa, foco, serie principal de los gráficos); no se usa como fondo. Los únicos colores adicionales son los de **significado**: Alto (verde), Medio (ámbar) y Bajo (rojo verdadero, distinto del fucsia).

Estructura de administración convencional: barra lateral gris a toda la altura, pegada al borde izquierdo, con borde derecho de 1 px, marca arriba, navegación agrupada y cuenta fija abajo; barra superior blanca con borde inferior (título a la izquierda; tema y cuenta a la derecha); contenido sobre un fondo gris muy claro con tarjetas blancas de borde fino y radios de 6 a 10 px; listas densas con filas separadas por líneas finas y resaltado al pasar el cursor; anillo de foco visible. Por debajo de 768 px la barra lateral se pliega en el menú de Ionic y el tema y «Cerrar sesión» pasan al menú.

## Paleta

| Rol | Claro | Oscuro |
| --- | --- | --- |
| Página / tarjeta / superficie | `#FFFFFF` / `#FFFFFF` / `#F4F5F7` | `#0F1115` / `#1E222B` / `#171A21` |
| Fondo del contenido del panel | `#F6F7F9` | `#0F1115` |
| Barra lateral | `#E5E7EB` | `#1F2329` |
| Borde / borde de control | `#E3E5EA` / `#6B7280` | `#2A2F3A` / `#8A92A0` |
| Texto / texto atenuado | `#101218` / `#5A606B` | `#F4F5F7` / `#A8AEBA` |
| Acción (relleno) / texto de acento | `#D6006F` / `#C0005C` | `#D6006F` / `#FF5CA8` |
| Serie de gráficos (tras el fucsia) | `#14161C`, `#8A919E`, `#4B5563`, `#E8559F` | `#F4F5F7`, `#7C8493`, `#B4BAC6`, `#FF5CA8` |
| Niveles Alto / Medio / Bajo | `#1B7A3A` / `#8A5300` / `#C62828` | `#5FD38A` / `#FFB74D` / `#FF6B6B` |

## Criterios de aceptación

- [x] La página y las tarjetas del tema claro son blancas; el fondo del contenido del panel es gris `#F6F7F9` solo para que destaquen las tarjetas; no hay tintes rosados ni colores de acento distintos de fucsia, grises y los niveles (`tokens.spec.ts`).
- [x] Todo par texto/superficie cumple 4,5:1 en claro y oscuro, incluido el texto sobre la barra lateral y sobre el fondo del contenido; los colores de gráficos y de nivel se ven a 3:1 sobre la tarjeta; el texto blanco de la navegación activa cumple 4,5:1 sobre el fucsia.
- [x] Barra lateral gris pegada a los bordes (sin tarjeta flotante) con borde derecho, marca, grupo de navegación, elemento activo fucsia y cuenta fija abajo.
- [x] Barra superior blanca con título y, a la derecha, selector «Tema», usuario y «Cerrar sesión».
- [x] Tarjetas del Resumen blancas con icono en chip gris (fucsia para el énfasis); gráficos en fucsia y escala de grises.
- [x] Usuarios, Roles, Ciudades y Rutas se leen como listas densas (contenedor con borde, filas con línea fina y hover); los filtros van en una tarjeta con borde.
- [x] «Bajo» usa un rojo propio, no el fucsia.
- [x] Resumen, Usuarios, Roles, Ciudades, Rutas (lista, detalle y formulario), inicio de sesión y el inicio del corredor (`/app`) siguen el mismo sistema en claro y oscuro, sin scroll horizontal a 360 px.
- [x] El tema por defecto es Claro y el selector «Tema» sigue funcionando.
- [x] El paquete inicial sigue por debajo de 1,2 MB (`ng build` sin avisos de presupuesto).

## Implementación

- `frontend/src/theme/*`, `frontend/src/styles.scss`
- `frontend/src/app/admin/admin-shell.ts` y las tarjetas de `frontend/src/app/admin/summary/`

## Pruebas

- `frontend/src/theme/tokens.spec.ts`
