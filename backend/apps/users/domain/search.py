"""RF-01-2: user search for the admin panel.

Exact filters (email, id number, birth date, city) are equality filters of the store. Names
are matched in memory with a case- and accent-insensitive prefix over a bounded scan:
Firestore cannot match without accents, and the pilot (one club in Loja) has hundreds of
users, not millions. Each request reads at most `ScanBudget.max_scanned` profiles and
returns a cursor to continue.
"""

import re
import unicodedata
from collections.abc import Mapping
from dataclasses import dataclass

from apps.shared.domain.errors import DomainError, ErrorKind
from apps.users.domain.models import Usuario

_DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 50
_MAX_FILTER = 120
_MAX_CURSOR = 128

_EQUALITY_FIELDS = ("email", "idNumber", "birthDate", "cityId")
_TEXT_FILTERS = ("firstName", "lastName", *_EQUALITY_FIELDS)
_FORMATS = {
    "idNumber": re.compile(r"[0-9]{10}"),
    "birthDate": re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}"),
}

EqualityFilter = tuple[str, str]


@dataclass(frozen=True, slots=True)
class SearchQuery:
    filters: Mapping[str, str]
    limit: int
    cursor: str | None  # uid of the last profile scanned for the previous page


@dataclass(frozen=True, slots=True)
class ScanBudget:
    batch_size: int
    max_scanned: int


DEFAULT_SCAN_BUDGET = ScanBudget(batch_size=200, max_scanned=1000)


@dataclass(frozen=True, slots=True)
class UserPage:
    users: list[Usuario]
    next_cursor: str | None


def _invalid(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.INVALID_ARGUMENT, reason, message)


def _parse_limit(value: object) -> int:
    """A positive whole number, as JSON or as the text of a query string."""
    if isinstance(value, str) and value.isascii() and value.isdigit():
        value = int(value)
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise _invalid("invalid-limit", "limit must be a positive integer.")
    return min(value, MAX_PAGE_SIZE)


def parse_search_query(raw: Mapping[str, object] | None) -> SearchQuery:
    data = raw or {}
    filters: dict[str, str] = {}
    for name in _TEXT_FILTERS:
        value = data.get(name)
        if value is None:
            continue
        if not isinstance(value, str) or len(value) > _MAX_FILTER:
            raise _invalid("invalid-filter", f'Filter "{name}" must be text.')
        text = value.strip().lower() if name == "email" else value.strip()
        if not text:
            continue
        if name in _FORMATS and not _FORMATS[name].fullmatch(text):
            raise _invalid("invalid-filter", f'Filter "{name}" has an invalid format.')
        filters[name] = text

    cursor = data.get("cursor")
    # A cursor is a document id: a path separator would point outside the collection.
    if cursor is not None and (
        not isinstance(cursor, str) or len(cursor) > _MAX_CURSOR or "/" in cursor
    ):
        raise _invalid("invalid-cursor", "cursor must be a document id.")

    limit = _parse_limit(data["limit"]) if "limit" in data else _DEFAULT_PAGE_SIZE
    return SearchQuery(filters=filters, limit=limit, cursor=cursor or None)


def equality_filters(filters: Mapping[str, str]) -> list[EqualityFilter]:
    return [(name, filters[name]) for name in _EQUALITY_FIELDS if name in filters]


def normalize_name(value: str) -> str:
    """Lowercase, no accents (é → e, ñ → n), collapsed spaces."""
    decomposed = unicodedata.normalize("NFD", value)
    without_accents = "".join(char for char in decomposed if not unicodedata.combining(char))
    return " ".join(without_accents.lower().split())


def matches_name_prefixes(user: Usuario, filters: Mapping[str, str]) -> bool:
    return all(
        normalize_name(name).startswith(normalize_name(filters.get(filter_name, "")))
        for name, filter_name in ((user.first_name, "firstName"), (user.last_name, "lastName"))
    )
