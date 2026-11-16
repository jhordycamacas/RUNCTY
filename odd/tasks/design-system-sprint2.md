# Feature: sistema de diseño + Sprint 2 (catálogo de rutas y evaluación de seguridad)

- **Rama:** `feat/design-system-sprint2`
- **Locator:** `odd/tasks/design-system-sprint2.md` (espejo Engram `odd/design-system-sprint2/tasks`: **pendiente**, Engram no disponible en la sesión del 2026-11-02)
- **Estrategia de entrega:** `ask-on-risk`. El forecast supera ~400 líneas por mucho (~3.000), así que antes de abrir PRs se define con el usuario si van como cadena (`stacked-to-main` o `feature-branch-chain`). Por ahora: commits por unidad de trabajo en la rama.
- **Revisión RDD:** no aplica en este repo (decisión del usuario).

## Objetivo

1. Que la app móvil se vea profesional: sistema de diseño con tipografía, íconos y componentes reutilizables, aplicado a las pantallas del Sprint 1.
2. Sprint 2: catálogo de rutas y tramos (EP-05 / RF-05) y evaluación de seguridad por franja horaria (EP-07 / RF-07-1 a RF-07-11).

## Por qué

- La app hoy tiene estilos mínimos, sin íconos ni tipografía propia, y no transmite calidad en la presentación a Gacelas.
- Las rutas con su nivel de seguridad por horario son una de las 3 funcionalidades que deben verse el día de la presentación.

## Decisiones (2026-11-02)

- **Índice de seguridad (elegido por el usuario):** cada tramo parte de 100 puntos por franja. Cada factor de riesgo activo en esa franja resta según su severidad: baja −10, media −20, alta −35 (mínimo 0). Niveles: **Alto ≥70, Medio 40–69, Bajo <40**. La ruta toma el nivel de su **peor tramo** por franja. Siempre se muestran los factores que explican el nivel. Nunca se dice "segura" o "insegura".
- **Reportes comunitarios (RF-17):** todavía no existen. El cálculo queda listo para sumarlos como otra fuente de penalización.
- **Mapas:** sin mapa en este sprint, porque se pospone lo de Google. Las coordenadas se ingresan a mano, como en ciudades. El mapa llega después detrás del puerto `MapProvider`.
- **Alertas de zona de riesgo (RF-07-12 a 15):** son del Sprint 3 según el backlog y quedan fuera.

## Alcance autorizado

- Sistema de diseño móvil y rediseño de las pantallas existentes.
- RF-05-1 a RF-05-8: rutas y tramos (CRUD del admin; lectura en la app).
- RF-07-1 a RF-07-11: franjas, factores de riesgo por tramo, cálculo, consulta y recálculo del índice.
- Datos semilla de rutas en Loja para la demo.

## Tareas

| ID | Tarea | Ruta | Estado |
| --- | --- | --- | --- |
| T0 | Configuración de dispositivo Android, ícono de la app y manual (commit `4af2330`) | inline | [x] |
| T1 | Sistema de diseño móvil: fuente, íconos, componentes nuevos, rediseño de Auth, Inicio y Perfil, tabs con íconos | delegada | [x] |
| T2 | Dominio de rutas y cálculo puro del índice de seguridad (functions) con tests | delegada | [x] |
| T3 | Backend de rutas: callables (crear/editar/borrar rutas, tramos, franjas, factores) con recálculo, reglas de Firestore y tests de reglas | delegada | [x] |
| T4 | Panel admin: gestión de rutas, tramos, franjas y factores | delegada | [x] |
| T5 | App móvil: catálogo de rutas con filtros y detalle con tramos y seguridad por franja | delegada | [x] |
| T6 | Seed de rutas de Loja, prueba en dispositivo, CONTEXTO.md y README | inline/delegada | [ ] |

## Criterios de aceptación

- La app usa una tipografía y un set de íconos consistentes, tiene tabs con íconos y sus pantallas cumplen 48 dp, contraste 4,5:1, modo oscuro y escala de fuente.
- El admin puede crear, editar y borrar rutas y tramos (y reordenarlos), además de franjas sin solapamiento y factores de riesgo por tramo.
- Cada cambio en tramos, franjas o factores recalcula el índice de la ruta.
- El corredor ve las rutas de su ciudad filtradas por distancia o dificultad, cada una con su nivel Alto/Medio/Bajo por franja y los factores que lo explican.
- Las reglas de Firestore niegan las escrituras directas de clientes sin permiso `routes.manage`.

## Checks por tarea

- mobile: `npm run typecheck`, `npm test`, `npm run lint`
- functions: `npm run build`, `npm test`, `npm run test:rules` (con emulador)
- admin: `npm run typecheck` (si existe), `npm test`, `npm run build`

## Progreso y evidencia

### T0 — Configuración de dispositivo (commit `4af2330` `chore(mobile): add android device setup, app icon and install guide`)

- Ruta inline. La app compila e instala en un Infinix X678B con `npm run android`. Typecheck de mobile en verde.

### T1 — Sistema de diseño móvil (commit `9e84cb9` `feat(mobile): add design system and redesign sprint 1 screens`)

- Ruta delegada (writer trigger: más de 30 archivos no triviales).
- Dependencias nuevas: `@expo/vector-icons`, `expo-font`, `@expo-google-fonts/inter`, `expo-asset` (peer de expo-font).
- Test-first: los tests de contraste, de AppText, de los 11 componentes nuevos y del helper de franjas se vieron en RED antes de implementar y luego en GREEN.
- mobile: typecheck OK, lint OK, tests 211/211 (antes 126). Re-ejecución del parent: 211/211.
- Pendiente: revisión visual en el dispositivo (los temas claro y oscuro solo se revisaron razonando).

### T2 — Dominio e índice de seguridad (commit `dac9825` `feat(functions): add route domain and safety index calculation`)

- Ruta delegada junto con T3 (un solo escritor para el paquete functions).
- Test-first: los tests de time, safety, reorder e inputs dieron RED porque los módulos no existían; GREEN 75/75. El único fallo en GREEN fue una expectativa mal escrita en el test (80 es nivel alto).
- Hook `extraPenalties` listo para sumar los reportes comunitarios (RF-17).

### T3 — Backend de rutas (commit `9f0d0eb` `feat(functions): add route, segment, time slot and risk factor callables`)

- 12 callables con `routes.manage`. Cada mutación recalcula la seguridad en una transacción. `deleteRoute` usa `recursiveDelete`, que no es atómico.
- Reglas: lectura para usuarios con sesión (los corredores solo ven rutas activas y deben filtrar con `active == true`); escritura `false`.
- functions: build OK, tests 167/167 (107 nuevos); reglas 47/47, corridas contra el emulador activo con `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx vitest run --dir test/rules`. Los tests de reglas se escribieron junto con las reglas, sin RED observado. Re-ejecución del parent: 167/167. No hay lint configurado en functions.
- Ojo: los emuladores que corren hoy salieron del repo viejo y tienen las functions viejas. Para usar los callables nuevos hay que reiniciarlos desde `D:\RUNCTY`.

### T5 — Catálogo de rutas en la app (commit `7f4a2fd` `feat(mobile): add route catalog with safety level per time slot`)

- Ruta delegada (más de 20 archivos no triviales).
- Test-first: los tests de catalog y mappers dieron RED porque los módulos no existían; GREEN 24/24. Los tests de pantallas detectaron un bug real: sin ciudad se mostraban rutas viejas.
- mobile: typecheck OK, lint OK, tests 250/250. Re-ejecución del parent: 250/250. `npm run seed` carga 5 rutas de Loja con niveles alto, medio y bajo según la franja.
- Las franjas se agrupan por ventana horaria (`HH:MM-HH:MM`) porque el id de cada franja cambia según la ruta. La preferencia km/mi todavía no se aplica.

### T4 — Panel admin de rutas (commit `9c0f7c7` `feat(admin): add route management with segments, time slots and risk factors`)

- Ruta delegada.
- Test-first: los tests de dominio (route, segment, schedule) y de mensajes de error dieron RED; GREEN 60/60. Las pantallas no tienen tests, porque el vitest del panel corre solo `.test.ts` en node.
- admin: build OK, typecheck OK (después del build, que genera los tipos de Next), lint OK, tests 60/60. Re-ejecución del parent: 60/60.
- Pendiente: probarlo en el navegador contra emuladores levantados desde `D:\RUNCTY`.

### T6 — Documentación y prueba (parcial)

- Ruta inline. CONTEXTO.md (fase actual, decisión del índice resuelta, estado) y README (app móvil, panel de rutas, estado) actualizados.
- Probado en el dispositivo: el Inicio con el diseño nuevo (captura revisada). El catálogo de rutas llega por recarga de Metro y queda pendiente de revisión visual por el usuario.
- Pendiente: el usuario debe cerrar los emuladores que corren desde el repo viejo (el parent no tiene permiso para matar procesos) y levantarlos desde `D:\RUNCTY` para que el panel use los callables nuevos.

### Arreglos en el dispositivo (commits `89fbfab` y `1f03154`)

- Barra de estado: sigue el tema de la app. Barra de pestañas: la altura depende del tamaño de letra (de la app y del sistema) más el inset inferior; tiene test (`tabBarLayout.test.ts`).
- Sesión muerta (usuario borrado o refresh token inválido): `restoreSessionRole` cierra sesión, y con un error de red sigue offline. Test-first: RED (el módulo no existía) y luego GREEN con 7 tests.
- mobile: 260/260, typecheck y lint OK. El usuario confirmó que la app abre y se ve.
- Emuladores reiniciados desde `D:\RUNCTY` (con permiso del usuario) y seed recargado.

### Diseño original en la app Ionic

- Ruta delegada. Causa raíz: `styles.scss` cargaba `core.css` de Ionic después del tema, y su paleta por defecto (primario azul, danger #c5000f) pisaba los tokens. Ahora Ionic va primero.
- Portado del diseño de la app móvil: botones de 48px con sombra suave, secundarios y fantasma en el rojo legible del esquema, campos rellenos con el tono de superficie y borde de 1.5px, encabezado plano con línea fina, barra de pestañas con línea superior, logo y "Corre más seguro" en las pantallas de acceso, separador "¿No tienes cuenta?" en el login y la acción de borrar cuenta contorneada (nunca un bloque rojo).
- El modo claro u oscuro sigue al sistema, igual que la app vieja.
- frontend: tests 474/474, lint OK, build OK (1.15 MB inicial).

## Siguiente paso

Demo con Gacelas esta semana: pasar a Firebase real (plan en CONTEXTO.md, sección 12). Después, abrir los PRs hacia `main` (dividir la rama, que tiene más de 400 líneas).
