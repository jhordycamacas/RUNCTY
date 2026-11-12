from google.api_core.exceptions import Conflict, NotFound
from google.cloud.firestore import DELETE_FIELD, SERVER_TIMESTAMP, CollectionReference

from apps.shared.infrastructure.firebase.app import firestore_client
from apps.shared.infrastructure.firebase.collections import USERS
from apps.users.domain.models import Usuario


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
