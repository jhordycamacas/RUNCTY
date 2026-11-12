import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from tests import fakes


@pytest.fixture(autouse=True)
def _clear_throttle_counters():
    cache.clear()


@pytest.fixture(autouse=True)
def firebase() -> fakes.FakeFirebase:
    """Fresh fake Firebase holding an account for every test token."""
    fakes.FIREBASE.reset()
    fakes.FIREBASE.add_principals()
    return fakes.FIREBASE


class HttpsAPIClient(APIClient):
    def request(self, **kwargs):
        return super().request(**{**kwargs, "wsgi.url_scheme": "https"})


@pytest.fixture
def client() -> APIClient:
    """HTTPS client: production-like settings redirect plain HTTP."""
    return HttpsAPIClient()


def bearer(token: str) -> dict[str, str]:
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}
