# RUNCTY - Club Gacelas Running Team

Aplicación web y Android para que los corredores encuentren **rutas más seguras para correr** según la ciudad, la distancia y el horario.

> **Rama `RUNCTY_INGWEB`:** versión para la materia Ingeniería Web, construida con **Django + MySQL** en el backend y **Angular + Ionic + Capacitor** en el frontend, siguiendo la estructura de la guía del curso. La rama `main` conserva la versión anterior con Firebase.

## Contexto

Este proyecto nace de un reto académico de la **Universidad Técnica Particular de Loja (UTPL)**. El problema lo planteó el club **Gacelas Running Team** de Loja, Ecuador.

Hoy los corredores no saben dónde, a qué hora ni con qué nivel de seguridad correr. Los principales riesgos en Loja son el acoso callejero, la falta de separación entre vehículos y corredores, la poca iluminación y los desniveles.

RUNCTY no declara una ruta "segura" o "insegura" de forma absoluta. Muestra un **índice de seguridad (Alto / Medio / Bajo) por franja horaria**, explicado por sus factores de riesgo.

## Arquitectura

```
RUNCTY/
├── backend/    Django 5.2 + Django REST Framework + MySQL 8.4
│   ├── config/             settings (lee backend/.env), urls, wsgi
│   ├── usuarios/           Rol, Usuario, PerfilDeportivo, Preferencia
│   ├── ciudades/           Ciudad, Zona (+ comando seed)
│   ├── rutas/              Ruta, Tramo, PuntoApoyo, SenderoResguardado
│   ├── seguridad/          FranjaHoraria, FactorRiesgo, AlertaZona, FuenteInformacion,
│   │                       Incidente, SolicitudRutaSegura (+ índice de seguridad)
│   ├── seguridad_personal/ ContactoConfianza, AlertaPanico, UbicacionCompartida
│   ├── entrenamiento/      Entrenamiento, MetaPersonal
│   ├── comunidad/          Favorita, Valoracion, Reto, ReporteComunitario, Notificacion, SolicitudCompanero
│   ├── clubes/             Club, Membresia, RutaClub, PuntoEncuentro, SalidaGrupal
│   ├── eventos/            Evento, Inscripcion
│   └── publicidad/         Anunciante, Campana
└── frontend/   Angular 22 + Ionic 9 + Capacitor 8 (web y Android)
    └── src/app/
        ├── core/      modelos, servicios de la API (CrudService), configuración, errores
        └── paginas/   lista, formulario y detalle por entidad, agrupadas por módulo
```

- **36 modelos** con relaciones, validaciones y reglas de negocio en `Model.clean()`.
- **API REST** bajo `/api/` con GET, POST, PUT, PATCH y DELETE por entidad (200, 201, 204, 400, 404 y 409).
- **Documentación** en `/api/docs/` (Swagger) y `/api/schema/`. **Administrador** en `/admin/`.
- **Índice de seguridad:** cada tramo parte de 100 puntos por franja y resta 10, 20 o 35 por cada factor activo de severidad baja, media o alta. Alto ≥ 70, Medio 40–69, Bajo < 40; la ruta toma su peor tramo.
- **Android:** app `RUNCTY` (paquete `ec.runcty.ingweb`) que consume `http://10.0.2.2:8000/api`.

## Cómo ejecutarlo

Requisitos: Python 3.12, MySQL 8.4 (servicio en el puerto 3307), Node 22 y, para Android, JDK 21 y Android Studio con un emulador.

1. **Base de datos** (como root): edita la contraseña en `backend/sql/01_crear_base.sql` y ejecútalo:
   `mysql -u root -p -h 127.0.0.1 -P 3307 < backend/sql/01_crear_base.sql`
2. **Backend:**
   ```powershell
   cd backend
   py -3.12 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   Copy-Item .env.example .env   # y completa DB_PASSWORD y SECRET_KEY
   python manage.py migrate
   python manage.py seed          # datos de Loja para las 36 entidades
   python manage.py createsuperuser
   python manage.py runserver 0.0.0.0:8000
   ```
3. **Frontend web:** `cd frontend`, `npm install`, `npx ng serve --port 8100` y abre http://localhost:8100.
4. **Android:** `npm run build`, `npx cap sync android` y, desde `frontend/android`, `.\gradlew.bat assembleDebug`; instala `app/build/outputs/apk/debug/app-debug.apk` en el emulador.

Pruebas: `python manage.py test` en `backend` (325 pruebas) y `npx ng test --watch=false` en `frontend`.

## Entrega

- Documento de requisitos, matriz de trazabilidad y evidencias: [docs/RUNCTY_Requisitos_Trazabilidad_Evidencias.pdf](docs/RUNCTY_Requisitos_Trazabilidad_Evidencias.pdf) (también en `.docx`).
- Capturas de evidencia: [docs/evidencias/](docs/evidencias/).
- Registro del trabajo: [odd/tasks/ingweb-django-mysql.md](odd/tasks/ingweb-django-mysql.md).

## Equipo

| Integrante | Rol |
| --- | --- |
| Jhordy Camacas | Scrum Master |
| Pedro Vargas | Gerente de Proyecto |
| William Jadan | Desarrollo |
| Santiago Matute | Desarrollo |

Tutores: Ing. Segundo Raymundo e Ing. Jorge Landacay.

## Documentación

El contexto completo del proyecto, con requisitos, reglas de negocio y decisiones, está en [CONTEXTO.md](CONTEXTO.md).
