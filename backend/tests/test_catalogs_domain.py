"""Option catalogs: the rules every edit must keep."""

import pytest

from apps.catalogs.domain.models import CATALOG_IDS, MAX_ITEMS, Catalog, CatalogItem
from apps.shared.domain.errors import DomainError

LEVELS = Catalog.defaults("sportLevels")


def item(code: str, label: str = "Label", order: int = 0, active: bool = True) -> dict:
    return {"code": code, "label": label, "order": order, "active": active}


def stored(catalog: Catalog) -> list[dict]:
    return catalog.to_document()["items"]


def fields_of(raw_items: object, current: Catalog = LEVELS) -> dict[str, str]:
    with pytest.raises(DomainError) as error:
        Catalog.parse("sportLevels", raw_items, current)
    assert error.value.reason == "invalid-argument"
    return error.value.fields


class TestDefaults:
    def test_the_closed_set_of_catalogs(self):
        assert CATALOG_IDS == ("sportLevels", "sportGoals")

    def test_sport_levels(self):
        assert [(i.code, i.label, i.order, i.active) for i in LEVELS.items] == [
            ("beginner", "Principiante", 1, True),
            ("intermediate", "Intermedio", 2, True),
            ("advanced", "Avanzado", 3, True),
        ]

    def test_sport_goals(self):
        goals = Catalog.defaults("sportGoals")

        assert [(i.code, i.label) for i in goals.items] == [
            ("health", "Salud"),
            ("weightLoss", "Bajar de peso"),
            ("racePrep", "Preparar una carrera"),
            ("pace", "Mejorar el ritmo"),
            ("social", "Correr en compañía"),
        ]
        assert goals.active_codes() == ("health", "weightLoss", "racePrep", "pace", "social")


class TestParse:
    def test_replaces_the_items_trimming_labels_and_sorting_by_order(self):
        raw = [
            item("elite", " Élite ", 9),
            *stored(LEVELS),
            item("novice", "Novato", 0),
        ]

        catalog = Catalog.parse("sportLevels", raw, LEVELS)

        assert [i.code for i in catalog.items] == [
            "novice",
            "beginner",
            "intermediate",
            "advanced",
            "elite",
        ]
        assert catalog.items[-1] == CatalogItem("elite", "Élite", 9, True)
        assert catalog.active_codes() == ("novice", "beginner", "intermediate", "advanced", "elite")

    def test_equal_orders_keep_the_order_they_were_sent_in(self):
        raw = [item("b", order=1), item("a", order=1), *stored(LEVELS)[1:]]
        raw.append({**stored(LEVELS)[0], "order": 0})

        catalog = Catalog.parse("sportLevels", raw, LEVELS)

        assert [i.code for i in catalog.items][:3] == ["beginner", "b", "a"]

    def test_deactivating_never_deletes(self):
        raw = [{**i, "active": i["code"] != "advanced"} for i in stored(LEVELS)]

        catalog = Catalog.parse("sportLevels", raw, LEVELS)

        assert [i.code for i in catalog.items] == ["beginner", "intermediate", "advanced"]
        assert catalog.active_codes() == ("beginner", "intermediate")

    @pytest.mark.parametrize(
        ("code", "reason"),
        [
            (None, "required"),
            ("", "required"),
            (7, "invalid"),
            ("Beginner", "invalid-format"),
            ("1level", "invalid-format"),
            ("two words", "invalid-format"),
            ("ñandú", "invalid-format"),
            ("a" * 41, "invalid-format"),
        ],
    )
    def test_rejects_a_bad_code(self, code, reason):
        assert fields_of([*stored(LEVELS), {**item("x"), "code": code}]) == {"items.3.code": reason}

    @pytest.mark.parametrize("code", ["a", "weightLoss", "half_marathon", "ten-k", "a" * 40])
    def test_accepts_slug_codes(self, code):
        catalog = Catalog.parse("sportLevels", [*stored(LEVELS), item(code)], LEVELS)

        assert code in catalog.active_codes()

    @pytest.mark.parametrize(
        ("label", "reason"),
        [
            (None, "required"),
            ("   ", "required"),
            (7, "invalid"),
            ("x" * 61, "max-length"),
        ],
    )
    def test_rejects_a_bad_label(self, label, reason):
        assert fields_of([*stored(LEVELS), {**item("x"), "label": label}]) == {
            "items.3.label": reason
        }

    def test_accepts_a_label_of_sixty_characters_after_trimming(self):
        raw = [*stored(LEVELS), item("x", f"  {'y' * 60}  ", 9)]

        assert Catalog.parse("sportLevels", raw, LEVELS).items[-1].label == "y" * 60

    @pytest.mark.parametrize(
        ("order", "reason"),
        [(None, "required"), ("1", "invalid"), (1.5, "invalid"), (True, "invalid")],
    )
    def test_rejects_a_bad_order(self, order, reason):
        assert fields_of([*stored(LEVELS), {**item("x"), "order": order}]) == {
            "items.3.order": reason
        }

    @pytest.mark.parametrize(
        ("active", "reason"), [(None, "required"), ("yes", "invalid"), (1, "invalid")]
    )
    def test_rejects_a_bad_active_flag(self, active, reason):
        assert fields_of([*stored(LEVELS), {**item("x"), "active": active}]) == {
            "items.3.active": reason
        }

    def test_rejects_an_item_that_is_not_an_object(self):
        assert fields_of([*stored(LEVELS), "x"]) == {"items.3": "invalid"}

    def test_rejects_an_unknown_item_field(self):
        assert fields_of([*stored(LEVELS), {**item("x"), "color": "red"}]) == {
            "items.3.color": "unknown"
        }

    def test_reports_every_bad_field_at_once(self):
        raw = [{"code": "Bad", "label": "", "order": "x", "active": 3}]

        assert fields_of(raw) == {
            "items.0.code": "invalid-format",
            "items.0.label": "required",
            "items.0.order": "invalid",
            "items.0.active": "invalid",
        }

    def test_rejects_items_that_are_missing_or_not_a_list(self):
        assert fields_of(None) == {"items": "required"}
        assert fields_of("beginner") == {"items": "invalid"}
        assert fields_of({"code": "x"}) == {"items": "invalid"}

    def test_rejects_a_repeated_code_on_its_later_occurrence(self):
        assert fields_of([*stored(LEVELS), item("beginner")]) == {"items.3.code": "duplicate"}

    def test_requires_at_least_one_active_item(self):
        raw = [{**i, "active": False} for i in stored(LEVELS)]

        assert fields_of(raw) == {"items": "no-active-item"}

    def test_a_code_that_existed_can_never_be_removed(self):
        raw = [i for i in stored(LEVELS) if i["code"] != "intermediate"]

        assert fields_of(raw) == {"items": "code-removed"}

    def test_an_empty_list_removes_every_code(self):
        assert fields_of([]) == {"items": "code-removed"}

    def test_a_first_catalog_may_start_from_nothing(self):
        empty = Catalog("sportLevels", ())

        assert Catalog.parse("sportLevels", [item("only")], empty).active_codes() == ("only",)
        assert fields_of([], empty) == {"items": "no-active-item"}

    def test_caps_the_number_of_items(self):
        raw = [item(f"c{n}", order=n) for n in range(MAX_ITEMS + 1)]

        assert fields_of(raw, Catalog("sportLevels", ())) == {"items": "max-length"}


class TestDocument:
    def test_round_trips_through_the_stored_shape(self):
        catalog = Catalog.parse("sportLevels", [*stored(LEVELS), item("elite", order=9)], LEVELS)

        assert Catalog.from_document("sportLevels", catalog.to_document()) == catalog
        assert catalog.to_document() == {"items": stored(catalog)}

    def test_reading_is_tolerant_and_skips_what_is_malformed(self):
        document = {
            "items": [
                item("good", order=2),
                {"code": "Bad Code", "label": "x", "order": 1, "active": True},
                "junk",
                item("good", "Repeated", 3),
                {"code": "first", "label": " First ", "order": 1, "active": False},
            ]
        }

        catalog = Catalog.from_document("sportLevels", document)

        assert catalog.items == (
            CatalogItem("first", "First", 1, False),
            CatalogItem("good", "Label", 2, True),
        )

    def test_a_document_without_items_reads_as_empty(self):
        assert Catalog.from_document("sportLevels", {"items": "x"}).items == ()
        assert Catalog.from_document("sportLevels", {}).items == ()


class TestViews:
    def test_active_keeps_only_the_active_items(self):
        raw = [{**i, "active": i["code"] != "beginner"} for i in stored(LEVELS)]
        catalog = Catalog.parse("sportLevels", raw, LEVELS)

        assert [i.code for i in catalog.active().items] == ["intermediate", "advanced"]
        assert len(catalog.items) == 3
