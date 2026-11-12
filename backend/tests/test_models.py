from apps.shared.domain.models import Principal


def test_from_claims_maps_identity_and_custom_claims():
    principal = Principal.from_claims(
        {
            "uid": "u1",
            "email": "a@example.com",
            "email_verified": True,
            "role": "club_rep",
            "perms": ["admin.access", "routes.manage"],
        }
    )

    assert principal == Principal(
        uid="u1",
        email="a@example.com",
        email_verified=True,
        role="club_rep",
        perms=("admin.access", "routes.manage"),
    )


def test_from_claims_without_custom_claims_grants_nothing():
    principal = Principal.from_claims({"uid": "u1"})

    assert principal.email is None
    assert principal.email_verified is False
    assert principal.role is None
    assert principal.perms == ()
    assert not principal.has_permission("users.read")


def test_from_claims_ignores_malformed_claims():
    principal = Principal.from_claims(
        {"uid": "u1", "role": 7, "perms": ["users.read", 3, None], "email_verified": "yes"}
    )

    assert principal.role is None
    assert principal.perms == ("users.read",)
    assert principal.email_verified is False


def test_perms_claim_that_is_not_a_list_grants_nothing():
    assert Principal.from_claims({"uid": "u1", "perms": "users.read"}).perms == ()


def test_permission_requires_the_exact_entry():
    principal = Principal.from_claims({"uid": "u1", "role": "support", "perms": ["users.read"]})

    assert principal.has_permission("users.read")
    assert not principal.has_permission("roles.manage")
    assert not principal.is_admin


def test_admin_role_implies_every_permission_even_without_perms():
    principal = Principal.from_claims({"uid": "u1", "role": "admin"})

    assert principal.is_admin
    assert principal.has_permission("roles.manage")
