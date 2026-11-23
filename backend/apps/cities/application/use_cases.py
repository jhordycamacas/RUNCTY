"""RF-04: the catalogue of cities and zones.

Authority is the `cities.manage` permission of the verified token, checked by the
presentation layer before any of the mutations below.
"""

from collections.abc import Mapping
from dataclasses import dataclass

from apps.cities.application.ports import CityRepository, CityUsage
from apps.cities.domain.models import Ciudad, parse_city_id, parse_coverage
from apps.shared.domain.errors import DomainError, ErrorKind
from apps.shared.domain.text import sort_key
from apps.system_settings.domain.models import SystemSettings


@dataclass(frozen=True, slots=True)
class CitiesDeps:
    cities: CityRepository
    usage: CityUsage
    settings: SystemSettings


def _existing_city(city_id: str, cities: CityRepository) -> Ciudad:
    city = cities.get(city_id)
    if city is None:
        raise DomainError(
            ErrorKind.NOT_FOUND, "city-not-found", f'City "{city_id}" does not exist.'
        )
    return city


def _assert_valid_parent(city: Ciudad, cities: CityRepository) -> None:
    """A zone belongs to an existing top-level city, never to another zone."""
    if city.parent_city_id is None:
        return
    parent = cities.get(city.parent_city_id)
    if parent is None or parent.parent_city_id is not None:
        raise DomainError(
            ErrorKind.INVALID_ARGUMENT,
            "invalid-parent-city",
            "The parent must be an existing city that is not a zone itself.",
        )


def list_cities(coverage: object, cities: CityRepository) -> list[Ciudad]:
    """The public catalogue, sorted by name; `coverage=None` lists every city and zone."""
    found = cities.list(None if coverage is None else parse_coverage(coverage))
    return sorted(found, key=lambda city: (sort_key(city.name), city.id))


def create_city(raw: Mapping[str, object], deps: CitiesDeps) -> Ciudad:
    city = Ciudad.parse(raw, deps.settings.country_code)
    _assert_valid_parent(city, deps.cities)
    if not deps.cities.create(city):
        raise DomainError(
            ErrorKind.ALREADY_EXISTS, "city-exists", f'City "{city.id}" already exists.'
        )
    return city


def update_city(raw_city_id: object, changes: Mapping[str, object], deps: CitiesDeps) -> Ciudad:
    city = _existing_city(parse_city_id(raw_city_id), deps.cities).with_changes(changes)
    _assert_valid_parent(city, deps.cities)
    deps.cities.update(city)
    return city


def delete_city(raw_city_id: object, deps: CitiesDeps) -> None:
    """RF-04-4: a city or zone goes only when no route references it and, for a city,
    when it has no zones left."""
    city_id = parse_city_id(raw_city_id)
    _existing_city(city_id, deps.cities)
    if deps.usage.has_routes(city_id):
        raise DomainError(
            ErrorKind.FAILED_PRECONDITION, "city-has-routes", "The city has associated routes."
        )
    if deps.usage.has_zones(city_id):
        raise DomainError(
            ErrorKind.FAILED_PRECONDITION, "city-has-zones", "The city still has zones."
        )
    deps.cities.delete(city_id)
