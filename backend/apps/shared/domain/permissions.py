"""Permission catalogue (RF-02).

Permissions travel in the `perms` custom claim of the Firebase ID token (`{role, perms}`),
so they are checked without reading Firestore. Each entry gates one admin area.

| Permission       | Grants                                  |
| ---------------- | --------------------------------------- |
| admin.access     | Sign in to the admin panel              |
| users.read       | Search and read user profiles           |
| roles.manage     | CRUD roles and assign them to users     |
| cities.manage    | CRUD cities and zones                   |
| routes.manage    | CRUD routes and segments                |
| reports.validate | Validate community reports              |
| ads.manage       | Manage advertisers and campaigns        |
| clubs.manage     | Manage clubs and memberships            |
| settings.manage  | Edit the system parameters              |
"""

ALL_PERMISSIONS = (
    "admin.access",
    "users.read",
    "roles.manage",
    "cities.manage",
    "routes.manage",
    "reports.validate",
    "ads.manage",
    "clubs.manage",
    "settings.manage",
)

ADMIN_ROLE = "admin"


def is_permission(value: object) -> bool:
    return isinstance(value, str) and value in ALL_PERMISSIONS


def normalize_permissions(value: object) -> tuple[str, ...] | None:
    """Sorted unique catalogue permissions, or None if anything is outside the catalogue."""
    if not isinstance(value, (list, tuple)) or not all(map(is_permission, value)):
        return None
    return tuple(sorted(set(value)))
