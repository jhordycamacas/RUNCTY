"""System parameters (`settings.manage`, checked by the presentation layer).

Every other use case receives the current `SystemSettings` as a parameter; the presentation
layer reads them with `get_settings`. Saving parameters that drive the safety index recalculates
the stored safety of every route.
"""

from collections.abc import Mapping
from dataclasses import dataclass

from apps.routes.application.ports import RouteRepository
from apps.routes.application.use_cases import recalculate_all_routes
from apps.system_settings.application.ports import SettingsRepository
from apps.system_settings.domain.models import SystemSettings


@dataclass(frozen=True, slots=True)
class SettingsDeps:
    settings: SettingsRepository
    routes: RouteRepository


@dataclass(frozen=True, slots=True)
class SettingsUpdate:
    settings: SystemSettings
    # Routes whose stored safety was recalculated by this update (0 when nothing needed it).
    recalculated: int


def get_settings(settings: SettingsRepository) -> SystemSettings:
    """The stored parameters, or the defaults when nobody saved any."""
    return settings.get() or SystemSettings.defaults()


def update_settings(patch: Mapping[str, object], deps: SettingsDeps) -> SettingsUpdate:
    """Applies the fields of `patch` (by document key) over the current parameters.

    Changing a penalty, a threshold, the incident window or margin, or the time zone also
    recalculates every route, so the stored index never disagrees with the parameters.
    """
    current = get_settings(deps.settings)
    updated = current.with_changes(patch)
    deps.settings.save(updated)
    recalculated = (
        recalculate_all_routes(deps.routes, updated) if current.changes_safety(updated) else 0
    )
    return SettingsUpdate(updated, recalculated)


def recalculate_routes(deps: SettingsDeps) -> int:
    """Recomputes the stored safety of every route with the current parameters."""
    return recalculate_all_routes(deps.routes, get_settings(deps.settings))
