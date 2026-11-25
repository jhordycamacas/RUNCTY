# RUNCTY · Frontend (Angular + Ionic + Capacitor)

App web y Android de RUNCTY. Consume la API Django de `backend/` (`/api/`) y ofrece listado,
formulario (crear y editar) y detalle para cada una de las 36 entidades.

## Requisitos

- Node.js 22 y npm 10.
- Backend en ejecución: `python manage.py runserver 0.0.0.0:8000` (ver `backend/README` o el README raíz).
- Para Android: Android Studio (SDK 36) y JDK 21.

## Instalar y ejecutar en el navegador

```bash
cd frontend
npm install
npm start            # ng serve → http://localhost:4200
# o, con Ionic CLI instalado:
ionic serve          # → http://localhost:8100
```

La app llama a `http://127.0.0.1:8000/api` desde el navegador. El backend debe permitir el origen
(`CORS_ALLOWED_ORIGINS=http://localhost:8100,http://localhost:4200,http://localhost`).

## Compilar y probar

```bash
npm run build                 # salida en dist/frontend/browser
npx ng test --watch=false     # pruebas unitarias con Vitest
```

Presupuesto de tamaño: el paquete inicial de Ionic + Angular ronda 1,2 MB sin comprimir
(≈ 225 kB transferidos), por eso en `angular.json` el aviso del presupuesto `initial` subió de
500 kB a 1,5 MB; el límite de error sigue en 2 MB.

## Estructura

```
src/app/
├── core/                      # Solo modelos, servicios de API y configuración
│   ├── api.config.ts          # URL base: 127.0.0.1 en web, 10.0.2.2 en Android
│   ├── modelos.ts             # Interfaces de las 36 entidades (campos del esquema OpenAPI)
│   ├── crud.service.ts        # CrudService<T>: listar, obtener, crear, PUT, PATCH, DELETE
│   ├── api.service.ts         # Registro tipado: un CrudService por entidad
│   ├── entidades.ts           # Metadatos: títulos, campos, choices, FK, filtros, hijos
│   └── errores.ts             # Errores DRF (400/404/409/red) → mensajes en español
├── paginas/
│   ├── compartido/            # Componentes de lista, formulario y detalle guiados por metadatos
│   ├── inicio.page.ts         # Panel: totales por módulo y seguridad de las rutas
│   ├── usuarios/ ciudades/ rutas/ seguridad/ seguridad-personal/
│   ├── entrenamiento/ comunidad/ clubes/ eventos/ publicidad/
│   │   └── <entidad>-lista.page.ts, <entidad>-form.page.ts, <entidad>-detalle.page.ts
├── app.routes.ts              # /inicio y, por entidad, /<endpoint>, /nuevo, /:id, /:id/editar
└── app.ts                     # Menú lateral por módulo (ion-split-pane)
```

Las páginas nunca usan `HttpClient`: piden el servicio a `ApiService`. Los errores 400 del backend
se muestran bajo cada campo; el error general, en un aviso y un toast.

## Android

```bash
npm run build
npx cap sync android
cd android
# Windows (PowerShell): $env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
./gradlew assembleDebug       # en Windows: gradlew.bat assembleDebug
```

APK de depuración: `android/app/build/outputs/apk/debug/app-debug.apk`. Instálalo en el emulador
con `adb install -r app/build/outputs/apk/debug/app-debug.apk` o ábrelo con `npx cap open android`.

- La app se llama **RUNCTY** (`appId` `ec.runcty.ingweb`).
- En el emulador la API es `http://10.0.2.2:8000/api` (10.0.2.2 es la PC). El tráfico http sin
  cifrar está permitido solo para desarrollo (`server.cleartext` en `capacitor.config.ts`,
  `usesCleartextTraffic` y `network_security_config.xml`).
- Teléfono real: pon la IP de la PC en `IP_TELEFONO_REAL` (`src/app/core/api.config.ts`) y en
  `ALLOWED_HOSTS` del backend, y agrégala a `android/app/src/main/res/xml/network_security_config.xml`.
