import logging
from collections.abc import Callable

from django.conf import settings

from apps.shared.infrastructure.firebase.app import (
    auth_client,
    firestore_client,
    messaging_sender,
    storage_bucket,
)

logger = logging.getLogger(__name__)


def _builds(service: str, accessor: Callable[[], object]) -> bool:
    try:
        accessor()
    except Exception:  # noqa: BLE001 - any configuration failure means "not configured"
        logger.warning("Google service %s is not configured", service, exc_info=True)
        return False
    return True


class FirebaseGoogleServicesProbe:
    """`GoogleServicesProbe` adapter: a service is configured when its client can be built.

    Building a client resolves credentials, project and bucket but makes no remote call,
    so this reports configuration, not availability.
    """

    def configured_services(self) -> dict[str, bool]:
        # The lambdas look the accessors up at call time.
        return {
            "auth": _builds("auth", lambda: auth_client()),
            "firestore": _builds("firestore", lambda: firestore_client()),
            "storage": _builds("storage", lambda: storage_bucket()),
            "messaging": _builds("messaging", lambda: messaging_sender()),
            "maps": bool(settings.GOOGLE_MAPS_API_KEY),
        }
