"""RF-01-4: an account can only be deleted right after its owner signed in again."""

# The client re-authenticates right before the request; anything older is rejected.
RECENT_SIGN_IN_MAX_AGE_SEC = 5 * 60


def is_recent_sign_in(auth_time: float | None, now: float) -> bool:
    """`auth_time` is the claim of the ID token; both are seconds since the epoch."""
    return auth_time is not None and now - auth_time <= RECENT_SIGN_IN_MAX_AGE_SEC
