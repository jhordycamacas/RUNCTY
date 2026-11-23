from apps.system_settings.domain.models import SystemSettings
from tests.fakes import FIREBASE, InMemorySettingsRepository

STORED = {"penaltyHigh": 50, "timeZone": "America/Bogota"}


def test_nothing_is_stored_before_the_first_save():
    assert InMemorySettingsRepository().get() is None


def test_saves_one_document_and_reads_it_back():
    repository = InMemorySettingsRepository()
    settings = SystemSettings.defaults().with_changes({"nearbyRadiusM": 800})

    repository.save(settings)

    assert list(FIREBASE.docs) == ["systemSettings/global"]
    assert FIREBASE.docs["systemSettings/global"] == settings.to_document()
    assert repository.get() == settings


def test_saving_again_replaces_the_document():
    repository = InMemorySettingsRepository()
    repository.save(SystemSettings.defaults().with_changes({"nearbyRadiusM": 800}))
    repository.save(SystemSettings.defaults())

    assert repository.get() == SystemSettings.defaults()


def test_a_partial_document_is_completed_with_the_defaults():
    FIREBASE.docs["systemSettings/global"] = dict(STORED)

    settings = InMemorySettingsRepository().get()

    assert (settings.penalty_high, settings.time_zone) == (50, "America/Bogota")
    assert settings.penalty_low == 10
