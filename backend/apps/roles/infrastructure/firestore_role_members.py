from google.cloud.firestore import (
    SERVER_TIMESTAMP,
    Client,
    FieldFilter,
    Query,
    Transaction,
    transactional,
)

from apps.roles.application.ports import RoleChange
from apps.shared.infrastructure.firebase.app import firestore_client
from apps.shared.infrastructure.firebase.collections import USERS
from apps.shared.infrastructure.firebase.last_admin import another_admin_exists


def _change_role(
    transaction: Transaction, client: Client, uid: str, role_id: str, keep_an_admin: bool
) -> RoleChange:
    user = client.collection(USERS).document(uid)
    if not user.get(transaction=transaction).exists:
        return RoleChange.PROFILE_MISSING
    if keep_an_admin and not another_admin_exists(client, transaction, uid):
        return RoleChange.LAST_ADMIN
    transaction.update(user, {"role": role_id, "updatedAt": SERVER_TIMESTAMP})
    return RoleChange.APPLIED


class FirestoreRoleMembers:
    """`RoleMembers` adapter over the `role` field of `users/{uid}`."""

    def _with_role(self, role_id: str) -> Query:
        users = firestore_client().collection(USERS)
        # Single-field query, so no composite index is needed.
        return users.where(filter=FieldFilter("role", "==", role_id)).select(["role"])

    def ids_with_role(self, role_id: str) -> list[str]:
        return [snapshot.id for snapshot in self._with_role(role_id).stream()]

    def has_members(self, role_id: str) -> bool:
        return any(True for _ in self._with_role(role_id).limit(1).stream())

    def change_role(self, uid: str, role_id: str, *, keep_an_admin: bool) -> RoleChange:
        client = firestore_client()
        return transactional(_change_role)(
            client.transaction(), client, uid, role_id, keep_an_admin
        )
