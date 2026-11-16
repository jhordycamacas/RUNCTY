import { route, slot } from '../../../routes/domain/testing/fixtures';
import { routeSlotLevels } from './slot-safety';

describe('routeSlotLevels', () => {
  it('gives the level of the route for every time slot, in the API order', () => {
    const levels = routeSlotLevels(
      route('jipiro', {
        safety: [slot('morning', '05:00', '07:00', 90), slot('night', '18:00', '24:00', 20)],
      }),
    );

    expect(levels).toEqual([
      { key: 'morning', label: '05:00 – 07:00', level: 'high' },
      { key: 'night', label: '18:00 – 24:00', level: 'low' },
    ]);
  });

  it('is empty for a route without time slots', () => {
    expect(routeSlotLevels(route('nueva'))).toEqual([]);
  });
});
