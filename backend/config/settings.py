"""Environment-driven settings. Secure by default: everything relaxed needs DJANGO_DEBUG=true.

Every variable is documented in `.env.example`.
"""

import environ
from django.core.exceptions import ImproperlyConfigured

from apps.shared.infrastructure.firebase.guard import (
    EMULATOR_HOST_VARIABLES,
    check_production_target,
)

env = environ.Env()

DEBUG = env.bool("DJANGO_DEBUG", default=False)

SECRET_KEY = env.str("DJANGO_SECRET_KEY", default="insecure-development-only-key" if DEBUG else "")
if not SECRET_KEY:
    raise ImproperlyConfigured("DJANGO_SECRET_KEY is required unless DJANGO_DEBUG is true.")

# Empty in debug means Django's default: localhost only.
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=[])

# Reverse proxies in front of the app (0 = clients connect directly).
NUM_PROXIES = env.int("DJANGO_NUM_PROXIES", default=0)

# --- Google services -------------------------------------------------------

FIREBASE_PROJECT_ID = env.str("FIREBASE_PROJECT_ID", default="")
FIREBASE_STORAGE_BUCKET = env.str("FIREBASE_STORAGE_BUCKET", default="")
# The Google SDKs read these variables themselves; they are collected here for the guard.
FIREBASE_EMULATOR_HOSTS = {
    name: env.str(name) for name in EMULATOR_HOST_VARIABLES if env.str(name, default="")
}
GOOGLE_MAPS_API_KEY = env.str("GOOGLE_MAPS_API_KEY", default="")

if not DEBUG:
    target_error = check_production_target(FIREBASE_PROJECT_ID, FIREBASE_EMULATOR_HOSTS)
    if target_error:
        raise ImproperlyConfigured(target_error)

# Adapters behind the application ports (dotted paths, replaced by fakes in the tests).
TOKEN_VERIFIER = (
    # A dotted path, not a credential.
    "apps.shared.infrastructure.firebase.token_verifier.FirebaseTokenVerifier"  # noqa: S105
)
GOOGLE_SERVICES_PROBE = (
    "apps.health.infrastructure.google_services_probe.FirebaseGoogleServicesProbe"
)

# --- Django ----------------------------------------------------------------

# Firestore is the data store: no SQL database and none of the contrib apps that need one.
DATABASES = {}
INSTALLED_APPS = ["corsheaders"]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
USE_TZ = True

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}

# --- Security --------------------------------------------------------------

SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_SSL_REDIRECT = not DEBUG
SECURE_HSTS_SECONDS = 0 if DEBUG else 31_536_000
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
if NUM_PROXIES:
    # TLS ends at the proxy, which must set (and strip from clients) this header.
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Bearer tokens only: there are no cookies, so no CSRF middleware (security.W003).
SILENCED_SYSTEM_CHECKS = ["security.W003"]

# Explicit allowlist; an empty list allows no cross-origin browser client.
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])

# --- REST framework --------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.shared.presentation.authentication.BearerTokenAuthentication",
    ],
    # Deny by default: an endpoint is public only when it says so.
    "DEFAULT_PERMISSION_CLASSES": ["apps.shared.presentation.permissions.IsAuthenticated"],
    "DEFAULT_THROTTLE_CLASSES": [
        "apps.shared.presentation.throttles.IpRateThrottle",
        "apps.shared.presentation.throttles.PrincipalRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "ip": env.str("THROTTLE_RATE_IP", default="120/min"),
        "user": env.str("THROTTLE_RATE_USER", default="240/min"),
    },
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "EXCEPTION_HANDLER": "apps.shared.presentation.errors.exception_handler",
    "UNAUTHENTICATED_USER": None,
    "NUM_PROXIES": NUM_PROXIES,
}
