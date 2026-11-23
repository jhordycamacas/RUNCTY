import { displayDate, toUserDetail } from './user-detail';

const USER = {
  uid: 'u1',
  email: 'ana@mail.com',
  firstName: 'Ana',
  lastName: 'Pérez',
  birthDate: '1995-04-23',
  cityId: 'loja',
  role: 'runner',
  idNumber: '1710034065',
  emailVerified: true,
  createdAt: '2026-03-05T10:00:00Z',
};

describe('toUserDetail', () => {
  it('reads the user, the sport profile and the rating as the API sends them', () => {
    const detail = toUserDetail({
      user: USER,
      sportProfile: {
        level: 'beginner',
        goals: ['health', 'pace'],
        usualPaceSecPerKm: 390,
        preferredDistanceKm: 10,
      },
      rating: { average: 4.3, count: 12 },
    });

    expect(detail.user).toEqual(USER);
    expect(detail.sportProfile).toEqual({
      level: 'beginner',
      goals: ['health', 'pace'],
      usualPaceSecPerKm: 390,
      preferredDistanceKm: 10,
    });
    expect(detail.rating).toEqual({ average: 4.3, count: 12 });
  });

  it('tolerates missing optional fields', () => {
    const detail = toUserDetail({ user: { uid: 'u1', email: 'a@b.co' } });

    expect(detail.user).toEqual({
      uid: 'u1',
      email: 'a@b.co',
      firstName: '',
      lastName: '',
      birthDate: '',
      cityId: '',
      role: null,
      idNumber: null,
      emailVerified: null,
      createdAt: null,
    });
    expect(detail.sportProfile).toBeNull();
    expect(detail.rating).toBeNull();
  });

  it('survives a body that is not an object', () => {
    expect(toUserDetail(null).user.uid).toBe('');
    expect(toUserDetail('x').sportProfile).toBeNull();
  });

  it('keeps a sport profile with missing parts and drops non-text goals', () => {
    const detail = toUserDetail({ user: USER, sportProfile: { level: 'x', goals: ['health', 3] } });

    expect(detail.sportProfile).toEqual({
      level: 'x',
      goals: ['health'],
      usualPaceSecPerKm: null,
      preferredDistanceKm: null,
    });
  });

  it('has no rating when it is absent, empty or malformed', () => {
    expect(toUserDetail({ user: USER, rating: null }).rating).toBeNull();
    expect(toUserDetail({ user: USER, rating: { average: 4, count: 0 } }).rating).toBeNull();
    expect(toUserDetail({ user: USER, rating: { average: 'x', count: 3 } }).rating).toBeNull();
    expect(toUserDetail({ user: USER, rating: { average: 4 } }).rating).toBeNull();
  });

  it('keeps the average inside the five stars', () => {
    expect(toUserDetail({ user: USER, rating: { average: 7, count: 2 } }).rating).toEqual({
      average: 5,
      count: 2,
    });
  });
});

describe('displayDate', () => {
  it('writes a date in Spanish', () => {
    expect(displayDate('1995-04-23')).toBe('23 de abril de 1995');
    expect(displayDate('2026-03-05T10:00:00Z')).toBe('5 de marzo de 2026');
  });

  it('gives back what it cannot read', () => {
    expect(displayDate('ayer')).toBe('ayer');
  });
});
