# ADM-4 — Sistema visual del panel y del área del corredor

> Spec de apoyo · Estado: **Implementada**

## Historia de usuario

Como administrador · Deseo un panel con aspecto de club de running, sobrio y deportivo. Para trabajar a gusto y que el producto represente al club, no a un estilo pastel.

## Dirección

Fondo blanco, superficies de grises fríos, tinta casi negra y un lateral flotante que **sigue el tema** (panel blanco con borde de 1 px en claro, panel oscuro en oscuro) con la píldora activa en fucsia. El fucsia original de Gacelas (`#D6006F`) es **solo** el color de acción y acento (botones, navegación activa, foco, estados seleccionados); no se usa como fondo. Referencia de tono: club deportivo (Strava, Nike Run Club), no app de bienestar. Radios de 8 a 16 px, números en negrita y microetiquetas en mayúsculas.

## Paleta

| Rol | Claro | Oscuro |
| --- | --- | --- |
| Fondo / superficie / tarjeta | `#FFFFFF` / `#F4F5F7` / `#FFFFFF` | `#0F1115` / `#171A21` / `#1E222B` |
| Borde / borde de control | `#E3E5EA` / `#6B7280` | `#2A2F3A` / `#8A92A0` |
| Texto / texto atenuado | `#101218` / `#5A606B` | `#F4F5F7` / `#A8AEBA` |
| Acción (relleno) / texto de acento | `#D6006F` / `#C0005C` | `#D6006F` / `#FF5CA8` |
| Lateral (superficie elevada) / tarjeta de cuenta | `#FFFFFF` con borde `#E3E5EA` / `#F4F5F7` | `#1E222B` / `#171A21` |
| Color neutro de gráficos | `#7C8493` | `#7C8493` |
| Acentos (azul, naranja, verde azulado) | `#1F6FEB`, `#E8590C`, `#0E9F8E` | `#5B9BFF`, `#FF8A4C`, `#2DD4BF` |
| Niveles Alto / Medio / Bajo | `#1B7A3A` / `#8A5300` / `#C62828` | `#5FD38A` / `#FFB74D` / `#FF6B6B` |

«Bajo» es un rojo verdadero, distinto del fucsia de la marca. Las fichas y tarjetas del Resumen son blancas, con borde de 1 px, sombra muy suave y una barra superior de color (fucsia, azul, naranja, verde azulado o carbón); los íconos van en un chip de color.

## Criterios de aceptación

- [x] El fondo del tema claro es blanco puro y no hay superficies, paneles ni tarjetas teñidos de rosa (`tokens.spec.ts`).
- [x] Todo par texto/superficie cumple 4,5:1 en claro y oscuro; los colores de estado son legibles como texto; los acentos y el relleno de progreso se ven (3:1) sobre la tarjeta; el texto del lateral cumple 4,5:1.
- [x] El lateral sigue el tema: blanco con borde y texto tinta en claro, oscuro con texto claro en oscuro, y la misma píldora activa fucsia con texto blanco; la tarjeta de cuenta es gris neutro (`#F4F5F7`) en claro. Texto del lateral y de la tarjeta a 4,5:1 en ambos temas (`tokens.spec.ts`).
- [x] Los colores de gráficos (fucsia, azul, naranja, verde azulado, carbón, gris y los de nivel) se ven a 3:1 sobre la tarjeta en ambos temas.
- [x] «Bajo» usa un rojo propio, no el fucsia.
- [x] Resumen, Usuarios, Roles, Ciudades, Rutas, inicio de sesión y el inicio del corredor (`/app`) siguen el mismo sistema en claro y oscuro.
- [x] El tema por defecto es Claro y el selector «Tema» sigue funcionando.
- [x] El paquete inicial sigue por debajo de 1,2 MB (`ng build` sin avisos de presupuesto).

## Implementación

- `frontend/src/theme/*`, `frontend/src/styles.scss`
- `frontend/src/app/admin/admin-shell.ts` y las tarjetas de `frontend/src/app/admin/summary/`

## Pruebas

- `frontend/src/theme/tokens.spec.ts`
