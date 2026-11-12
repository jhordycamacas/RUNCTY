import os

import firebase_admin
import pytest
from django.core.exceptions import ImproperlyConfigured
from google.auth.credentials import AnonymousCredentials

from apps.shared.infrastructure.firebase import app as firebase_app


def _reset():
    firebase_app.get_app.cache_clear()
    firebase_app.auth_client.cache_clear()
    for existing in list(firebase_admin._apps.values()):
        firebase_admin.delete_app(existing)


@pytest.fixture
def emulators(monkeypatch, settings):
    hosts = {
        "FIRESTORE_EMULATOR_HOST": "127.0.0.1:8080",
        "FIREBASE_AUTH_EMULATOR_HOST": "127.0.0.1:9099",
        "FIREBASE_STORAGE_EMULATOR_HOST": "127.0.0.1:9199",
    }
    for name, value in hosts.items():
        monkeypatch.setenv(name, value)
    settings.FIREBASE_EMULATOR_HOSTS = hosts
    settings.FIREBASE_PROJECT_ID = "demo-runcty"
    settings.FIREBASE_STORAGE_BUCKET = "demo-runcty.appspot.com"
    _reset()
    yield
    _reset()
    # Written by the initialiser itself, so monkeypatch does not know about it.
    os.environ.pop("STORAGE_EMULATOR_HOST", None)


def test_app_is_initialised_once_with_project_and_bucket(emulators):
    app = firebase_app.get_app()

    assert firebase_app.get_app() is app
    assert app.project_id == "demo-runcty"
    assert app.options.get("storageBucket") == "demo-runcty.appspot.com"


def test_emulators_need_no_credentials(emulators):
    assert isinstance(firebase_app.get_app().credential.get_credential(), AnonymousCredentials)
    assert firebase_app.auth_client() is firebase_app.auth_client()
    assert firebase_app.firestore_client().project == "demo-runcty"
    assert firebase_app.storage_bucket().name == "demo-runcty.appspot.com"


def test_storage_emulator_host_is_exported_for_google_cloud_storage(emulators):
    firebase_app.get_app()

    assert os.environ["STORAGE_EMULATOR_HOST"] == "http://127.0.0.1:9199"


def test_storage_bucket_requires_a_configured_bucket(emulators, settings):
    settings.FIREBASE_STORAGE_BUCKET = ""
    _reset()

    with pytest.raises(ValueError, match="bucket"):
        firebase_app.storage_bucket()


def test_messaging_refuses_emulator_credentials(emulators):
    with pytest.raises(ImproperlyConfigured, match="Cloud Messaging"):
        firebase_app.messaging_sender()
