from collections.abc import Mapping

from firebase_admin import auth
from google.cloud.firestore import SERVER_TIMESTAMP

from apps.shared.infrastructure.firebase.app import auth_client, firestore_client
from apps.shared.infrastructure.firebase.collections import USERS


class FirebaseSeedAccounts:
    """`SeedAccounts` adapter backed by Firebase Auth and Firestore."""

    def ensure_admin_account(self, email: str, password: str, display_name: str) -> str:
        try:
            return auth_client().get_user_by_email(email).uid
        except auth.UserNotFoundError:
            created = auth_client().create_user(
                email=email, password=password, display_name=display_name, email_verified=True
            )
            return created.uid

    def save_admin_profile(self, uid: str, profile: Mapping[str, object]) -> None:
        document = firestore_client().collection(USERS).document(uid)
        created = {} if document.get().exists else {"createdAt": SERVER_TIMESTAMP}
        document.set({**profile, **created}, merge=True)
