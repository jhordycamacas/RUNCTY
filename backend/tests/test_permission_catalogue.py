from apps.roles.domain.policies import claims_for
from apps.shared.domain.permissions import is_permission, normalize_permissions


def test_recognizes_only_catalogue_permissions():
    assert is_permission("admin.access")
    assert is_permission("roles.manage")
    assert not is_permission("root")
    assert not is_permission(42)


def test_normalizes_permissions_to_a_sorted_unique_tuple():
    assert normalize_permissions(["users.read", "admin.access", "users.read"]) == (
        "admin.access",
        "users.read",
    )


def test_rejects_permissions_outside_the_catalogue():
    assert normalize_permissions(["admin.access", "root"]) is None
    assert normalize_permissions("admin.access") is None
    assert normalize_permissions([1]) is None


def test_claims_for_sets_role_and_perms_while_keeping_unrelated_claims():
    existing = {"beta": True, "role": "runner", "perms": []}

    assert claims_for(existing, "admin", ("users.read",)) == {
        "beta": True,
        "role": "admin",
        "perms": ["users.read"],
    }
    assert claims_for(None, "runner", ()) == {"role": "runner", "perms": []}
