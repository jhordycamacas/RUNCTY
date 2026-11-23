"""In-memory adapters so the suite needs no network, emulators or credentials."""

import copy
import time
from dataclasses import replace

from apps.catalogs.infrastructure.firestore_catalog_repository import FirestoreCatalogRepository
from apps.cities.domain.models import Ciudad
from apps.risk_alerts.infrastructure.document_repositories import (
    FirestoreRiskZoneAlertRepository,
)
from apps.roles.application.ports import RoleChange
from apps.roles.domain.models import Rol
from apps.routes.application.ports import Marker, WriteOp
from apps.routes.domain.models import FactorDeRiesgo, FranjaHoraria, RouteState, Ruta, Tramo
from apps.safe_routes.infrastructure.document_repositories import (
    FirestoreSafeRouteRequestRepository,
)
from apps.safety_data.domain.models import IncidenteSeguridad
from apps.safety_data.infrastructure.document_repositories import (
    FirestoreIncidentRepository,
    FirestoreSourceRepository,
)
from apps.shared.application.ports import AuthUserNotFound, TokenRejected
from apps.shared.domain.models import Principal
from apps.shared.domain.permissions import ADMIN_ROLE
from apps.shared.infrastructure.firebase.collections import (
    CATALOGS,
    GUARDED_TRAILS,
    INFORMATION_SOURCES,
    RISK_ZONE_ALERTS,
    SAFE_ROUTE_REQUESTS,
    SAFETY_INCIDENTS,
    SUPPORT_POINTS,
    SYSTEM_SETTINGS,
)
from apps.summary.domain.metrics import UserRecord
from apps.support_points.infrastructure.document_repositories import (
    FirestoreGuardedTrailRepository,
    FirestoreSupportPointRepository,
)
from apps.system_settings.domain.models import SystemSettings
from apps.system_settings.infrastructure.firestore_settings_repository import (
    FirestoreSettingsRepository,
)
from apps.users.domain.models import PerfilDeportivo, PreferenciaUsuario, Usuario
from apps.users.domain.profile_photo import ProfilePhoto

# The parameters every test runs with: the defaults of the system settings.
SETTINGS = SystemSettings.defaults()

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
# A delegate that manages the catalogue of cities but not routes.
CATALOGUER = Principal(
    uid="cat-1",
    email="cataloguer@example.com",
    email_verified=True,
    role="cataloguer",
    perms=("admin.access", "cities.manage"),
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
    "cataloguer-token": CATALOGUER,
    "new-user-token": NEW_USER,
}

REJECTIONS = {
    "revoked-token": "token-revoked",
    "disabled-token": "user-disabled",
    "expired-token": "token-expired",
}


class FakeTokenVerifier:
    seconds_since_sign_in = 30

    def verify(self, token: str) -> Principal:
        if token in PRINCIPALS:
            signed_in_at = time.time() - self.seconds_since_sign_in
            return replace(PRINCIPALS[token], auth_time=signed_in_at)
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
        self.emails: dict[str, str] = {}  # uid of the accounts created by email (the seed)
        self.passwords: dict[str, str] = {}  # passwords set by uid after the account was created
        self.users: dict[str, dict] = {}  # `users/{uid}` documents
        self.private: dict[tuple[str, str], dict] = {}  # `users/{uid}/private/{id}` documents
        self.roles: dict[str, Rol] = {}
        self.cities: dict[str, Ciudad] = {}
        self.docs: dict[str, dict] = {}  # the `routes/...` documents by path
        self.id_counter = 0
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

    def delete_user(self, uid: str) -> None:
        self._require(uid)
        self._firebase.fail_if_requested("delete_user")
        del self._firebase.claims[uid]
        self._firebase.calls.append(("auth", uid))


class InMemorySeedAccounts:
    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        self._firebase = firebase or FIREBASE

    def ensure_admin_account(self, email: str, password: str, display_name: str) -> str:
        emails = self._firebase.emails
        if email not in emails:
            emails[email] = f"seed-uid-{len(emails) + 1}"
            self._firebase.claims[emails[email]] = None
        return emails[email]

    def set_password(self, email: str, password: str) -> str | None:
        uid = self._firebase.emails.get(email)
        if uid is not None:
            self._firebase.passwords[uid] = password
        return uid

    def save_admin_profile(self, uid: str, profile: dict) -> None:
        self._firebase.users.setdefault(uid, {}).update(profile)


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


class InMemoryCityRepository:
    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        self._cities = (firebase or FIREBASE).cities

    def get(self, city_id: str) -> Ciudad | None:
        return self._cities.get(city_id)

    def list(self, coverage: str | None = None) -> list[Ciudad]:
        return [
            self._cities[city_id]
            for city_id in sorted(self._cities)
            if coverage is None or self._cities[city_id].coverage == coverage
        ]

    def create(self, city: Ciudad) -> bool:
        if city.id in self._cities:
            return False
        self._cities[city.id] = city
        return True

    def update(self, city: Ciudad) -> None:
        self._cities[city.id] = city

    def delete(self, city_id: str) -> None:
        del self._cities[city_id]


class InMemoryCityUsage:
    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        self._firebase = firebase or FIREBASE

    def has_routes(self, city_id: str) -> bool:
        return any(
            path.startswith("routes/")
            and path.count("/") == 1
            and document.get("cityId") == city_id
            for path, document in self._firebase.docs.items()
        )

    def has_zones(self, city_id: str) -> bool:
        return any(city.parent_city_id == city_id for city in self._firebase.cities.values())


class InMemoryRouteRepository:
    """The route aggregate over `FakeFirebase.docs`, keyed by Firestore path."""

    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        self._firebase = firebase or FIREBASE
        self._docs = self._firebase.docs

    def new_id(self) -> str:
        self._firebase.id_counter += 1
        return f"gen-{self._firebase.id_counter}"

    def get(self, route_id: str) -> Ruta | None:
        document = self._docs.get(f"routes/{route_id}")
        return None if document is None else Ruta.from_document(route_id, document)

    def _children(self, prefix: str) -> list[tuple[str, dict]]:
        """The documents directly under a collection path, as (id, document)."""
        depth = prefix.count("/") + 1
        return [
            (path.rsplit("/", 1)[1], document)
            for path, document in sorted(self._docs.items())
            if path.startswith(prefix + "/") and path.count("/") == depth
        ]

    def state(self, route_id: str) -> RouteState | None:
        if f"routes/{route_id}" not in self._docs:
            return None
        base = f"routes/{route_id}"
        segments = self._children(f"{base}/segments")
        factors = {}
        for segment_id, _ in segments:
            parsed = (
                FactorDeRiesgo.from_document(factor_id, document)
                for factor_id, document in self._children(
                    f"{base}/segments/{segment_id}/riskFactors"
                )
            )
            factors[segment_id] = [factor for factor in parsed if factor is not None]
        incidents = (
            IncidenteSeguridad.from_document(incident_id, document)
            for incident_id, document in self._children(SAFETY_INCIDENTS)
            if document.get("routeId") == route_id
        )
        return RouteState(
            segments=[Tramo.from_document(i, document) for i, document in segments],
            slots=[
                FranjaHoraria.from_document(i, document)
                for i, document in self._children(f"{base}/timeSlots")
            ],
            factors=factors,
            incidents=[incident for incident in incidents if incident is not None],
        )

    def commit(self, ops: list[WriteOp]) -> None:
        self._apply(ops)

    def mutate(self, route_id: str, plan) -> None:
        self._apply(plan(self.state(route_id)))

    def delete_tree(self, route_id: str) -> None:
        base = f"routes/{route_id}"
        for path in [p for p in self._docs if p == base or p.startswith(base + "/")]:
            del self._docs[path]

    def _apply(self, ops: list[WriteOp]) -> None:
        """All or nothing, like a Firestore batch or transaction."""
        documents = copy.deepcopy(self._docs)
        for op in ops:
            if op.op == "delete":
                documents.pop(op.path, None)
                continue
            data = {k: v for k, v in op.data.items() if v is not Marker.DELETE_FIELD}
            data = {
                k: "SERVER_TIMESTAMP" if v is Marker.SERVER_TIMESTAMP else v
                for k, v in data.items()
            }
            if op.op == "set":
                documents[op.path] = data
            else:
                documents[op.path].update(data)  # KeyError for a missing document, like NotFound
                for key, value in op.data.items():
                    if value is Marker.DELETE_FIELD:
                        documents[op.path].pop(key, None)
        self._docs.clear()
        self._docs.update(documents)

    # Last: the name shadows the builtin `list` for the annotations that follow it.
    def list(self, city_id: str | None = None) -> list[Ruta]:
        routes = [
            Ruta.from_document(path.split("/")[1], document)
            for path, document in sorted(self._docs.items())
            if path.startswith("routes/") and path.count("/") == 1
        ]
        return [route for route in routes if city_id is None or route.city_id == city_id]


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

    def scan(
        self, filters: list[tuple[str, str]], start_after: str | None, batch_size: int
    ) -> list[Usuario]:
        users = self._firebase.users
        matching = [
            Usuario.from_document(uid, users[uid])
            for uid in sorted(users)
            if uid > (start_after or "")
            and all(users[uid].get(field) == value for field, value in filters)
        ]
        return matching[:batch_size]

    def delete_user_data(self, uid: str, *, keep_an_admin: bool) -> bool:
        users, private = self._firebase.users, self._firebase.private
        if keep_an_admin and not any(
            other != uid and users[other].get("role") == ADMIN_ROLE for other in users
        ):
            return False
        self._firebase.fail_if_requested("delete_user_data")
        users.pop(uid, None)
        for key in [key for key in private if key[0] == uid]:
            del private[key]
        self._firebase.calls.append(("data", uid))
        return True


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


class InMemoryProfilePhotoRepository(_InMemoryPrivateDocuments):
    document_id = "photo"
    model = ProfilePhoto


class InMemorySummarySource:
    """The summary reads over `FakeFirebase`, like the Firestore adapter but without queries."""

    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        self._firebase = firebase or FIREBASE

    def users(self, limit: int) -> list[UserRecord]:
        users = self._firebase.users
        return [
            UserRecord(users[uid].get("role"), users[uid].get("createdAt")) for uid in sorted(users)
        ][:limit]

    def private_documents(self, limit: int) -> list[tuple[str, dict]]:
        private = self._firebase.private
        return [(key[1], dict(private[key])) for key in sorted(private)][:limit]

    def routes(self, limit: int) -> list[Ruta]:
        return InMemoryRouteRepository(self._firebase).list()[:limit]

    def _under(self, collection: str) -> list[dict]:
        return [
            document
            for path, document in sorted(self._firebase.docs.items())
            if path.split("/")[-2] == collection
        ]

    def time_slot_count(self) -> int:
        return len(self._under("timeSlots"))

    def risk_factor_severities(self, limit: int) -> list[str]:
        return [str(document.get("severity", "")) for document in self._under("riskFactors")][
            :limit
        ]


class InMemoryDocumentStore:
    """`DocumentStore` over the `FakeFirebase.docs` of one top-level collection."""

    def __init__(self, collection: str, firebase: FakeFirebase | None = None) -> None:
        self._collection = collection
        self._firebase = firebase or FIREBASE

    def new_id(self) -> str:
        self._firebase.id_counter += 1
        return f"gen-{self._firebase.id_counter}"

    def get(self, doc_id: str) -> dict | None:
        document = self._firebase.docs.get(f"{self._collection}/{doc_id}")
        return None if document is None else dict(document)

    def all(self) -> list[tuple[str, dict]]:
        prefix = f"{self._collection}/"
        return [
            (path.removeprefix(prefix), dict(document))
            for path, document in sorted(self._firebase.docs.items())
            if path.startswith(prefix) and path.count("/") == 1
        ]

    def where(self, field: str, value: object) -> list[tuple[str, dict]]:
        return [(doc_id, data) for doc_id, data in self.all() if data.get(field) == value]

    def set(self, doc_id: str, data: dict) -> None:
        self._firebase.docs[f"{self._collection}/{doc_id}"] = dict(data)

    def delete(self, doc_id: str) -> None:
        self._firebase.docs.pop(f"{self._collection}/{doc_id}", None)


class InMemorySourceRepository(FirestoreSourceRepository):
    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        super().__init__(InMemoryDocumentStore(INFORMATION_SOURCES, firebase))


class InMemoryIncidentRepository(FirestoreIncidentRepository):
    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        super().__init__(InMemoryDocumentStore(SAFETY_INCIDENTS, firebase))


class InMemorySupportPointRepository(FirestoreSupportPointRepository):
    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        super().__init__(InMemoryDocumentStore(SUPPORT_POINTS, firebase))


class InMemoryGuardedTrailRepository(FirestoreGuardedTrailRepository):
    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        super().__init__(InMemoryDocumentStore(GUARDED_TRAILS, firebase))


class InMemoryRiskZoneAlertRepository(FirestoreRiskZoneAlertRepository):
    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        super().__init__(InMemoryDocumentStore(RISK_ZONE_ALERTS, firebase))


class InMemorySafeRouteRequestRepository(FirestoreSafeRouteRequestRepository):
    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        super().__init__(InMemoryDocumentStore(SAFE_ROUTE_REQUESTS, firebase))


class InMemorySettingsRepository(FirestoreSettingsRepository):
    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        super().__init__(InMemoryDocumentStore(SYSTEM_SETTINGS, firebase))


class InMemoryCatalogRepository(FirestoreCatalogRepository):
    def __init__(self, firebase: FakeFirebase | None = None) -> None:
        super().__init__(InMemoryDocumentStore(CATALOGS, firebase))
