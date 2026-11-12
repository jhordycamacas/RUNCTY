"""Single entry point to the Firebase Admin SDK.

The app is created on first use. Credentials come from `GOOGLE_APPLICATION_CREDENTIALS`
(a service-account file kept outside the repository) or Application Default Credentials.
With the emulators and no credentials file, anonymous credentials are used instead.
"""

import os
from collections.abc import Callable
from functools import lru_cache, partial

import firebase_admin
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from firebase_admin import auth, firestore, messaging, storage
from google.auth.credentials import AnonymousCredentials
from google.cloud.firestore import Client as FirestoreClient
from google.cloud.storage import Bucket


@lru_cache(maxsize=1)
def get_app() -> firebase_admin.App:
    emulator_hosts = settings.FIREBASE_EMULATOR_HOSTS
    storage_host = emulator_hosts.get("FIREBASE_STORAGE_EMULATOR_HOST")
    if storage_host:
        # google-cloud-storage only reads its own variable, which includes the scheme.
        os.environ.setdefault("STORAGE_EMULATOR_HOST", f"http://{storage_host}")

    use_anonymous = emulator_hosts and not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    options = {
        "projectId": settings.FIREBASE_PROJECT_ID,
        "storageBucket": settings.FIREBASE_STORAGE_BUCKET,
    }
    return firebase_admin.initialize_app(
        AnonymousCredentials() if use_anonymous else None,
        {key: value for key, value in options.items() if value},
    )


@lru_cache(maxsize=1)
def auth_client() -> auth.Client:
    return auth.Client(get_app())


def firestore_client() -> FirestoreClient:
    return firestore.client(get_app())


def storage_bucket() -> Bucket:
    """Default bucket (`FIREBASE_STORAGE_BUCKET`)."""
    return storage.bucket(app=get_app())


def messaging_sender() -> Callable[[messaging.Message], str]:
    """Returns a function that sends one FCM message and returns its message id."""
    app = get_app()
    if isinstance(app.credential.get_credential(), AnonymousCredentials):
        raise ImproperlyConfigured(
            "Firebase Cloud Messaging has no emulator: it needs real credentials."
        )
    return partial(messaging.send, app=app)
