from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.seed.application.use_cases import SeedDeps, run_seed
from apps.seed.domain.guard import check_seed_target
from apps.shared.presentation.adapters import adapter


class Command(BaseCommand):
    help = (
        "Seeds the Firebase emulators with Loja, the system roles, an admin account, sample "
        "routes and the Sprint 3 safety data. Refuses to run against anything but a demo "
        "project on a local emulator, unless --data-only leaves the accounts out."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--data-only",
            action="store_true",
            help="Seed everything but the test admin account; the only mode for a real project.",
        )

    def handle(self, *args, **options):
        hosts = settings.FIREBASE_EMULATOR_HOSTS
        error = check_seed_target(
            settings.FIREBASE_PROJECT_ID,
            hosts.get("FIRESTORE_EMULATOR_HOST"),
            hosts.get("FIREBASE_AUTH_EMULATOR_HOST"),
        )
        if error and not options["data_only"]:
            raise CommandError(
                f"{error} The test admin must never exist in a real project: create the first "
                "admin with `create_admin`, or pass --data-only to seed the data without accounts."
            )
        deps = SeedDeps(
            cities=adapter("CITY_REPOSITORY"),
            roles=adapter("ROLE_REPOSITORY"),
            auth=adapter("AUTH_GATEWAY"),
            accounts=adapter("SEED_ACCOUNTS"),
            routes=adapter("ROUTE_REPOSITORY"),
            sources=adapter("SOURCE_REPOSITORY"),
            support_points=adapter("SUPPORT_POINT_REPOSITORY"),
            guarded_trails=adapter("GUARDED_TRAIL_REPOSITORY"),
            alerts=adapter("RISK_ZONE_ALERT_REPOSITORY"),
            settings=adapter("SETTINGS_REPOSITORY"),
            catalogs=adapter("CATALOG_REPOSITORY"),
        )
        run_seed(deps, self.stdout.write, include_accounts=not options["data_only"])
