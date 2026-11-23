import getpass

from django.core.management.base import BaseCommand, CommandError

from apps.seed.application.use_cases import AdminDeps, create_admin
from apps.shared.presentation.adapters import adapter
from apps.users.domain.password_policy import password_error


class Command(BaseCommand):
    help = (
        "Creates the first admin of a real Firebase project, or promotes an existing account to "
        "admin. The password is asked on the terminal (never an argument) and is ignored when "
        "the account already exists. Seeds the system roles, the pilot city, the system "
        "settings and the option catalogs only when they are missing."
    )

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--first-name", required=True)
        parser.add_argument("--last-name", required=True)

    def handle(self, *args, **options):
        password = getpass.getpass("Password: ")
        if getpass.getpass("Repeat the password: ") != password:
            raise CommandError("The passwords do not match.")
        error = password_error(password)
        if error:
            raise CommandError(error)
        deps = AdminDeps(
            cities=adapter("CITY_REPOSITORY"),
            roles=adapter("ROLE_REPOSITORY"),
            auth=adapter("AUTH_GATEWAY"),
            accounts=adapter("SEED_ACCOUNTS"),
            settings=adapter("SETTINGS_REPOSITORY"),
            catalogs=adapter("CATALOG_REPOSITORY"),
        )
        create_admin(
            deps,
            email=options["email"].strip(),
            password=password,
            first_name=options["first_name"].strip(),
            last_name=options["last_name"].strip(),
            report=self.stdout.write,
        )
