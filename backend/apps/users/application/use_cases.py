"""RF-01: the account's own profile, sport profile and preferences.

Every use case acts on the uid of the verified token; none takes a uid from the client.
"""

from collections.abc import Mapping
from dataclasses import replace
from datetime import date

from apps.shared.application.ports import AuthGateway
from apps.shared.domain.errors import DomainError, ErrorKind
from apps.shared.domain.models import Principal
from apps.users.application.ports import (
    PreferencesRepository,
    SportProfileRepository,
    UserRepository,
)
from apps.users.domain.models import PerfilDeportivo, PreferenciaUsuario, Usuario
from apps.users.domain.role_assignment import resolve_role_assignment


def _not_found(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.NOT_FOUND, reason, message)


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
        raise DomainError(
            ErrorKind.FAILED_PRECONDITION, "email-required", "The account has no email address."
        )
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
