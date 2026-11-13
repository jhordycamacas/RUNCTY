"""RF-05: segment order helpers.

Segment `order` is always contiguous (0..n-1); these work on ordered id lists and report the
changed orders.
"""

from collections.abc import Sequence
from typing import Protocol


class Ordered(Protocol):
    id: str
    order: int


def ordered_ids(items: Sequence[Ordered]) -> list[str]:
    return [item.id for item in sorted(items, key=lambda item: (item.order, item.id))]


def insert_at(ids: Sequence[str], item_id: str, index: int | None) -> list[str]:
    """Inserts `item_id` at `index` (clamped); None appends."""
    at = len(ids) if index is None else min(max(index, 0), len(ids))
    return [*ids[:at], item_id, *ids[at:]]


def remove_id(ids: Sequence[str], item_id: str) -> list[str]:
    return [other for other in ids if other != item_id]


def move_to(ids: Sequence[str], item_id: str, index: int) -> list[str]:
    """Moves `item_id` so it ends up at `index` (clamped)."""
    return insert_at(remove_id(ids, item_id), item_id, index)


def order_updates(before: Sequence[Ordered], ids: Sequence[str]) -> dict[str, int]:
    """New `order` for each item whose position in `ids` differs from before."""
    current = {item.id: item.order for item in before}
    return {item_id: index for index, item_id in enumerate(ids) if current.get(item_id) != index}
