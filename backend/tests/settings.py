"""Test settings: a deterministic, production-like environment with fake adapters."""

import os

from apps.shared.infrastructure.firebase.guard import EMULATOR_HOST_VARIABLES

# The suite must never inherit emulator hosts or credentials from the developer shell.
for name in (*EMULATOR_HOST_VARIABLES, "GOOGLE_APPLICATION_CREDENTIALS"):
    os.environ.pop(name, None)

os.environ.update(
    {
        "DJANGO_DEBUG": "false",
        "DJANGO_SECRET_KEY": "test-only-secret-key-that-is-long-enough-for-django-checks",
        "DJANGO_ALLOWED_HOSTS": "testserver",
        "DJANGO_NUM_PROXIES": "0",
        "CORS_ALLOWED_ORIGINS": "https://panel.example.com",
        "FIREBASE_PROJECT_ID": "runcty-test",
        "FIREBASE_STORAGE_BUCKET": "runcty-test.appspot.com",
        "GOOGLE_MAPS_API_KEY": "test-maps-key",
        "THROTTLE_RATE_IP": "1000/min",
        "THROTTLE_RATE_USER": "1000/min",
    }
)

from config.settings import *  # noqa: E402, F403

TOKEN_VERIFIER = "tests.fakes.FakeTokenVerifier"
GOOGLE_SERVICES_PROBE = "tests.fakes.FakeGoogleServicesProbe"
