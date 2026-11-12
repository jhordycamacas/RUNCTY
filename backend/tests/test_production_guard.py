import importlib

import pytest
from django.core.exceptions import ImproperlyConfigured

import config.settings
from apps.shared.infrastructure.firebase.guard import check_production_target


def test_real_project_without_emulators_is_accepted():
    assert check_production_target("runcty", {}) is None


@pytest.mark.parametrize(
    "variable",
    [
        "FIRESTORE_EMULATOR_HOST",
        "FIREBASE_AUTH_EMULATOR_HOST",
        "FIREBASE_STORAGE_EMULATOR_HOST",
        "STORAGE_EMULATOR_HOST",
    ],
)
def test_emulator_hosts_are_refused(variable):
    error = check_production_target("runcty", {variable: "127.0.0.1:8080"})

    assert error is not None
    assert variable in error


def test_demo_project_is_refused():
    assert "demo-" in check_production_target("demo-runcty", {})


@pytest.mark.parametrize("project_id", ["", None])
def test_missing_project_is_refused(project_id):
    assert "FIREBASE_PROJECT_ID" in check_production_target(project_id, {})


class TestSettingsStartup:
    """Reloads the settings module under a patched environment."""

    def test_production_refuses_emulator_hosts(self, monkeypatch):
        monkeypatch.setenv("FIRESTORE_EMULATOR_HOST", "127.0.0.1:8080")

        with pytest.raises(ImproperlyConfigured, match="FIRESTORE_EMULATOR_HOST"):
            importlib.reload(config.settings)

    def test_production_refuses_demo_projects(self, monkeypatch):
        monkeypatch.setenv("FIREBASE_PROJECT_ID", "demo-runcty")

        with pytest.raises(ImproperlyConfigured, match="demo-"):
            importlib.reload(config.settings)

    def test_production_requires_a_secret_key(self, monkeypatch):
        monkeypatch.delenv("DJANGO_SECRET_KEY")

        with pytest.raises(ImproperlyConfigured, match="DJANGO_SECRET_KEY"):
            importlib.reload(config.settings)

    def test_debug_allows_emulators_and_demo_projects_without_a_secret_key(self, monkeypatch):
        monkeypatch.setenv("DJANGO_DEBUG", "true")
        monkeypatch.setenv("FIREBASE_PROJECT_ID", "demo-runcty")
        monkeypatch.setenv("FIRESTORE_EMULATOR_HOST", "127.0.0.1:8080")
        monkeypatch.delenv("DJANGO_SECRET_KEY")

        settings = importlib.reload(config.settings)

        assert settings.DEBUG is True
        assert settings.FIREBASE_EMULATOR_HOSTS == {"FIRESTORE_EMULATOR_HOST": "127.0.0.1:8080"}
        assert settings.SECURE_SSL_REDIRECT is False

    def test_debug_is_off_unless_explicitly_enabled(self, monkeypatch):
        monkeypatch.delenv("DJANGO_DEBUG")

        assert importlib.reload(config.settings).DEBUG is False
