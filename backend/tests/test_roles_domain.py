import pytest

from apps.roles.domain.models import Rol
from apps.shared.domain.errors import DomainError


def test_parse_normalizes_a_valid_role():
    role = Rol.parse(
        {
            "id": "support",
            "name": "  Soporte ",
            "description": "Mesa de ayuda",
            "permissions": ["users.read", "admin.access"],
        }
    )

    assert role == Rol(
        id="support",
        name="Soporte",
        description="Mesa de ayuda",
        permissions=("admin.access", "users.read"),
        system=False,
    )


def test_parse_defaults_a_missing_description_to_empty():
    assert Rol.parse({"id": "support", "name": "Soporte", "permissions": []}).description == ""


@pytest.mark.parametrize("role_id", ["", "A", "Support", "with space", "1abc", "x" * 40, 42])
def test_parse_rejects_ids_that_are_not_slugs(role_id):
    with pytest.raises(DomainError) as error:
        Rol.parse({"id": role_id, "name": "X", "permissions": []})

    assert error.value.reason == "invalid-role-id"


def test_parse_rejects_empty_or_long_names_and_descriptions():
    for name in ("   ", "x" * 61):
        with pytest.raises(DomainError) as error:
            Rol.parse({"id": "abc", "name": name, "permissions": []})
        assert error.value.reason == "invalid-role-name"

    with pytest.raises(DomainError) as error:
        Rol.parse({"id": "abc", "name": "X", "description": "x" * 201, "permissions": []})
    assert error.value.reason == "invalid-role-description"


def test_parse_rejects_permissions_outside_the_catalogue():
    with pytest.raises(DomainError, match="(?i)permissions") as error:
        Rol.parse({"id": "abc", "name": "X", "permissions": ["root"]})

    assert error.value.reason == "invalid-permissions"


def test_document_round_trip_keeps_the_stored_shape():
    role = Rol("support", "Soporte", "Mesa", ("users.read",), system=True)

    assert role.to_document() == {
        "name": "Soporte",
        "description": "Mesa",
        "permissions": ["users.read"],
        "system": True,
    }
    assert Rol.from_document("support", role.to_document()) == role


def test_from_document_tolerates_a_malformed_document():
    role = Rol.from_document("legacy", {"permissions": ["users.read", "root"], "system": "yes"})

    assert role == Rol("legacy", "legacy", "", (), system=False)
