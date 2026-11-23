import pytest

from apps.shared.domain.errors import DomainError
from apps.users.application.use_cases import get_profile_photo, save_profile_photo
from tests.fakes import SETTINGS, InMemoryProfilePhotoRepository
from tests.test_profile_photo_domain import JPEG, PNG, data_url


@pytest.fixture
def photos(firebase) -> InMemoryProfilePhotoRepository:
    return InMemoryProfilePhotoRepository(firebase)


def test_an_account_without_photo_has_none(photos):
    assert get_profile_photo("u1", photos) is None


def test_saves_the_photo_of_the_account(photos, firebase):
    saved = save_profile_photo("u1", data_url(JPEG), photos, SETTINGS)

    assert get_profile_photo("u1", photos) == saved
    assert get_profile_photo("u2", photos) is None
    assert list(firebase.private) == [("u1", "photo")]


def test_saving_again_replaces_it(photos):
    save_profile_photo("u1", data_url(JPEG), photos, SETTINGS)

    replaced = save_profile_photo("u1", data_url(PNG, "image/png"), photos, SETTINGS)

    assert get_profile_photo("u1", photos) == replaced


def test_an_invalid_photo_stores_nothing(photos, firebase):
    with pytest.raises(DomainError) as error:
        save_profile_photo("u1", data_url(PNG), photos, SETTINGS)

    assert error.value.fields == {"photo": "invalid-image"}
    assert firebase.private == {}
