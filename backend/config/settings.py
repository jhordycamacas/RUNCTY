"""Configuración de Django para RUNCTY. Los valores sensibles se leen de backend/.env."""
import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')


def variable(nombre, por_defecto=None):
    """Devuelve una variable de .env o detiene Django con un mensaje claro."""
    valor = os.getenv(nombre, por_defecto)
    if valor is None or valor == '':
        raise ImproperlyConfigured(f'Falta la variable {nombre} en backend/.env')
    return valor


def lista(nombre, por_defecto=''):
    """Convierte 'a,b,c' en ['a', 'b', 'c']."""
    return [x.strip() for x in os.getenv(nombre, por_defecto).split(',') if x.strip()]


# DB_ENGINE=sqlite solo sirve para correr las pruebas sin MySQL; por defecto se usa MySQL.
USAR_SQLITE = os.getenv('DB_ENGINE', 'mysql').lower() == 'sqlite'

# --- Seguridad ---------------------------------------------------------------
SECRET_KEY = (
    os.getenv('SECRET_KEY', 'clave-solo-para-pruebas-con-sqlite')
    if USAR_SQLITE
    else variable('SECRET_KEY')
)
DEBUG = os.getenv('DEBUG', 'False').lower() in ('1', 'true', 'yes')
ALLOWED_HOSTS = lista('ALLOWED_HOSTS', 'localhost,127.0.0.1,10.0.2.2')

# --- Aplicaciones -----------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Terceros
    'rest_framework',
    'django_filters',
    'drf_spectacular',
    'corsheaders',
    # Propias (una por módulo de requisitos)
    'usuarios',
    'ciudades',
    'rutas',
    'seguridad',
    'seguridad_personal',
    'entrenamiento',
    'comunidad',
    'clubes',
    'eventos',
    'publicidad',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # antes de CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# --- Base de datos MySQL ----------------------------------------------------
if USAR_SQLITE:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': variable('DB_NAME'),
            'USER': variable('DB_USER'),
            'PASSWORD': variable('DB_PASSWORD'),
            'HOST': variable('DB_HOST', '127.0.0.1'),
            'PORT': variable('DB_PORT', '3307'),
            'OPTIONS': {
                'charset': 'utf8mb4',
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            },
            'TEST': {
                'NAME': f"test_{variable('DB_NAME')}",
                'CHARSET': 'utf8mb4',
                'COLLATION': 'utf8mb4_unicode_ci',
            },
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- Idioma y zona horaria --------------------------------------------------
LANGUAGE_CODE = 'es'
TIME_ZONE = 'America/Guayaquil'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Django REST Framework y documentación ----------------------------------
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # Los decimales (coordenadas, distancias) viajan como números en el JSON.
    'COERCE_DECIMAL_TO_STRING': False,
    'EXCEPTION_HANDLER': 'config.excepciones.manejar_excepcion',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'API RUNCTY',
    'DESCRIPTION': 'Backend Django REST de RUNCTY: rutas seguras para correr en Loja.',
    'VERSION': '1.0.0',
    'COMPONENT_SPLIT_REQUEST': True,
    # Metas y retos comparten las mismas opciones de "tipo".
    'ENUM_NAME_OVERRIDES': {'TipoObjetivoEnum': 'entrenamiento.models.MetaPersonal.Tipo'},
}

# --- CORS: orígenes del frontend web y de la app Android --------------------
CORS_ALLOWED_ORIGINS = lista(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:8100,http://localhost,http://localhost:4200,capacitor://localhost,https://localhost',
)
