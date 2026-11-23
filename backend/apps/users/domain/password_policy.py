"""RF-01-1: the password policy. Mirrors the one the apps enforce at sign-up: at least 8
characters, one letter and one number. Pure module: returns an error message, or None."""

PASSWORD_MIN_LENGTH = 8


def password_error(value: str) -> str | None:
    if len(value) < PASSWORD_MIN_LENGTH:
        return f"The password must have at least {PASSWORD_MIN_LENGTH} characters."
    if not any(character.isalpha() for character in value):
        return "The password must include at least one letter."
    if not any(character.isdigit() for character in value):
        return "The password must include at least one number."
    return None
