from google.cloud.firestore import Client, FieldFilter, Transaction

from apps.shared.domain.permissions import ADMIN_ROLE
from apps.shared.infrastructure.firebase.collections import USERS


def another_admin_exists(client: Client, transaction: Transaction, uid: str) -> bool:
    """Whether the role mirror shows an admin other than `uid` (SEC-08, NEW-03).

    Must run inside the transaction that then demotes or deletes `uid`: the admins read here
    are locked until it commits, so two admins cannot remove each other at the same time.
    It fails closed: with a missing or stale mirror nobody counts as "another admin".
    """
    admins = (
        client.collection(USERS)
        .where(filter=FieldFilter("role", "==", ADMIN_ROLE))
        .limit(2)
        .select(["role"])
        .stream(transaction=transaction)
    )
    return any(admin.id != uid for admin in admins)
