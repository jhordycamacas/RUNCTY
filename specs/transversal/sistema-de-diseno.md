# Sistema de diseño

> Spec transversal · Estado: **Hecha** (verificada en el navegador el 2026-11-17; contrastes comprobados por `tokens.spec.ts`)

Define la identidad visual de RUNCTY para las dos áreas del frontend único: el área del corredor (`/app`, móvil primero) y el panel de administración (`/admin`, escritorio primero). El panel concreto está en [Panel de administración](panel-de-administracion.md); las reglas de accesibilidad vienen de [RNF-19 y RNF-20](rnf-requisitos-no-funcionales.md).

## Propósito

Una sola paleta, una sola tipografía y un solo conjunto de tokens, para que web y Android se vean como el mismo producto y los componentes nunca dependan de colores sueltos.

## Dirección

Paleta única: **blanco, grises y el fucsia de Gacelas** (`#D6006F`). El fucsia es el color de acción y de énfasis (botones, navegación activa, foco, serie principal de los gráficos); no se usa como fondo. Los únicos colores adicionales son los de **significado**: Alto (verde), Medio (ámbar) y Bajo (rojo verdadero, distinto del fucsia).

Estructura de administración convencional: barra lateral gris a toda la altura, pegada al borde izquierdo, con borde derecho de 1 px, marca arriba, navegación agrupada y cuenta fija abajo; barra superior blanca con borde inferior (título a la izquierda; tema y cuenta a la derecha); contenido sobre un fondo gris muy claro con tarjetas blancas de borde fino y radios de 6 a 10 px; listas densas con filas separadas por líneas finas y resaltado al pasar el cursor; anillo de foco visible. Por debajo de 768 px la barra lateral se pliega en el menú de Ionic y el tema y «Cerrar sesión» pasan al menú.

## Tokens

- Los componentes **solo leen variables semánticas** `--rc-*` (fondo, superficie, borde, texto, acción, estados, series de gráficos, barra lateral); la paleta cruda vive en `frontend/src/theme/_palette.scss` y no se usa fuera de los tokens.
- Tamaños de letra: `--rc-font-size-caption` 0,75 rem, `label` 0,875, `body` 1, `subtitle` 1,125, `title` 1,5 y `display` 2. El área del administrador puede ajustar tamaños y radios (`.area-admin`, `_areas.scss`).
- Espacios: `--rc-space-xs` a `xxl` (4, 8, 12, 16, 24 y 32 px). Radios: `sm` 6 px, `md` 8 px, `lg` 10 px y `pill`.
- Sombras suaves y neutras (`--rc-shadow-sm|md|lg`); objetivo táctil mínimo `--rc-min-touch-target` de 48 px.
- Cada área puede sobrescribir tokens (`.area-runner`, `.area-admin`) sin duplicar componentes.

## Temas

- Tres valores de `data-theme` en `<html>`: `light`, `dark` y `system` (sigue al dispositivo). El tema por defecto es **claro**.
- La apariencia es una preferencia del usuario ([EP-26](../26-preferencias-de-usuario.md)) y se aplica al instante al guardarla.
- El tamaño de letra de la preferencia multiplica el tamaño de la raíz (`--rc-font-scale`: 0,9 / 1 / 1,15 / 1,3), así que todo lo que está en `rem` lo sigue.

## Tipografía

Familia **Plus Jakarta Sans** (Regular, Medium, SemiBold y Bold), servida de forma local desde `frontend/public/fonts/` con respaldo a las fuentes del sistema. Las fuentes en TTF suman unos 1,3 MB al APK; pasarlas a WOFF2 está pendiente (no bloquea).

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

## Reglas de accesibilidad

- Texto normal con contraste mínimo de 4,5:1 sobre su superficie en ambos temas; elementos no textuales (bordes de control, series de gráficos, progreso) con 3:1 (RNF-19).
- El color nunca es la única señal: los niveles de seguridad llevan icono y texto además del color, y los gráficos llevan etiqueta y número.
- Objetivo táctil de 48 px en los controles de pantalla táctil, etiqueta visible o accesible en cada control y anillo de foco visible.
- Sin scroll horizontal de la página a 360 px de ancho.
- Las animaciones respetan `prefers-reduced-motion`.
- El texto de seguridad nunca llama a una ruta «segura» o «insegura»: muestra el nivel Alto, Medio o Bajo con los factores que lo explican.

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

- `frontend/src/theme/_palette.scss`, `_tokens.scss`, `_areas.scss`, `_ionic.scss`, `_fonts.scss`, `_utilities.scss`
- `frontend/src/styles.scss`
- `frontend/src/app/admin/admin-shell.ts` y las tarjetas de `frontend/src/app/admin/summary/`
- `frontend/src/app/shared/ui/` (componentes base)

## Pruebas

- `frontend/src/theme/tokens.spec.ts`

## Supuestos por validar

- La paleta y el diseño siguen sin validarse con el cliente (CONTEXTO, sección 12): la identidad fucsia, blanco y gris es una decisión del equipo.
- El modo oscuro es «Podría tener» (RNF-20); se mantiene porque ya existe y está probado.
