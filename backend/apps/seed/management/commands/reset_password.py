import getpass

from django.core.management.base import BaseCommand, CommandError

from apps.shared.presentation.adapters import adapter
from apps.users.domain.password_policy import password_error


class Command(BaseCommand):
    help = (
        "Sets a new password for an existing account and ends its open sessions. The password is "
        "asked on the terminal (never an argument). It never creates an account."
    )

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)

    def handle(self, *args, **options):
        password = getpass.getpass("New password: ")
        if getpass.getpass("Repeat the new password: ") != password:
            raise CommandError("The passwords do not match.")
        error = password_error(password)
        if error:
            raise CommandError(error)
        email = options["email"].strip()
        uid = adapter("SEED_ACCOUNTS").set_password(email, password)
        if uid is None:
            raise CommandError(f"No account has the email {email}.")
        adapter("AUTH_GATEWAY").revoke_refresh_tokens(uid)
        self.stdout.write(f"Password updated for {email} (uid {uid}).")
