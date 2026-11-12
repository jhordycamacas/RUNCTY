"""The Firestore adapters of the users app against a mocked client (no emulator)."""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from google.api_core.exceptions import Conflict, NotFound
from google.cloud.firestore import DELETE_FIELD, SERVER_TIMESTAMP

from apps.users.domain.models import PerfilDeportivo, PreferenciaUsuario, Usuario
from apps.users.infrastructure import firestore_private_documents, firestore_user_repository
from apps.users.infrastructure.firestore_private_documents import (
    FirestorePreferencesRepository,
    FirestoreSportProfileRepository,
)
from apps.users.infrastructure.firestore_user_repository import FirestoreUserRepository

ANA = Usuario("u1", "ana@example.com", "Ana", "Paz", "1990-01-01", "loja", "1104567890")


def snapshot(doc_id: str, data: dict | None = None) -> SimpleNamespace:
    return SimpleNamespace(id=doc_id, exists=data is not None, to_dict=lambda: data)


class TestFirestoreUserRepository:
    @pytest.fixture
    def document(self, monkeypatch) -> MagicMock:
        client = MagicMock()
        monkeypatch.setattr(firestore_user_repository, "firestore_client", lambda: client)
        return client.collection.return_value.document.return_value

    def test_reads_the_profile_with_its_mirrored_role(self, document):
        document.get.return_value = snapshot("u1", {**ANA.to_document(), "role": "runner"})

        user = FirestoreUserRepository().get("u1")

        assert user.first_name == "Ana"
        assert user.role == "runner"

    def test_a_missing_document_is_no_profile(self, document):
        document.get.return_value = snapshot("u1")

        assert FirestoreUserRepository().get("u1") is None

    def test_create_records_consent_and_server_timestamps(self, document):
        assert FirestoreUserRepository().create(ANA) is True

        document.create.assert_called_once_with(
            {
                "uid": "u1",
                "email": "ana@example.com",
                "firstName": "Ana",
                "lastName": "Paz",
                "birthDate": "1990-01-01",
                "cityId": "loja",
                "idNumber": "1104567890",
                "consent": {"lopdp": True, "acceptedAt": SERVER_TIMESTAMP},
                "createdAt": SERVER_TIMESTAMP,
                "updatedAt": SERVER_TIMESTAMP,
            }
        )

    def test_create_never_overwrites_an_existing_profile(self, document):
        document.create.side_effect = Conflict("exists")

        assert FirestoreUserRepository().create(ANA) is False
        document.set.assert_not_called()

    def test_update_writes_personal_data_only(self, document):
        FirestoreUserRepository().update_personal_data(ANA)

        document.update.assert_called_once_with(
            {
                "firstName": "Ana",
                "lastName": "Paz",
                "birthDate": "1990-01-01",
                "cityId": "loja",
                "idNumber": "1104567890",
                "updatedAt": SERVER_TIMESTAMP,
            }
        )

    def test_update_deletes_a_removed_id_number(self, document):
        without_id = Usuario("u1", "ana@example.com", "Ana", "Paz", "1990-01-01", "loja")

        FirestoreUserRepository().update_personal_data(without_id)

        assert document.update.call_args.args[0]["idNumber"] is DELETE_FIELD

    def test_set_role_updates_the_mirror(self, document):
        FirestoreUserRepository().set_role("u1", "runner")

        document.update.assert_called_once_with({"role": "runner", "updatedAt": SERVER_TIMESTAMP})

    def test_set_role_does_not_recreate_a_deleted_profile(self, document):
        document.update.side_effect = NotFound("gone")

        FirestoreUserRepository().set_role("u1", "runner")

        document.set.assert_not_called()


class TestFirestorePrivateDocuments:
    @pytest.fixture
    def client(self, monkeypatch) -> MagicMock:
        client = MagicMock()
        monkeypatch.setattr(firestore_private_documents, "firestore_client", lambda: client)
        return client

    @staticmethod
    def private_document(client) -> MagicMock:
        user = client.collection.return_value.document.return_value
        return user.collection.return_value.document.return_value

    @pytest.mark.parametrize(
        ("repository", "document_id"),
        [
            (FirestoreSportProfileRepository, "sportProfile"),
            (FirestorePreferencesRepository, "preferences"),
        ],
    )
    def test_each_model_lives_in_its_own_document_of_the_owner(
        self, client, repository, document_id
    ):
        repository().delete("u1")

        client.collection.assert_called_once_with("users")
        client.collection.return_value.document.assert_called_once_with("u1")
        user = client.collection.return_value.document.return_value
        user.collection.assert_called_once_with("private")
        user.collection.return_value.document.assert_called_once_with(document_id)
        self.private_document(client).delete.assert_called_once_with()

    def test_save_replaces_the_document_and_stamps_it(self, client):
        profile = PerfilDeportivo("advanced", ("pace",), 300, 21)

        FirestoreSportProfileRepository().save("u1", profile)

        self.private_document(client).set.assert_called_once_with(
            {**profile.to_document(), "updatedAt": SERVER_TIMESTAMP}
        )

    def test_reads_the_stored_model(self, client):
        stored = {"fontScale": "large", "updatedAt": object()}
        self.private_document(client).get.return_value = snapshot("preferences", stored)

        assert FirestorePreferencesRepository().get("u1") == PreferenciaUsuario(font_scale="large")

    def test_a_missing_document_is_none(self, client):
        self.private_document(client).get.return_value = snapshot("sportProfile")

        assert FirestoreSportProfileRepository().get("u1") is None
