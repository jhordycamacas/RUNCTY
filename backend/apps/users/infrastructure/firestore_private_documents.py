"""Repositories of the documents under `users/{uid}/private`, one per model."""

from google.cloud.firestore import SERVER_TIMESTAMP, DocumentReference

from apps.shared.infrastructure.firebase.app import firestore_client
from apps.shared.infrastructure.firebase.collections import USER_PRIVATE, USERS
from apps.users.domain.models import PerfilDeportivo, PreferenciaUsuario


class _FirestorePrivateDocument:
    document_id: str
    model: type[PerfilDeportivo] | type[PreferenciaUsuario]

    def _document(self, uid: str) -> DocumentReference:
        user = firestore_client().collection(USERS).document(uid)
        return user.collection(USER_PRIVATE).document(self.document_id)

    def get(self, uid: str):
        snapshot = self._document(uid).get()
        return self.model.from_document(snapshot.to_dict()) if snapshot.exists else None

    def save(self, uid: str, entity) -> None:
        # set() replaces the document, so fields of older versions do not linger.
        self._document(uid).set({**entity.to_document(), "updatedAt": SERVER_TIMESTAMP})

    def delete(self, uid: str) -> None:
        self._document(uid).delete()


class FirestoreSportProfileRepository(_FirestorePrivateDocument):
    """`SportProfileRepository` adapter."""

    document_id = "sportProfile"
    model = PerfilDeportivo


class FirestorePreferencesRepository(_FirestorePrivateDocument):
    """`PreferencesRepository` adapter."""

    document_id = "preferences"
    model = PreferenciaUsuario
