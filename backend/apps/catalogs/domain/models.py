"""Option catalogs (`catalogs/{id}`): the choices a runner picks from, which an admin manages
(RF-02, `settings.manage`). The catalog ids are a closed set in code; the items are data.

An item is `{code, label, order, active}`. A code is the value stored in the documents that use
it, so a code that existed can never be removed: it is deactivated instead, and the stored
documents keep their value. `parse` validates an admin edit and raises an `invalid-argument`
domain error naming every rejected field (dotted: `items.2.label`). `from_document` reads what
is stored and never raises. The default items below are the code fallback and the seed.
"""

import re
from collections.abc import Mapping
from dataclasses import dataclass

from apps.shared.domain.errors import invalid_fields

LEVELS_CATALOG = "sportLevels"
GOALS_CATALOG = "sportGoals"
CATALOG_IDS = (LEVELS_CATALOG, GOALS_CATALOG)

MAX_ITEMS = 30
_MAX_LABEL = 60
_CODE = re.compile(r"[a-z][a-zA-Z0-9_-]{0,39}")
_ITEM_KEYS = ("code", "label", "order", "active")


@dataclass(frozen=True, slots=True)
class CatalogItem:
    code: str
    label: str
    order: int
    active: bool = True

    def to_document(self) -> dict[str, object]:
        return {"code": self.code, "label": self.label, "order": self.order, "active": self.active}


def _items(*pairs: tuple[str, str]) -> tuple[CatalogItem, ...]:
    return tuple(CatalogItem(code, label, order) for order, (code, label) in enumerate(pairs, 1))


_DEFAULTS = {
    LEVELS_CATALOG: _items(
        ("beginner", "Principiante"),
        ("intermediate", "Intermedio"),
        ("advanced", "Avanzado"),
    ),
    GOALS_CATALOG: _items(
        ("health", "Salud"),
        ("weightLoss", "Bajar de peso"),
        ("racePrep", "Preparar una carrera"),
        ("pace", "Mejorar el ritmo"),
        ("social", "Correr en compañía"),
    ),
}


def _is_int(value: object) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


def _code_reason(value: object) -> str | None:
    if value is None or value == "":
        return "required"
    if not isinstance(value, str):
        return "invalid"
    return None if _CODE.fullmatch(value) else "invalid-format"


def _label_reason(value: object) -> str | None:
    if value is None:
        return "required"
    if not isinstance(value, str):
        return "invalid"
    if not value.strip():
        return "required"
    return "max-length" if len(value.strip()) > _MAX_LABEL else None


def _order_reason(value: object) -> str | None:
    if value is None:
        return "required"
    return None if _is_int(value) else "invalid"


def _active_reason(value: object) -> str | None:
    if value is None:
        return "required"
    return None if isinstance(value, bool) else "invalid"


def _item_errors(raw: object, index: int) -> dict[str, str]:
    """The reason of each bad field of one raw item, keyed by its dotted name."""
    prefix = f"items.{index}"
    if not isinstance(raw, Mapping):
        return {prefix: "invalid"}
    reasons = {
        "code": _code_reason(raw.get("code")),
        "label": _label_reason(raw.get("label")),
        "order": _order_reason(raw.get("order")),
        "active": _active_reason(raw.get("active")),
    }
    reasons.update({key: "unknown" for key in raw if key not in _ITEM_KEYS})
    return {f"{prefix}.{key}": reason for key, reason in reasons.items() if reason}


def _sorted(items: list[CatalogItem]) -> tuple[CatalogItem, ...]:
    return tuple(sorted(items, key=lambda item: item.order))


@dataclass(frozen=True, slots=True)
class Catalog:
    id: str
    items: tuple[CatalogItem, ...]

    @classmethod
    def defaults(cls, catalog_id: str) -> "Catalog":
        return cls(catalog_id, _DEFAULTS[catalog_id])

    @classmethod
    def parse(cls, catalog_id: str, raw_items: object, current: "Catalog") -> "Catalog":
        """The catalog that replaces `current` with `raw_items`; raises with each rejection."""
        if raw_items is None:
            raise invalid_fields({"items": "required"})
        if not isinstance(raw_items, list):
            raise invalid_fields({"items": "invalid"})
        errors: dict[str, str] = {}
        for index, raw in enumerate(raw_items):
            errors.update(_item_errors(raw, index))
        if len(raw_items) > MAX_ITEMS:
            errors["items"] = "max-length"
        if errors:
            raise invalid_fields(errors)
        items = [
            CatalogItem(raw["code"], raw["label"].strip(), raw["order"], raw["active"])
            for raw in raw_items
        ]
        errors = _rule_errors(items, current)
        if errors:
            raise invalid_fields(errors)
        return cls(catalog_id, _sorted(items))

    @classmethod
    def from_document(cls, catalog_id: str, data: Mapping[str, object]) -> "Catalog":
        """Tolerant read: a malformed or repeated item is skipped."""
        raw_items = data.get("items")
        items: list[CatalogItem] = []
        seen: set[str] = set()
        for index, raw in enumerate(raw_items if isinstance(raw_items, list) else []):
            if _item_errors(raw, index) or raw["code"] in seen:
                continue
            seen.add(raw["code"])
            items.append(
                CatalogItem(raw["code"], raw["label"].strip(), raw["order"], raw["active"])
            )
        return cls(catalog_id, _sorted(items))

    def to_document(self) -> dict[str, object]:
        return {"items": [item.to_document() for item in self.items]}

    def active(self) -> "Catalog":
        return Catalog(self.id, tuple(item for item in self.items if item.active))

    def active_codes(self) -> tuple[str, ...]:
        return tuple(item.code for item in self.items if item.active)


def _rule_errors(items: list[CatalogItem], current: Catalog) -> dict[str, str]:
    """Rules between items: unique codes, nothing removed, at least one active."""
    errors: dict[str, str] = {}
    seen: set[str] = set()
    for index, item in enumerate(items):
        if item.code in seen:
            errors[f"items.{index}.code"] = "duplicate"
        seen.add(item.code)
    if not errors:
        if any(item.code not in seen for item in current.items):
            errors["items"] = "code-removed"
        elif not any(item.active for item in items):
            errors["items"] = "no-active-item"
    return errors
