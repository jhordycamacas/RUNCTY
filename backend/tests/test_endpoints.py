from tests.conftest import bearer


class TestHealth:
    def test_liveness_is_public(self, client):
        response = client.get("/api/v1/health")

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_liveness_ignores_a_bad_token(self, client):
        assert client.get("/api/v1/health", **bearer("garbage")).status_code == 200


class TestHealthServices:
    URL = "/api/v1/health/services"

    def test_admin_sees_which_google_services_are_configured(self, client):
        response = client.get(self.URL, **bearer("admin-token"))

        assert response.status_code == 200
        assert response.json() == {
            "services": {
                "auth": True,
                "firestore": True,
                "storage": False,
                "messaging": False,
                "maps": True,
            }
        }

    def test_non_admin_is_forbidden(self, client):
        response = client.get(self.URL, **bearer("club-rep-token"))

        assert response.status_code == 403
        assert response.json() == {
            "error": {"reason": "admin-only", "message": "Only administrators can do this."}
        }

    def test_anonymous_is_unauthenticated(self, client):
        assert client.get(self.URL).status_code == 401


class TestMe:
    def test_returns_the_principal_in_camel_case(self, client):
        response = client.get("/api/v1/me", **bearer("club-rep-token"))

        assert response.status_code == 200
        assert response.json() == {
            "uid": "rep-1",
            "email": "rep@example.com",
            "emailVerified": False,
            "role": "club_rep",
            "perms": ["admin.access", "routes.manage"],
        }

    def test_principal_without_email_or_perms(self, client):
        response = client.get("/api/v1/me", **bearer("user-reader-token"))

        assert response.json()["email"] is None
        assert response.json()["perms"] == ["users.read"]
