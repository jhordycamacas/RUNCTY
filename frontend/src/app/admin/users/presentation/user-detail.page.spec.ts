import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { CitiesStore } from '../../../cities/application/cities.store';
import { CityRepository } from '../../../cities/domain/city';
import { CatalogRepository } from '../../../core/catalogs/catalog';
import { fakeCatalogRepository } from '../../../core/catalogs/testing/fake-catalog.repository';
import { ApiError } from '../../../core/errors/api-error';
import { DEFAULT_SETTINGS } from '../../../core/settings/system-settings';
import { SystemSettingsStore } from '../../../core/settings/system-settings.store';
import { AdminRolesStore } from '../../roles/application/admin-roles.store';
import { RoleAdminRepository } from '../../roles/domain/role';
import {
  FakeRoleAdminRepository,
  fakeRoleAdminRepository,
  role,
  settle,
} from '../../roles/testing/fake-role-admin.repository';
import { UserDetailStore } from '../application/user-detail.store';
import { UserAdminRepository } from '../domain/managed-user';
import {
  FakeUserAdminRepository,
  fakeUserAdminRepository,
  userDetail,
} from '../testing/fake-user-admin.repository';
import { UserDetailPage } from './user-detail.page';

describe('UserDetailPage', () => {
  let fixture: ComponentFixture<UserDetailPage>;
  let users: FakeUserAdminRepository;
  let roles: FakeRoleAdminRepository;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent?.replace(/\s+/g, ' ') ?? '';
  const panel = (title: string) =>
    [...root().querySelectorAll('section')].find(
      (el) => el.querySelector('h2')?.textContent?.trim() === title,
    ) as HTMLElement;
  const panelText = (title: string) => panel(title)?.textContent?.replace(/\s+/g, ' ') ?? '';
  const button = (label: string) =>
    [...root().querySelectorAll('ion-button')].find((el) => el.textContent?.trim() === label);

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(UserDetailPage);
    fixture.detectChanges();
    fixture.componentInstance.ionViewWillEnter();
    await settle(fixture);
  }

  beforeEach(() => {
    users = fakeUserAdminRepository();
    users.get.mockResolvedValue(userDetail('u1'));
    roles = fakeRoleAdminRepository();
    roles.list.mockResolvedValue([role('runner', { name: 'Corredor' })]);
    const catalogs = fakeCatalogRepository({
      sportLevels: [
        { code: 'beginner', label: 'Principiante', order: 1, active: true },
        { code: 'legacy', label: 'Antiguo', order: 2, active: false },
      ],
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        UserDetailStore,
        AdminRolesStore,
        CitiesStore,
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ uid: 'u1' }) } } },
        { provide: UserAdminRepository, useValue: users },
        { provide: RoleAdminRepository, useValue: roles },
        { provide: CityRepository, useValue: { list: async () => [{ id: 'loja', name: 'Loja', type: 'city' }] } },
        { provide: CatalogRepository, useValue: catalogs },
        {
          provide: SystemSettingsStore,
          useValue: { settings: signal({ ...DEFAULT_SETTINGS }), load: async () => undefined },
        },
      ],
    });
  });

  it('asks for the user of the route and titles the page with the full name', async () => {
    await create();

    expect(users.get).toHaveBeenCalledWith('u1');
    expect(root().querySelector('app-admin-header h1')?.textContent).toContain('Ana Pérez');
  });

  it('shows a loading state while the user arrives', async () => {
    users.get.mockReturnValueOnce(new Promise<never>(() => undefined));
    await create();

    expect(text()).toContain('Cargando usuario…');
    expect(root().querySelector('app-admin-header h1')?.textContent).toContain('Usuario');
  });

  it('has the three panels', async () => {
    await create();

    expect([...root().querySelectorAll('section h2')].map((el) => el.textContent?.trim())).toEqual([
      'Perfil personal',
      'Perfil deportivo',
      'Valoración',
    ]);
  });

  describe('personal profile', () => {
    it('shows the data with the names of the city and the role', async () => {
      await create();

      const personal = panelText('Perfil personal');
      expect(personal).toContain('Ana Pérez');
      expect(personal).toContain('ana@mail.com');
      expect(personal).toContain('1710034065');
      expect(personal).toContain('23 de abril de 1995');
      expect(personal).toMatch(/\(\d+ años\)/);
      expect(personal).toContain('Loja');
      expect(personal).toContain('Corredor');
      expect(personal).toContain('5 de marzo de 2026');
    });

    it('tags the email as verified or not only when the API says so', async () => {
      await create();
      expect(panelText('Perfil personal')).toContain('Verificado');
      expect(panelText('Perfil personal')).not.toContain('Sin verificar');
    });

    it('says an email is not verified', async () => {
      const detail = userDetail('u1');
      users.get.mockResolvedValue({ ...detail, user: { ...detail.user, emailVerified: false } });
      await create();

      expect(panelText('Perfil personal')).toContain('Sin verificar');
    });

    it('shows no verification tag, creation date or cédula that the API does not send', async () => {
      const detail = userDetail('u1');
      users.get.mockResolvedValue({
        ...detail,
        user: { ...detail.user, emailVerified: null, createdAt: null, idNumber: null, role: null },
      });
      await create();

      const personal = panelText('Perfil personal');
      expect(personal).not.toContain('Verificado');
      expect(personal).not.toContain('Sin verificar');
      expect(personal).not.toContain('Registrado');
      expect(personal).toContain('No registrada');
      expect(personal).toContain('Sin rol');
    });
  });

  describe('sport profile', () => {
    it('shows level and goals with the labels of the catalogs, and pace and distance', async () => {
      await create();

      const sport = panelText('Perfil deportivo');
      expect(sport).toContain('Principiante');
      expect(sport).toContain('Salud');
      expect(sport).toContain('Mejorar mi ritmo');
      expect(sport).toContain('6:30 min/km');
      expect(sport).toContain('10 km');
      expect(sport).not.toContain('beginner');
    });

    it('labels an inactive code and shows the raw code of an unknown one', async () => {
      const detail = userDetail('u1');
      users.get.mockResolvedValue({
        ...detail,
        sportProfile: { ...detail.sportProfile!, level: 'legacy', goals: ['health', 'gone'] },
      });
      await create();

      const sport = panelText('Perfil deportivo');
      expect(sport).toContain('Antiguo');
      expect(sport).toContain('gone');
    });

    it('says so when the user has not completed it', async () => {
      users.get.mockResolvedValue(userDetail('u1', { sportProfile: null }));
      await create();

      expect(panelText('Perfil deportivo')).toContain(
        'Este usuario aún no completó su perfil deportivo.',
      );
    });

    it('does not invent the pace or the distance the API leaves out', async () => {
      const detail = userDetail('u1');
      users.get.mockResolvedValue({
        ...detail,
        sportProfile: { ...detail.sportProfile!, usualPaceSecPerKm: null, preferredDistanceKm: null },
      });
      await create();

      expect(panelText('Perfil deportivo')).not.toContain('min/km');
      expect(panelText('Perfil deportivo')).toContain('No indicado');
    });
  });

  describe('rating', () => {
    it('shows the stars with their text alternative', async () => {
      await create();

      expect(panel('Valoración').querySelector('app-rating-stars [role="img"]')?.getAttribute('aria-label')).toBe(
        '4,3 de 5 estrellas, 12 valoraciones',
      );
    });

    it('says so when nobody rated the user, or the API sends no rating', async () => {
      users.get.mockResolvedValue(userDetail('u1', { rating: null }));
      await create();

      expect(panelText('Valoración')).toContain('Aún no tiene valoraciones.');
      expect(panel('Valoración').querySelector('app-rating-stars')).toBeNull();
    });
  });

  describe('failures', () => {
    it('says the user does not exist', async () => {
      users.get.mockRejectedValue(new ApiError(404, 'user-not-found', 'No encontrado.'));
      await create();

      expect(text()).toContain('No encontramos a este usuario.');
      expect(root().querySelector('section')).toBeNull();
      expect(button('Reintentar')).toBeUndefined();
    });

    it('shows the error with a retry that asks again', async () => {
      users.get.mockRejectedValueOnce(new ApiError(0, 'network', 'No hay conexión con el servidor.'));
      await create();

      expect(text()).toContain('No hay conexión con el servidor.');

      button('Reintentar')?.dispatchEvent(new Event('click'));
      await settle(fixture);

      expect(users.get).toHaveBeenCalledTimes(2);
      expect(panelText('Perfil personal')).toContain('ana@mail.com');
    });
  });
});
