"""RF-01: the account's own profile, sport profile and preferences, and the user search.

Every use case on an account acts on the uid of the verified token; none takes a uid from
the client.
"""

from collections.abc import Mapping
from dataclasses import replace
from datetime import date

from apps.shared.application.ports import AuthGateway, AuthUserNotFound
from apps.shared.domain.errors import DomainError, ErrorKind
from apps.shared.domain.models import Principal
from apps.shared.domain.permissions import ADMIN_ROLE
from apps.users.application.ports import (
    PreferencesRepository,
    SportProfileRepository,
    UserRepository,
)
from apps.users.domain.account_deletion import is_recent_sign_in
from apps.users.domain.models import PerfilDeportivo, PreferenciaUsuario, Usuario
from apps.users.domain.role_assignment import resolve_role_assignment
from apps.users.domain.search import (
    DEFAULT_SCAN_BUDGET,
    ScanBudget,
    SearchQuery,
    UserPage,
    equality_filters,
    matches_name_prefixes,
)


def _not_found(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.NOT_FOUND, reason, message)


def _precondition(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.FAILED_PRECONDITION, reason, message)


def assign_default_role(
    uid: str, doc_role: str | None, users: UserRepository, auth: AuthGateway
) -> str:
    """Gives a new account the `runner` claims and mirrors the role on its profile.

    Idempotent, and it never downgrades an account that already has a role claim.
    """
    decision = resolve_role_assignment(auth.get_custom_claims(uid), doc_role)
    if decision.claims_changed:
        auth.set_custom_claims(uid, decision.claims)
    if decision.doc_changed:
        users.set_role(uid, decision.role)
    return decision.role


def register_user(
    caller: Principal,
    data: Mapping[str, object],
    today: date,
    users: UserRepository,
    auth: AuthGateway,
) -> Usuario:
    """Creates the caller's profile at sign-up and assigns the default role.

    The client must then refresh its ID token to receive the new claims.
    """
    if not caller.email:
        raise _precondition("email-required", "The account has no email address.")
    user = Usuario.register(caller.uid, caller.email, data, today)
    if users.create(user):
        return replace(user, role=assign_default_role(caller.uid, None, users, auth))

    # A repeated sign-up never overwrites the profile. The role step runs anyway: it is
    # idempotent, and the first attempt may have failed between the two writes.
    existing = users.get(caller.uid)
    assign_default_role(caller.uid, existing.role if existing else None, users, auth)
    raise DomainError(
        ErrorKind.ALREADY_EXISTS, "profile-exists", "The account already has a profile."
    )


def get_profile(uid: str, users: UserRepository) -> Usuario:
    user = users.get(uid)
    if user is None:
        raise _not_found("profile-not-found", "The account has no profile.")
    return user


def update_personal_data(
    uid: str, changes: Mapping[str, object], today: date, users: UserRepository
) -> Usuario:
    user = get_profile(uid, users).with_personal_data(changes, today)
    users.update_personal_data(user)
    return user


def get_sport_profile(uid: str, profiles: SportProfileRepository) -> PerfilDeportivo:
    profile = profiles.get(uid)
    if profile is None:
        raise _not_found("sport-profile-not-found", "The account has no sport profile.")
    return profile


def save_sport_profile(
    uid: str, data: Mapping[str, object], profiles: SportProfileRepository
) -> PerfilDeportivo:
    profile = PerfilDeportivo.parse(data)
    profiles.save(uid, profile)
    return profile


def get_preferences(uid: str, preferences: PreferencesRepository) -> PreferenciaUsuario:
    """Raises `preferences-not-found` for an account that never saved any.

    The clients then apply their defaults without writing them.
    """
    saved = preferences.get(uid)
    if saved is None:
        raise _not_found("preferences-not-found", "The account has no saved preferences.")
    return saved


def save_preferences(
    uid: str, data: Mapping[str, object], preferences: PreferencesRepository
) -> PreferenciaUsuario:
    saved = PreferenciaUsuario.parse(data)
    preferences.save(uid, saved)
    return saved


def search_users(
    query: SearchQuery, users: UserRepository, budget: ScanBudget = DEFAULT_SCAN_BUDGET
) -> UserPage:
    """RF-01-2: one page of the profiles that match `query`, scanning at most the budget."""
    filters = equality_filters(query.filters)
    found: list[Usuario] = []
    cursor = query.cursor
    scanned = 0

    while scanned < budget.max_scanned:
        batch_size = min(budget.batch_size, budget.max_scanned - scanned)
        batch = users.scan(filters, cursor, batch_size)
        for user in batch:
            cursor = user.uid
            scanned += 1
            if matches_name_prefixes(user, query.filters):
                found.append(user)
                if len(found) == query.limit:
                    # More profiles may match after this one; the next page resumes here.
                    return UserPage(found, cursor)
        if len(batch) < batch_size:
            return UserPage(found, None)

    # Scan budget exhausted: the admin continues from the last scanned profile.
    return UserPage(found, cursor)


def delete_account(caller: Principal, now: float, users: UserRepository, auth: AuthGateway) -> None:
    """RF-01-4: deletes the caller's profile, private documents and credentials."""
    if not is_recent_sign_in(caller.auth_time, now):
        raise _precondition(
            "recent-sign-in-required", "Re-authenticate before deleting your account."
        )
    try:
        # The stored claims, not the token: the account may have been promoted since (NEW-01).
        claims = auth.get_custom_claims(caller.uid)
    except AuthUserNotFound:
        claims = None
    is_admin = (claims or {}).get("role") == ADMIN_ROLE

    # SEC-08, NEW-03: the panel must always keep at least one admin.
    if not users.delete_user_data(caller.uid, keep_an_admin=is_admin):
        raise _precondition("last-admin", "You cannot delete the last admin account.")
    # Data first: if the auth deletion fails, the user can still sign in and retry.
    try:
        auth.delete_user(caller.uid)
    except AuthUserNotFound:
        pass
