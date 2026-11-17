# Feature: Base del proyecto + Sprint 1

> Specs (SDD): [EP-01 users](../../specs/01-gestion-de-usuarios.md), [EP-02 roles](../../specs/02-roles-y-permisos.md), [EP-04 cities](../../specs/04-ciudades-y-zonas.md), [EP-25 authentication](../../specs/25-autenticacion-y-credenciales.md), [EP-26 preferences](../../specs/26-preferencias-de-usuario.md)

- **Rama:** `feat/foundation-sprint1`
- **Locator:** `odd/tasks/foundation-sprint1.md` · espejo Engram `odd/foundation-sprint1/tasks` (**pendiente**: Engram no disponible en la sesión 2026-11-02).
- **Estrategia de entrega:** `ask-on-risk`. Forecast > 400 líneas autoradas; la estrategia de PR encadenado se pregunta al usuario antes de abrir PRs (push/PR son decisión del usuario).

## Objetivo

Crear la base técnica de RUNCTY (app móvil, panel admin, Cloud Functions, reglas) e implementar las historias del Sprint 1: EP-01, EP-25, EP-26, EP-02, EP-27 y EP-04.

## Por qué

Todas las épicas siguientes dependen de usuarios, roles y ciudades. Seguir el plan de sprints mantiene la trazabilidad con Jira y con el docente.

## Decisiones técnicas (referencia: PilasOe, corrigiendo sus debilidades)

- Tres paquetes npm independientes, sin workspaces: `mobile/` (Expo), `admin/` (Next.js), `functions/` (Gen 2). Config de Firebase en la raíz.
- **Un solo SDK de Firebase** en móvil: el JS SDK (`firebase`), con persistencia de auth vía AsyncStorage. Nada de `@react-native-firebase` por ahora.
- **Un solo sistema de estilos:** `StyleSheet` + tokens de tema propios. Sin NativeWind ni styled-components.
- **Navegación:** react-navigation v7, igual que PilasOe.
- **Roles solo por custom claim** `role` (no `get()` del doc en reglas). El claim lo asignan Cloud Functions, no el cliente.
- **Desarrollo contra emuladores** con project id `demo-runcty`. No se necesitan claves reales hasta desplegar. Las claves reales van en `.env` (gitignored) y se le piden al usuario en ese momento.
- **Firestore rules deny-by-default** y tests de reglas con `@firebase/rules-unit-testing`.
- **Paleta:** blanco `#FFFFFF`, negro `#111111`, rojo suave `#D9534F` (por validar con el usuario).
- **Idioma:** UI en español (RNF); código, identificadores y comentarios en inglés.
- **Accesibilidad:** botones ≥ 48 dp, contraste ≥ 4,5:1, letra escalable.

## Alcance autorizado

Historias del Sprint 1:

- RF-01-1 registrar cuenta (nombres, apellidos, correo, fecha de nacimiento, ciudad, identificación opcional, consentimiento LOPDP)
- RF-01-3 actualizar datos y cambiar contraseña (con verificación de la contraseña actual)
- RF-01-4 eliminar cuenta (borra credenciales, perfil y preferencias)
- RF-01-6 iniciar sesión
- RF-01-7 recuperar contraseña por correo
- RF-01-9 a RF-01-12 CRUD del perfil deportivo (nivel, objetivos, ritmo, distancia preferida)
- RF-01-13 a RF-01-16 CRUD de preferencias (idioma, tamaño de letra, modo oscuro, unidades, notificaciones, privacidad de ubicación) + restablecer
- RF-02-1 a RF-02-4 CRUD de roles con permisos (solo se elimina un rol sin usuarios)
- RF-01-2 administrador consulta usuarios con filtros
- RF-04-1 a RF-04-4 CRUD de ciudades y zonas (ubicación, cobertura; solo se elimina sin rutas asociadas)

Fuera de alcance: épicas de sprints 2–5, despliegue real, consentimiento parental de menores (decisión abierta, sección 10 de CONTEXTO.md).

## Tareas

| ID | Tarea | Ruta | Estado |
| --- | --- | --- | --- |
| T1 | Base: config Firebase raíz, reglas deny-all, emuladores, functions Gen 2, tooling, seed de Loja | delegada (2+ archivos) | [x] |
| T2 | App móvil: Expo + TS, tema y paleta, init Firebase, React Query, navegación, componentes base, Jest | delegada | [x] |
| T3 | Autenticación: registro, login, recuperar contraseña, guard; trigger que asigna rol `runner` | delegada | [x] |
| T4 | Cuenta: actualizar datos, cambiar contraseña, eliminar cuenta (callable), perfil deportivo CRUD | delegada | [x] |
| T5 | Preferencias CRUD + restablecer, aplicadas al tema (modo oscuro, tamaño de letra) | delegada | [x] |
| T6 | Panel admin Next.js: login admin, usuarios con filtros, CRUD de roles, asignación de rol | delegada | [x] |
| T7 | Ciudades y zonas: CRUD en admin, selector en registro, borrado protegido | delegada | [x] |

## Criterios de aceptación

- Cada historia cumple su criterio del backlog y maneja entradas inválidas.
- Typecheck y tests en verde por paquete.
- Reglas de Firestore probadas: un usuario no puede leer ni escribir datos de otro ni asignarse un rol.
- Ningún secreto en git.

## Checks por tarea

- `npm run typecheck` y `npm test` en el paquete tocado.
- Reglas: `npm test` en `functions/` o en la suite de reglas con emulador.

## Progreso y evidencia

### T1 — Base (commit `7b4d361` `chore: scaffold firebase config, rules and functions`)

- Ruta: delegada (writer único; 2+ archivos no triviales).
- Test-first: tests de reglas escritos primero y ejecutados contra reglas deny-all → RED (8 fallos de 16, los casos permitidos). Con `firestore.rules` real → GREEN.
- `npm --prefix functions run build`: OK.
- `npm --prefix functions test`: 1 test OK.
- `npm --prefix functions run test:rules`: 16/16 OK (emulador Firestore).
- `npm run seed` vía `firebase emulators:exec --only auth,firestore`: crea `cities/loja` y `admin@runcty.dev` con claim `role: admin`. Sin variables de emulador, el script se niega a correr (exit 1).
- Versiones: firebase-functions 7.4, firebase-admin 14.5, firebase-tools 15.34, TypeScript 7.0, Vitest 5.

### T2 — App móvil (commit `9b27102` `feat(mobile): scaffold expo app with theme and firebase setup`)

- Ruta: delegada (writer único).
- Expo SDK 58 (React Native 0.88, React 19.3), firebase JS SDK 13, react-navigation 7, React Query 5, Jest 30 + jest-expo.
- Test-first: `contrast.test.ts` y `Button.test.tsx` escritos antes de la implementación → RED (módulo inexistente); luego GREEN.
- Paleta: `#D9534F` sobre blanco da 3,96:1 (no cumple 4,5:1), así que los rellenos de acciones primarias usan `#C9302C` (5,33:1 con texto blanco). `#D9534F` queda como tono de marca para acentos. Lo verifica un test por tema (claro y oscuro).
- `npm --prefix mobile run typecheck`: OK.
- `npm --prefix mobile test`: 22/22 OK.
- `npm --prefix mobile run lint` (`expo lint`, config `eslint-config-expo`): sin errores.
- `npx expo-doctor`: 20/20 checks OK.
- `npx expo export --platform android`: bundle generado (resuelve el alias `@/` y el build RN de `@firebase/auth`).

### T3 — Autenticación (commit `6d54550` `feat(auth): add registration, login and password recovery`)

- Ruta: delegada (writer único; 2+ archivos no triviales en functions, reglas y móvil).
- Functions: `onUserDocCreated` (Gen 2) con lógica pura `assignDefaultRole`/`resolveRoleAssignment`. Asigna el claim `role: runner` sin pisar un rol existente (admin) y después copia el rol al doc (`update`, para no recrear una cuenta borrada). El orden claim → doc permite que la app fuerce `getIdToken(true)` al ver el rol en el doc.
- Reglas: validación de creación de `users/{uid}` (campos requeridos y permitidos, `uid` y `email` del token, sin `role`, consentimiento LOPDP `true`, timestamps de servidor, cédula de 10 dígitos opcional). `cities` pasa a lectura pública (catálogo sin datos personales; el selector de ciudad del registro se usa antes de tener cuenta).
- Móvil: feature `auth` (domain: schemas zod, política de contraseña, fecha de nacimiento con edad 5–110 y `TODO(product)` sobre menores/LOPDP, mapper de errores en español, puertos; application: `registerUser` con rollback, `signIn`, `requestPasswordReset` neutral; infrastructure: adaptadores Firebase; presentation: `SessionProvider`, pantallas Login/Registro/Recuperar). Feature `cities` (lista ciudades `coverage == 'active'`). Navegación: guard con loader, `AuthNavigator` y `AppTabs` (Inicio, Perfil). Átomos nuevos en `core/ui`: `Checkbox`, `ChoiceGroup`, `FormMessage`, `LoadingView`; helpers `core/forms`.
- Test-first:
  - functions: `assignDefaultRole.test.ts` → RED (módulo inexistente) → GREEN.
  - reglas: 4 casos nuevos de creación → RED (4 fallos de 21) → GREEN; lectura pública de ciudades → RED (1 fallo) → GREEN.
  - móvil: `schemas.test.ts`, `authErrors.test.ts`, `authUseCases.test.ts` → RED (módulos inexistentes) → GREEN; `choices.test.tsx` → RED → GREEN.
- `npm --prefix functions run build`: OK.
- `npm --prefix functions test`: 9/9 OK.
- `npm --prefix functions run test:rules`: 21/21 OK.
- `npm --prefix mobile run typecheck`: OK.
- `npm --prefix mobile test`: 65/65 OK.
- `npm --prefix mobile run lint`: sin errores.
- `npx expo export --platform android`: bundle generado (`dist/` borrado).

### T4 — Cuenta y perfil deportivo (commit `68a9b32` `feat(account): add profile editing, account deletion and sport profile`)

- Ruta: delegada (writer único).
- Functions: callable `deleteAccount` (Gen 2 `onCall`). Lógica pura `deleteUserAccount` (borra `users/{uid}` con `recursiveDelete`, después el usuario de Auth; idempotente si Auth ya no existe) e `isRecentSignIn` (exige `auth_time` de hace ≤ 5 min; la app re-autentica antes de llamar).
- Reglas: `update` de `users/{uid}` solo sobre `firstName`, `lastName`, `birthDate`, `cityId`, `idNumber`, `updatedAt` (hora del servidor) y con datos válidos; sin `delete` desde el cliente. `private/sportProfile` validado (nivel, 1–5 objetivos de una lista fija, ritmo 150–1200 s/km, distancia 1–50 km, campos exactos, `updatedAt` del servidor).
- Móvil: feature `account` (RF-01-3 datos personales y cambio de contraseña con re-autenticación; RF-01-4 eliminar cuenta con contraseña + casilla de confirmación → callable → cierre de sesión) y feature `sportProfile` (RF-01-9..12 crear, ver, editar y eliminar con confirmación; ritmo en formato `min:seg`). Pestaña Perfil: datos del usuario y secciones Datos personales, Perfil deportivo, Cambiar contraseña, Cerrar sesión y Eliminar cuenta.
- Test-first:
  - functions: `deleteAccount.test.ts` → RED (módulo inexistente) → GREEN.
  - reglas: 6 casos nuevos (update y perfil deportivo) → RED (6 fallos de 28) → GREEN.
  - móvil: `account/domain/schemas.test.ts`, `account/application/accountUseCases.test.ts`, `sportProfile/domain/sportProfile.test.ts` → RED (módulos inexistentes) → GREEN.
- `npm --prefix functions run build`: OK.
- `npm --prefix functions test`: 15/15 OK.
- `npm --prefix functions run test:rules`: 28/28 OK.
- `npm --prefix mobile run typecheck`: OK.
- `npm --prefix mobile test`: 86/86 OK.
- `npm --prefix mobile run lint`: sin errores.
- `npx expo export --platform android`: bundle generado (`dist/` borrado).
- Sin probar de punta a punta en dispositivo/emulador con el emulador de Functions (solo tests unitarios, de reglas y bundle).

### T5 — Preferencias (commit `d3682f5` `feat(preferences): add user preferences with theme and font scale`)

- Ruta: delegada (writer único).
- Doc `users/{uid}/private/preferences` con claves exactas: `language` (`es`), `fontScale` (`small|normal|large|xlarge` → 0,9/1/1,15/1,3), `appearance` (`system|light|dark`), `units` (`metric|imperial`), `notifications` {`enabled`, `safetyAlerts`, `events`}, `locationPrivacy` (`trustedContactsDuringSession|off`), `updatedAt` del servidor.
- Valores predeterminados en el dominio (`DEFAULT_PREFERENCES`): español, letra normal, apariencia del sistema, km, notificaciones activas, ubicación solo a contactos de confianza durante el entrenamiento. Lectura tolerante (`parsePreferences`): campos faltantes o inválidos toman el valor predeterminado. Sin doc → predeterminados sin escribir; el primer guardado crea el doc; restablecer (RF-01-16) borra el doc tras confirmar.
- Reglas: `private/{docId}` solo acepta escrituras de `sportProfile` y `preferences` (cada uno con su esquema); preferencias con enums, mapa de notificaciones exacto y `updatedAt == request.time`. Lectura y borrado solo del dueño.
- Móvil: feature `preferences` (domain, use cases, repositorio Firestore, caché AsyncStorage por uid `runcty:preferences:{uid}`, `PreferencesThemeProvider`, `PreferencesScreen`). El tema se aplica al abrir la app: primero la caché local, luego Firestore. Sin sesión: apariencia del sistema y letra normal. `ThemeProvider` recibe `appearance` (`resolveColorScheme`, `createTheme`). Átomo nuevo `SwitchRow`; `ChoiceGroup` admite opciones deshabilitadas ("English (próximamente)"). `formatDistance(km, units)` listo para sprints siguientes. Entrada "Preferencias" en Perfil.
- Borrado de cuenta: el callable ya hace `recursiveDelete` de `users/{uid}` (incluye `private/preferences`); sin cambios.
- Test-first:
  - reglas: casos nuevos de preferencias → RED (4 fallos de 34) → GREEN.
  - móvil: `preferences/domain/preferences.test.ts`, `preferences/domain/units.test.ts`, `preferences/application/preferencesUseCases.test.ts`, `core/theme/resolveTheme.test.ts`, `core/ui/SwitchRow.test.tsx` → RED (módulos inexistentes) → GREEN. El caso de opción deshabilitada en `choices.test.tsx` se escribió después del cambio (sin RED observado).
- `npm --prefix functions run test:rules`: 34/34 OK.
- `npm --prefix mobile run typecheck`: OK.
- `npm --prefix mobile test`: 124/124 OK.
- `npm --prefix mobile run lint`: sin errores.
- `npx expo export --platform android`: bundle generado (`dist/` borrado).
- Sin probar en dispositivo/emulador (solo tests unitarios, de reglas y bundle). Las notificaciones solo se guardan (no hay push todavía).

### T6 — Panel admin, usuarios y roles (commit `9580679` `feat(admin): add admin panel with users and roles management`)

- Ruta: delegada (writer único; paquete nuevo + functions + reglas).
- `admin/`: Next.js 16.4 (App Router, `src/`, Tailwind 4 como único sistema de estilos), SDK cliente de Firebase 13 (auth, firestore, functions) con emuladores (`NEXT_PUBLIC_USE_EMULATORS`, `NEXT_PUBLIC_EMULATOR_HOST`), React Query 5, zod 4, Vitest 5. **Sin cuenta de servicio ni firebase-admin.** Carpetas por feature (`auth`, `users`, `roles`, `cities`) con `domain/application/infrastructure/presentation`; las páginas de `src/app` solo montan pantallas. Se quitó del template `README.md`, los SVG de ejemplo, la fuente Geist (descarga en build) y `cacheComponents`; `--no-agents-md` evitó generar `AGENTS.md`/`CLAUDE.md`. `turbopack.root` fijado al paquete (hay lockfile en la raíz). `@types/node` 22 (Vitest 5 lo exige y es el runtime del proyecto).
- Permisos (RF-02): catálogo en `functions/src/roles/permissions.ts` (`admin.access`, `users.read`, `roles.manage`, `cities.manage`, `routes.manage`, `reports.validate`, `ads.manage`, `clubs.manage`); el seed lo reutiliza. Roles del sistema: `runner` (sin permisos), `admin` (todos), `club_rep` (`admin.access`, `routes.manage`, `reports.validate`). Claims `{ role, perms }`; `assignDefaultRole` ahora da `{ role: 'runner', perms: [] }`.
- Callables Gen 2 (lógica pura + envoltorio fino, `DomainError` → `HttpsError` con `details.reason` que el panel traduce): `createRole`, `updateRole` (re-sincroniza claims de los usuarios del rol en lotes de 10), `deleteRole` (rechaza roles del sistema y roles con usuarios, RF-02-4), `setUserRole` (rol existente, claims y luego espejo en el doc; bloqueo: nadie se quita su propio rol admin ni `roles.manage`), `searchUsers` (`users.read`).
- `searchUsers`: filtros exactos (correo, identificación, fecha de nacimiento, ciudad) como igualdades en Firestore; nombres por prefijo sin mayúsculas ni tildes en memoria sobre un escaneo acotado (lotes de 200, máximo 1000 docs por pedido, cursor por id de documento, página ≤ 50). Se eligió en lugar de campos `firstNameLower` porque Firestore no compara sin tildes, evita migrar datos y tocar la app y basta para la escala del piloto. Devuelve solo `uid, email, firstName, lastName, birthDate, cityId, role` (`select()` en la consulta; sin identificación ni consentimiento).
- Reglas: `hasPerm(p)` lee `request.auth.token.perms` (con `admin` como superusuario); lectura de `users` con `users.read`; `roles` legible con sesión y sin escrituras de cliente.
- Panel: `/login` (exige `admin.access`, si no cierra sesión con aviso), layout protegido con menú según permisos, Usuarios (filtros, tabla, "Cargar más", cambio de rol con `roles.manage`), Roles (lista, crear, editar permisos, eliminar con confirmación y error claro).
- Test-first:
  - functions: `permissions.test.ts`, `authz.test.ts`, `roleService.test.ts`, `searchUsers.test.ts` → RED (módulos inexistentes, 4 archivos) → GREEN; `assignDefaultRole.test.ts` ajustado a `perms: []` → RED (3 fallos) → GREEN.
  - reglas: casos de roles (sin escrituras de cliente) y permisos por claim → RED (2 fallos de 38) → GREEN.
  - admin: `permissions.test.ts`, `config.test.ts`, `errorMessages.test.ts`, `userSearch.test.ts`, `role.test.ts` → RED (módulos inexistentes) → GREEN.
- `npm --prefix functions run build`: OK. `typecheck`: OK.
- `npm --prefix functions test`: 55/55 OK.
- `npm --prefix functions run test:rules`: 38/38 OK.
- `npm --prefix admin test`: 22/22 OK; `typecheck`, `lint` y `build` OK.
- Seed dos veces seguidas bajo `firebase emulators:exec --only auth,firestore`: crea `cities/loja`, roles `runner, admin, club_rep` y el admin con `perms` completos (idempotente).
- Prueba de humo con emuladores Auth + Firestore + Functions (script temporal, no versionado): un corredor nuevo recibe `{role:'runner', perms:[]}` y `searchUsers` le responde `permission-denied`; el admin encuentra "Ángela Ordóñez" buscando `angela`/`ORDO`; crear rol, asignarlo, editarlo (`syncedUsers: 1`), borrar rol con usuarios → `role-has-users`, borrar `runner` → `system-role`, quitarse el rol admin → `self-lockout`, borrar rol sin usuarios → OK.
- Sin probar en navegador (solo build, tests y callables contra emuladores).

### T7 — Ciudades y zonas (commit `e06e681` `feat(cities): add city and zone management`)

- Ruta: delegada (writer único).
- Modelo `cities/{id}`: `name`, `province`, `country` (`EC`), `type` (`city|zone`), `parentCityId` (solo zonas), `location {lat,lng}`, `coverage` (`active|planned|suspended`), `createdAt`, `updatedAt`. Ids tipo slug (`loja`, `loja-centro`), sugeridos desde el nombre. El seed de Loja ahora incluye `type: 'city'` y `updatedAt`.
- Reglas: crear/editar con `hasPerm('cities.manage')` y validación de campos (rangos de lat/lng, enums, `country == 'EC'`, timestamps del servidor); `type` y `createdAt` inmutables; una zona apunta a una ciudad existente que no es zona (`exists`/`get` del doc padre: es una validación de datos, no de roles); sin `delete` desde el cliente.
- Callable `deleteCity` (`cities.manage`, lógica pura + envoltorio): rechaza ids inválidos, ciudades inexistentes, con rutas (`routes` donde `cityId == id`; la colección aún no existe, probado con dobles) o con zonas (`parentCityId == id`) (RF-04-4).
- Panel: "Ciudades y zonas" con tabla (zonas bajo su ciudad, insignias de cobertura), formulario de creación/edición con lat/lng (sin mapa todavía), eliminación con confirmación y mensaje claro si está bloqueada. El filtro de ciudad de Usuarios incluye zonas marcadas "(zona)".
- Móvil: el selector del registro y del perfil lista solo ciudades activas, sin zonas (`toPickerCities`, filtro en memoria para no requerir índice compuesto). Tipo `CityCoverage` alineado (`active|planned|suspended`).
- Test-first:
  - functions: `deleteCity.test.ts` → RED (módulo inexistente) → GREEN; `config.test.ts` ajustado por la colección `routes`.
  - reglas: casos de ciudades → RED (3 fallos de 42) → GREEN. Los casos de validación ya pasaban en RED porque la regla anterior negaba todo a quien no era admin; con la regla nueva prueban la validación.
  - admin: `cities/domain/city.test.ts` → RED (módulo inexistente) → GREEN.
  - móvil: `cities/domain/city.test.ts` → RED (`toPickerCities` no existe) → GREEN.
- `npm --prefix functions run build`: OK. `typecheck`: OK.
- `npm --prefix functions test`: 60/60 OK.
- `npm --prefix functions run test:rules`: 42/42 OK.
- `npm --prefix admin test`: 30/30 OK; `typecheck`, `lint` y `build` OK (rutas `/login`, `/usuarios`, `/roles`, `/ciudades`).
- `npm --prefix mobile run typecheck`: OK. `npm --prefix mobile test`: 126/126 OK. `npm --prefix mobile run lint`: sin errores.
- Prueba de humo con emuladores (script temporal, no versionado): seed OK; borrar ciudad con zona → `city-has-zones`; borrado directo desde el cliente → `permission-denied`; borrar zona y luego ciudad → OK; borrar inexistente → `city-not-found`. Los casos de roles de T6 siguen pasando.
- Sin probar en navegador ni en dispositivo.

## Siguiente paso

Sprint 1 completo en la rama. Pendiente del usuario: revisar el panel en el navegador con los emuladores, decidir push y la estrategia de PR (el forecast supera 400 líneas: `ask-on-risk`) y validar la paleta con el cliente.
