import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import { HttpUserAdminRepository } from './http-user-admin.repository';

describe('HttpUserAdminRepository', () => {
  const api = { get: vi.fn() };
  let repository: HttpUserAdminRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [HttpUserAdminRepository, { provide: ApiClient, useValue: api }],
    });
    repository = TestBed.inject(HttpUserAdminRepository);
  });

  it('searches with the text and the cursor, and maps the page', async () => {
    api.get.mockReturnValue(
      of({
        users: [
          {
            uid: 'u1',
            email: 'ana@mail.com',
            firstName: 'Ana',
            lastName: 'Pérez',
            birthDate: '1995-04-23',
            cityId: 'loja',
            role: 'admin',
          },
          { uid: 'u2', email: 'luis@mail.com', role: null },
        ],
        nextCursor: 'u2',
      }),
    );

    const page = await repository.search('  Ana ', 'u0');

    expect(api.get).toHaveBeenCalledWith('/users', { q: 'Ana', cursor: 'u0' });
    expect(page.nextCursor).toBe('u2');
    expect(page.users).toEqual([
      {
        uid: 'u1',
        email: 'ana@mail.com',
        firstName: 'Ana',
        lastName: 'Pérez',
        birthDate: '1995-04-23',
        cityId: 'loja',
        role: 'admin',
      },
      { uid: 'u2', email: 'luis@mail.com', firstName: '', lastName: '', birthDate: '', cityId: '', role: null },
    ]);
  });

  it('sends neither text nor cursor on the first page and tolerates a body without users', async () => {
    api.get.mockReturnValue(of({}));

    const page = await repository.search('   ', null);

    expect(api.get).toHaveBeenCalledWith('/users', {});
    expect(page).toEqual({ users: [], nextCursor: null });
  });

  it('reads the detail of one user', async () => {
    api.get.mockReturnValue(
      of({
        user: { uid: 'u1', email: 'ana@mail.com', idNumber: '1710034065', emailVerified: false },
        sportProfile: null,
        rating: { average: 4, count: 3 },
      }),
    );

    const detail = await repository.get('u 1');

    expect(api.get).toHaveBeenCalledWith('/users/u%201');
    expect(detail.user).toMatchObject({ uid: 'u1', idNumber: '1710034065', emailVerified: false });
    expect(detail.sportProfile).toBeNull();
    expect(detail.rating).toEqual({ average: 4, count: 3 });
  });
});
