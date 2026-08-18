"""IST (Asia/Kolkata) time helper for Nest Services."""
from __future__ import annotations
from datetime import datetime, timezone, timedelta

# India Standard Time is UTC+5:30, no DST — a fixed offset is correct.
IST = timezone(timedelta(hours=5, minutes=30), name="IST")


def now_ist() -> datetime:
    """Return the current time in IST (tz-aware)."""
    return datetime.now(IST)


def to_ist(dt: datetime | None) -> datetime | None:
    """Convert any tz-aware or naive datetime to IST. Naive is treated as UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST)
