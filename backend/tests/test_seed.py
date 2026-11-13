"""The emulator seed against the in-memory adapters."""

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from apps.roles.domain.system_roles import SYSTEM_ROLES
from apps.seed.application.use_cases import SeedDeps, run_seed
from apps.seed.domain.data import ADMIN_EMAIL, SEED_ROUTES
from apps.shared.domain.permissions import ALL_PERMISSIONS
from tests import fakes
from tests.fakes import FIREBASE

ROUTE_IDS = [
    "loja-jipiro",
    "loja-tebaida",
    "loja-malecon-zamora",
    "loja-puear",
    "loja-pucara-orillas",
]


def deps() -> SeedDeps:
    return SeedDeps(
        cities=fakes.InMemoryCityRepository(),
        roles=fakes.InMemoryRoleRepository(),
        auth=fakes.InMemoryAuthGateway(),
        accounts=fakes.InMemorySeedAccounts(),
        routes=fakes.InMemoryRouteRepository(),
    )


@pytest.fixture
def report() -> list[str]:
    return []


def seed(report: list[str]) -> None:
    run_seed(deps(), report.append)


def children(prefix: str) -> dict[str, dict]:
    depth = prefix.count("/") + 1
    return {
        path.rsplit("/", 1)[1]: document
        for path, document in FIREBASE.docs.items()
        if path.startswith(prefix + "/") and path.count("/") == depth
    }


def test_seeds_the_pilot_city():
    seed([])
    loja = FIREBASE.cities["loja"]
    assert (loja.name, loja.province, loja.type, loja.coverage) == (
        "Loja",
        "Loja",
        "city",
        "active",
    )
    assert (loja.lat, loja.lng) == (-3.99313, -79.20422)


def test_seeds_the_system_roles_with_sorted_permissions():
    seed([])
    assert sorted(FIREBASE.roles) == ["admin", "club_rep", "runner"]
    assert all(role.system for role in FIREBASE.roles.values())
    assert FIREBASE.roles["runner"].permissions == ()
    assert FIREBASE.roles["admin"].permissions == tuple(sorted(ALL_PERMISSIONS))
    assert FIREBASE.roles["club_rep"].permissions == (
        "admin.access",
        "reports.validate",
        "routes.manage",
    )
    assert sorted(FIREBASE.roles.values(), key=lambda role: role.id) == sorted(
        SYSTEM_ROLES, key=lambda role: role.id
    )


def test_seeds_the_admin_account_with_claims_and_profile():
    seed([])
    (uid,) = [uid for uid, user in FIREBASE.users.items() if user.get("email") == ADMIN_EMAIL]
    assert FIREBASE.claims[uid] == {"role": "admin", "perms": list(ALL_PERMISSIONS)}
    profile = FIREBASE.users[uid]
    assert profile["uid"] == uid
    assert (profile["firstName"], profile["lastName"]) == ("Administrador", "RUNCTY")
    assert (profile["cityId"], profile["role"]) == ("loja", "admin")


def test_seeds_five_routes_with_segments_time_slots_and_risk_factors():
    seed([])
    routes = {path for path in FIREBASE.docs if path.count("/") == 1}
    assert routes == {f"routes/{route_id}" for route_id in ROUTE_IDS}
    assert len(SEED_ROUTES) == 5
    tebaida = children("routes/loja-tebaida/segments")
    assert sorted(tebaida) == ["seg-1", "seg-2", "seg-3"]
    assert [tebaida[f"seg-{n}"]["order"] for n in (1, 2, 3)] == [0, 1, 2]
    assert sorted(children("routes/loja-tebaida/timeSlots")) == ["evening", "morning"]
    factors = children("routes/loja-tebaida/segments/seg-2/riskFactors")
    assert sorted(factors) == ["factor-1", "factor-2", "factor-3"]
    assert factors["factor-2"] == {
        "type": "poor_lighting",
        "severity": "high",
        "description": "Tramo sin alumbrado público.",
        "startTime": "18:00",
        "endTime": "24:00",
        "createdAt": "SERVER_TIMESTAMP",
        "updatedAt": "SERVER_TIMESTAMP",
    }


def test_a_risk_factor_without_a_window_is_stored_without_time_fields():
    seed([])
    factor = children("routes/loja-malecon-zamora/segments/seg-2/riskFactors")["factor-1"]
    assert "startTime" not in factor and "endTime" not in factor


def test_computes_lengths_distance_and_the_safety_index():
    seed([])
    jipiro = FIREBASE.docs["routes/loja-jipiro"]
    segments = children("routes/loja-jipiro/segments")
    total_m = sum(segment["lengthM"] for segment in segments.values())
    assert jipiro["distanceKm"] == round(total_m * 3 / 1000, 1)
    assert jipiro["segmentCount"] == 3
    # One low lighting factor (18:00-24:00) takes 10 points off the evening slot only.
    assert segments["seg-3"]["safety"]["morning"]["score"] == 100
    assert segments["seg-3"]["safety"]["evening"]["score"] == 90
    assert jipiro["safety"]["evening"]["worstSegmentId"] == "seg-3"
    assert jipiro["safety"]["evening"]["level"] == "high"

    puear = FIREBASE.docs["routes/loja-puear"]["safety"]
    # seg-2: isolated (high) + uneven (medium) at 05:00-07:00 -> 100 - 35 - 20.
    assert puear["morning"]["score"] == 45
    assert puear["morning"]["level"] == "medium"
    assert puear["morning"]["worstSegmentId"] == "seg-2"
    # poor lighting high + isolated high + uneven medium in the evening -> 100 - 35 - 35 - 20.
    assert puear["evening"]["score"] == 10
    assert puear["evening"]["level"] == "low"


def test_route_documents_have_the_expected_fields():
    seed([])
    route = FIREBASE.docs["routes/loja-puear"]
    assert route["cityId"] == "loja"
    assert route["active"] is True
    assert (route["surface"], route["difficulty"]) == ("trail", "advanced")
    assert route["elevationGainM"] == 180
    assert route["start"]["label"] == "Ingreso por la UNL"
    for field in ("safetyUpdatedAt", "createdAt", "updatedAt"):
        assert route[field] == "SERVER_TIMESTAMP"
    slot = children("routes/loja-puear/timeSlots")["morning"]
    assert slot["label"] == "Mañana"
    assert (slot["startTime"], slot["endTime"]) == ("05:00", "07:00")


def test_running_it_twice_changes_nothing():
    seed([])
    snapshot = (
        dict(FIREBASE.docs),
        dict(FIREBASE.roles),
        dict(FIREBASE.cities),
        {uid: dict(user) for uid, user in FIREBASE.users.items()},
        dict(FIREBASE.claims),
    )
    seed([])
    assert (
        FIREBASE.docs,
        FIREBASE.roles,
        FIREBASE.cities,
        FIREBASE.users,
        FIREBASE.claims,
    ) == snapshot


def test_a_rerun_removes_leftovers_of_an_older_seed():
    seed([])
    FIREBASE.docs["routes/loja-jipiro/segments/old"] = {"name": "stale"}
    FIREBASE.docs["routes/loja-jipiro/segments/old/riskFactors/x"] = {"type": "traffic"}
    seed([])
    assert sorted(children("routes/loja-jipiro/segments")) == ["seg-1", "seg-2", "seg-3"]
    assert "routes/loja-jipiro/segments/old/riskFactors/x" not in FIREBASE.docs


def test_a_rerun_keeps_the_admin_account_and_restores_its_claims():
    seed([])
    (uid,) = [uid for uid, user in FIREBASE.users.items() if user.get("email") == ADMIN_EMAIL]
    FIREBASE.claims[uid] = {"role": "runner", "perms": []}
    seed([])
    assert FIREBASE.claims[uid]["role"] == "admin"
    assert len([user for user in FIREBASE.users.values() if user["email"] == ADMIN_EMAIL]) == 1


def test_reports_what_it_seeded(report):
    seed(report)
    assert report[0] == "City seeded: cities/loja"
    assert report[1] == "Roles seeded: runner, admin, club_rep"
    assert report[2].startswith(f"Admin seeded: {ADMIN_EMAIL} (uid ")
    routes = [line for line in report if line.startswith("Route seeded: routes/")]
    assert len(routes) == 5
    assert routes[0].startswith("Route seeded: routes/loja-jipiro — Parque Recreacional Jipiro, ")
    assert "05:00–07:00" in routes[0] and "18:00–20:00" in routes[0]


# ---------- The command ----------


@pytest.fixture
def emulator(settings):
    settings.FIREBASE_PROJECT_ID = "demo-runcty"
    settings.FIREBASE_EMULATOR_HOSTS = {
        "FIRESTORE_EMULATOR_HOST": "127.0.0.1:8080",
        "FIREBASE_AUTH_EMULATOR_HOST": "127.0.0.1:9099",
    }
    settings.SEED_ACCOUNTS = "tests.fakes.InMemorySeedAccounts"


def test_the_command_seeds_the_emulator(emulator, capsys):
    call_command("seed")
    assert "loja" in FIREBASE.cities
    assert "Route seeded: routes/loja-puear" in capsys.readouterr().out


@pytest.mark.parametrize(
    ("changes", "message"),
    [
        ({"FIREBASE_PROJECT_ID": "runcty-prod"}, 'must start with "demo-"'),
        ({"FIREBASE_EMULATOR_HOSTS": {}}, "EMULATOR_HOST"),
        (
            {
                "FIREBASE_EMULATOR_HOSTS": {
                    "FIRESTORE_EMULATOR_HOST": "firestore.googleapis.com:443",
                    "FIREBASE_AUTH_EMULATOR_HOST": "127.0.0.1:9099",
                }
            },
            "loopback",
        ),
    ],
)
def test_the_command_refuses_anything_but_the_emulator(emulator, settings, changes, message):
    for name, value in changes.items():
        setattr(settings, name, value)
    with pytest.raises(CommandError, match=message):
        call_command("seed")
    assert not FIREBASE.cities and not FIREBASE.docs and not FIREBASE.roles
