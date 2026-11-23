"""The `create_admin` command: the first admin of a real Firebase project, against the fakes."""

from dataclasses import replace

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from apps.seed.domain.data import ADMIN_EMAIL
from apps.shared.domain.permissions import ALL_PERMISSIONS
from tests.fakes import FIREBASE

EMAIL = "owner@example.com"
PASSWORD = "Owner1234"
ARGS = ["--email", EMAIL, "--first-name", "Ana", "--last-name", "Mora"]


@pytest.fixture
def typed(monkeypatch):
    """Answers the password prompts in order; returns the prompts shown."""
    answers: list[str] = [PASSWORD, PASSWORD]
    prompts: list[str] = []

    def getpass(prompt: str = "") -> str:
        prompts.append(prompt)
        return answers.pop(0)

    monkeypatch.setattr("getpass.getpass", getpass)
    return answers, prompts


def run(*extra: str) -> None:
    call_command("create_admin", *ARGS, *extra)


def admin_uids() -> list[str]:
    return [uid for uid, user in FIREBASE.users.items() if user.get("email") == EMAIL]


def test_creates_the_admin_with_every_permission_and_its_profile(typed):
    run()
    (uid,) = admin_uids()
    assert FIREBASE.claims[uid] == {"role": "admin", "perms": list(ALL_PERMISSIONS)}
    assert "settings.manage" in FIREBASE.claims[uid]["perms"]
    profile = FIREBASE.users[uid]
    assert (profile["firstName"], profile["lastName"], profile["role"]) == ("Ana", "Mora", "admin")
    assert profile["uid"] == uid


def test_seeds_the_roles_the_city_and_the_defaults_but_no_sample_data(typed):
    run()
    assert sorted(FIREBASE.roles) == ["admin", "club_rep", "runner"]
    assert "loja" in FIREBASE.cities
    assert "systemSettings/global" in FIREBASE.docs
    assert "catalogs/sportLevels" in FIREBASE.docs
    assert not [path for path in FIREBASE.docs if path.startswith(("routes/", "safetyIncidents/"))]


def test_never_creates_the_test_admin(typed):
    run()
    assert ADMIN_EMAIL not in FIREBASE.emails
    assert all(user.get("email") != ADMIN_EMAIL for user in FIREBASE.users.values())


def test_a_second_run_promotes_the_same_account_and_keeps_what_an_admin_edited(typed):
    answers, _ = typed
    run()
    (uid,) = admin_uids()
    FIREBASE.claims[uid] = {"role": "runner", "perms": []}
    FIREBASE.docs["systemSettings/global"]["penaltyHigh"] = 50
    FIREBASE.cities["loja"] = replace(FIREBASE.cities["loja"], name="Editada")
    answers.extend([PASSWORD, PASSWORD])
    run()
    assert admin_uids() == [uid]
    assert FIREBASE.claims[uid]["role"] == "admin"
    assert FIREBASE.docs["systemSettings/global"]["penaltyHigh"] == 50
    assert FIREBASE.cities["loja"].name == "Editada"


def test_asks_twice_and_never_echoes_the_password(typed, capsys):
    _, prompts = typed
    run()
    assert len(prompts) == 2
    output = capsys.readouterr()
    assert PASSWORD not in output.out + output.err


def test_refuses_passwords_that_do_not_match_before_touching_firebase(typed):
    answers, _ = typed
    answers[1] = "Other1234"
    with pytest.raises(CommandError, match="do not match"):
        run()
    assert not admin_uids() and not FIREBASE.roles and not FIREBASE.docs


@pytest.mark.parametrize("weak", ["short1", "onlyletters", "12345678"])
def test_refuses_a_weak_password_before_touching_firebase(typed, weak):
    answers, _ = typed
    answers[:] = [weak, weak]
    with pytest.raises(CommandError, match="password"):
        run()
    assert not admin_uids() and not FIREBASE.roles and not FIREBASE.docs


@pytest.mark.parametrize("flag", ["--password=Owner1234", "--password"])
def test_does_not_accept_the_password_as_an_argument(typed, flag):
    with pytest.raises(CommandError):
        run(flag)
    assert not admin_uids()


def test_requires_the_email_and_the_names(typed):
    with pytest.raises(CommandError):
        call_command("create_admin", "--email", EMAIL)
