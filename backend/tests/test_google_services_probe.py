import pytest

from apps.health.infrastructure import google_services_probe
from apps.health.infrastructure.google_services_probe import FirebaseGoogleServicesProbe

ACCESSORS = ("auth_client", "firestore_client", "storage_bucket", "messaging_sender")


@pytest.fixture
def accessors(monkeypatch):
    for name in ACCESSORS:
        monkeypatch.setattr(google_services_probe, name, object)
    return monkeypatch


def test_reports_every_service_as_configured(accessors):
    assert FirebaseGoogleServicesProbe().configured_services() == {
        "auth": True,
        "firestore": True,
        "storage": True,
        "messaging": True,
        "maps": True,
    }


def test_a_failing_accessor_marks_only_its_service(accessors):
    def missing_bucket():
        raise ValueError("Storage bucket name not specified.")

    accessors.setattr(google_services_probe, "storage_bucket", missing_bucket)

    status = FirebaseGoogleServicesProbe().configured_services()

    assert status["storage"] is False
    assert status["firestore"] is True


def test_maps_depends_on_the_api_key(accessors, settings):
    settings.GOOGLE_MAPS_API_KEY = ""

    assert FirebaseGoogleServicesProbe().configured_services()["maps"] is False
