"""Ported from `functions/src/routes/domain/reorder.test.ts`."""

from dataclasses import dataclass

from apps.routes.domain.reorder import insert_at, move_to, order_updates, ordered_ids, remove_id


@dataclass
class Item:
    id: str
    order: int


def test_ordered_ids_sorts_by_order_and_breaks_ties_by_id():
    assert ordered_ids([Item("c", 2), Item("b", 0), Item("a", 0)]) == ["a", "b", "c"]


def test_insert_at_clamps_out_of_range_indexes_to_the_end():
    assert insert_at(["a", "b"], "x", 1) == ["a", "x", "b"]
    assert insert_at(["a", "b"], "x", 0) == ["x", "a", "b"]
    assert insert_at(["a", "b"], "x", 99) == ["a", "b", "x"]
    assert insert_at(["a", "b"], "x", None) == ["a", "b", "x"]


def test_remove_id_keeps_the_rest_contiguous():
    assert remove_id(["a", "b", "c"], "b") == ["a", "c"]
    assert remove_id(["a"], "z") == ["a"]


def test_move_to_moves_an_id_forward_and_backward():
    assert move_to(["a", "b", "c", "d"], "a", 2) == ["b", "c", "a", "d"]
    assert move_to(["a", "b", "c", "d"], "d", 0) == ["d", "a", "b", "c"]
    assert move_to(["a", "b", "c"], "b", 99) == ["a", "c", "b"]


def test_order_updates_returns_only_the_ids_whose_order_changes():
    before = [Item("a", 0), Item("b", 1), Item("c", 2)]

    assert order_updates(before, ["a", "c"]) == {"c": 1}
    assert order_updates(before, ["c", "a", "b"]) == {"c": 0, "a": 1, "b": 2}
    assert order_updates(before, ["a", "b", "c"]) == {}
