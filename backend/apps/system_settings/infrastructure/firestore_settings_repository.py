from apps.shared.infrastructure.firebase.collections import SYSTEM_SETTINGS
from apps.shared.infrastructure.firebase.documents import DocumentStore, FirestoreDocumentStore
from apps.system_settings.domain.models import SystemSettings

DOCUMENT_ID = "global"


class FirestoreSettingsRepository:
    """`SettingsRepository` adapter over `systemSettings/global`."""

    def __init__(self, store: DocumentStore | None = None) -> None:
        self._store = store or FirestoreDocumentStore(SYSTEM_SETTINGS)

    def get(self) -> SystemSettings | None:
        data = self._store.get(DOCUMENT_ID)
        return None if data is None else SystemSettings.from_document(data)

    def save(self, settings: SystemSettings) -> None:
        self._store.set(DOCUMENT_ID, settings.to_document())
