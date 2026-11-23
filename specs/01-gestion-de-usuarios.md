# EP-01 — Gestión de usuarios

> Spec de capacidad · Debe tener · **1/8 Hecha, 7 Parcial, 0 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-01 · Gestión de usuarios |
| Requisitos | RF-01-1, RF-01-2, RF-01-3, RF-01-4, RF-01-9, RF-01-10, RF-01-11, RF-01-12 (8 sub-requisitos) |
| Requisito de usuario (UR) | UR-01 |
| RNF | RNF-01, RNF-02, RNF-08, RNF-18 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | William Jadan |
| Sprint planificado | Sprint 1 · Semana 4 / Sprint 1 · Semana 5 |
| Sprint real | Sprint 1 (semanas 4–5). Backend: 2026-11-12. Área del corredor: 2026-11-13. Administración de usuarios: 2026-11-17. |
| Dependencias | ninguna |

## Propósito

Que una persona cree su cuenta de corredor, mantenga sus datos personales y su perfil deportivo, y que el administrador pueda consultar los usuarios registrados. El perfil deportivo (nivel, objetivos, ritmo y distancia preferida) personaliza las recomendaciones de rutas. Las credenciales y el inicio de sesión viven en [EP-25](25-autenticacion-y-credenciales.md) y las preferencias de uso en [EP-26](26-preferencias-de-usuario.md).

Entradas, proceso y salidas del requisito padre en el Excel (RF-01):

- Entradas: datos personales, credenciales de acceso, perfil deportivo y preferencias de uso.
- Proceso: validar los datos obligatorios, verificar las credenciales al iniciar sesión y guardar los cambios con el consentimiento del usuario.
- Salidas: cuenta creada o modificada, sesión iniciada y mensajes de confirmación o de error.

## Alcance

**Incluye**

- Registro de una cuenta con datos personales y consentimiento LOPDP (RF-01-1).
- Consulta de usuarios por el administrador con filtros (RF-01-2).
- Actualización de los datos personales propios y eliminación de la cuenta propia (RF-01-3, RF-01-4).
- Perfil deportivo del corredor: crear, consultar, actualizar y eliminar (RF-01-9 a RF-01-12).

**No incluye**

- Credenciales, inicio de sesión y recuperación de contraseña: [EP-25](25-autenticacion-y-credenciales.md).
- Preferencias de apariencia, unidades y notificaciones: [EP-26](26-preferencias-de-usuario.md).
- Verificación obligatoria del correo (hoy solo se avisa; decisión abierta, CONTEXTO sección 10 punto 11).
- Consentimiento parental para menores de edad (decisión abierta, CONTEXTO sección 10 punto 5): hoy se aceptan edades de 5 a 110 años.

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que no exista otro usuario con el mismo correo electrónico.
- Que el correo electrónico tenga formato válido.
- Que la fecha de nacimiento no sea posterior a la fecha actual.
- Permitir filtrar por nombres, apellidos, correo electrónico, identificación, fecha de nacimiento o ciudad.
- Que solo el administrador consulte los datos de otros usuarios.
- Que el correo electrónico siga siendo único.
- Que la eliminación cuente con el consentimiento del propio usuario.
- Eliminar también sus credenciales, perfil y preferencias.
- Que el corredor no tenga ya un perfil deportivo.
- Que el nivel sea uno de los definidos.
- Que el corredor consulte solo su propio perfil.
- Que el nivel siga siendo uno de los definidos.
- Dejar de personalizar las recomendaciones al eliminarlo.

Decididas por el equipo o derivadas de otros documentos:

- Todo usuario nuevo recibe el rol `runner`; el rol y la identidad nunca vienen del cuerpo de la petición.
- Al eliminar un usuario se eliminan también sus credenciales, perfil deportivo y preferencias (CONTEXTO sección 6).
- El último administrador no puede eliminar su cuenta (`last-admin`).
- Nivel del corredor y objetivos: opciones de los catálogos `sportLevels` y `sportGoals` que gestiona el administrador ([CFG-4](27-configuracion-del-sistema.md)); por defecto Principiante, Intermedio y Avanzado, y salud, bajar de peso, preparar carrera, mejorar ritmo y socializar (al menos un objetivo; por validar con Gacelas). Al guardar se aceptan solo opciones activas.

## Modelo de datos y contrato de API

**Estado: implementado** (`backend/apps/users`, `frontend/src/app/{auth,account,sport-profile}`, `frontend/src/app/admin/users`).

| Endpoint | Permiso | Descripción |
| --- | --- | --- |
| `POST /users` | sesión | Crea el perfil de quien tiene el token (`201` con el usuario). Cuerpo: `firstName`, `lastName`, `birthDate` (`AAAA-MM-DD`), `cityId`, `idNumber` opcional (10 dígitos) y `consent: {lopdp: true}`. |
| `GET /users` | `users.read` | Búsqueda de administrador por `firstName`, `lastName`, `email`, `idNumber`, `birthDate`, `cityId`; paginada con `limit` (máx. 50) y `cursor`; responde `{users, nextCursor}` sin identificación. |
| `GET /users/me` · `PATCH /users/me` · `DELETE /users/me` | sesión | Perfil propio, cambio parcial de datos personales (una identificación vacía la elimina) y eliminación de la cuenta (inicio de sesión de menos de 5 minutos). |
| `GET/PUT/DELETE /users/me/sport-profile` | sesión | Perfil deportivo propio: `level`, `goals[]`, `usualPaceSecPerKm`, `preferredDistanceKm`. |

Documento `users/{uid}`: `email`, `firstName`, `lastName`, `birthDate`, `cityId`, `idNumber?`, `role` (espejo del claim). Subdocumentos privados: `users/{uid}/private/sportProfile` y `users/{uid}/private/preferences`.

Códigos de error propios: `profile-exists` (409), `profile-not-found`, `sport-profile-not-found`, `not-accepted` (falta el consentimiento), `recent-sign-in-required`, `last-admin`, `invalid-cursor`, `invalid-filter`, `invalid-limit`, además de los errores por campo (`required`, `max-length`, `invalid-format`, `invalid-date`, `out-of-range`).

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-01-1](#rf-01-1--crear-usuario) | Crear usuario | Persona que se registra | Sprint 1 · Semana 4 | Parcial |
| [RF-01-2](#rf-01-2--leer-usuarios) | Leer usuarios | Administrador | Sprint 1 · Semana 4 | Hecha |
| [RF-01-3](#rf-01-3--actualizar-usuario) | Actualizar usuario | Usuario | Sprint 1 · Semana 4 | Parcial |
| [RF-01-4](#rf-01-4--eliminar-usuario) | Eliminar usuario | Usuario | Sprint 1 · Semana 4 | Parcial |
| [RF-01-9](#rf-01-9--crear-perfil-deportivo) | Crear perfil deportivo | Corredor | Sprint 1 · Semana 5 | Parcial |
| [RF-01-10](#rf-01-10--leer-perfiles-deportivos) | Leer perfiles deportivos | Corredor | Sprint 1 · Semana 5 | Parcial |
| [RF-01-11](#rf-01-11--actualizar-perfil-deportivo) | Actualizar perfil deportivo | Corredor | Sprint 1 · Semana 5 | Parcial |
| [RF-01-12](#rf-01-12--eliminar-perfil-deportivo) | Eliminar perfil deportivo | Corredor | Sprint 1 · Semana 5 | Parcial |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-01-1 — Crear usuario

- **Historia de usuario:** Como corredor · Deseo crear mi cuenta con mis datos personales (nombres, apellidos, correo, fecha de nacimiento y ciudad). Para usar RUNCTY con un registro sencillo y con mi consentimiento.
- **Actor:** Persona que se registra · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 4 · **Dependencia:** N/A · **Caso de uso:** Crear cuenta
- **Estado:** `Parcial` — Implementada y con pruebas automáticas; commits `add05a1`, `439b6fa`, `f5f3f83` (frontend) y `488674c`, `04e66b3` (backend). Falta la verificación manual en navegador o celular.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombres (obligatorio); Apellidos (obligatorio); Correo electrónico (obligatorio); Fecha de nacimiento (obligatorio); Ciudad de residencia (obligatorio); Identificación (opcional) | El sistema deberá permitir crear un usuario con sus datos personales (nombres, apellidos, correo electrónico, fecha de nacimiento y ciudad de residencia), validando que los datos obligatorios estén completos y que el correo electrónico no esté registrado. | Registro de «usuario» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] `/registro` pide nombres, apellidos, correo, fecha de nacimiento (tres campos numéricos), ciudad (selector con búsqueda), identificación opcional de 10 dígitos y contraseña con confirmación.
- [x] Con datos obligatorios incompletos o inválidos se muestra el error de cada campo en español y no se crea nada.
- [x] El correo debe tener formato válido y la fecha de nacimiento no puede ser posterior a hoy; el servidor además exige una edad de 5 a 110 años (`out-of-range`).
- [x] Si el correo ya tiene una cuenta, se avisa y no se crea otro usuario; si el perfil ya existe, la API responde 409 `profile-exists` sin tocarlo.
- [x] Se exige aceptar el tratamiento de datos personales (LOPDP) y la API rechaza el registro sin `consent.lopdp` (RNF-02).
- [x] El perfil se crea para el dueño del token: la identidad, el correo y el rol nunca se toman del cuerpo; el usuario nuevo recibe el rol `runner`.
- [x] Si la API rechaza el perfil, se elimina la cuenta de Firebase para no dejar cuentas huérfanas y se muestra el motivo.
- [x] Tras crear la cuenta se envía el correo de verificación (sin bloquear el registro) y se abre el área del corredor.
- [ ] Verificado de punta a punta en un navegador o en un celular contra la API y Firebase (CONTEXTO 17.4: el área del corredor solo está validada con pruebas unitarias y compilación).

**Implementación:** `frontend/src/app/auth/presentation/register.page.ts`, `frontend/src/app/auth/presentation/personal-data-fields.ts`, `frontend/src/app/auth/application/auth-use-cases.ts`, `frontend/src/app/auth/domain/registration.ts`, `frontend/src/app/auth/domain/personal-data.ts`, `frontend/src/app/auth/domain/birth-date.ts`, `frontend/src/app/auth/infrastructure/http-users.repository.ts`, `frontend/src/app/shared/ui/birth-date-field.ts`, `frontend/src/app/cities/presentation/city-picker-field.ts`, `backend/apps/users/domain/models.py`, `backend/apps/users/application/use_cases.py`, `backend/apps/users/presentation/views.py`

**Pruebas:** `frontend/src/app/auth/presentation/register.page.spec.ts`, `frontend/src/app/auth/application/auth-use-cases.spec.ts`, `frontend/src/app/auth/domain/validation.spec.ts`, `backend/tests/test_users_api.py`, `backend/tests/test_users_domain.py`, `backend/tests/test_default_role.py`

### RF-01-2 — Leer usuarios

- **Historia de usuario:** Como administrador · Deseo consultar los datos de los usuarios autorizados. Para localizar información de usuarios mediante filtros concretos cuando tenga autorización para consultarla.
- **Actor:** Administrador · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 4 · **Dependencia:** N/A · **Caso de uso:** Consultar usuarios
- **Estado:** `Hecha` — Verificada en el navegador con el stack local (2026-11-17). Specs `fe15884`; implementación: `83c9d18`, `b25af72`; backend `04e66b3`.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombres (filtro); Apellidos (filtro); Correo electrónico (filtro); Fecha de nacimiento (filtro) | El sistema deberá permitir leer los datos de los usuarios, filtrándolos por nombres, apellidos, correo electrónico, identificación, fecha de nacimiento o ciudad de residencia. | Datos de «usuarios» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [x] `/admin/usuarios` lista los usuarios con nombre, correo, ciudad y rol, con estados de carga, vacío y error con botón «Reintentar».
- [x] Se puede filtrar por nombres, apellidos, correo, identificación, fecha de nacimiento y ciudad; solo se envían a la API los filtros con valor.
- [x] Una identificación que no tiene 10 dígitos o una fecha que no es AAAA-MM-DD muestra un aviso en español y no envía nada a la API.
- [x] Si la API devuelve `nextCursor`, aparece «Cargar más» y añade la página siguiente; sin cursor no aparece. Un cursor inválido (`invalid-cursor`) muestra un mensaje y permite volver a buscar.
- [x] La lista no muestra la identificación (minimización de datos): la API tampoco la devuelve.
- [x] Cada usuario muestra el nombre de su rol (RF-02-2).
- [x] Requiere el permiso `users.read`; sin él la pantalla no es accesible.
- [x] Todo el texto de la interfaz está en español; un código de error de la API sin traducción cae en el mensaje genérico (`frontend/src/app/core/errors/error-messages.ts`).
- [x] Cada control tiene etiqueta, objetivo táctil de 48 px y contraste de texto 4,5:1; sin scroll horizontal de la página en pantallas angostas (360 px) y el área sigue pensada para escritorio.

**Implementación:** `frontend/src/app/admin/users/presentation/users-admin.page.ts`, `frontend/src/app/admin/users/application/admin-users.store.ts`, `frontend/src/app/admin/users/domain/user-search.ts`, `frontend/src/app/admin/users/domain/managed-user.ts`, `frontend/src/app/admin/users/infrastructure/http-user-admin.repository.ts`, `backend/apps/users/presentation/views.py`

**Pruebas:** `frontend/src/app/admin/users/domain/user-search.spec.ts`, `frontend/src/app/admin/users/infrastructure/http-user-admin.repository.spec.ts`, `frontend/src/app/admin/users/application/admin-users.store.spec.ts`, `frontend/src/app/admin/users/presentation/users-admin.page.spec.ts`

### RF-01-3 — Actualizar usuario

- **Historia de usuario:** Como corredor · Deseo actualizar mis datos personales y los datos de mi cuenta. Para mantener vigentes mis nombres, correo, celular y demás datos desde mi perfil.
- **Actor:** Usuario · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 4 · **Dependencia:** N/A · **Caso de uso:** Actualizar datos personales
- **Estado:** `Parcial` — Implementada y con pruebas automáticas; commits `add05a1`, `439b6fa`, `f5f3f83` (frontend) y `488674c`, `04e66b3` (backend). Falta la verificación manual en navegador o celular.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nombres (obligatorio); Apellidos (obligatorio); Correo electrónico (obligatorio); Fecha de nacimiento (obligatorio); Ciudad de residencia (obligatorio); Identificación (opcional) | El sistema deberá permitir actualizar los datos personales de un usuario, de modo que su información se mantenga vigente. | Registro de «usuario» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] `/app/cuenta/datos` muestra los datos cargados y el correo como solo lectura; si no se pueden cargar, ofrece reintentar.
- [x] Valida igual que el registro antes de llamar al servidor y no envía nada si hay errores.
- [x] Guarda con `PATCH /users/me` solo los campos dados, confirma con un aviso y no queda nada sin guardar.
- [x] Una identificación vacía la elimina; los campos inmutables (uid, correo, rol) los rechaza la API.
- [x] Si el servidor rechaza el cambio, muestra el motivo y conserva lo escrito.
- [ ] El correo electrónico puede actualizarse manteniéndose único (hoy es de solo lectura; ver «Supuestos por validar»).
- [ ] Verificado de punta a punta en un navegador o en un celular contra la API y Firebase (CONTEXTO 17.4: el área del corredor solo está validada con pruebas unitarias y compilación).

**Implementación:** `frontend/src/app/account/presentation/edit-personal-data.page.ts`, `frontend/src/app/account/application/account-use-cases.ts`, `frontend/src/app/account/infrastructure/http-profile.repository.ts`, `frontend/src/app/account/domain/profile.ts`, `frontend/src/app/auth/domain/personal-data.ts`, `backend/apps/users/presentation/views.py`, `backend/apps/users/application/use_cases.py`

**Pruebas:** `frontend/src/app/account/presentation/edit-personal-data.page.spec.ts`, `frontend/src/app/account/domain/profile.spec.ts`, `backend/tests/test_users_api.py`, `backend/tests/test_users_domain.py`

### RF-01-4 — Eliminar usuario

- **Historia de usuario:** Como corredor · Deseo eliminar mi cuenta cuando lo solicite. Para darme de baja voluntariamente y conservar el control sobre mi cuenta.
- **Actor:** Usuario · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 4 · **Dependencia:** N/A · **Caso de uso:** Eliminar cuenta
- **Estado:** `Parcial` — Implementada y con pruebas automáticas; commits `add05a1`, `439b6fa`, `f5f3f83` (frontend) y `488674c`, `04e66b3` (backend). Falta la verificación manual en navegador o celular.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar la cuenta de un usuario únicamente con su consentimiento. | Registro de «usuario» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] `/app/cuenta/eliminar` advierte que la eliminación es permanente y pide la contraseña y una confirmación antes de hacer nada.
- [x] Reautentica, renueva el token, llama a `DELETE /users/me` y cierra la sesión.
- [x] La API borra primero los datos de Firestore (perfil, perfil deportivo y preferencias) y después el usuario de Auth (sus credenciales); es idempotente si Auth ya no lo tiene.
- [x] Exige un inicio de sesión de menos de 5 minutos: `recent-sign-in-required` se traduce y la sesión se conserva.
- [x] El último administrador no puede eliminar su cuenta (`last-admin`).
- [x] Con una contraseña incorrecta no se borra nada y se informa.
- [ ] Verificado de punta a punta en un navegador o en un celular contra la API y Firebase (CONTEXTO 17.4: el área del corredor solo está validada con pruebas unitarias y compilación).

**Implementación:** `frontend/src/app/account/presentation/delete-account.page.ts`, `frontend/src/app/account/application/account-use-cases.ts`, `backend/apps/users/domain/account_deletion.py`, `backend/apps/users/application/use_cases.py`, `backend/apps/users/presentation/views.py`

**Pruebas:** `frontend/src/app/account/presentation/delete-account.page.spec.ts`, `frontend/src/app/account/application/account-use-cases.spec.ts`, `backend/tests/test_account_deletion.py`, `backend/tests/test_users_api.py`

### RF-01-9 — Crear perfil deportivo

- **Historia de usuario:** Como corredor · Deseo configurar mi perfil deportivo. Para recibir rutas acordes con mi nivel, ritmo habitual, objetivos y distancia preferida.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 5 · **Dependencia:** N/A · **Caso de uso:** Configurar perfil deportivo
- **Estado:** `Parcial` — Implementada y con pruebas automáticas; commits `add05a1`, `439b6fa`, `f5f3f83` (frontend) y `488674c`, `04e66b3` (backend). Falta la verificación manual en navegador o celular.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nivel {Principiante, Intermedio, Avanzado} (obligatorio); Objetivo de entrenamiento (obligatorio); Ritmo habitual (opcional); Distancia preferida (opcional) | El sistema deberá permitir crear el perfil deportivo del corredor (nivel principiante, intermedio o avanzado, objetivos, ritmo habitual y distancia preferida), para personalizar las recomendaciones de rutas. | Registro de «perfil deportivo» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] `/app/cuenta/deportivo` ofrece crear el perfil cuando el corredor no tiene uno; pide nivel, uno o más objetivos (las opciones activas de los catálogos `sportLevels` y `sportGoals`, que lee de `GET /catalogs/<id>`), ritmo habitual (`min:seg`) y distancia preferida.
- [x] Cada campo inválido muestra su mensaje en español y no se guarda nada (nivel obligatorio, al menos un objetivo, ritmo y distancia dentro de los rangos de los parámetros del sistema, por defecto de 2:30 a 20:00 min/km y de 1 a 50 km).
- [x] Al crear, se muestra el resumen del perfil con un aviso; un error del servidor se muestra junto al botón y se conserva el formulario.
- [x] El perfil pertenece solo al corredor autenticado y la API rechaza campos desconocidos o fuera del esquema.
- [ ] El ritmo habitual y la distancia preferida son opcionales, como dice el Excel (hoy son obligatorios).
- [ ] La API impide crear un segundo perfil (hoy `PUT` reemplaza el documento; solo la pantalla ofrece «crear» cuando no hay perfil).
- [ ] Verificado de punta a punta en un navegador o en un celular contra la API y Firebase (CONTEXTO 17.4: el área del corredor solo está validada con pruebas unitarias y compilación).

**Implementación:** `frontend/src/app/sport-profile/presentation/sport-profile.page.ts`, `frontend/src/app/sport-profile/application/sport-profile.store.ts`, `frontend/src/app/sport-profile/domain/sport-profile.ts`, `frontend/src/app/sport-profile/infrastructure/http-sport-profile.repository.ts`, `backend/apps/users/presentation/views.py`, `backend/apps/users/application/use_cases.py`

**Pruebas:** `frontend/src/app/sport-profile/presentation/sport-profile.page.spec.ts`, `frontend/src/app/sport-profile/domain/sport-profile.spec.ts`, `frontend/src/app/sport-profile/application/sport-profile.store.spec.ts`, `backend/tests/test_private_documents_api.py`

### RF-01-10 — Leer perfiles deportivos

- **Historia de usuario:** Como corredor · Deseo consultar mi perfil deportivo. Para revisar la información deportiva con la que la aplicación personaliza mis rutas.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 5 · **Dependencia:** N/A · **Caso de uso:** Ver perfil deportivo
- **Estado:** `Parcial` — Implementada y con pruebas automáticas; commits `add05a1`, `439b6fa`, `f5f3f83` (frontend) y `488674c`, `04e66b3` (backend). Falta la verificación manual en navegador o celular.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nivel (filtro); Objetivo de entrenamiento (filtro); Ritmo habitual (filtro); Distancia preferida (filtro) | El sistema deberá permitir leer el perfil deportivo de un corredor, para que la aplicación lo use al recomendar rutas y el usuario revise sus datos. | Datos de «perfiles deportivos» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [x] El corredor ve su perfil deportivo guardado (nivel, objetivos, ritmo y distancia) y la distancia sigue su preferencia de unidades; un nivel u objetivo ya desactivado se sigue mostrando con su etiqueta, y al editar se deja de ofrecer.
- [x] Un corredor sin perfil se trata como estado vacío («crear mi perfil»), no como error; un fallo de carga muestra un reintento en vez de un formulario vacío.
- [x] Solo se lee el perfil propio: la API no acepta el uid de otro usuario y devuelve 404 `sport-profile-not-found` si no existe.
- [ ] El perfil guardado personaliza las recomendaciones de rutas (hoy solo se muestra; la personalización llega con [EP-09](09-rutas-seguras.md)).
- [ ] Verificado de punta a punta en un navegador o en un celular contra la API y Firebase (CONTEXTO 17.4: el área del corredor solo está validada con pruebas unitarias y compilación).

**Implementación:** `frontend/src/app/sport-profile/presentation/sport-profile.page.ts`, `frontend/src/app/sport-profile/application/sport-profile.store.ts`, `backend/apps/users/presentation/views.py`

**Pruebas:** `frontend/src/app/sport-profile/presentation/sport-profile.page.spec.ts`, `frontend/src/app/sport-profile/application/sport-profile.store.spec.ts`, `backend/tests/test_private_documents_api.py`

### RF-01-11 — Actualizar perfil deportivo

- **Historia de usuario:** Como corredor · Deseo actualizar mi perfil deportivo. Para adaptar las recomendaciones a mi progreso cuando cambien mi ritmo, objetivos o nivel.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 5 · **Dependencia:** N/A · **Caso de uso:** Ajustar nivel y objetivos de entrenamiento
- **Estado:** `Parcial` — Implementada y con pruebas automáticas; commits `add05a1`, `439b6fa`, `f5f3f83` (frontend) y `488674c`, `04e66b3` (backend). Falta la verificación manual en navegador o celular.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Nivel {Principiante, Intermedio, Avanzado} (obligatorio); Objetivo de entrenamiento (obligatorio); Ritmo habitual (opcional); Distancia preferida (opcional) | El sistema deberá permitir actualizar el nivel, los objetivos, el ritmo y la distancia preferida a medida que el corredor progresa, para que las recomendaciones sean adecuadas a su rendimiento. | Registro de «perfil deportivo» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El corredor edita su perfil desde la pantalla de resumen, con el formulario precargado.
- [x] Las mismas validaciones que al crear; los errores salen en español y no se guarda nada si hay alguno.
- [x] Al guardar se reemplaza el documento completo y se muestra el perfil actualizado con un aviso.
- [x] La API rechaza valores fuera del esquema y los reporta por campo.
- [ ] Verificado de punta a punta en un navegador o en un celular contra la API y Firebase (CONTEXTO 17.4: el área del corredor solo está validada con pruebas unitarias y compilación).

**Implementación:** `frontend/src/app/sport-profile/presentation/sport-profile.page.ts`, `frontend/src/app/sport-profile/domain/sport-profile.ts`, `backend/apps/users/presentation/views.py`

**Pruebas:** `frontend/src/app/sport-profile/presentation/sport-profile.page.spec.ts`, `backend/tests/test_private_documents_api.py`

### RF-01-12 — Eliminar perfil deportivo

- **Historia de usuario:** Como corredor · Deseo eliminar mi perfil deportivo. Para dejar de utilizar la personalización deportiva sin afectar otras funciones de mi cuenta.
- **Actor:** Corredor · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 5 · **Dependencia:** N/A · **Caso de uso:** Eliminar perfil deportivo
- **Estado:** `Parcial` — Implementada y con pruebas automáticas; commits `add05a1`, `439b6fa`, `f5f3f83` (frontend) y `488674c`, `04e66b3` (backend). Falta la verificación manual en navegador o celular.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar el perfil deportivo de un corredor, para que deje de personalizar las recomendaciones o como parte de la baja de su cuenta. | Registro de «perfil deportivo» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] La pantalla pide confirmación antes de eliminar el perfil deportivo y, si se cancela, no borra nada.
- [x] Tras eliminar vuelve al estado vacío con un aviso; la cuenta no se ve afectada.
- [x] Si el servidor rechaza la eliminación, el perfil se conserva en pantalla.
- [x] `DELETE /users/me/sport-profile` es idempotente.
- [ ] Verificado de punta a punta en un navegador o en un celular contra la API y Firebase (CONTEXTO 17.4: el área del corredor solo está validada con pruebas unitarias y compilación).

**Implementación:** `frontend/src/app/sport-profile/presentation/sport-profile.page.ts`, `frontend/src/app/sport-profile/application/sport-profile.store.ts`, `backend/apps/users/presentation/views.py`

**Pruebas:** `frontend/src/app/sport-profile/presentation/sport-profile.page.spec.ts`, `frontend/src/app/sport-profile/application/sport-profile.store.spec.ts`, `backend/tests/test_private_documents_api.py`

## Dependencias

- **Depende de:** ninguna.
- **Dependen de esta capacidad:** [EP-02 · Roles y permisos](02-roles-y-permisos.md), [EP-03 · Contactos de confianza](03-contactos-de-confianza.md), [EP-10 · Rutas favoritas y valoraciones](10-favoritas-y-valoraciones.md), [EP-12 · Registro de entrenamientos](12-registro-de-entrenamientos.md), [EP-15 · Botón de pánico](15-boton-de-panico.md), [EP-17 · Reportes comunitarios](17-reportes-comunitarios.md), [EP-18 · Notificaciones](18-notificaciones.md), [EP-19 · Clubes de running y membresías](19-clubes-y-membresias.md), [EP-22 · Compañeros para correr](22-companeros-para-correr.md), [EP-23 · Eventos y carreras](23-eventos-y-carreras.md).

## Supuestos por validar

- El Excel marca ritmo habitual y distancia preferida como opcionales (`*`) en RF-01-9 y RF-01-11, pero la app los exige (y valida rangos de 2:30 a 20:00 min/km y de 1 a 50 km); decidir con Gacelas cuál es la regla correcta.
- RF-01-3 permite actualizar el correo en el Excel; hoy el correo es de solo lectura en el perfil (cambiarlo requiere reautenticación y verificación; no se implementó).
- Filtrar perfiles deportivos «por criterios de búsqueda» (RF-01-10) no tiene sentido con un documento por corredor; se implementa solo la consulta del propio perfil (inferido).
- Los rangos de ritmo y distancia, el máximo de 60 caracteres en nombres y la edad de 5 a 110 años son decisiones del equipo (inferido).
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
