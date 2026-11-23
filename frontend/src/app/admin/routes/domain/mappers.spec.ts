import { toManagedRouteDetail } from './mappers';

const RAW = {
  id: 'jipiro',
  name: 'Parque Jipiro',
  cityId: 'loja',
  active: false,
  segments: [
    {
      id: 's2',
      name: 'Orilla',
      order: 1,
      riskFactors: [
        {
          id: 'f1',
          type: 'Iluminación deficiente',
          severity: 'high',
          description: 'Postes apagados',
          startTime: '18:00',
          endTime: '24:00',
        },
        { id: 'f2', type: 'Tráfico', severity: 'low', description: 'Cruce', startTime: null },
        { id: 'broken', severity: 'extreme' },
        'nope',
      ],
    },
    { id: 's1', name: 'Entrada', order: 0 },
  ],
  timeSlots: [
    { id: 'evening', label: null, startTime: '18:00', endTime: '20:00', validFrom: null },
    {
      id: 'morning',
      label: 'Mañana',
      startTime: '05:00',
      endTime: '07:00',
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
    },
    { id: 'broken', startTime: '25:00', endTime: '07:00' },
  ],
};

describe('toManagedRouteDetail', () => {
  it('keeps the route, including an inactive one', () => {
    const detail = toManagedRouteDetail(RAW);

    expect(detail.route).toMatchObject({ id: 'jipiro', name: 'Parque Jipiro', active: false });
  });

  it('sorts the segments by order and reads their risk factors', () => {
    const { segments } = toManagedRouteDetail(RAW);

    expect(segments.map((segment) => segment.id)).toEqual(['s1', 's2']);
    expect(segments[0].riskFactors).toEqual([]);
    expect(segments[1].riskFactors).toEqual([
      {
        id: 'f1',
        type: 'Iluminación deficiente',
        severity: 'high',
        description: 'Postes apagados',
        startTime: '18:00',
        endTime: '24:00',
      },
      {
        id: 'f2',
        type: 'Tráfico',
        severity: 'low',
        description: 'Cruce',
        startTime: null,
        endTime: null,
      },
    ]);
  });

  it('sorts the time slots by start time and drops malformed ones', () => {
    const { timeSlots } = toManagedRouteDetail(RAW);

    expect(timeSlots).toEqual([
      {
        id: 'morning',
        label: 'Mañana',
        startTime: '05:00',
        endTime: '07:00',
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
      },
      {
        id: 'evening',
        label: null,
        startTime: '18:00',
        endTime: '20:00',
        validFrom: null,
        validTo: null,
      },
    ]);
  });

  it('tolerates a response without segments or time slots', () => {
    expect(toManagedRouteDetail({ id: 'x' })).toMatchObject({ segments: [], timeSlots: [] });
  });
});
