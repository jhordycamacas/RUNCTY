"""Ported from `functions/src/routes/domain/time.test.ts`."""

import pytest

from apps.routes.domain.time import (
    DAY_MINUTES,
    TimeWindow,
    is_iso_date,
    parse_time,
    time_windows_overlap,
    to_window,
)


class TestParseTime:
    def test_parses_hh_mm_into_minutes_since_midnight(self):
        assert parse_time("00:00") == 0
        assert parse_time("06:30") == 390
        assert parse_time("23:59") == 1439

    def test_accepts_24_00_as_the_end_of_the_day(self):
        assert parse_time("24:00") == DAY_MINUTES

    @pytest.mark.parametrize(
        "value",
        ["", "6:30", "24:01", "25:00", "12:60", "12:5", "ab:cd", "12:30:00", "١٢:٣٠", 1230, None],
    )
    def test_returns_none_for_malformed_values(self, value):
        assert parse_time(value) is None


class TestToWindow:
    def test_covers_the_whole_day_when_both_bounds_are_missing(self):
        assert to_window(None, None) == TimeWindow(0, DAY_MINUTES)

    def test_converts_hh_mm_bounds(self):
        assert to_window("18:00", "24:00") == TimeWindow(1080, DAY_MINUTES)


class TestTimeWindowsOverlap:
    def test_detects_overlapping_windows(self):
        assert time_windows_overlap(TimeWindow(360, 540), TimeWindow(480, 600))
        assert time_windows_overlap(TimeWindow(360, 540), TimeWindow(400, 420))
        assert time_windows_overlap(TimeWindow(400, 420), TimeWindow(360, 540))

    def test_treats_windows_as_half_open_so_touching_windows_do_not_overlap(self):
        assert not time_windows_overlap(TimeWindow(360, 540), TimeWindow(540, 600))
        assert not time_windows_overlap(TimeWindow(540, 600), TimeWindow(360, 540))

    def test_detects_disjoint_windows(self):
        assert not time_windows_overlap(TimeWindow(0, 60), TimeWindow(120, 180))


def test_is_iso_date_accepts_real_calendar_dates_only():
    assert is_iso_date("2026-11-02")
    assert is_iso_date("2024-02-29")
    assert not is_iso_date("2026-02-29")
    assert not is_iso_date("2026-13-01")
    assert not is_iso_date("2026-1-01")
    assert not is_iso_date(20261102)
