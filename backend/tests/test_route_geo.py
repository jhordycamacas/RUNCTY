"""Ported from `functions/src/routes/domain/geo.test.ts`."""

from apps.routes.domain.geo import LatLng, path_length_m, preview_polyline


def test_sums_the_haversine_distance_between_consecutive_points_in_whole_meters():
    # 0.001 degrees of latitude is about 111.2 m
    assert path_length_m([LatLng(0, 0), LatLng(0.001, 0)]) == 111
    assert path_length_m([LatLng(0, 0), LatLng(0.001, 0), LatLng(0.002, 0)]) == 222


def test_is_zero_for_a_single_point_or_repeated_points():
    assert path_length_m([LatLng(-4, -79)]) == 0
    assert path_length_m([LatLng(-4, -79), LatLng(-4, -79)]) == 0


class TestPreviewPolyline:
    def test_keeps_a_short_polyline_as_is(self):
        points = [LatLng(0, 0), LatLng(1, 1), LatLng(2, 2)]

        assert preview_polyline(points) == points

    def test_down_samples_evenly_keeping_the_first_and_last_point(self):
        points = [LatLng(i, -i) for i in range(101)]

        preview = preview_polyline(points, 5)

        assert preview == [
            LatLng(0, 0),
            LatLng(25, -25),
            LatLng(50, -50),
            LatLng(75, -75),
            LatLng(100, -100),
        ]

    def test_never_exceeds_forty_points_by_default(self):
        points = [LatLng(i / 1000, 0) for i in range(500)]

        preview = preview_polyline(points)

        assert len(preview) == 40
        assert (preview[0], preview[-1]) == (points[0], points[-1])

    def test_handles_empty_and_single_point(self):
        assert preview_polyline([]) == []
        assert preview_polyline([LatLng(1, 2)]) == [LatLng(1, 2)]
