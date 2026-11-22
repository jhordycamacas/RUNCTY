"""Demo data for the local emulators: the pilot city, the admin account and five sample routes
in Loja with fictitious risk factors, plus fictitious sources, incidents, support points, a
guarded trail and risk zone alerts. Written in the shape of the API request bodies, so the
seed validates it with the same domain classes as the endpoints."""

from dataclasses import dataclass

CITY = {
    "id": "loja",
    "name": "Loja",
    "province": "Loja",
    "type": "city",
    "location": {"lat": -3.99313, "lng": -79.20422},
    "coverage": "active",
}
CITY_ID = CITY["id"]

# Emulator-only credentials: the seed guard refuses to run against anything else.
ADMIN_EMAIL = "admin@runcty.dev"
ADMIN_PASSWORD = "Admin123!"  # noqa: S105
ADMIN_DISPLAY_NAME = "Administrador RUNCTY"
ADMIN_FIRST_NAME = "Administrador"
ADMIN_LAST_NAME = "RUNCTY"


@dataclass(frozen=True, slots=True)
class SeedSegment:
    name: str
    coordinates: list[dict[str, float]]
    factors: list[dict[str, str]]


@dataclass(frozen=True, slots=True)
class SeedRoute:
    id: str
    name: str
    description: str
    start: dict[str, object]
    end: dict[str, object]
    elevation_gain_m: int
    surface: str
    difficulty: str
    # Times the path is run: 2 = out and back, 3 = three laps.
    repeats: int
    segments: list[SeedSegment]


# Every route gets the two recommended training slots.
SEED_SLOTS = [
    {"id": "morning", "label": "Mañana", "startTime": "05:00", "endTime": "07:00"},
    {"id": "evening", "label": "Tarde", "startTime": "18:00", "endTime": "20:00"},
]


def _pt(lat: float, lng: float) -> dict[str, float]:
    return {"lat": lat, "lng": lng}


def _place(lat: float, lng: float, label: str) -> dict[str, object]:
    return {"lat": lat, "lng": lng, "label": label}


def _factor(
    factor_type: str,
    severity: str,
    description: str,
    start_time: str | None = None,
    end_time: str | None = None,
) -> dict[str, str]:
    """A risk factor; without a window it applies all day."""
    factor = {"type": factor_type, "severity": severity, "description": description}
    if start_time is not None and end_time is not None:
        factor |= {"startTime": start_time, "endTime": end_time}
    return factor


SEED_ROUTES = [
    SeedRoute(
        id="loja-jipiro",
        name="Parque Recreacional Jipiro",
        description=(
            "Circuito plano y concurrido alrededor del lago, ideal para empezar. "
            "Distancia de tres vueltas."
        ),
        start=_place(-3.9668, -79.2047, "Entrada principal (Av. Salvador Bustamante Celi)"),
        end=_place(-3.9712, -79.2032, "Puerta sur del parque"),
        elevation_gain_m=18,
        surface="asphalt",
        difficulty="beginner",
        repeats=3,
        segments=[
            SeedSegment(
                "Entrada principal al lago",
                [_pt(-3.9668, -79.2047), _pt(-3.9676, -79.2041), _pt(-3.9685, -79.2036)],
                [],
            ),
            SeedSegment(
                "Vuelta al lago",
                [
                    _pt(-3.9685, -79.2036),
                    _pt(-3.9693, -79.2022),
                    _pt(-3.9704, -79.2027),
                    _pt(-3.9699, -79.2043),
                    _pt(-3.9685, -79.2036),
                ],
                [],
            ),
            SeedSegment(
                "Juegos infantiles a la puerta sur",
                [_pt(-3.9685, -79.2036), _pt(-3.9698, -79.203), _pt(-3.9712, -79.2032)],
                [
                    _factor(
                        "poor_lighting",
                        "low",
                        "Algunas luminarias apagadas junto a los juegos.",
                        "18:00",
                        "24:00",
                    )
                ],
            ),
        ],
    ),
    SeedRoute(
        id="loja-tebaida",
        name="Parque Lineal La Tebaida",
        description=(
            "Sendero junto al río Malacatos con tramos de tierra y adoquín. "
            "Distancia de ida y vuelta."
        ),
        start=_place(-4.0102, -79.2085, "Ingreso por la Av. Pío Jaramillo"),
        end=_place(-4.0225, -79.2068, "Puente de La Tebaida"),
        elevation_gain_m=32,
        surface="mixed",
        difficulty="beginner",
        repeats=2,
        segments=[
            SeedSegment(
                "Ingreso y canchas",
                [_pt(-4.0102, -79.2085), _pt(-4.0128, -79.2081), _pt(-4.0151, -79.2077)],
                [],
            ),
            SeedSegment(
                "Orilla del río Malacatos",
                [_pt(-4.0151, -79.2077), _pt(-4.0176, -79.2074), _pt(-4.0199, -79.2071)],
                [
                    _factor(
                        "isolated_area",
                        "medium",
                        "Poco tránsito de personas al amanecer.",
                        "04:30",
                        "06:30",
                    ),
                    _factor(
                        "poor_lighting", "high", "Tramo sin alumbrado público.", "18:00", "24:00"
                    ),
                    _factor(
                        "harassment",
                        "low",
                        "Reportes ocasionales de acoso verbal.",
                        "19:00",
                        "22:00",
                    ),
                ],
            ),
            SeedSegment(
                "Llegada al puente",
                [_pt(-4.0199, -79.2071), _pt(-4.0213, -79.2069), _pt(-4.0225, -79.2068)],
                [],
            ),
        ],
    ),
    SeedRoute(
        id="loja-malecon-zamora",
        name="Malecón del Río Zamora",
        description=(
            "Recorrido urbano por el malecón, con cruces de avenidas en horas pico. "
            "Distancia de ida y vuelta."
        ),
        start=_place(-3.9845, -79.1985, "Puente Bolívar"),
        end=_place(-4.0105, -79.2006, "Redondel de la Av. Emiliano Ortega"),
        elevation_gain_m=25,
        surface="asphalt",
        difficulty="intermediate",
        repeats=2,
        segments=[
            SeedSegment(
                "Puente Bolívar a la Av. Universitaria",
                [_pt(-3.9845, -79.1985), _pt(-3.989, -79.199), _pt(-3.9935, -79.1994)],
                [
                    _factor(
                        "traffic",
                        "high",
                        "Cruces sin semáforo con mucho tráfico de entrada a la ciudad.",
                        "06:00",
                        "08:30",
                    ),
                    _factor(
                        "traffic", "medium", "Tráfico de salida en hora pico.", "17:00", "20:00"
                    ),
                ],
            ),
            SeedSegment(
                "Malecón central",
                [_pt(-3.9935, -79.1994), _pt(-3.9985, -79.1998), _pt(-4.003, -79.2001)],
                [
                    _factor("flood_risk", "low", "Se encharca cuando llueve fuerte."),
                    _factor(
                        "poor_lighting",
                        "high",
                        "Luminarias dañadas en varios postes.",
                        "18:00",
                        "24:00",
                    ),
                ],
            ),
            SeedSegment(
                "Llegada a la Av. Emiliano Ortega",
                [_pt(-4.003, -79.2001), _pt(-4.0065, -79.2003), _pt(-4.0105, -79.2006)],
                [],
            ),
        ],
    ),
    SeedRoute(
        id="loja-puear",
        name="Parque Universitario (PUEAR)",
        description=(
            "Senderos de montaña en el bosque de la Universidad Nacional de Loja, "
            "con subidas exigentes. Distancia de ida y vuelta."
        ),
        start=_place(-4.0325, -79.2002, "Ingreso por la UNL"),
        end=_place(-4.0418, -79.1935, "Mirador del PUEAR"),
        elevation_gain_m=180,
        surface="trail",
        difficulty="advanced",
        repeats=2,
        segments=[
            SeedSegment(
                "Ingreso UNL al sendero bajo",
                [_pt(-4.0325, -79.2002), _pt(-4.0345, -79.199), _pt(-4.0362, -79.1978)],
                [],
            ),
            SeedSegment(
                "Sendero del bosque",
                [
                    _pt(-4.0362, -79.1978),
                    _pt(-4.0378, -79.1962),
                    _pt(-4.0395, -79.1951),
                    _pt(-4.0404, -79.1944),
                ],
                [
                    _factor(
                        "isolated_area",
                        "high",
                        "Bosque sin personas cerca a primera hora.",
                        "05:00",
                        "07:30",
                    ),
                    _factor("uneven_terrain", "medium", "Raíces y piedras sueltas."),
                    _factor("poor_lighting", "high", "Sendero sin iluminación.", "18:00", "24:00"),
                    _factor(
                        "isolated_area",
                        "high",
                        "Zona aislada al anochecer.",
                        "18:30",
                        "24:00",
                    ),
                ],
            ),
            SeedSegment(
                "Subida al mirador",
                [_pt(-4.0404, -79.1944), _pt(-4.0411, -79.194), _pt(-4.0418, -79.1935)],
                [_factor("uneven_terrain", "low", "Escalones de tierra irregulares.")],
            ),
        ],
    ),
    SeedRoute(
        id="loja-pucara-orillas",
        name="Parque Pucará y Av. Orillas del Zamora",
        description=(
            "Ruta larga hacia el norte por la Av. Orillas del Zamora hasta el Parque Pucará. "
            "Distancia de ida y vuelta."
        ),
        start=_place(-3.9985, -79.1998, "Av. Orillas del Zamora y Av. Universitaria"),
        end=_place(-3.952, -79.209, "Parque Pucará"),
        elevation_gain_m=140,
        surface="asphalt",
        difficulty="intermediate",
        repeats=2,
        segments=[
            SeedSegment(
                "Av. Orillas del Zamora (centro)",
                [
                    _pt(-3.9985, -79.1998),
                    _pt(-3.9935, -79.1994),
                    _pt(-3.985, -79.199),
                    _pt(-3.976, -79.1995),
                    _pt(-3.97, -79.2005),
                ],
                [
                    _factor(
                        "traffic",
                        "medium",
                        "Tráfico intenso al salir del trabajo.",
                        "17:30",
                        "19:30",
                    )
                ],
            ),
            SeedSegment(
                "Orillas del Zamora (norte)",
                [_pt(-3.97, -79.2005), _pt(-3.964, -79.203), _pt(-3.958, -79.2055)],
                [
                    _factor(
                        "isolated_area",
                        "high",
                        "Tramo solitario antes del amanecer.",
                        "04:30",
                        "06:00",
                    ),
                    _factor(
                        "poor_lighting",
                        "high",
                        "Alumbrado escaso hasta que amanece.",
                        "00:00",
                        "06:15",
                    ),
                    _factor(
                        "harassment",
                        "medium",
                        "Reportes de acoso al anochecer cerca de la parada de buses.",
                        "18:00",
                        "21:00",
                    ),
                ],
            ),
            SeedSegment(
                "Subida al Parque Pucará",
                [_pt(-3.958, -79.2055), _pt(-3.955, -79.2072), _pt(-3.952, -79.209)],
                [],
            ),
        ],
    ),
]


# ---------- Sprint 3 (EP-06, EP-07 alerts, EP-08) ----------

SEED_SOURCES = [
    {"id": "ecu911-robos", "entity": "ECU 911", "dataType": "Robos y asaltos reportados"},
    {"id": "policia-acoso", "entity": "Policía Nacional", "dataType": "Denuncias de acoso"},
]


@dataclass(frozen=True, slots=True)
class SeedIncident:
    id: str
    route_id: str
    segment_id: str
    type: str
    # Dated relative to the day the seed runs, so it always falls in the last 12 months.
    days_ago: int
    time: str
    source_id: str


SEED_INCIDENTS = [
    # Takes the evening of Jipiro from high to medium (seg-2: 100 - 35).
    SeedIncident("inc-jipiro-robo", "loja-jipiro", "seg-2", "robbery", 20, "19:00", "ecu911-robos"),
    # Adds to the morning traffic of the Malecón (seg-1: 65 - 20).
    SeedIncident(
        "inc-malecon-acoso",
        "loja-malecon-zamora",
        "seg-1",
        "harassment",
        45,
        "06:00",
        "policia-acoso",
    ),
]

SEED_SUPPORT_POINTS = [
    {
        "id": "upc-jipiro",
        "type": "police_post",
        "name": "UPC Jipiro",
        "location": _pt(-3.9671, -79.2052),
        "cityId": CITY_ID,
        "openingHours": "Lun–Dom 24 h",
    },
    {
        "id": "centro-salud-tebaida",
        "type": "health_center",
        "name": "Centro de Salud La Tebaida",
        "location": _pt(-4.0145, -79.2092),
        "cityId": CITY_ID,
        "openingHours": "Lun–Vie 08:00–17:00",
    },
    {
        "id": "tienda-malecon",
        "type": "open_business",
        "name": "Tienda del Malecón",
        "location": _pt(-3.9938, -79.1989),
        "cityId": CITY_ID,
        "openingHours": "Lun–Sáb 06:00–21:00",
    },
]

SEED_GUARDED_TRAILS = [
    {
        "id": "resguardo-puear",
        "routeId": "loja-puear",
        "segmentId": "seg-2",
        "days": ["sat", "sun"],
        "startTime": "06:00",
        "endTime": "09:00",
    },
]


@dataclass(frozen=True, slots=True)
class SeedAlert:
    id: str
    # The API body without `validFrom`/`validTo`, which the seed dates around the day it runs.
    body: dict[str, object]
    days_before: int
    days_after: int


SEED_ALERTS = [
    SeedAlert(
        "alerta-malecon-robos",
        {
            "type": "Robos frecuentes",
            "severity": "alta",
            "description": "Reportes de robo de celulares en el malecón al anochecer.",
            "location": _pt(-3.9985, -79.1998),
            "radiusM": 400,
            "cityId": CITY_ID,
            "routeId": "loja-malecon-zamora",
        },
        days_before=3,
        days_after=30,
    ),
    SeedAlert(
        "alerta-centro-obras",
        {
            "type": "Obras en la vía",
            "severity": "baja",
            "description": "Trabajos de alcantarillado con desvíos peatonales en el centro.",
            "location": _pt(-3.9965, -79.2015),
            "radiusM": 250,
            "cityId": CITY_ID,
        },
        days_before=1,
        days_after=14,
    ),
]
