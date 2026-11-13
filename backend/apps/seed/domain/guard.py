"""SEC-05: the seed writes an admin account with a known password, so it must only ever run
against local emulators. Pure module: returns an error message, or None when the target is safe."""

_ALLOWED_HOSTS = frozenset({"127.0.0.1", "localhost", "::1", "firebase"})


def _host_of(host_port: str) -> str:
    """Strips the port and the IPv6 brackets: `[::1]:9099` -> `::1`, `firebase:80` -> `firebase`."""
    if host_port.startswith("["):
        return host_port[1 : host_port.index("]")]
    colon = host_port.rfind(":")
    # A bare IPv6 literal has several colons and no port.
    return host_port if colon == -1 or host_port.find(":") != colon else host_port[:colon]


def check_seed_target(
    project_id: str | None, firestore_host: str | None, auth_host: str | None
) -> str | None:
    if not firestore_host or not auth_host:
        return (
            "Refusing to seed: FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST "
            "must point to the emulators."
        )
    if not project_id or not project_id.startswith("demo-"):
        return 'Refusing to seed: the project id must start with "demo-".'
    for host_port in (firestore_host, auth_host):
        if _host_of(host_port) not in _ALLOWED_HOSTS:
            return (
                f'Refusing to seed: "{host_port}" is not a loopback host '
                '(127.0.0.1, localhost, ::1) or the Docker "firebase" service.'
            )
    return None
