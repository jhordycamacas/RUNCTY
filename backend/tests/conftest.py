import pytest
from django.core.cache import cache
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def _clear_throttle_counters():
    cache.clear()


class HttpsAPIClient(APIClient):
    def request(self, **kwargs):
        return super().request(**{**kwargs, "wsgi.url_scheme": "https"})


@pytest.fixture
def client() -> APIClient:
    """HTTPS client: production-like settings redirect plain HTTP."""
    return HttpsAPIClient()


def bearer(token: str) -> dict[str, str]:
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}
