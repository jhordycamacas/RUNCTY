from apps.users.application.use_cases import assign_default_role
from apps.users.domain.role_assignment import RoleAssignment, resolve_role_assignment
from tests.fakes import InMemoryAuthGateway, InMemoryUserRepository


class TestResolveRoleAssignment:
    def test_assigns_runner_to_a_brand_new_user(self):
        assert resolve_role_assignment(None, None) == RoleAssignment(
            claims={"role": "runner", "perms": []},
            claims_changed=True,
            role="runner",
            doc_changed=True,
        )

    def test_keeps_unrelated_existing_claims_when_adding_the_role(self):
        result = resolve_role_assignment({"beta": True}, None)

        assert result.claims == {"beta": True, "role": "runner", "perms": []}
        assert result.claims_changed is True

    def test_never_downgrades_an_existing_admin_claim(self):
        result = resolve_role_assignment({"role": "admin"}, None)

        assert result.role == "admin"
        assert result.claims == {"role": "admin"}
        assert result.claims_changed is False
        assert result.doc_changed is True

    def test_does_nothing_when_claim_and_doc_already_agree(self):
        result = resolve_role_assignment({"role": "admin"}, "admin")

        assert result.claims_changed is False
        assert result.doc_changed is False

    def test_ignores_a_role_written_to_the_doc_that_the_claim_does_not_back(self):
        result = resolve_role_assignment(None, "admin")

        assert result.role == "runner"
        assert result.doc_changed is True


class TestAssignDefaultRole:
    def assign(self, firebase, uid: str, doc_role: str | None) -> str:
        return assign_default_role(
            uid, doc_role, InMemoryUserRepository(firebase), InMemoryAuthGateway(firebase)
        )

    def test_sets_the_claim_before_writing_the_role_to_the_doc(self, firebase):
        firebase.add_user("u1")

        role = self.assign(firebase, "u1", None)

        assert role == "runner"
        assert firebase.claims["u1"] == {"role": "runner", "perms": []}
        assert firebase.users["u1"]["role"] == "runner"
        assert firebase.calls == [("claims", "u1"), ("mirror", "u1", "runner")]

    def test_preserves_an_admin_claim_and_only_mirrors_it_to_the_doc(self, firebase):
        firebase.add_user("a1", {"role": "admin"}, role=None)

        role = self.assign(firebase, "a1", None)

        assert role == "admin"
        assert firebase.claims["a1"] == {"role": "admin"}
        assert firebase.calls == [("mirror", "a1", "admin")]

    def test_is_idempotent_when_everything_is_already_in_place(self, firebase):
        firebase.add_user("u1", {"role": "runner"})

        self.assign(firebase, "u1", "runner")

        assert firebase.calls == []
