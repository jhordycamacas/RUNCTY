"""Ported from `functions/src/routes/domain/geo.test.ts`."""

from apps.routes.domain.geo import LatLng, path_length_m


def test_sums_the_haversine_distance_between_consecutive_points_in_whole_meters():
    # 0.001 degrees of latitude is about 111.2 m
    assert path_length_m([LatLng(0, 0), LatLng(0.001, 0)]) == 111
    assert path_length_m([LatLng(0, 0), LatLng(0.001, 0), LatLng(0.002, 0)]) == 222


def test_is_zero_for_a_single_point_or_repeated_points():
    assert path_length_m([LatLng(-4, -79)]) == 0
    assert path_length_m([LatLng(-4, -79), LatLng(-4, -79)]) == 0
