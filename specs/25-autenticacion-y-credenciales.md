# EP-25 — Autenticación y credenciales

> Spec de capacidad · Debe tener · **0/4 Hecha, 4 Parcial, 0 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-25 · Autenticación y credenciales |
| Requisitos | RF-01-5 a RF-01-8 (4 sub-requisitos) |
| Requisito de usuario (UR) | UR-02 |
| RNF | RNF-01 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | William Jadan |
| Sprint planificado | Sprint 1 · Semana 4 / Sprint 1 · Semana 5 |
| Sprint real | Sprint 1 (semanas 4–5). Área del corredor: 2026-11-13. |
| Dependencias | ninguna |

## Propósito

Que solo una persona con credenciales vigentes acceda a su cuenta: crear las credenciales (correo y contraseña), iniciar sesión, cambiar o recuperar la contraseña y eliminar las credenciales. Es un flujo propio, separado de la gestión de usuarios ([EP-01](01-gestion-de-usuarios.md)), porque **recuperar la contraseña no es una edición del perfil**. Las credenciales las guarda Firebase Auth: la API nunca recibe ni almacena una contraseña.

Entradas, proceso y salidas del requisito padre en el Excel (RF-01):

- Entradas: datos personales, credenciales de acceso, perfil deportivo y preferencias de uso.
- Proceso: validar los datos obligatorios, verificar las credenciales al iniciar sesión y guardar los cambios con el consentimiento del usuario.
- Salidas: cuenta creada o modificada, sesión iniciada y mensajes de confirmación o de error.

## Alcance

**Incluye**

- Registro de credenciales con la política de contraseña (RF-01-5).
- Inicio de sesión con mensajes neutros y límite de intentos (RF-01-6).
- Cambio voluntario de contraseña y recuperación por correo (RF-01-7).
- Eliminación de las credenciales junto con la cuenta (RF-01-8).

**No incluye**

- Cerrar sesión como historia: no existe en el Excel final (existe en la app como acción de apoyo).
- Inicio de sesión con proveedores externos (no pedido).
- Verificación obligatoria del correo (decisión abierta).

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que el usuario esté registrado.
- Que la contraseña cumpla la política de seguridad definida.
- Que la contraseña no se almacene legible.
- Que las credenciales ingresadas coincidan con las registradas.
- Que nunca se muestre la contraseña almacenada.
- Verificar la identidad del usuario antes de cambiar o recuperar la contraseña.
- Que la eliminación cuente con el consentimiento del propio usuario.

Decididas por el equipo o derivadas de otros documentos:

- Política de contraseña: al menos 8 caracteres, una letra y un número (decisión del equipo, ver supuestos).
- Una contraseña nunca se almacena legible ni se muestra (RNF-01).
- Cambiar o recuperar la contraseña exige verificar la identidad: reautenticación con la contraseña actual o enlace enviado al correo.
- Iniciar sesión nunca revela si una cuenta existe (mensaje neutro para contraseña incorrecta y cuenta desconocida).

## Modelo de datos y contrato de API

**Estado: implementado en el cliente con Firebase Auth** (`frontend/src/app/auth`, `frontend/src/app/account`, `frontend/src/app/core/auth`). La API solo verifica el ID token (`GET /me` devuelve `uid`, `email`, `emailVerified`, `role`, `perms`).

| Operación | Dónde ocurre |
| --- | --- |
| Crear credencial | Firebase Auth `createUserWithEmailAndPassword`; luego `POST /users` ([EP-01](01-gestion-de-usuarios.md)). Si el perfil se rechaza se borra la cuenta de Firebase. |
| Iniciar sesión | Firebase Auth; la API verifica el token en cada petición (`check_revoked=True`) y limita los intentos fallidos por dirección (`auth-failed`, `rate-limited`). |
| Cambiar contraseña | Reautenticación con la contraseña actual y actualización en Firebase Auth. |
| Recuperar contraseña | Correo de restablecimiento de Firebase Auth. |
| Eliminar credencial | `DELETE /users/me` borra primero los datos de Firestore y después el usuario de Auth. |

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-01-5](#rf-01-5--crear-credencial-de-acceso) | Crear credencial de acceso | Usuario | Sprint 1 · Semana 4 | Parcial |
| [RF-01-6](#rf-01-6--leer-credenciales-de-acceso-iniciar-sesión) | Leer credenciales de acceso (iniciar sesión) | Usuario | Sprint 1 · Semana 5 | Parcial |
| [RF-01-7](#rf-01-7--actualizar-credencial-de-acceso) | Actualizar credencial de acceso | Usuario | Sprint 1 · Semana 5 | Parcial |
| [RF-01-8](#rf-01-8--eliminar-credencial-de-acceso) | Eliminar credencial de acceso | Usuario | Sprint 1 · Semana 4 | Parcial |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-01-5 — Crear credencial de acceso

- **Historia de usuario:** Como corredor · Deseo que al registrarme se creen mis credenciales de acceso (correo y contraseña). Para ingresar a RUNCTY con una contraseña que no sea legible por terceros.
- **Actor:** Usuario · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 4 · **Dependencia:** N/A · **Caso de uso:** Crear credenciales de acceso
- **Estado:** `Parcial` — Implementada y con pruebas automáticas; commits `add05a1`, `439b6fa`, `f5f3f83` (frontend) y `488674c`, `04e66b3` (backend). Falta la verificación manual en navegador o celular.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Correo electrónico (obligatorio); Contraseña (obligatorio) | El sistema deberá permitir crear las credenciales de acceso (correo electrónico y contraseña) de un usuario registrado, de modo que la contraseña no sea legible por terceros. | Registro de «credencial de acceso» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] El formulario de registro pide correo y contraseña con confirmación; la contraseña cumple la política de 8 caracteres, una letra y un número y se muestra el motivo en español si no.
- [x] Las contraseñas deben coincidir; si no, se avisa y no se crea la cuenta.
- [x] La contraseña la guarda Firebase Auth; la API nunca la recibe y la app no la guarda ni la muestra (RNF-01).
- [x] Si el correo ya está en uso, no se crea nada más y se informa.
- [x] Si el perfil falla después de crear la credencial, la credencial se elimina y se informa el error original.
- [ ] Verificado de punta a punta en un navegador o en un celular contra la API y Firebase (CONTEXTO 17.4: el área del corredor solo está validada con pruebas unitarias y compilación).

**Implementación:** `frontend/src/app/auth/domain/password-policy.ts`, `frontend/src/app/auth/domain/registration.ts`, `frontend/src/app/auth/application/auth-use-cases.ts`, `frontend/src/app/core/auth/sdk-firebase-auth.gateway.ts`, `frontend/src/app/auth/presentation/register.page.ts`

**Pruebas:** `frontend/src/app/auth/domain/validation.spec.ts`, `frontend/src/app/auth/application/auth-use-cases.spec.ts`, `frontend/src/app/auth/presentation/register.page.spec.ts`

### RF-01-6 — Leer credenciales de acceso (iniciar sesión)

- **Historia de usuario:** Como usuario (corredor, administrador o representante de club) · Deseo iniciar sesión con mi correo electrónico y contraseña. Para acceder a mi cuenta solo cuando mis credenciales coincidan con las registradas.
- **Actor:** Usuario · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 5 · **Dependencia:** N/A · **Caso de uso:** Iniciar sesión
- **Estado:** `Parcial` — Implementada y con pruebas automáticas; commits `add05a1`, `439b6fa`, `f5f3f83` (frontend) y `488674c`, `04e66b3` (backend). Falta la verificación manual en navegador o celular.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Correo electrónico [o] (filtro); Contraseña [o] (filtro) | El sistema deberá permitir leer las credenciales ingresadas al iniciar sesión para validarlas, permitiendo el acceso solo cuando coincidan con las registradas. | Datos de «credenciales de acceso» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [x] `/login` explica qué falta (correo con formato, contraseña) y no llama al servidor mientras haya errores.
- [x] Inicia sesión con el correo normalizado (minúsculas, sin espacios) y abre el área que corresponde al rol (corredor o admin).
- [x] Una contraseña incorrecta y una cuenta desconocida muestran el mismo mensaje neutro; nunca se muestra la contraseña.
- [x] Los límites de intentos y los fallos de red se muestran en español.
- [x] La API verifica el ID token en cada petición (`check_revoked`) y limita los intentos con token rechazado por dirección (`rate-limited`).
- [x] Un usuario ya autenticado que abre `/login` va directo a su área.
- [ ] Verificado de punta a punta en un navegador o en un celular contra la API y Firebase (CONTEXTO 17.4: el área del corredor solo está validada con pruebas unitarias y compilación).

**Implementación:** `frontend/src/app/auth/presentation/login.page.ts`, `frontend/src/app/auth/application/auth-use-cases.ts`, `frontend/src/app/core/auth/auth.service.ts`, `frontend/src/app/core/guards/auth.guards.ts`, `frontend/src/app/core/errors/auth-errors.ts`, `backend/apps/shared/presentation/authentication.py`, `backend/apps/shared/infrastructure/firebase/token_verifier.py`, `backend/apps/shared/presentation/throttles.py`

**Pruebas:** `frontend/src/app/auth/presentation/login.page.spec.ts`, `frontend/src/app/core/auth/auth.service.spec.ts`, `frontend/src/app/core/guards/guards.spec.ts`, `frontend/src/app/core/errors/auth-errors.spec.ts`, `backend/tests/test_authentication.py`, `backend/tests/test_firebase_token_verifier.py`

### RF-01-7 — Actualizar credencial de acceso

- **Historia de usuario:** Como usuario (corredor, administrador o representante de club) · Deseo cambiar mi contraseña o recuperarla cuando la olvide, previa verificación de mi identidad. Para mantener el acceso a mi cuenta de forma segura. Cambiar (con sesión) y recuperar (sin sesión) son flujos distintos: casos de uso Cambiar contraseña y Recuperar contraseña.
- **Actor:** Usuario · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 5 · **Dependencia:** N/A · **Caso de uso:** Cambiar contraseña; Recuperar contraseña
- **Estado:** `Parcial` — Implementada y con pruebas automáticas; commits `add05a1`, `439b6fa`, `f5f3f83` (frontend) y `488674c`, `04e66b3` (backend). Falta la verificación manual en navegador o celular.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Correo electrónico (obligatorio); Contraseña (obligatorio) | El sistema deberá permitir actualizar la contraseña del usuario, ya sea por cambio voluntario o por recuperación, previa verificación de su identidad. | Registro de «credencial de acceso» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] **Cambio voluntario** (`/app/cuenta/contrasena`): reautentica con la contraseña actual y actualiza la contraseña; limpia el formulario al terminar.
- [x] Una contraseña nueva que rompe la política se bloquea con su motivo; una contraseña actual incorrecta se informa y no cambia nada.
- [x] **Recuperación** (`/recuperar`): no envía nada si el correo es inválido; envía el enlace al correo normalizado y confirma con un mensaje neutro.
- [x] La confirmación es idéntica para una cuenta desconocida (no se revela si existe); los fallos de red se muestran.
- [x] La identidad se verifica antes de cambiar o recuperar: con la contraseña actual o con el enlace enviado al correo.
- [ ] Verificado de punta a punta en un navegador o en un celular contra la API y Firebase (CONTEXTO 17.4: el área del corredor solo está validada con pruebas unitarias y compilación).

**Implementación:** `frontend/src/app/account/presentation/change-password.page.ts`, `frontend/src/app/account/application/account-use-cases.ts`, `frontend/src/app/auth/presentation/forgot-password.page.ts`, `frontend/src/app/auth/application/auth-use-cases.ts`, `frontend/src/app/auth/domain/password-policy.ts`

**Pruebas:** `frontend/src/app/account/presentation/change-password.page.spec.ts`, `frontend/src/app/account/application/account-use-cases.spec.ts`, `frontend/src/app/auth/presentation/forgot-password.page.spec.ts`, `frontend/src/app/auth/application/auth-use-cases.spec.ts`

### RF-01-8 — Eliminar credencial de acceso

- **Historia de usuario:** Como corredor · Deseo que mis credenciales se eliminen cuando doy de baja mi cuenta. Para que nadie pueda volver a ingresar con ellas.
- **Actor:** Usuario · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 4 · **Dependencia:** N/A · **Caso de uso:** Eliminar credenciales de acceso
- **Estado:** `Parcial` — Cubierta solo a través de la eliminación de la cuenta ([RF-01-4](01-gestion-de-usuarios.md#rf-01-4--eliminar-usuario)); commits `f5f3f83` y `04e66b3`. No hay una acción separada para eliminar solo la credencial.

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar las credenciales de un usuario con su consentimiento. | Registro de «credencial de acceso» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Las credenciales (usuario de Firebase Auth) se eliminan al eliminar la cuenta, después de los datos de Firestore.
- [x] Se solicita confirmación previa (contraseña actual y una confirmación explícita) y la eliminación cuenta con el consentimiento del propio usuario.
- [x] Si la eliminación de datos falla, el usuario de Auth se conserva (no quedan datos sueltos sin credencial ni al revés).
- [ ] Existe una acción para eliminar únicamente la credencial sin eliminar el perfil (no implementada; ver «Supuestos por validar»).
- [ ] Verificado de punta a punta en un navegador o en un celular contra la API y Firebase (CONTEXTO 17.4: el área del corredor solo está validada con pruebas unitarias y compilación).

**Implementación:** `frontend/src/app/account/presentation/delete-account.page.ts`, `backend/apps/users/domain/account_deletion.py`, `backend/apps/shared/infrastructure/firebase/auth_gateway.py`

**Pruebas:** `frontend/src/app/account/presentation/delete-account.page.spec.ts`, `backend/tests/test_account_deletion.py`

## Dependencias

- **Depende de:** ninguna.

## Supuestos por validar

- No existe una acción para eliminar solo la credencial: las credenciales mueren con la cuenta (RF-01-4). Si Gacelas quiere quitar la contraseña y conservar el perfil, hay que especificarlo.
- La política «8 caracteres, letra y número» no está en el Excel («la política de seguridad definida»); es una decisión del equipo (inferido).
- El backlog del Excel tiene RF-01-7 como una sola historia (cambio voluntario y recuperación); CONTEXTO la nombra como dos flujos. Aquí se mantiene el ID único y los dos flujos se cubren con criterios separados.
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
