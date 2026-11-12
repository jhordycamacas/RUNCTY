from rest_framework.throttling import SimpleRateThrottle

from apps.shared.domain.models import Principal


class IpRateThrottle(SimpleRateThrottle):
    """Limits every caller by network address (see `DJANGO_NUM_PROXIES`)."""

    scope = "ip"

    def get_cache_key(self, request, view) -> str:
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


class FailedAuthenticationThrottle(IpRateThrottle):
    """Limits rejected bearer tokens per address, before a token is verified.

    DRF throttles run after authentication, so `BearerTokenAuthentication` drives this one:
    `allow_request` only reads the counter and `record_failure` adds to it. Accepted tokens
    never use the budget, but a blocked address cannot authenticate until the window passes.
    """

    scope = "auth-failed"

    def allow_request(self, request, view=None) -> bool:
        self.key = self.get_cache_key(request, view)
        self.now = self.timer()
        oldest_counted = self.now - self.duration
        self.history = [at for at in self.cache.get(self.key, []) if at > oldest_counted]
        return len(self.history) < self.num_requests

    def record_failure(self) -> None:
        self.history.insert(0, self.now)
        self.cache.set(self.key, self.history, self.duration)


class PrincipalRateThrottle(SimpleRateThrottle):
    """Limits authenticated callers by uid, whatever address they come from."""

    scope = "user"

    def get_cache_key(self, request, view) -> str | None:
        if not isinstance(request.user, Principal):
            return None
        return self.cache_format % {"scope": self.scope, "ident": request.user.uid}


class SensitiveRateThrottle(PrincipalRateThrottle):
    """Tighter per-uid budget for endpoints that expose personal data or change authority."""

    scope = "sensitive"


# `throttle_classes` of a sensitive view: the default limits plus the tighter one.
SENSITIVE_THROTTLES = (IpRateThrottle, PrincipalRateThrottle, SensitiveRateThrottle)
