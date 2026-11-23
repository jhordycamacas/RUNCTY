"""RF-01-2: user search for the admin panel, from one text box.

The text is read as an exact id number (10 digits), an exact email (it has an `@`) or a name.
Id number and email are equality filters of the store. Names are matched in memory with a
case- and accent-insensitive prefix over a bounded scan: Firestore cannot match without
accents, and the pilot (one club in Loja) has hundreds of users, not millions. Each request
reads at most `ScanBudget.max_scanned` profiles and returns a cursor to continue.
"""

import re
import unicodedata
from collections.abc import Mapping
from dataclasses import dataclass

from apps.shared.domain.errors import DomainError, ErrorKind
from apps.users.domain.models import Usuario

_DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 50
_MAX_TEXT = 120
_MAX_CURSOR = 128

_ID_NUMBER = re.compile(r"[0-9]{10}")

EqualityFilter = tuple[str, str]


@dataclass(frozen=True, slots=True)
class SearchQuery:
    text: str  # trimmed; empty lists everyone
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
    text = data.get("q")
    if text is not None and (not isinstance(text, str) or len(text) > _MAX_TEXT):
        raise _invalid(
            "invalid-filter", 'The search text "q" must be text of up to 120 characters.'
        )

    cursor = data.get("cursor")
    # A cursor is a document id: a path separator would point outside the collection.
    if cursor is not None and (
        not isinstance(cursor, str) or len(cursor) > _MAX_CURSOR or "/" in cursor
    ):
        raise _invalid("invalid-cursor", "cursor must be a document id.")

    limit = _parse_limit(data["limit"]) if "limit" in data else _DEFAULT_PAGE_SIZE
    return SearchQuery(text=(text or "").strip(), limit=limit, cursor=cursor or None)


def equality_filter(text: str) -> EqualityFilter | None:
    """The exact match the store can answer: an id number or an email, else None."""
    if _ID_NUMBER.fullmatch(text):
        return ("idNumber", text)
    if "@" in text:
        return ("email", text.lower())
    return None


def normalize_name(value: str) -> str:
    """Lowercase, no accents (é → e, ñ → n), collapsed spaces."""
    decomposed = unicodedata.normalize("NFD", value)
    without_accents = "".join(char for char in decomposed if not unicodedata.combining(char))
    return " ".join(without_accents.lower().split())


def matches_text(user: Usuario, text: str) -> bool:
    """Whether every word of `text` starts a word of the name, or `text` starts the email.

    The email is only compared up to its `@`, so the domain never matches.
    """
    query = normalize_name(text)
    name_words = normalize_name(f"{user.first_name} {user.last_name}").split()
    if all(any(word.startswith(part) for word in name_words) for part in query.split()):
        return True
    return " " not in query and user.email.split("@")[0].lower().startswith(query)
