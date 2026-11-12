"""Permission classes. Anonymous callers get 401 because DRF checks authentication first."""

from rest_framework.permissions import BasePermission

from apps.shared.domain.models import Principal
from apps.shared.domain.permissions import ALL_PERMISSIONS


class IsAuthenticated(BasePermission):
    """Default permission: every endpoint requires a verified principal unless it opts out."""

    def has_permission(self, request, view) -> bool:
        return isinstance(request.user, Principal)


class IsAdmin(BasePermission):
    code = "admin-only"
    message = "Only administrators can do this."

    def has_permission(self, request, view) -> bool:
        return isinstance(request.user, Principal) and request.user.is_admin


def HasPermission(permission: str) -> type[BasePermission]:  # noqa: N802 - used like a class
    """Builds a permission class that requires `permission` from the catalogue."""
    if permission not in ALL_PERMISSIONS:
        raise ValueError(f"Unknown permission: {permission}")

    class _HasPermission(BasePermission):
        code = "missing-permission"
        message = f"Missing permission {permission}."

        def has_permission(self, request, view) -> bool:
            return isinstance(request.user, Principal) and request.user.has_permission(permission)

    return _HasPermission
