from google.api_core.exceptions import Conflict
from google.cloud.firestore import SERVER_TIMESTAMP, CollectionReference

from apps.roles.domain.models import Rol
from apps.shared.infrastructure.firebase.app import firestore_client
from apps.shared.infrastructure.firebase.collections import ROLES


class FirestoreRoleRepository:
    """`RoleRepository` adapter over the `roles` collection."""

    def _roles(self) -> CollectionReference:
        return firestore_client().collection(ROLES)

    def get(self, role_id: str) -> Rol | None:
        snapshot = self._roles().document(role_id).get()
        return Rol.from_document(snapshot.id, snapshot.to_dict()) if snapshot.exists else None

    def list(self) -> list[Rol]:
        return [
            Rol.from_document(snapshot.id, snapshot.to_dict())
            for snapshot in self._roles().stream()
        ]

    def create(self, role: Rol) -> bool:
        document = {
            **role.to_document(),
            "createdAt": SERVER_TIMESTAMP,
            "updatedAt": SERVER_TIMESTAMP,
        }
        try:
            # create() fails if the document appeared in the meantime.
            self._roles().document(role.id).create(document)
        except Conflict:
            return False
        return True

    def update(self, role: Rol) -> None:
        self._roles().document(role.id).update(
            {**role.to_document(), "updatedAt": SERVER_TIMESTAMP}
        )

    def delete(self, role_id: str) -> None:
        self._roles().document(role_id).delete()
