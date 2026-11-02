# Feature: Base del proyecto + Sprint 1

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
| T5 | Preferencias CRUD + restablecer, aplicadas al tema (modo oscuro, tamaño de letra) | delegada | [ ] |
| T6 | Panel admin Next.js: login admin, usuarios con filtros, CRUD de roles, asignación de rol | delegada | [ ] |
| T7 | Ciudades y zonas: CRUD en admin, selector en registro, borrado protegido | delegada | [ ] |

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

### T4 — Cuenta y perfil deportivo (commit `feat(account): add profile editing, account deletion and sport profile`)

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

## Siguiente paso

T5 (preferencias CRUD + restablecer, aplicadas al tema).
