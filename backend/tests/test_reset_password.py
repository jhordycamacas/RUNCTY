"""The `reset_password` command: sets a new password for an existing account, against the fakes."""

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from tests.fakes import FIREBASE

EMAIL = "reset-me@example.com"


@pytest.fixture
def account():
    FIREBASE.emails[EMAIL] = "reset-uid"
    FIREBASE.claims["reset-uid"] = None
    yield "reset-uid"
    FIREBASE.emails.pop(EMAIL, None)
    FIREBASE.claims.pop("reset-uid", None)
    FIREBASE.passwords.pop("reset-uid", None)


def type_passwords(monkeypatch, *answers: str) -> None:
    queue = list(answers)
    monkeypatch.setattr("getpass.getpass", lambda prompt="": queue.pop(0))


def test_sets_the_new_password_and_ends_the_open_sessions(account, monkeypatch):
    type_passwords(monkeypatch, "Nueva12345", "Nueva12345")
    call_command("reset_password", "--email", EMAIL)
    assert FIREBASE.passwords[account] == "Nueva12345"
    assert ("revoke", account) in FIREBASE.calls


def test_refuses_an_unknown_account_without_creating_it(monkeypatch):
    type_passwords(monkeypatch, "Nueva12345", "Nueva12345")
    with pytest.raises(CommandError, match="No account"):
        call_command("reset_password", "--email", "nobody@example.com")
    assert "nobody@example.com" not in FIREBASE.emails


def test_refuses_passwords_that_do_not_match(account, monkeypatch):
    type_passwords(monkeypatch, "Nueva12345", "Otra12345")
    with pytest.raises(CommandError, match="do not match"):
        call_command("reset_password", "--email", EMAIL)
    assert account not in FIREBASE.passwords


def test_refuses_a_weak_password(account, monkeypatch):
    type_passwords(monkeypatch, "corta", "corta")
    with pytest.raises(CommandError):
        call_command("reset_password", "--email", EMAIL)
    assert account not in FIREBASE.passwords


def test_takes_no_password_argument():
    with pytest.raises(CommandError):
        call_command("reset_password", "--email", EMAIL, "--password", "Nueva12345")
