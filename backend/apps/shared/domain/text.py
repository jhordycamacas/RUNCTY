import unicodedata


def sort_key(text: str) -> str:
    """Text without case or accents: the order the clients gave (`localeCompare` in Spanish)."""
    plain = unicodedata.normalize("NFD", text.casefold())
    return "".join(char for char in plain if not unicodedata.combining(char))
