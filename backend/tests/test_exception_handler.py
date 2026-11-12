import logging

import pytest
from rest_framework.throttling import SimpleRateThrottle

from tests.conftest import bearer


@pytest.mark.urls("tests.urls")
class TestHandledErrors:
    @pytest.mark.parametrize(
        ("kind", "status"),
        [
            ("invalid-argument", 400),
            ("failed-precondition", 400),
            ("permission-denied", 403),
            ("not-found", 404),
            ("already-exists", 409),
        ],
    )
    def test_domain_error_maps_to_http_status(self, client, kind, status):
        response = client.get(f"/probe/domain-error/{kind}")

        assert response.status_code == status
        assert response.json() == {"error": {"reason": "probe-reason", "message": "Probe message."}}

    def test_unexpected_error_is_a_generic_500_and_is_logged(self, client, caplog):
        with caplog.at_level(logging.ERROR):
            response = client.get("/probe/crash")

        assert response.status_code == 500
        assert response.json() == {
            "error": {"reason": "internal", "message": "Internal server error."}
        }
        assert "secrets" not in response.content.decode()
        assert "RuntimeError" in caplog.text

    def test_django_http404_hides_the_internal_message(self, client):
        response = client.get("/probe/missing")

        assert response.status_code == 404
        assert response.json() == {"error": {"reason": "not-found", "message": "Not found."}}

    def test_django_permission_denied_hides_the_internal_message(self, client):
        response = client.get("/probe/forbidden")

        assert response.status_code == 403
        assert response.json()["error"] == {
            "reason": "permission-denied",
            "message": "You do not have permission to perform this action.",
        }

    def test_validation_error_is_invalid_argument(self, client):
        response = client.get("/probe/validation")

        assert response.status_code == 400
        assert response.json() == {
            "error": {"reason": "invalid-argument", "message": "The request is invalid."}
        }

    def test_only_json_bodies_are_parsed(self, client):
        accepted = client.post("/probe/echo", {"name": "x"}, format="json")
        rejected = client.post(
            "/probe/echo", "name=x", content_type="application/x-www-form-urlencoded"
        )

        assert accepted.json() == {"name": "x"}
        assert rejected.status_code == 415
        assert rejected.json()["error"]["reason"] == "unsupported-media-type"


def test_unknown_route_returns_the_json_envelope(client):
    response = client.get("/api/v1/nope")

    assert response.status_code == 404
    assert response["Content-Type"] == "application/json"
    assert response.json() == {"error": {"reason": "not-found", "message": "Not found."}}


def test_method_not_allowed_uses_the_envelope(client):
    response = client.post("/api/v1/health", {}, format="json")

    assert response.status_code == 405
    assert response.json()["error"]["reason"] == "method-not-allowed"


class TestThrottling:
    @pytest.fixture(autouse=True)
    def _tight_rates(self, monkeypatch):
        monkeypatch.setattr(SimpleRateThrottle, "THROTTLE_RATES", {"ip": "2/min", "user": "1/min"})

    def test_public_endpoint_is_throttled_per_ip(self, client):
        assert client.get("/api/v1/health").status_code == 200
        assert client.get("/api/v1/health").status_code == 200

        response = client.get("/api/v1/health")

        assert response.status_code == 429
        assert int(response["Retry-After"]) > 0
        assert response.json()["error"]["reason"] == "rate-limited"

    def test_ip_limit_is_tracked_per_address(self, client):
        for _ in range(2):
            client.get("/api/v1/health", REMOTE_ADDR="10.0.0.1")

        assert client.get("/api/v1/health", REMOTE_ADDR="10.0.0.1").status_code == 429
        assert client.get("/api/v1/health", REMOTE_ADDR="10.0.0.2").status_code == 200

    def test_forwarded_for_header_cannot_spoof_the_address(self, client):
        for index in range(2):
            client.get("/api/v1/health", HTTP_X_FORWARDED_FOR=f"1.1.1.{index}")

        response = client.get("/api/v1/health", HTTP_X_FORWARDED_FOR="9.9.9.9")

        assert response.status_code == 429

    def test_authenticated_calls_are_throttled_per_user(self, client):
        assert client.get("/api/v1/me", **bearer("runner-token")).status_code == 200

        assert client.get("/api/v1/me", **bearer("runner-token")).status_code == 429
        assert (
            client.get("/api/v1/me", **bearer("admin-token"), REMOTE_ADDR="10.0.0.9").status_code
            == 200
        )
