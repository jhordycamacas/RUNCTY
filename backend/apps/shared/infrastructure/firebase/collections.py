"""Firestore collection names. The data model is shared with the seed and the clients."""

USERS = "users"
ROLES = "roles"
CITIES = "cities"
ROUTES = "routes"
# Sub-collection of `users/{uid}` readable only by its owner.
USER_PRIVATE = "private"
# EP-08. Incidents reference their route by `routeId` and their source by `sourceId`.
INFORMATION_SOURCES = "informationSources"
SAFETY_INCIDENTS = "safetyIncidents"
# EP-06.
SUPPORT_POINTS = "supportPoints"
GUARDED_TRAILS = "guardedTrails"
# EP-07 (RF-07-12 to RF-07-15).
RISK_ZONE_ALERTS = "riskZoneAlerts"
# EP-09. Each request keeps the `uid` of the runner who made it.
SAFE_ROUTE_REQUESTS = "safeRouteRequests"
# System parameters: the single document `systemSettings/global` (`settings.manage`).
SYSTEM_SETTINGS = "systemSettings"
# Option catalogs the admin manages (sport levels, sport goals): one document per catalog id.
CATALOGS = "catalogs"
