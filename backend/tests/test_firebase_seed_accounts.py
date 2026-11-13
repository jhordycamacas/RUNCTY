"""The seed account adapter against mocked SDK clients (no emulator)."""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from firebase_admin import auth
from google.cloud.firestore import SERVER_TIMESTAMP

from apps.seed.infrastructure import firebase_seed_accounts as module
from apps.seed.infrastructure.firebase_seed_accounts import FirebaseSeedAccounts


@pytest.fixture
def auth_sdk(monkeypatch) -> MagicMock:
    client = MagicMock()
    monkeypatch.setattr(module, "auth_client", lambda: client)
    return client


@pytest.fixture
def users(monkeypatch) -> MagicMock:
    client = MagicMock()
    monkeypatch.setattr(module, "firestore_client", lambda: client)
    return client.collection.return_value.document.return_value


def test_an_existing_account_is_reused(auth_sdk):
    auth_sdk.get_user_by_email.return_value = SimpleNamespace(uid="u1")

    assert FirebaseSeedAccounts().ensure_admin_account("a@b.dev", "pw", "Admin") == "u1"
    auth_sdk.create_user.assert_not_called()


def test_a_missing_account_is_created_verified(auth_sdk):
    auth_sdk.get_user_by_email.side_effect = auth.UserNotFoundError("none")
    auth_sdk.create_user.return_value = SimpleNamespace(uid="u2")

    assert FirebaseSeedAccounts().ensure_admin_account("a@b.dev", "pw", "Admin") == "u2"
    auth_sdk.create_user.assert_called_once_with(
        email="a@b.dev", password="pw", display_name="Admin", email_verified=True
    )


def test_a_new_profile_gets_its_creation_timestamp(users):
    users.get.return_value = SimpleNamespace(exists=False)

    FirebaseSeedAccounts().save_admin_profile("u1", {"role": "admin"})

    users.set.assert_called_once_with({"role": "admin", "createdAt": SERVER_TIMESTAMP}, merge=True)


def test_an_existing_profile_keeps_its_creation_timestamp(users):
    users.get.return_value = SimpleNamespace(exists=True)

    FirebaseSeedAccounts().save_admin_profile("u1", {"role": "admin"})

    users.set.assert_called_once_with({"role": "admin"}, merge=True)
