from rest_framework.throttling import SimpleRateThrottle

from apps.shared.domain.models import Principal


class IpRateThrottle(SimpleRateThrottle):
    """Limits every caller by network address (see `DJANGO_NUM_PROXIES`)."""

    scope = "ip"

    def get_cache_key(self, request, view) -> str:
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


class PrincipalRateThrottle(SimpleRateThrottle):
    """Limits authenticated callers by uid, whatever address they come from."""

    scope = "user"

    def get_cache_key(self, request, view) -> str | None:
        if not isinstance(request.user, Principal):
            return None
        return self.cache_format % {"scope": self.scope, "ident": request.user.uid}
