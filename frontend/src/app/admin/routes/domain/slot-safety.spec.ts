import { route, segment, slot } from '../../../routes/domain/testing/fixtures';
import { TimeSlot } from './managed-route';
import { managedDetail } from '../testing/fake-route-admin.repository';
import { routeSlotLevels, safetySummary, segmentSlotLevels } from './slot-safety';

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

describe('safetySummary', () => {
  const factor = {
    type: 'poor_lighting',
    severity: 'high' as const,
    description: 'Sin postes de luz',
    segmentId: 's2',
    segmentName: 'Orilla',
  };
  const detail = managedDetail(
    route('jipiro', {
      safety: [
        { ...slot('night', '18:00', '24:00', 25), worstSegmentId: 's2', factors: [factor] },
        slot('morning', '05:00', '07:00', 90),
      ],
    }),
    {
      timeSlots: [
        {
          id: 'night',
          label: 'Noche',
          startTime: '18:00',
          endTime: '24:00',
          validFrom: null,
          validTo: null,
        },
      ],
      segments: [
        { ...segment('s1', { name: 'Entrada' }), riskFactors: [] },
        { ...segment('s2', { name: 'Orilla' }), riskFactors: [] },
      ],
    },
  );

  it('gives per slot the API level and score, the worst segment and the factors behind it', () => {
    expect(safetySummary(detail)).toEqual([
      {
        key: 'night',
        label: 'Noche (18:00 – 24:00)',
        level: 'low',
        score: 25,
        worstSegment: 'Orilla',
        factors: [factor],
      },
      {
        key: 'morning',
        label: '05:00 – 07:00',
        level: 'high',
        score: 90,
        worstSegment: null,
        factors: [],
      },
    ]);
  });

  it('is empty while the route has no rated slot', () => {
    expect(safetySummary(managedDetail(route('nueva')))).toEqual([]);
  });
});
