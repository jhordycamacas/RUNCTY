import { googleMapsUrl } from './maps';

describe('googleMapsUrl', () => {
  it('searches the coordinates of the point', () => {
    expect(googleMapsUrl({ lat: -3.97, lng: -79.2 })).toBe(
      'https://www.google.com/maps/search/?api=1&query=-3.97,-79.2',
    );
  });
});
