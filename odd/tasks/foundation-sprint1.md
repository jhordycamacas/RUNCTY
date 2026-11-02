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
| T2 | App móvil: Expo + TS, tema y paleta, init Firebase, React Query, navegación, componentes base, Jest | delegada | [ ] |
| T3 | Autenticación: registro, login, recuperar contraseña, guard; trigger que asigna rol `runner` | delegada | [ ] |
| T4 | Cuenta: actualizar datos, cambiar contraseña, eliminar cuenta (callable), perfil deportivo CRUD | delegada | [ ] |
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

### T1 — Base (commit `chore: scaffold firebase config, rules and functions`)

- Ruta: delegada (writer único; 2+ archivos no triviales).
- Test-first: tests de reglas escritos primero y ejecutados contra reglas deny-all → RED (8 fallos de 16, los casos permitidos). Con `firestore.rules` real → GREEN.
- `npm --prefix functions run build`: OK.
- `npm --prefix functions test`: 1 test OK.
- `npm --prefix functions run test:rules`: 16/16 OK (emulador Firestore).
- `npm run seed` vía `firebase emulators:exec --only auth,firestore`: crea `cities/loja` y `admin@runcty.dev` con claim `role: admin`. Sin variables de emulador, el script se niega a correr (exit 1).
- Versiones: firebase-functions 7.4, firebase-admin 14.5, firebase-tools 15.34, TypeScript 7.0, Vitest 5.

## Siguiente paso

T2.
