from datetime import date

import pytest

from apps.shared.domain.errors import DomainError
from apps.users.domain.models import (
    PerfilDeportivo,
    PreferenciaNotificaciones,
    PreferenciaUsuario,
    Usuario,
)
from tests.fakes import SETTINGS

TODAY = date(2026, 11, 12)
SIGN_UP = {
    "firstName": " Ana ",
    "lastName": "Paz",
    "birthDate": "1990-01-01",
    "cityId": "loja",
    "consent": {"lopdp": True},
}
ANA = Usuario("u1", "ana@example.com", "Ana", "Paz", "1990-01-01", "loja")


def fields_of(call, *args) -> dict[str, str]:
    with pytest.raises(DomainError) as error:
        call(*args)
    assert error.value.reason == "invalid-argument"
    return error.value.fields


class TestUsuarioRegister:
    def test_builds_the_profile_of_the_token_owner_without_a_role(self):
        user = Usuario.register("u1", "ana@example.com", SIGN_UP, TODAY)

        assert user == ANA
        assert user.role is None
        assert user.id_number is None

    def test_keeps_an_optional_id_number(self):
        user = Usuario.register("u1", "a@b.ec", {**SIGN_UP, "idNumber": "1104567890"}, TODAY)

        assert user.id_number == "1104567890"

    @pytest.mark.parametrize("empty", ["", None])
    def test_an_empty_id_number_means_not_provided(self, empty):
        assert Usuario.register("u1", "a@b.ec", {**SIGN_UP, "idNumber": empty}, TODAY) == Usuario(
            "u1", "a@b.ec", "Ana", "Paz", "1990-01-01", "loja"
        )

    def test_reports_every_invalid_field(self):
        data = {"firstName": "  ", "lastName": "x" * 61, "cityId": 7, "idNumber": "123"}

        assert fields_of(Usuario.register, "u1", "a@b.ec", data, TODAY) == {
            "firstName": "required",
            "lastName": "max-length",
            "birthDate": "required",
            "cityId": "invalid",
            "idNumber": "invalid-format",
            "consent.lopdp": "not-accepted",
        }

    @pytest.mark.parametrize("consent", [None, {}, {"lopdp": False}, {"lopdp": "true"}, True])
    def test_requires_explicit_lopdp_consent(self, consent):
        data = {**SIGN_UP, "consent": consent}

        assert fields_of(Usuario.register, "u1", "a@b.ec", data, TODAY) == {
            "consent.lopdp": "not-accepted"
        }

    def test_rejects_a_city_id_longer_than_the_document_id_limit(self):
        data = {**SIGN_UP, "cityId": "c" * 65}

        assert fields_of(Usuario.register, "u1", "a@b.ec", data, TODAY) == {"cityId": "max-length"}


class TestBirthDate:
    """NEW-08: a real calendar date that gives an age between 5 and 110."""

    @pytest.mark.parametrize(
        ("birth_date", "reason"),
        [
            ("01/01/1990", "invalid-format"),
            ("1990-1-1", "invalid-format"),
            (19900101, "invalid"),
            ("1990-02-30", "invalid-date"),
            ("1990-13-01", "invalid-date"),
            ("0000-01-01", "invalid-date"),
            ("2027-01-01", "out-of-range"),
            ("2026-11-12", "out-of-range"),
            ("2021-11-13", "out-of-range"),  # turns 5 tomorrow
            ("1915-11-12", "out-of-range"),  # 111 today
        ],
    )
    def test_rejects(self, birth_date, reason):
        data = {**SIGN_UP, "birthDate": birth_date}

        assert fields_of(Usuario.register, "u1", "a@b.ec", data, TODAY) == {"birthDate": reason}

    @pytest.mark.parametrize("birth_date", ["2021-11-12", "1916-11-12", "1915-11-13", "2000-02-29"])
    def test_accepts(self, birth_date):
        user = Usuario.register("u1", "a@b.ec", {**SIGN_UP, "birthDate": birth_date}, TODAY)

        assert user.birth_date == birth_date

    def test_a_leap_day_birthday_counts_from_the_first_of_march(self):
        data = {**SIGN_UP, "birthDate": "2016-02-29"}

        assert fields_of(Usuario.register, "u1", "a@b.ec", data, date(2021, 2, 28)) == {
            "birthDate": "out-of-range"
        }
        assert Usuario.register("u1", "a@b.ec", data, date(2021, 3, 1)).birth_date == "2016-02-29"


class TestUsuarioPersonalData:
    def test_changes_only_the_given_fields(self):
        updated = ANA.with_personal_data(
            {"firstName": "Ana María", "idNumber": "1104567890"}, TODAY
        )

        assert updated == Usuario(
            "u1", "ana@example.com", "Ana María", "Paz", "1990-01-01", "loja", "1104567890"
        )

    @pytest.mark.parametrize("empty", ["", None])
    def test_an_empty_id_number_removes_it(self, empty):
        with_id = ANA.with_personal_data({"idNumber": "1104567890"}, TODAY)

        assert with_id.with_personal_data({"idNumber": empty}, TODAY).id_number is None

    def test_never_changes_identity_or_role(self):
        admin = Usuario("u1", "a@b.ec", "Ana", "Paz", "1990-01-01", "loja", role="admin")

        updated = admin.with_personal_data(
            {"uid": "u2", "email": "x@y.z", "role": "runner", "lastName": "Ríos"}, TODAY
        )

        assert updated == Usuario("u1", "a@b.ec", "Ana", "Ríos", "1990-01-01", "loja", role="admin")

    def test_validates_the_resulting_profile(self):
        assert fields_of(ANA.with_personal_data, {"birthDate": "1990-02-30"}, TODAY) == {
            "birthDate": "invalid-date"
        }


class TestUsuarioDocument:
    def test_new_profile_document_has_no_role(self):
        assert ANA.to_document() == {
            "uid": "u1",
            "email": "ana@example.com",
            "firstName": "Ana",
            "lastName": "Paz",
            "birthDate": "1990-01-01",
            "cityId": "loja",
        }

    def test_document_round_trip(self):
        user = Usuario("u1", "a@b.ec", "Ana", "Paz", "1990-01-01", "loja", "1104567890")

        assert user.to_document()["idNumber"] == "1104567890"
        assert Usuario.from_document("u1", {**user.to_document(), "role": "runner"}) == Usuario(
            "u1", "a@b.ec", "Ana", "Paz", "1990-01-01", "loja", "1104567890", "runner"
        )

    def test_from_document_tolerates_missing_or_malformed_fields(self):
        user = Usuario.from_document("u1", {"firstName": 7, "idNumber": "", "role": ""})

        assert user == Usuario("u1", "", "", "", "", "")


SPORT_PROFILE = {
    "level": "intermediate",
    "goals": ["health", "pace"],
    "usualPaceSecPerKm": 390,
    "preferredDistanceKm": 10.5,
}


LEVELS = ("beginner", "intermediate", "advanced")
GOALS = ("health", "weightLoss", "racePrep", "pace", "social")


def parse_sport(raw):
    return PerfilDeportivo.parse(raw, SETTINGS, LEVELS, GOALS)


class TestPerfilDeportivo:
    def test_parses_a_valid_profile(self):
        profile = parse_sport(SPORT_PROFILE)

        assert profile == PerfilDeportivo("intermediate", ("health", "pace"), 390, 10.5)
        assert profile.to_document() == SPORT_PROFILE

    @pytest.mark.parametrize(
        ("change", "fields"),
        [
            ({"level": "pro"}, {"level": "invalid-choice"}),
            ({"goals": []}, {"goals": "required"}),
            ({"goals": ["health"] * 6}, {"goals": "max-length"}),
            ({"goals": ["health", "fly"]}, {"goals": "invalid-choice"}),
            ({"goals": "health"}, {"goals": "invalid"}),
            ({"usualPaceSecPerKm": 149}, {"usualPaceSecPerKm": "out-of-range"}),
            ({"usualPaceSecPerKm": 1201}, {"usualPaceSecPerKm": "out-of-range"}),
            ({"usualPaceSecPerKm": float("nan")}, {"usualPaceSecPerKm": "out-of-range"}),
            ({"usualPaceSecPerKm": "390"}, {"usualPaceSecPerKm": "invalid"}),
            ({"usualPaceSecPerKm": True}, {"usualPaceSecPerKm": "invalid"}),
            ({"preferredDistanceKm": 0.5}, {"preferredDistanceKm": "out-of-range"}),
            ({"preferredDistanceKm": 50.1}, {"preferredDistanceKm": "out-of-range"}),
        ],
    )
    def test_rejects_values_outside_the_schema(self, change, fields):
        assert fields_of(parse_sport, {**SPORT_PROFILE, **change}) == fields

    def test_the_choices_come_from_the_catalogs_it_is_given(self):
        raw = {**SPORT_PROFILE, "level": "elite", "goals": ["fun", "pace"]}

        profile = PerfilDeportivo.parse(raw, SETTINGS, ("elite",), ("fun", "pace"))

        assert (profile.level, profile.goals) == ("elite", ("fun", "pace"))
        assert fields_of(parse_sport, raw) == {"level": "invalid-choice", "goals": "invalid-choice"}

    def test_the_goal_count_is_bounded_by_the_goals_on_offer(self):
        raw = {**SPORT_PROFILE, "goals": ["pace", "pace"]}

        assert fields_of(lambda r: PerfilDeportivo.parse(r, SETTINGS, LEVELS, ("pace",)), raw) == {
            "goals": "max-length"
        }

    def test_an_unhashable_choice_is_invalid_not_a_crash(self):
        raw = {**SPORT_PROFILE, "level": ["beginner"], "goals": [["health"]]}

        assert fields_of(parse_sport, raw) == {"level": "invalid-choice", "goals": "invalid-choice"}

    def test_accepts_the_limits(self):
        limits = {**SPORT_PROFILE, "usualPaceSecPerKm": 150, "preferredDistanceKm": 50}

        assert parse_sport(limits).usual_pace_sec_per_km == 150

    def test_reads_a_stored_document_ignoring_its_timestamp(self):
        stored = {**SPORT_PROFILE, "updatedAt": object()}

        assert PerfilDeportivo.from_document(stored) == parse_sport(SPORT_PROFILE)

    def test_a_stored_code_is_kept_even_if_the_catalog_no_longer_offers_it(self):
        stored = {**SPORT_PROFILE, "level": "legacy", "goals": ["old", "gone", "x", "y", "z", "w"]}

        profile = PerfilDeportivo.from_document(stored)

        assert profile.level == "legacy"
        assert profile.goals == ("old", "gone", "x", "y", "z", "w")

    @pytest.mark.parametrize(
        "change",
        [
            {"level": 7},
            {"level": ""},
            {"goals": []},
            {"goals": "health"},
            {"goals": [7]},
            {"usualPaceSecPerKm": "fast"},
        ],
    )
    def test_a_stored_document_that_no_longer_matches_the_shape_is_treated_as_missing(self, change):
        assert PerfilDeportivo.from_document({**SPORT_PROFILE, **change}) is None


PREFERENCES = {
    "language": "es",
    "fontScale": "large",
    "appearance": "dark",
    "units": "imperial",
    "notifications": {"enabled": True, "safetyAlerts": False, "events": True},
    "locationPrivacy": "off",
}


class TestPreferenciaUsuario:
    def test_parses_valid_preferences(self):
        preferences = PreferenciaUsuario.parse(PREFERENCES)

        assert preferences == PreferenciaUsuario(
            language="es",
            font_scale="large",
            appearance="dark",
            units="imperial",
            notifications=PreferenciaNotificaciones(enabled=True, safety_alerts=False, events=True),
            location_privacy="off",
        )
        assert preferences.to_document() == PREFERENCES

    def test_reports_every_invalid_field(self):
        raw = {
            **PREFERENCES,
            "language": "en",
            "fontScale": "huge",
            "notifications": {"enabled": "yes", "safetyAlerts": True},
        }

        assert fields_of(PreferenciaUsuario.parse, raw) == {
            "language": "invalid-choice",
            "fontScale": "invalid-choice",
            "notifications.enabled": "invalid",
            "notifications.events": "invalid",
        }

    def test_notifications_must_be_an_object(self):
        raw = {**PREFERENCES, "notifications": True}

        assert fields_of(PreferenciaUsuario.parse, raw) == {"notifications": "invalid"}

    def test_defaults_match_the_app(self):
        assert PreferenciaUsuario().to_document() == {
            "language": "es",
            "fontScale": "normal",
            "appearance": "light",
            "units": "metric",
            "notifications": {"enabled": True, "safetyAlerts": True, "events": True},
            "locationPrivacy": "trustedContactsDuringSession",
        }

    def test_a_stored_document_falls_back_to_the_default_field_by_field(self):
        stored = {
            "fontScale": "xlarge",
            "appearance": "neon",
            "notifications": {"events": False, "enabled": 1},
            "updatedAt": object(),
        }

        assert PreferenciaUsuario.from_document(stored) == PreferenciaUsuario(
            font_scale="xlarge",
            notifications=PreferenciaNotificaciones(events=False),
        )
