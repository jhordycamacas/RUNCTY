# Despliegue en Google Cloud

> Spec transversal · API en Cloud Run y web en Firebase Hosting · Estado: **Pendiente (decisión del propietario: facturación)**; antes: Pendiente de ejecutar por el propietario (archivos y scripts listos el 2026-11-22; ningún comando se ha ejecutado contra Google Cloud) · Sprint: apoyo de la defensa del 2026-11-23

Fija cómo se publica RUNCTY en el proyecto real `runcty-73d70` y qué seguridad mínima debe cumplir. La guía paso a paso para el propietario está en [docs/despliegue.md](../../docs/despliegue.md); las decisiones técnicas generales, en [Arquitectura](arquitectura.md); los requisitos de seguridad medibles, en [RNF](rnf-requisitos-no-funcionales.md).

## Propósito

Publicar la API Django y la web Angular (web del corredor y panel de administración) de forma repetible, con mínimo privilegio y sin secretos en el repositorio, de modo que una persona sin conocimientos de Google Cloud pueda hacerlo con dos scripts y volver atrás si algo falla.

## Alcance

Incluye: imagen de producción del backend, servicio Cloud Run, cuenta de servicio, secreto, Firebase Hosting con cabeceras de seguridad, reglas e índices de Firestore, scripts de despliegue y la guía. No incluye: dominio propio, WAF, CI/CD, la app Android, ni un caché compartido para los límites de tasa.

## Requisitos

| ID | Requisito |
| --- | --- |
| DES-1 | La imagen del backend corre sin root, escucha en `$PORT`, no contiene `.env`, claves ni archivos de desarrollo. |
| DES-2 | La API se despliega en Cloud Run (`southamerica-east1`) con una cuenta de servicio propia con **solo** `roles/datastore.user` y `roles/firebaseauth.admin`. |
| DES-3 | `DJANGO_SECRET_KEY` se genera con aleatoriedad criptográfica, vive en Secret Manager y no se imprime en ningún momento. |
| DES-4 | En producción no se define `DJANGO_DEBUG`, ni variables `*_EMULATOR_HOST`, ni claves JSON; `DJANGO_ALLOWED_HOSTS` y `CORS_ALLOWED_ORIGINS` listan orígenes exactos; `DJANGO_NUM_PROXIES=1`. |
| DES-5 | El servicio escala de 0 a 3 instancias como máximo, para limitar costo y abuso. |
| DES-6 | La web se sirve desde Firebase Hosting con redirección SPA, `index.html` sin caché, recursos con hash en caché larga y las cabeceras CSP (sin `unsafe-eval`), HSTS, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy` y `Permissions-Policy`. |
| DES-7 | Los scripts piden confirmación antes de cada paso remoto, se detienen en el primer error, son idempotentes y no leen ni imprimen secretos. |
| DES-8 | Reglas e índices de Firestore se despliegan junto con la web. |
| DES-9 | Existe un procedimiento de reversión de la API (revisión anterior) y de la web (versión anterior de Hosting). |
| DES-10 | Los riesgos residuales están documentados. |

## Criterios de aceptación

Marcados con `[x]` solo lo observado; lo que requiere ejecutar el despliegue queda abierto.

- [x] `firebase.json` es JSON válido, mantiene las secciones de emuladores, Firestore, Storage y Functions, y define `hosting` con `public` igual a la salida de `ng build` (`frontend/dist/runcty-frontend/browser`).
- [x] Los tres scripts de `deploy/` pasan el análisis de sintaxis de PowerShell sin errores y son ASCII.
- [x] La regla de reescritura de `apiBaseUrl` cambia una sola línea de `environment.prod.ts` (comprobado sobre el archivo real en memoria).
- [x] `backend/.dockerignore` excluye `.env*`, `.venv`, `*service-account*.json`, `tests` y cachés.
- [ ] `deploy-backend.ps1` termina y muestra la URL del servicio.
- [ ] `GET <url>/api/v1/health` responde 200 y `GET <url>/api/v1/me` sin token responde 401 en JSON.
- [ ] `gcloud run services describe runcty-api` no muestra `DJANGO_DEBUG`, ni `*_EMULATOR_HOST`, ni `GOOGLE_APPLICATION_CREDENTIALS`, y `DJANGO_SECRET_KEY` aparece como referencia a un secreto.
- [ ] `gcloud projects get-iam-policy runcty-73d70` muestra para `runcty-api` solo los dos roles de DES-2.
- [ ] `deploy-web.ps1` termina; `https://runcty-73d70.web.app` carga, el administrador inicia sesión y ve el panel con datos.
- [ ] Las cabeceras de DES-6 aparecen en la respuesta de `index.html` y no hay violaciones de CSP en la consola del navegador.
- [ ] La reversión a la revisión anterior de Cloud Run se probó una vez.

## Implementación

- Backend: `backend/Dockerfile`, `backend/.dockerignore`, `backend/config/settings.py` (sin cambios; ya seguro por defecto).
- Scripts: `deploy/common.ps1`, `deploy/deploy-backend.ps1`, `deploy/deploy-web.ps1`.
- Web: `firebase.json` (sección `hosting`), `.firebaserc` (alias `production`), `frontend/src/environments/environment.prod.ts` (solo `apiBaseUrl`).
- Guía: [docs/despliegue.md](../../docs/despliegue.md). Feature: `odd/tasks/despliegue-seguro.md`.

## Supuestos por validar

- El host de Cloud Run sigue el formato `runcty-api-<número>.southamerica-east1.run.app`; el script lo corrige si no.
- El primer build en un proyecto nuevo puede necesitar `-GrantBuildPermissions`.
- La CSP cubre el uso actual; el adaptador de Google Maps (en desarrollo) puede pedir ajustar dominios.
