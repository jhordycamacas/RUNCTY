# RUNCTY - Backend (Django + MySQL)

API REST de RUNCTY hecha con Django 5.2, Django REST Framework y MySQL 8.4.
Cada módulo de requisitos es una aplicación de Django:

| Aplicación | Requisitos | Modelos |
| --- | --- | --- |
| `usuarios` | RF-01, RF-02 | Rol, Usuario, PerfilDeportivo, Preferencia |
| `ciudades` | RF-04 | Ciudad, Zona |
| `rutas` | RF-05, RF-06 | Ruta, Tramo, PuntoApoyo, SenderoResguardado |
| `seguridad` | RF-07, RF-08, RF-09 | FranjaHoraria, FactorRiesgo, AlertaZona, FuenteInformacion, Incidente, SolicitudRutaSegura |
| `seguridad_personal` | RF-03, RF-15, RF-16 | ContactoConfianza, AlertaPanico, UbicacionCompartida |
| `entrenamiento` | RF-12, RF-13 | Entrenamiento, MetaPersonal |
| `comunidad` | RF-10, RF-14, RF-17, RF-18, RF-22 | Favorita, Valoracion, Reto, ReporteComunitario, Notificacion, SolicitudCompanero |
| `clubes` | RF-11, RF-19, RF-20, RF-21 | Club, Membresia, RutaClub, PuntoEncuentro, SalidaGrupal |
| `eventos` | RF-23 | Evento, Inscripcion |
| `publicidad` | RF-24 | Anunciante, Campana |

## Requisitos

- Python 3.12
- MySQL 8.4 (servicio `MySQL84`, puerto 3307)

## Puesta en marcha

1. Crear el entorno virtual e instalar las dependencias:

   ```bash
   cd backend
   py -3.12 -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Crear la base de datos y el usuario (una sola vez, como `root`). Antes, cambie
   `CAMBIAR_CLAVE` en `sql/01_crear_base.sql` por la clave que usará:

   ```bash
   mysql -u root -p -h 127.0.0.1 -P 3307 < sql/01_crear_base.sql
   ```

3. Copiar `.env.example` como `.env` y poner la misma clave en `DB_PASSWORD` y una
   `SECRET_KEY` propia. El archivo `.env` no se sube a git.

4. Crear las tablas, cargar los datos de ejemplo de Loja y crear un administrador:

   ```bash
   python manage.py migrate
   python manage.py seed
   python manage.py createsuperuser
   ```

5. Levantar el servidor (accesible también desde el emulador Android en `10.0.2.2:8000`):

   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

## Direcciones útiles

- Documentación Swagger: <http://localhost:8000/api/docs/>
- Esquema OpenAPI: <http://localhost:8000/api/schema/>
- Administración de Django: <http://localhost:8000/admin/>
- API: `http://localhost:8000/api/<recurso>/`, por ejemplo `/api/rutas/` o `/api/franjas-horarias/?ruta=1`.

Códigos de respuesta: 200 (consulta o edición), 201 (creado), 204 (eliminado),
400 (datos inválidos, con el error por campo), 404 (no existe) y 409 (no se puede
eliminar porque otros registros dependen de él).

## Reglas de negocio principales

- **Índice de seguridad (RF-07):** cada tramo parte de 100 puntos por franja; cada factor de
  riesgo activo resta según su severidad (baja -10, media -20, alta -35). Niveles: Alto >= 70,
  Medio 40-69, Bajo < 40. La ruta toma el nivel de su peor tramo. Lo calcula el servidor
  (`seguridad/indice.py`) y se muestra en `/api/rutas/` (campos `seguridad` y `nivel_seguridad`).
- **Rutas seguras (RF-09):** al crear una `solicitud-ruta-segura` se devuelven las rutas de la
  ciudad ordenadas de la más segura a la menos segura para la hora pedida.
- Las franjas horarias de una ruta no se solapan.
- Una sola valoración (1 a 5) por usuario y ruta.
- El botón de pánico exige al menos un contacto de confianza.
- Las inscripciones a un evento respetan el cupo; la campaña termina el mismo día o después de empezar.
- La identidad de quien envía un reporte comunitario no se devuelve en la API.

Las reglas están en el método `clean()` de cada modelo, así se aplican igual en la API
(`config/validacion.py`) y en el admin.

## Pruebas

```bash
python manage.py test
```

Si MySQL no está disponible, las pruebas se pueden correr con SQLite:

```bash
# Git Bash
DB_ENGINE=sqlite python manage.py test
# PowerShell
$env:DB_ENGINE="sqlite"; python manage.py test
```

`DB_ENGINE=sqlite` solo es para pruebas; la aplicación usa MySQL.
