from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.seed.application.use_cases import SeedDeps, run_seed
from apps.seed.domain.guard import check_seed_target
from apps.shared.presentation.adapters import adapter


class Command(BaseCommand):
    help = (
        "Seeds the Firebase emulators with Loja, the system roles, an admin account and sample "
        "routes. Refuses to run against anything but a demo project on a local emulator."
    )

    def handle(self, *args, **options):
        hosts = settings.FIREBASE_EMULATOR_HOSTS
        error = check_seed_target(
            settings.FIREBASE_PROJECT_ID,
            hosts.get("FIRESTORE_EMULATOR_HOST"),
            hosts.get("FIREBASE_AUTH_EMULATOR_HOST"),
        )
        if error:
            raise CommandError(error)
        deps = SeedDeps(
            cities=adapter("CITY_REPOSITORY"),
            roles=adapter("ROLE_REPOSITORY"),
            auth=adapter("AUTH_GATEWAY"),
            accounts=adapter("SEED_ACCOUNTS"),
            routes=adapter("ROUTE_REPOSITORY"),
        )
        run_seed(deps, self.stdout.write)
