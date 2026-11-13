import pytest

from apps.seed.domain.guard import check_seed_target

OK = {
    "project_id": "demo-runcty",
    "firestore_host": "127.0.0.1:8080",
    "auth_host": "127.0.0.1:9099",
}


def check(**changes):
    return check_seed_target(**{**OK, **changes})


def test_accepts_loopback_hosts_and_the_docker_service_host_with_a_demo_project():
    assert check() is None
    assert check(firestore_host="localhost:8080", auth_host="[::1]:9099") is None
    assert check(firestore_host="firebase:8080", auth_host="firebase:9099") is None
    assert check(firestore_host="::1", auth_host="::1") is None


@pytest.mark.parametrize("changes", [{"firestore_host": None}, {"auth_host": ""}])
def test_refuses_missing_emulator_hosts(changes):
    assert "EMULATOR_HOST" in check(**changes)


@pytest.mark.parametrize("project_id", ["runcty-prod", "", None])
def test_refuses_a_project_id_that_is_not_a_demo_project(project_id):
    assert 'must start with "demo-"' in check(project_id=project_id)


@pytest.mark.parametrize(
    "changes",
    [
        {"firestore_host": "firestore.googleapis.com:443"},
        {"auth_host": "10.0.0.5:9099"},
        {"auth_host": "127.0.0.1.evil.com:9099"},
    ],
)
def test_refuses_remote_hosts_including_lookalikes(changes):
    assert "loopback" in check(**changes)
