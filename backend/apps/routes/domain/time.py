"""Time-of-day helpers for time slots ("franjas") and risk factor windows.

Times are "HH:MM" strings within one day; "24:00" is only meaningful as an end bound. Windows
are half-open [start, end) in minutes since midnight, so 06:00-09:00 and 09:00-12:00 do not
overlap.
"""

import re
from dataclasses import dataclass
from datetime import date, datetime, timezone

from apps.system_settings.domain.models import SystemSettings

DAY_MINUTES = 24 * 60

_TIME = re.compile(r"([01][0-9]|2[0-4]):([0-5][0-9])")
_DATE = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}")


@dataclass(frozen=True, slots=True)
class TimeWindow:
    start: int
    end: int


def parse_time(value: object) -> int | None:
    """Minutes since midnight for "HH:MM" (00:00-24:00), or None."""
    match = _TIME.fullmatch(value) if isinstance(value, str) else None
    if match is None:
        return None
    minutes = int(match[1]) * 60 + int(match[2])
    return None if minutes > DAY_MINUTES else minutes


def to_window(start_time: str | None, end_time: str | None) -> TimeWindow:
    """Window for already-validated bounds; a missing bound means the whole day."""
    start = 0 if start_time is None else parse_time(start_time)
    end = DAY_MINUTES if end_time is None else parse_time(end_time)
    return TimeWindow(0 if start is None else start, DAY_MINUTES if end is None else end)


def time_windows_overlap(a: TimeWindow, b: TimeWindow) -> bool:
    return a.start < b.end and b.start < a.end


def local_now(settings: SystemSettings) -> datetime:
    """The current wall clock of the system time zone."""
    return datetime.now(timezone.utc).astimezone(settings.zone())


def minutes_of_day(moment: datetime) -> int:
    return moment.hour * 60 + moment.minute


def is_iso_date(value: object) -> bool:
    """ISO calendar date "YYYY-MM-DD" that actually exists."""
    if not isinstance(value, str) or not _DATE.fullmatch(value):
        return False
    try:
        date.fromisoformat(value)
    except ValueError:
        return False
    return True
