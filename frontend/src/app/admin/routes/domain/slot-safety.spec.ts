import { route, segment, slot } from '../../../routes/domain/testing/fixtures';
import { TimeSlot } from './managed-route';
import { routeSlotLevels, segmentSlotLevels } from './slot-safety';

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

describe('segmentSlotLevels', () => {
  const timeSlot = (id: string, startTime: string, endTime: string, label: string | null = null) =>
    ({ id, label, startTime, endTime, validFrom: null, validTo: null }) satisfies TimeSlot;

  it('gives the level of the segment for every slot of the route, named when it has a label', () => {
    const levels = segmentSlotLevels(
      segment('s1', { safety: { morning: { level: 'medium', score: 50, factors: [] } } }),
      [timeSlot('morning', '05:00', '07:00', 'Mañana'), timeSlot('night', '18:00', '24:00')],
    );

    expect(levels).toEqual([
      { key: 'morning', label: 'Mañana (05:00 – 07:00)', level: 'medium' },
      { key: 'night', label: '18:00 – 24:00', level: null },
    ]);
  });
});
