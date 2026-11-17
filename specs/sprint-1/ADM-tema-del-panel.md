# ADM-1 — Tema del panel de administración

> Spec de apoyo del Sprint 1 · Estado: **Implementada** (verificada en el navegador con el stack local)

## Historia de usuario

Como administrador · Deseo elegir el tema claro, oscuro o el del sistema en el panel. Para trabajar con la apariencia que me resulta cómoda, igual que en la app del corredor.

## Requisito

Reutiliza la preferencia de apariencia del usuario (RF-01-13, RF-01-15): el panel no define un almacenamiento propio.

## Criterios de aceptación

- [x] El menú del panel, junto a «Cerrar sesión», tiene un selector «Tema» con las opciones «Según el sistema», «Claro» y «Oscuro».
- [x] El selector muestra la apariencia guardada del usuario (claro por defecto) y la sigue si cambia.
- [x] Al elegir una opción se guarda con el caso de uso de preferencias y se aplica al instante, sin recargar.
- [x] La elección persiste tras recargar la página.
- [x] Si el guardado falla, aparece un aviso de error en español y el selector vuelve a la apariencia guardada.
- [x] El selector tiene etiqueta visible y objetivo táctil mínimo del área (48 px en pantallas táctiles).

## Implementación

- `frontend/src/app/admin/theme-selector.ts`
- `frontend/src/app/admin/admin-shell.ts`
- `frontend/src/app/preferences/application/preferences.store.ts` (solo se consume)

## Pruebas

- `frontend/src/app/admin/theme-selector.spec.ts`

## Verificación manual (navegador)

1. Iniciar sesión como `admin@runcty.dev` y abrir `/admin/roles`.
2. Elegir «Oscuro» en «Tema»: el panel cambia al instante; recargar y comprobar que sigue oscuro.
3. Elegir «Claro» y recargar.
