# EP-26 — Preferencias de usuario

> Spec de capacidad · Debe tener · **0/4 Hecha, 4 Parcial, 0 Pendiente**

| Campo | Valor |
| --- | --- |
| Épica | EP-26 · Preferencias de usuario |
| Requisitos | RF-01-13 a RF-01-16 (4 sub-requisitos) |
| Requisito de usuario (UR) | UR-17 |
| RNF | RNF-19, RNF-20 (transversales: RNF-10, RNF-11, RNF-21, RNF-23) |
| Prioridad | Debe tener |
| Responsable | William Jadan |
| Sprint planificado | Sprint 1 · Semana 5 |
| Sprint real | Sprint 1 (semana 5). Área del corredor: 2026-11-13. Selector de tema del panel: 2026-11-17. |
| Dependencias | ninguna |

## Propósito

Que cada usuario ajuste la aplicación a sí mismo: idioma, tamaño de letra, tema claro u oscuro, unidades de medida, notificaciones y privacidad de la ubicación. Son las preferencias del propio usuario, no un catálogo del administrador. Sostienen la accesibilidad pedida en RNF-19 y RNF-20.

Entradas, proceso y salidas del requisito padre en el Excel (RF-01):

- Entradas: datos personales, credenciales de acceso, perfil deportivo y preferencias de uso.
- Proceso: validar los datos obligatorios, verificar las credenciales al iniciar sesión y guardar los cambios con el consentimiento del usuario.
- Salidas: cuenta creada o modificada, sesión iniciada y mensajes de confirmación o de error.

## Alcance

**Incluye**

- Crear, consultar, actualizar y restablecer las preferencias propias (RF-01-13 a RF-01-16).
- Aplicar al instante la apariencia, el tamaño de letra y las unidades.
- Selector de tema del panel de administración, que reutiliza la misma preferencia (ver [Panel de administración](transversal/panel-de-administracion.md)).

**No incluye**

- Que las notificaciones y la privacidad de ubicación tengan efecto real: dependen de [EP-18](18-notificaciones.md) y [EP-16](16-ubicacion-compartida.md); hoy se guardan y se marcan «Próximamente».
- Otros idiomas distintos del español.

## Reglas de negocio

Del Excel (hoja MODULOS), por operación:

- Reglas comunes: los datos obligatorios están completos, el registro existe al modificarlo o eliminarlo, los datos modificados cumplen las validaciones del alta y se pide confirmación previa antes de eliminar.
- Que el usuario no tenga ya preferencias guardadas.
- Aplicar las preferencias al abrir la aplicación.
- Que los valores elegidos sean opciones disponibles.
- Restablecer los valores por defecto.

Decididas por el equipo o derivadas de otros documentos:

- Valores por defecto: idioma `es`, letra normal, apariencia clara, unidades métricas, notificaciones activas y ubicación visible solo para los contactos durante la sesión.
- Un documento sin guardar se lee como los valores por defecto, sin escribirlo.
- Restablecer elimina el documento y devuelve los valores por defecto.

## Modelo de datos y contrato de API

**Estado: implementado** (`backend/apps/users`, `frontend/src/app/preferences`).

| Endpoint | Descripción |
| --- | --- |
| `GET /users/me/preferences` | Preferencias guardadas, o los valores por defecto si el usuario nunca guardó. |
| `PUT /users/me/preferences` | Reemplaza el documento completo. |
| `DELETE /users/me/preferences` | Restablece (elimina el documento). |

Documento `users/{uid}/private/preferences`:

| Campo | Valores | Efecto hoy |
| --- | --- | --- |
| `language` | `es` | Solo español |
| `fontScale` | `small`, `normal`, `large`, `xlarge` | Multiplica el tamaño de la raíz (0,9 / 1 / 1,15 / 1,3) |
| `appearance` | `system`, `light`, `dark` | Fija `data-theme` en `<html>` |
| `units` | `metric`, `imperial` | Distancias y elevaciones (el ritmo sigue en min/km) |
| `notifications` | `{enabled, safetyAlerts, events}` | Se guarda; marcado «Próximamente» |
| `locationPrivacy` | `trustedContactsDuringSession`, `off` | Se guarda; marcado «Próximamente» |

La app mantiene una copia local por usuario para aplicar el tema antes de que responda la API.

## Historias

| ID | Historia | Actor | Sprint | Estado |
| --- | --- | --- | --- | --- |
| [RF-01-13](#rf-01-13--crear-preferencia-de-usuario) | Crear preferencia de usuario | Usuario | Sprint 1 · Semana 5 | Parcial |
| [RF-01-14](#rf-01-14--leer-preferencias-de-usuario) | Leer preferencias de usuario | Usuario | Sprint 1 · Semana 5 | Parcial |
| [RF-01-15](#rf-01-15--actualizar-preferencia-de-usuario) | Actualizar preferencia de usuario | Usuario | Sprint 1 · Semana 5 | Parcial |
| [RF-01-16](#rf-01-16--eliminar-preferencias-de-usuario-restablecer) | Eliminar preferencias de usuario (restablecer) | Usuario | Sprint 1 · Semana 5 | Parcial |

Leyenda: `Hecha` = todos los criterios marcados con evidencia; `Parcial` = implementada pero con criterios sin cumplir o sin verificar; `Pendiente` = sin implementar.

## Historias de usuario y criterios de aceptación

### RF-01-13 — Crear preferencia de usuario

- **Historia de usuario:** Como corredor · Deseo configurar mis preferencias de la aplicación (idioma, tamaño de letra, modo oscuro, unidades, notificaciones y privacidad). Para adaptar la aplicación a mis necesidades.
- **Actor:** Usuario · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 5 · **Dependencia:** N/A · **Caso de uso:** Configurar preferencias
- **Estado:** `Parcial` — Implementada y con pruebas automáticas; commits `f5f3f83` (frontend) y `488674c` (backend); el selector de tema del panel se verificó en el navegador el 2026-11-17 (`23c62d0`).

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Idioma (opcional); Tamaño de letra (opcional); Modo oscuro (opcional); Unidades de medida (opcional); Notificaciones (opcional); Privacidad de la ubicación (opcional) | El sistema deberá permitir crear las preferencias de la aplicación del usuario (idioma, tamaño de letra, modo oscuro, unidades de medida, notificaciones y privacidad de la ubicación), para adaptarla a sus necesidades. | Registro de «preferencia de usuario» creado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Un usuario sin preferencias guardadas ve los valores por defecto (español, letra normal, tema claro, métrico, notificaciones activas, ubicación solo para contactos durante la sesión) sin que se escriba nada.
- [x] `/app/cuenta/preferencias` guarda el borrador completo con `PUT /users/me/preferences` y confirma con un aviso, sin remontar el formulario.
- [x] Las preferencias inválidas se rechazan sin guardar (cliente y API, con el motivo por campo).
- [x] Los grupos que todavía no tienen efecto (notificaciones, privacidad de ubicación) se marcan «Próximamente».
- [ ] Verificado de punta a punta en un navegador o en un celular contra la API y Firebase (CONTEXTO 17.4: el área del corredor solo está validada con pruebas unitarias y compilación).

**Implementación:** `frontend/src/app/preferences/presentation/preferences.page.ts`, `frontend/src/app/preferences/application/preferences-use-cases.ts`, `frontend/src/app/preferences/domain/preferences.ts`, `frontend/src/app/preferences/infrastructure/http-preferences.repository.ts`, `backend/apps/users/presentation/views.py`, `backend/apps/users/domain/models.py`

**Pruebas:** `frontend/src/app/preferences/presentation/preferences.page.spec.ts`, `frontend/src/app/preferences/application/preferences-use-cases.spec.ts`, `frontend/src/app/preferences/domain/preferences.spec.ts`, `backend/tests/test_private_documents_api.py`

### RF-01-14 — Leer preferencias de usuario

- **Historia de usuario:** Como corredor · Deseo que mis preferencias guardadas se apliquen al abrir la aplicación. Para no tener que configurarlas cada vez.
- **Actor:** Usuario · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 5 · **Dependencia:** N/A · **Caso de uso:** Aplicar preferencias guardadas
- **Estado:** `Parcial` — Implementada y con pruebas automáticas; commits `f5f3f83` (frontend) y `488674c` (backend); el selector de tema del panel se verificó en el navegador el 2026-11-17 (`23c62d0`).

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Idioma (filtro); Tamaño de letra (filtro); Modo oscuro (filtro); Unidades de medida (filtro) | El sistema deberá permitir leer las preferencias guardadas del usuario y aplicarlas al abrir la aplicación. | Datos de «preferencias de usuario» (lista o detalle) o aviso de que no hay resultados. |

**Criterios de aceptación**

- [x] Solo el propio usuario lee sus preferencias (`GET /users/me/preferences`); un documento nunca guardado devuelve los valores por defecto.
- [x] Al iniciar la app se aplica primero la copia local del dispositivo y después lo que responde la API; nunca se aplican las preferencias de otro usuario.
- [x] Si la API falla, se conserva la copia local y se informa el error; en la pantalla se ofrece reintentar.
- [x] Un documento guardado con campos inválidos o ajenos al esquema se lee con valores por defecto para esos campos y sin las claves desconocidas.
- [ ] Verificado de punta a punta en un navegador o en un celular contra la API y Firebase (CONTEXTO 17.4: el área del corredor solo está validada con pruebas unitarias y compilación).

**Implementación:** `frontend/src/app/preferences/application/preferences.store.ts`, `frontend/src/app/preferences/application/preferences-use-cases.ts`, `frontend/src/app/preferences/infrastructure/local-storage-preferences.cache.ts`, `frontend/src/app/preferences/domain/preferences.ts`

**Pruebas:** `frontend/src/app/preferences/application/preferences.store.spec.ts`, `frontend/src/app/preferences/application/preferences-use-cases.spec.ts`, `backend/tests/test_private_documents_api.py`

### RF-01-15 — Actualizar preferencia de usuario

- **Historia de usuario:** Como corredor · Deseo actualizar mis preferencias de la aplicación. Para ajustar la aplicación cuando cambian mis necesidades.
- **Actor:** Usuario · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 5 · **Dependencia:** N/A · **Caso de uso:** Actualizar preferencias
- **Estado:** `Parcial` — Implementada y con pruebas automáticas; commits `f5f3f83` (frontend) y `488674c` (backend); el selector de tema del panel se verificó en el navegador el 2026-11-17 (`23c62d0`).

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Idioma (opcional); Tamaño de letra (opcional); Modo oscuro (opcional); Unidades de medida (opcional); Notificaciones (opcional); Privacidad de la ubicación (opcional) | El sistema deberá permitir actualizar el idioma, el tamaño de letra, el modo oscuro, las unidades, las notificaciones o la privacidad, para ajustar la aplicación cuando cambian sus necesidades. | Registro de «preferencia de usuario» actualizado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] Un cambio guardado se aplica al instante: la apariencia fija `data-theme`, el tamaño de letra fija `--rc-font-scale` y las unidades cambian las distancias y elevaciones.
- [x] Apagar el interruptor principal de notificaciones apaga también los demás; un error al guardar conserva el borrador.
- [x] El selector de tema del panel de administración guarda la misma preferencia y la aplica sin recargar (ver [Panel de administración](transversal/panel-de-administracion.md)).
- [ ] Las notificaciones y la privacidad de ubicación cambian el comportamiento de la app (hoy solo se guardan; dependen de [EP-18](18-notificaciones.md) y [EP-16](16-ubicacion-compartida.md)).
- [ ] Verificado de punta a punta en un navegador o en un celular contra la API y Firebase (CONTEXTO 17.4: el área del corredor solo está validada con pruebas unitarias y compilación).

**Implementación:** `frontend/src/app/preferences/presentation/preferences.page.ts`, `frontend/src/app/preferences/application/preferences.store.ts`, `frontend/src/app/preferences/infrastructure/document-preferences-display.ts`, `frontend/src/app/preferences/domain/units.ts`, `frontend/src/app/admin/theme-selector.ts`

**Pruebas:** `frontend/src/app/preferences/presentation/preferences.page.spec.ts`, `frontend/src/app/preferences/application/preferences.store.spec.ts`, `frontend/src/app/preferences/domain/units.spec.ts`, `frontend/src/app/preferences/infrastructure/document-preferences-display.spec.ts`, `frontend/src/app/admin/theme-selector.spec.ts`

### RF-01-16 — Eliminar preferencias de usuario (restablecer)

- **Historia de usuario:** Como corredor · Deseo restablecer mis preferencias a los valores por defecto. Para volver a la configuración inicial de la aplicación.
- **Actor:** Usuario · **Prioridad:** Debe tener · **Sprint planificado:** Sprint 1 · Semana 5 · **Dependencia:** N/A · **Caso de uso:** Restablecer preferencias
- **Estado:** `Parcial` — Implementada y con pruebas automáticas; commits `f5f3f83` (frontend) y `488674c` (backend); el selector de tema del panel se verificó en el navegador el 2026-11-17 (`23c62d0`).

| Entrada | Proceso | Salida |
| --- | --- | --- |
| Identificador del registro (opcional) | El sistema deberá permitir eliminar las preferencias personalizadas, restableciendo los valores por defecto. | Registro de «preferencias de usuario» eliminado y mensaje de confirmación o de error. |

**Criterios de aceptación**

- [x] La pantalla pide confirmación antes de restablecer y, si se cancela, no cambia nada.
- [x] Restablecer elimina el documento (`DELETE /users/me/preferences`), limpia la copia local y devuelve los valores por defecto; se aplican al instante.
- [x] Si el servidor rechaza la eliminación, se conserva la copia local.
- [x] Al cerrar sesión la app vuelve a los valores por defecto.
- [ ] Verificado de punta a punta en un navegador o en un celular contra la API y Firebase (CONTEXTO 17.4: el área del corredor solo está validada con pruebas unitarias y compilación).

**Implementación:** `frontend/src/app/preferences/presentation/preferences.page.ts`, `frontend/src/app/preferences/application/preferences-use-cases.ts`, `frontend/src/app/preferences/application/preferences.store.ts`, `backend/apps/users/presentation/views.py`

**Pruebas:** `frontend/src/app/preferences/presentation/preferences.page.spec.ts`, `frontend/src/app/preferences/application/preferences-use-cases.spec.ts`, `frontend/src/app/preferences/application/preferences.store.spec.ts`, `backend/tests/test_private_documents_api.py`

## Dependencias

- **Depende de:** ninguna.

## Supuestos por validar

- Las notificaciones vienen activadas por defecto; falta confirmar si deben ser opt-in (CONTEXTO sección 10 punto 9).
- Hoy las preferencias se aplican al guardar; falta decidir si deben aplicarse al instante mientras se edita (punto 13).
- El Excel lista «Modo oscuro» como preferencia; la implementación usa `appearance` con tres valores (sistema, claro, oscuro) (inferido).
- Los criterios de las historias pendientes salen del Excel (entradas, reglas de negocio) y del backlog; los mensajes de confirmación y de error son genéricos, tomados de las salidas del requisito padre (inferido). Se afinan al planificar el sprint.
