from django.conf import settings
from django.utils.module_loading import import_string


def adapter(setting: str):
    """A new instance of the adapter that `setting` names by dotted path."""
    return import_string(getattr(settings, setting))()
