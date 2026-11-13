"""The roles every deployment starts with (RF-02). They cannot be deleted, and `admin` always
holds every permission of the catalogue."""

from apps.roles.domain.models import Rol
from apps.shared.domain.permissions import ALL_PERMISSIONS

SYSTEM_ROLES = (
    Rol(
        id="runner",
        name="Corredor",
        description="Usuario de la app móvil. Sin acceso al panel de administración.",
        permissions=(),
        system=True,
    ),
    Rol(
        id="admin",
        name="Administrador",
        description="Personal de Gacelas con todos los permisos.",
        permissions=tuple(sorted(ALL_PERMISSIONS)),
        system=True,
    ),
    Rol(
        id="club_rep",
        name="Representante de club",
        description="Aporta rutas de su ciudad y apoya la revisión de reportes.",
        permissions=("admin.access", "reports.validate", "routes.manage"),
        system=True,
    ),
)
