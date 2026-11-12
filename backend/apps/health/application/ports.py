from typing import Protocol


class GoogleServicesProbe(Protocol):
    def configured_services(self) -> dict[str, bool]:
        """Whether each Google service is ready to be used, keyed by service name."""
        ...
