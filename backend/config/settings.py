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
AUTH_GATEWAY = "apps.shared.infrastructure.firebase.auth_gateway.FirebaseAuthGateway"
ROLE_REPOSITORY = "apps.roles.infrastructure.firestore_role_repository.FirestoreRoleRepository"
ROLE_MEMBERS = "apps.roles.infrastructure.firestore_role_members.FirestoreRoleMembers"
CITY_REPOSITORY = "apps.cities.infrastructure.firestore_city_repository.FirestoreCityRepository"
CITY_USAGE = "apps.cities.infrastructure.firestore_city_usage.FirestoreCityUsage"
ROUTE_REPOSITORY = "apps.routes.infrastructure.firestore_route_repository.FirestoreRouteRepository"
SUMMARY_SOURCE = "apps.summary.infrastructure.firestore_summary_source.FirestoreSummarySource"
SEED_ACCOUNTS = "apps.seed.infrastructure.firebase_seed_accounts.FirebaseSeedAccounts"
USER_REPOSITORY = "apps.users.infrastructure.firestore_user_repository.FirestoreUserRepository"
SPORT_PROFILE_REPOSITORY = (
    "apps.users.infrastructure.firestore_private_documents.FirestoreSportProfileRepository"
)
PREFERENCES_REPOSITORY = (
    "apps.users.infrastructure.firestore_private_documents.FirestorePreferencesRepository"
)
SOURCE_REPOSITORY = (
    "apps.safety_data.infrastructure.document_repositories.FirestoreSourceRepository"
)
INCIDENT_REPOSITORY = (
    "apps.safety_data.infrastructure.document_repositories.FirestoreIncidentRepository"
)
SUPPORT_POINT_REPOSITORY = (
    "apps.support_points.infrastructure.document_repositories.FirestoreSupportPointRepository"
)
GUARDED_TRAIL_REPOSITORY = (
    "apps.support_points.infrastructure.document_repositories.FirestoreGuardedTrailRepository"
)
RISK_ZONE_ALERT_REPOSITORY = (
    "apps.risk_alerts.infrastructure.document_repositories.FirestoreRiskZoneAlertRepository"
)
SAFE_ROUTE_REQUEST_REPOSITORY = (
    "apps.safe_routes.infrastructure.document_repositories.FirestoreSafeRouteRequestRepository"
)

# --- Django ----------------------------------------------------------------

# Firestore is the data store: no SQL database and none of the contrib apps that need one.
DATABASES = {}
# `apps.seed` only provides the `seed` management command.
INSTALLED_APPS = ["corsheaders", "apps.seed"]

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

# Explicit allowlist from the environment, plus the origins of the Capacitor Android app (its
# WebView serves the frontend from them) and, in debug only, the Ionic and Angular dev servers.
CAPACITOR_ORIGINS = ["https://localhost", "http://localhost", "capacitor://localhost"]
DEV_SERVER_ORIGINS = ["http://localhost:8100", "http://localhost:4200"] if DEBUG else []
CORS_ALLOWED_ORIGINS = [
    *env.list("CORS_ALLOWED_ORIGINS", default=[]),
    *CAPACITOR_ORIGINS,
    *DEV_SERVER_ORIGINS,
]

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
        "auth-failed": env.str("THROTTLE_RATE_AUTH_FAILED", default="20/min"),
        "sensitive": env.str("THROTTLE_RATE_SENSITIVE", default="30/min"),
    },
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "EXCEPTION_HANDLER": "apps.shared.presentation.errors.exception_handler",
    "UNAUTHENTICATED_USER": None,
    "NUM_PROXIES": NUM_PROXIES,
}
