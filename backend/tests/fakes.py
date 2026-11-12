"""In-memory adapters so the suite needs no network, emulators or credentials."""

from apps.roles.application.ports import RoleChange
from apps.roles.domain.models import Rol
from apps.shared.application.ports import AuthUserNotFound, TokenRejected
from apps.shared.domain.models import Principal
from apps.shared.domain.permissions import ADMIN_ROLE
from apps.users.domain.models import PerfilDeportivo, PreferenciaUsuario, Usuario

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
    uid="reader-1", email=None, email_verified=False, role="reader", perms=("users.read",)
)
# A delegate: manages roles without being an admin.
MANAGER = Principal(
    uid="mgr-1",
    email="manager@example.com",
    email_verified=True,
    role="manager",
    perms=("admin.access", "roles.manage", "users.read"),
)
# Signed in with Firebase Auth, but has not completed sign-up: no profile and no role yet.
NEW_USER = Principal(
    uid="new-1", email="new@example.com", email_verified=False, role=None, perms=()
)

PRINCIPALS = {
    "runner-token": RUNNER,
    "admin-token": ADMIN,
    "club-rep-token": CLUB_REP,
    "user-reader-token": USER_READER,
    "manager-token": MANAGER,
    "new-user-token": NEW_USER,
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


class FakeFirebase:
    """In-memory Auth accounts and Firestore documents behind the fake adapters."""

    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.claims: dict[str, dict | None] = {}  # Auth accounts by uid
        self.users: dict[str, dict] = {}  # `users/{uid}` documents
        self.private: dict[tuple[str, str], dict] = {}  # `users/{uid}/private/{id}` documents
        self.roles: dict[str, Rol] = {}
        self.calls: list[tuple] = []  # side effects, in order
        self.failing: set[str] = set()  # operation names that raise

    def add_user(self, uid: str, claims: dict | None = None, **profile) -> None:
        """An Auth account plus its profile, whose `role` mirrors the claim."""
        self.claims[uid] = claims
        self.users[uid] = {"uid": uid, "role": (claims or {}).get("role"), **profile}

    def add_principals(self) -> None:
        """An account for every test token, with Auth claims equal to the token's.

        Principals that hold a role also have a profile, as after a completed sign-up.
        """
        for principal in PRINCIPALS.values():
            if principal.role is None:
                self.claims[principal.uid] = None
                continue
            self.add_user(
                principal.uid,
                {"role": principal.role, "perms": list(principal.perms)},
                email=principal.email or "",
                firstName="Test",
                lastName="User",
                birthDate="1990-01-01",
                cityId="loja",
            )

    def fail_if_requested(self, operation: str) -> None:
        if operation in self.failing:
            raise RuntimeError(f"{operation} failed")


# Used by the adapters the settings name; reset before every test.
FIREBASE = FakeFirebase()


class InMemoryAuthGateway:
    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        self._firebase = firebase or FIREBASE

    def _require(self, uid: str) -> None:
        if uid not in self._firebase.claims:
            raise AuthUserNotFound(uid)

    def get_custom_claims(self, uid: str) -> dict | None:
        self._require(uid)
        claims = self._firebase.claims[uid]
        return None if claims is None else dict(claims)

    def set_custom_claims(self, uid: str, claims: dict) -> None:
        self._require(uid)
        self._firebase.fail_if_requested("set_custom_claims")
        self._firebase.claims[uid] = dict(claims)
        self._firebase.calls.append(("claims", uid))

    def revoke_refresh_tokens(self, uid: str) -> None:
        self._require(uid)
        self._firebase.calls.append(("revoke", uid))


class InMemoryRoleRepository:
    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        self._roles = (firebase or FIREBASE).roles

    def get(self, role_id: str) -> Rol | None:
        return self._roles.get(role_id)

    def list(self) -> list[Rol]:
        return [self._roles[role_id] for role_id in sorted(self._roles)]

    def create(self, role: Rol) -> bool:
        if role.id in self._roles:
            return False
        self._roles[role.id] = role
        return True

    def update(self, role: Rol) -> None:
        self._roles[role.id] = role

    def delete(self, role_id: str) -> None:
        del self._roles[role_id]


class InMemoryRoleMembers:
    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        self._firebase = firebase or FIREBASE

    def ids_with_role(self, role_id: str) -> list[str]:
        users = self._firebase.users
        return sorted(uid for uid in users if users[uid].get("role") == role_id)

    def has_members(self, role_id: str) -> bool:
        return bool(self.ids_with_role(role_id))

    def change_role(self, uid: str, role_id: str, *, keep_an_admin: bool) -> RoleChange:
        if uid not in self._firebase.users:
            return RoleChange.PROFILE_MISSING
        if keep_an_admin and self.ids_with_role(ADMIN_ROLE) in ([], [uid]):
            return RoleChange.LAST_ADMIN
        self._firebase.users[uid]["role"] = role_id
        self._firebase.calls.append(("mirror", uid, role_id))
        return RoleChange.APPLIED


class InMemoryUserRepository:
    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        self._firebase = firebase or FIREBASE

    def get(self, uid: str) -> Usuario | None:
        document = self._firebase.users.get(uid)
        return None if document is None else Usuario.from_document(uid, document)

    def create(self, user: Usuario) -> bool:
        if user.uid in self._firebase.users:
            return False
        self._firebase.users[user.uid] = {**user.to_document(), "consent": {"lopdp": True}}
        return True

    def update_personal_data(self, user: Usuario) -> None:
        document = self._firebase.users[user.uid]
        document.update(user.to_document())
        if user.id_number is None:
            document.pop("idNumber", None)

    def set_role(self, uid: str, role: str) -> None:
        if uid in self._firebase.users:
            self._firebase.users[uid]["role"] = role
            self._firebase.calls.append(("mirror", uid, role))


class _InMemoryPrivateDocuments:
    document_id: str
    model: type

    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        self._private = (firebase or FIREBASE).private

    def get(self, uid: str):
        document = self._private.get((uid, self.document_id))
        return None if document is None else self.model.from_document(document)

    def save(self, uid: str, entity) -> None:
        self._private[(uid, self.document_id)] = entity.to_document()

    def delete(self, uid: str) -> None:
        self._private.pop((uid, self.document_id), None)


class InMemorySportProfileRepository(_InMemoryPrivateDocuments):
    document_id = "sportProfile"
    model = PerfilDeportivo


class InMemoryPreferencesRepository(_InMemoryPrivateDocuments):
    document_id = "preferences"
    model = PreferenciaUsuario
