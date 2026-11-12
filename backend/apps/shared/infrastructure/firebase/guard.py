"""Startup guard: a production process must never talk to emulators or demo projects.

Counterpart of the seed guard, which only allows emulators. Pure module (no Django or
Firebase imports) because the settings module calls it while it is being loaded.
"""

from collections.abc import Mapping

# STORAGE_EMULATOR_HOST is the variable google-cloud-storage itself honours.
EMULATOR_HOST_VARIABLES = (
    "FIRESTORE_EMULATOR_HOST",
    "FIREBASE_AUTH_EMULATOR_HOST",
    "FIREBASE_STORAGE_EMULATOR_HOST",
    "STORAGE_EMULATOR_HOST",
)


def check_production_target(
    project_id: str | None, emulator_hosts: Mapping[str, str]
) -> str | None:
    """Returns an error message, or None when the target is a real Firebase project."""
    if emulator_hosts:
        names = ", ".join(sorted(emulator_hosts))
        return f"Refusing to start: {names} must not be set unless DJANGO_DEBUG is true."
    if not project_id:
        return "Refusing to start: FIREBASE_PROJECT_ID is required unless DJANGO_DEBUG is true."
    if project_id.startswith("demo-"):
        return 'Refusing to start: a "demo-" project id is only valid when DJANGO_DEBUG is true.'
    return None
