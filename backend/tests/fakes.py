"""In-memory adapters so the suite needs no network, emulators or credentials."""

from apps.shared.application.ports import TokenRejected
from apps.shared.domain.models import Principal

RUNNER = Principal(
    uid="runner-1", email="runner@example.com", email_verified=True, role="runner", perms=()
)
ADMIN = Principal(
    uid="admin-1", email="admin@example.com", email_verified=True, role="admin", perms=()
)
CLUB_REP = Principal(
    uid="rep-1",
    email="rep@example.com",
    email_verified=False,
    role="club_rep",
    perms=("admin.access", "routes.manage"),
)
USER_READER = Principal(
    uid="reader-1", email=None, email_verified=False, role="support", perms=("users.read",)
)

PRINCIPALS = {
    "runner-token": RUNNER,
    "admin-token": ADMIN,
    "club-rep-token": CLUB_REP,
    "user-reader-token": USER_READER,
}

REJECTIONS = {
    "revoked-token": "token-revoked",
    "disabled-token": "user-disabled",
    "expired-token": "token-expired",
}


class FakeTokenVerifier:
    def verify(self, token: str) -> Principal:
        if token in PRINCIPALS:
            return PRINCIPALS[token]
        reason = REJECTIONS.get(token, "invalid-token")
        raise TokenRejected(reason, f"Rejected: {reason}.")


class FakeGoogleServicesProbe:
    def configured_services(self) -> dict[str, bool]:
        return {"auth": True, "firestore": True, "storage": False, "messaging": False, "maps": True}
