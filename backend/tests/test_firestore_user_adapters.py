"""The Firestore adapters of the users app against a mocked client (no emulator)."""

from types import SimpleNamespace
from unittest.mock import MagicMock, call

import pytest
from google.api_core.exceptions import Conflict, NotFound
from google.cloud.firestore import DELETE_FIELD, SERVER_TIMESTAMP

from apps.users.domain.models import PerfilDeportivo, PreferenciaUsuario, Usuario
from apps.users.infrastructure import firestore_private_documents, firestore_user_repository
from apps.users.infrastructure.firestore_private_documents import (
    FirestorePreferencesRepository,
    FirestoreSportProfileRepository,
)
from apps.users.infrastructure.firestore_user_repository import (
    FirestoreUserRepository,
    _delete_user_data,
)

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


class TestFirestoreUserScan:
    @pytest.fixture
    def users(self, monkeypatch) -> MagicMock:
        client = MagicMock()
        monkeypatch.setattr(firestore_user_repository, "firestore_client", lambda: client)
        return client.collection.return_value

    def test_reads_a_batch_of_summaries_ordered_by_document_id(self, users):
        ordered = users.select.return_value.order_by.return_value
        ordered.limit.return_value.stream.return_value = [
            snapshot("u1", {"email": "ana@example.com", "firstName": "Ana", "role": "runner"}),
            snapshot("u2", {"firstName": "Bruno"}),
        ]

        found = FirestoreUserRepository().scan([], None, 2)

        assert [(user.uid, user.first_name, user.role) for user in found] == [
            ("u1", "Ana", "runner"),
            ("u2", "Bruno", None),
        ]
        # Data minimization: the id number and the consent record never leave Firestore.
        users.select.assert_called_once_with(
            ["email", "firstName", "lastName", "birthDate", "cityId", "role"]
        )
        users.select.return_value.order_by.assert_called_once_with("__name__")
        ordered.limit.assert_called_once_with(2)
        ordered.limit.return_value.start_after.assert_not_called()

    def test_applies_the_equality_filters_and_resumes_after_the_cursor(self, users):
        filtered = users.select.return_value.where.return_value.where.return_value
        limited = filtered.order_by.return_value.limit.return_value
        limited.start_after.return_value.stream.return_value = [snapshot("u4", {})]

        found = FirestoreUserRepository().scan([("cityId", "loja"), ("email", "a@b.ec")], "u3", 5)

        assert [user.uid for user in found] == ["u4"]
        first = users.select.return_value.where.call_args.kwargs["filter"]
        second = users.select.return_value.where.return_value.where.call_args.kwargs["filter"]
        assert [(f.field_path, f.op_string, f.value) for f in (first, second)] == [
            ("cityId", "==", "loja"),
            ("email", "==", "a@b.ec"),
        ]
        users.document.assert_called_once_with("u3")
        limited.start_after.assert_called_once_with({"__name__": users.document.return_value})


class TestDeleteUserDataTransaction:
    """NEW-03: the last-admin check and the deletion share one transaction."""

    @staticmethod
    def given(admins: list[str]) -> tuple[MagicMock, MagicMock]:
        client = MagicMock()
        users = client.collection.return_value
        query = users.where.return_value.limit.return_value.select.return_value
        query.stream.return_value = [snapshot(uid, {}) for uid in admins]
        return client, users

    def test_deletes_the_private_documents_and_the_profile(self):
        client, users = self.given(admins=[])
        user = users.document.return_value
        private = [MagicMock(), MagicMock()]
        user.collection.return_value.list_documents.return_value = private
        transaction = MagicMock()

        assert _delete_user_data(transaction, client, "target", keep_an_admin=False) is True

        users.document.assert_called_once_with("target")
        user.collection.assert_called_once_with("private")
        assert transaction.delete.call_args_list == [call(private[0]), call(private[1]), call(user)]
        users.where.assert_not_called()

    def test_an_admin_is_deleted_when_the_mirror_shows_another_one(self):
        client, users = self.given(admins=["target", "other"])
        transaction = MagicMock()

        assert _delete_user_data(transaction, client, "target", keep_an_admin=True) is True

        query = users.where.return_value.limit.return_value.select.return_value
        query.stream.assert_called_once_with(transaction=transaction)
        transaction.delete.assert_called_with(users.document.return_value)

    @pytest.mark.parametrize("admins", [["target"], []])
    def test_refuses_to_delete_the_last_admin(self, admins):
        client, _ = self.given(admins=admins)
        transaction = MagicMock()

        assert _delete_user_data(transaction, client, "target", keep_an_admin=True) is False

        transaction.delete.assert_not_called()


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
