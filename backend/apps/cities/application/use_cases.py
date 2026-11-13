"""RF-04: the catalogue of cities and zones.

Authority is the `cities.manage` permission of the verified token, checked by the
presentation layer before any of the mutations below.
"""

import unicodedata
from collections.abc import Mapping
from dataclasses import dataclass

from apps.cities.application.ports import CityRepository, CityUsage
from apps.cities.domain.models import Ciudad, parse_city_id, parse_coverage
from apps.shared.domain.errors import DomainError, ErrorKind


@dataclass(frozen=True, slots=True)
class CitiesDeps:
    cities: CityRepository
    usage: CityUsage


def _existing_city(city_id: str, cities: CityRepository) -> Ciudad:
    city = cities.get(city_id)
    if city is None:
        raise DomainError(
            ErrorKind.NOT_FOUND, "city-not-found", f'City "{city_id}" does not exist.'
        )
    return city


def _assert_valid_parent(city: Ciudad, cities: CityRepository) -> None:
    """A zone belongs to an existing city, not to another zone."""
    if city.parent_city_id is None:
        return
    parent = cities.get(city.parent_city_id)
    if parent is None or parent.type != "city":
        raise DomainError(
            ErrorKind.INVALID_ARGUMENT,
            "invalid-parent-city",
            "The parent of a zone must be an existing city.",
        )


def _sort_key(city: Ciudad) -> tuple[str, str]:
    """Name without case or accents, like the clients sorted it (`localeCompare` in Spanish)."""
    plain = unicodedata.normalize("NFD", city.name.casefold())
    return "".join(ch for ch in plain if not unicodedata.combining(ch)), city.id


def list_cities(coverage: object, cities: CityRepository) -> list[Ciudad]:
    """The public catalogue, sorted by name; `coverage=None` lists every city and zone."""
    found = cities.list(None if coverage is None else parse_coverage(coverage))
    return sorted(found, key=_sort_key)


def create_city(raw: Mapping[str, object], deps: CitiesDeps) -> Ciudad:
    city = Ciudad.parse(raw)
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
