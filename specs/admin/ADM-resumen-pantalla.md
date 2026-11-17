# ADM-3 — Pantalla «Resumen» del panel

> Spec de apoyo · Panel de administración · Estado: **En implementación**

## Historia de usuario

Como administrador · Deseo que, al entrar al panel, lo primero que vea sea un Resumen con analíticas de la app móvil. Para tener el pulso del producto de un vistazo.

## Requisito

La sección **Resumen** es la primera del menú, antes de Usuarios, y la pantalla de aterrizaje de `/admin`. Consume `GET /api/v1/admin/summary` (ver `ADM-resumen-endpoint.md`).

## Contenido

1. Saludo con la fecha de hoy en español.
2. Fichas KPI (números grandes, etiqueta pequeña en mayúsculas): Usuarios, Altas en 7 días, Rutas activas, Rutas con nivel Bajo, Ciudades y zonas.
3. Altas por semana (últimas 8 semanas): barras.
4. Rutas por dificultad, por superficie y por ciudad: barras horizontales con número.
5. Nivel de seguridad de las rutas (Alto, Medio, Bajo, Sin índice): barra apilada con leyenda y cifras. Nunca «segura» ni «insegura».
6. Perfil deportivo completado: barra de progreso con porcentaje; preferencias de apariencia y notificaciones activas.
7. Fichas «Próximamente» (sin cifras): Entrenamientos registrados, Alertas SOS y Eventos.

## Criterios de aceptación

- [ ] «Resumen» es la primera sección del menú y `/admin` aterriza en ella para quien tiene `admin.access`; con otro permiso solo, aterriza en su primera sección permitida.
- [ ] Muestra solo cifras que devuelve el endpoint; los bloques `null` no se pintan; las métricas inexistentes son fichas «Próximamente», sin números.
- [ ] Estado de carga con esqueleto, estado de error con «Reintentar» y estado vacío (sin datos todavía) legible.
- [ ] Cada gráfico tiene alternativa textual (`aria-label` y lista equivalente visualmente oculta); el color nunca es la única señal (hay etiqueta y número).
- [ ] Contraste de texto 4,5:1 en claro y oscuro; sin scroll horizontal de la página a 360 px; las tarjetas se reacomodan.
- [ ] Si `truncated` es `true`, un aviso indica que las cifras son un mínimo.
- [ ] Todo el texto está en español; sin gráficos externos (SVG y CSS propios).

## Implementación

- `frontend/src/app/admin/summary/` (dominio, infraestructura, aplicación y presentación)
- `frontend/src/app/admin/admin-sections.ts` y `admin.routes.ts`

## Pruebas

- `frontend/src/app/admin/summary/**/*.spec.ts`
- `frontend/src/app/admin/admin-landing.guard.spec.ts`

## Verificación manual (navegador)

1. Iniciar sesión como `admin@runcty.dev`: `/admin` abre el Resumen.
2. Revisar claro y oscuro, 1280 px y 360 px; apagar la API y comprobar el error con «Reintentar».
