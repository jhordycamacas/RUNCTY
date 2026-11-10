# Feature: auditoría (seguridad, UX/UI, sprints) y pulido de las dos apps

- **Rama:** `feat/hardening-and-polish`
- **Locator:** `odd/tasks/auditoria-y-pulido.md` (espejo Engram `odd/auditoria-y-pulido/tasks`: **pendiente**, Engram no está disponible en la sesión del 2026-11-10)
- **Estrategia de entrega:** `ask-on-risk`. Commits por unidad de trabajo en la rama; PR a decisión del usuario.
- **Revisión RDD:** no aplica en este repo (decisión del usuario).

## Objetivo

Corregir lo que dejó la auditoría del 2026-11-10 y hacer que la app del celular y el panel admin se vean y se sientan completos.

## Fuentes (auditoría del 2026-11-10, tres agentes de solo lectura)

- **Verificación de sprints:** typecheck y tests en verde (mobile 257, admin 60, functions 167). Sprints 1 y 2 completos contra el código. Quedan 3 restos de código sin uso y documentación de Docker y Metro 8082 pendiente.
- **Seguridad:** SEC-01 a SEC-10 (ver `README.md`, sección de seguridad).
- **UX/UI:** UX-M-01 a UX-M-14 (app) y UX-A-01 a UX-A-13 (panel).

## Restricciones

- **Sin módulos nativos nuevos en la app móvil.** El celular tiene instalada una build de desarrollo; un módulo nativo obliga a recompilar e instalar el APK. Todo cambio de la app debe ser solo JS/TS.
- Regla de código zombie: lo que quede sin uso se elimina en el mismo cambio.
- Textos de interfaz en español, igual que el resto del proyecto.

## Tareas

| ID | Tarea | Ruta | Estado |
| --- | --- | --- | --- |
| T0 | Docker: emuladores y seed en compose; puertos solo en 127.0.0.1; procesos sin root | inline | [x] |
| T1 | Functions y seed: App Check configurable, `roles.manage` sin escalar a admin, revocar tokens al cambiar rol, proteger al último admin, guarda del seed, restos de knip | delegada | [ ] |
| T2 | App móvil: botón de emergencia, preferencias que se aplican, reenvío de correo, fecha sin teclado de guiones, contraste, estados y errores | delegada | [ ] |
| T3 | Panel admin: menú responsive, confirmación al cambiar rol, botón de peligro, hora y fecha nativas, avisos que se cierran, títulos | delegada | [ ] |
| T4 | Documentación: README, CONTEXTO.md (Docker, Metro 8082, auditoría) y manual de Android | inline | [ ] |
| T5 | Verificación final: tests, typecheck, lint, app en el celular y panel en el navegador | delegada | [ ] |

## Decisiones abiertas

- **App Check en producción:** exigirlo requiere activar el proveedor (Play Integrity) en la consola de Firebase y enviar el token desde la app y el panel. Queda detrás de una variable, apagada por defecto, para no romper la demo.
- **Datos personales legibles con `users.read` (SEC-04) y correo sin verificar en reglas (SEC-07):** cambiar las reglas puede romper la búsqueda del panel; se documentan y se deciden con el equipo.
- **Dependencias con avisos (SEC-10):** el único arreglo que ofrece npm es bajar `firebase` a 9.x; no se aplica.

## Progreso

- 2026-11-10: auditoría hecha y rama creada.
