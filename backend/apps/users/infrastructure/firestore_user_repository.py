from google.api_core.exceptions import Conflict, NotFound
from google.cloud.firestore import (
    DELETE_FIELD,
    SERVER_TIMESTAMP,
    Client,
    CollectionReference,
    FieldFilter,
    Transaction,
    transactional,
)
from google.cloud.firestore_v1.field_path import FieldPath

from apps.shared.infrastructure.firebase.app import firestore_client
from apps.shared.infrastructure.firebase.collections import USER_PRIVATE, USERS
from apps.shared.infrastructure.firebase.last_admin import another_admin_exists
from apps.users.domain.models import Usuario
from apps.users.domain.search import EqualityFilter

# Only these fields leave Firestore in a search (data minimization, LOPDP).
_SUMMARY_FIELDS = ["email", "firstName", "lastName", "birthDate", "cityId", "role"]


def _delete_user_data(
    transaction: Transaction, client: Client, uid: str, keep_an_admin: bool
) -> bool:
    if keep_an_admin and not another_admin_exists(client, transaction, uid):
        return False
    user = client.collection(USERS).document(uid)
    # Firestore does not delete sub-collections with their parent document.
    for private_document in user.collection(USER_PRIVATE).list_documents():
        transaction.delete(private_document)
    transaction.delete(user)
    return True


class FirestoreUserRepository:
    """`UserRepository` adapter over the `users` collection."""

    def _users(self) -> CollectionReference:
        return firestore_client().collection(USERS)

    def get(self, uid: str) -> Usuario | None:
        snapshot = self._users().document(uid).get()
        return Usuario.from_document(uid, snapshot.to_dict()) if snapshot.exists else None

    def create(self, user: Usuario) -> bool:
        document = {
            **user.to_document(),
            "consent": {"lopdp": True, "acceptedAt": SERVER_TIMESTAMP},
            "createdAt": SERVER_TIMESTAMP,
            "updatedAt": SERVER_TIMESTAMP,
        }
        try:
            # create() never overwrites: consent and createdAt are written once.
            self._users().document(user.uid).create(document)
        except Conflict:
            return False
        return True

    def update_personal_data(self, user: Usuario) -> None:
        self._users().document(user.uid).update(
            {
                "firstName": user.first_name,
                "lastName": user.last_name,
                "birthDate": user.birth_date,
                "cityId": user.city_id,
                "idNumber": user.id_number or DELETE_FIELD,
                "updatedAt": SERVER_TIMESTAMP,
            }
        )

    def set_role(self, uid: str, role: str) -> None:
        try:
            # update (not set) so an account deleted in the meantime is not recreated.
            self._users().document(uid).update({"role": role, "updatedAt": SERVER_TIMESTAMP})
        except NotFound:
            pass

    def scan(
        self, filters: list[EqualityFilter], start_after: str | None, batch_size: int
    ) -> list[Usuario]:
        users = self._users()
        query = users.select(_SUMMARY_FIELDS)
        for field, value in filters:
            query = query.where(filter=FieldFilter(field, "==", value))
        query = query.order_by(FieldPath.document_id()).limit(batch_size)
        if start_after:
            query = query.start_after({FieldPath.document_id(): users.document(start_after)})
        return [Usuario.from_document(found.id, found.to_dict()) for found in query.stream()]

    def delete_user_data(self, uid: str, *, keep_an_admin: bool) -> bool:
        client = firestore_client()
        return transactional(_delete_user_data)(client.transaction(), client, uid, keep_an_admin)
