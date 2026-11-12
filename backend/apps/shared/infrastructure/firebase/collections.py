"""Firestore collection names. The data model is shared with the seed and the clients."""

USERS = "users"
ROLES = "roles"
# Sub-collection of `users/{uid}` readable only by its owner.
USER_PRIVATE = "private"
