from django.db import connection
from rest_framework.test import APIClient


def test_no_sql_database_is_configured():
    # Django fills an empty DATABASES with its "dummy" backend, which fails on any query.
    assert connection.settings_dict["ENGINE"] == "django.db.backends.dummy"


def test_plain_http_is_redirected_to_https():
    response = APIClient().get("/api/v1/health")

    assert response.status_code == 301
    assert response["Location"] == "https://testserver/api/v1/health"


def test_security_headers_are_sent(client):
    response = client.get("/api/v1/health")

    assert response["X-Content-Type-Options"] == "nosniff"
    assert response["X-Frame-Options"] == "DENY"
    assert response["Strict-Transport-Security"] == "max-age=31536000; includeSubDomains"


def test_cors_allows_only_listed_origins(client):
    allowed = client.get("/api/v1/health", HTTP_ORIGIN="https://panel.example.com")
    other = client.get("/api/v1/health", HTTP_ORIGIN="https://evil.example.com")

    assert allowed["Access-Control-Allow-Origin"] == "https://panel.example.com"
    assert "Access-Control-Allow-Origin" not in other


def test_cors_preflight_allows_the_authorization_header(client):
    response = client.options(
        "/api/v1/me",
        HTTP_ORIGIN="https://panel.example.com",
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
        HTTP_ACCESS_CONTROL_REQUEST_HEADERS="authorization",
    )

    assert response.status_code == 200
    assert "authorization" in response["Access-Control-Allow-Headers"]
