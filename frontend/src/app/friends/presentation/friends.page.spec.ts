import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/errors/api-error';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { FriendRepository } from '../domain/friend';
import { FakeFriendRepository, profile } from '../testing/fake-friend.repository';
import { FriendsPage } from './friends.page';

describe('FriendsPage', () => {
  let fixture: ComponentFixture<FriendsPage>;
  let repository: FakeFriendRepository;
  let confirm: ReturnType<typeof vi.fn<ConfirmDialog['confirm']>>;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent?.replace(/\s+/g, ' ') ?? '';
  const buttons = (label: string) =>
    Array.from(root().querySelectorAll<HTMLElement>('ion-button')).filter((button) =>
      button.textContent?.includes(label),
    );

  async function settle(): Promise<void> {
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(FriendsPage);
    fixture.detectChanges();
    await settle();
  }

  async function openTab(value: string): Promise<void> {
    fixture.componentInstance['select'](value);
    fixture.detectChanges();
    await settle();
  }

  beforeEach(() => {
    repository = new FakeFriendRepository();
    confirm = vi.fn<ConfirmDialog['confirm']>().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: FriendRepository, useValue: repository },
        { provide: AuthService, useValue: { session: signal({ uid: 'me' }) } },
        { provide: ConfirmDialog, useValue: { confirm } },
      ],
    });
  });

  it('is titled «Amigos» with its three sections', async () => {
    await create();

    expect(text()).toContain('Amigos');
    expect(root().querySelectorAll('ion-segment-button')).toHaveLength(3);
    expect(text()).toContain('Solicitudes');
    expect(text()).toContain('Buscar');
  });

  it('shows the empty state of a user without friends', async () => {
    await create();

    expect(text()).toContain('Aún no tienes amigos');
    expect(buttons('Buscar personas')).toHaveLength(1);
  });

  it('lists the friends by name with the date they became friends', async () => {
    repository.friends = [{ profile: profile('ana-1', 'Ana', 'Paz'), since: '2026-11-23T09:00:00' }];

    await create();

    expect(text()).toContain('Ana Paz');
    expect(text()).toContain('Amigos desde');
    expect(text()).not.toContain('Aún no tienes amigos');
  });

  it('removes a friend only after the user confirms', async () => {
    repository.friends = [{ profile: profile('ana-1'), since: '' }];
    await create();
    confirm.mockResolvedValueOnce(false);

    await fixture.componentInstance['confirmRemove'](repository.friends[0]);
    expect(repository.calls).not.toContain('remove:ana-1');

    await fixture.componentInstance['confirmRemove'](repository.friends[0]);
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(repository.calls).toContain('remove:ana-1');
  });

  describe('requests', () => {
    beforeEach(() => {
      repository.requests = {
        incoming: [{ id: 'r1', profile: profile('b', 'Beto', 'Luna') }],
        outgoing: [{ id: 'r2', profile: profile('c', 'Carla', 'Vera') }],
      };
    });

    it('answers a received request with Aceptar or Rechazar', async () => {
      await create();
      await openTab('requests');

      expect(text()).toContain('Recibidas');
      expect(text()).toContain('Beto Luna');

      buttons('Aceptar')[0].click();
      buttons('Rechazar')[0].click();

      expect(repository.calls).toEqual(expect.arrayContaining(['accept:r1', 'reject:r1']));
    });

    it('cancels a sent request with Cancelar', async () => {
      await create();
      await openTab('requests');

      expect(text()).toContain('Enviadas');
      expect(text()).toContain('Carla Vera');
      buttons('Cancelar')[0].click();

      expect(repository.calls).toContain('cancel:r2');
    });

    it('shows the number of requests waiting for an answer', async () => {
      await create();

      expect(text()).toContain('Solicitudes (1)');
    });

    it('shows the empty state without requests', async () => {
      repository.requests = { incoming: [], outgoing: [] };
      await create();
      await openTab('requests');

      expect(text()).toContain('No tienes solicitudes pendientes');
    });
  });

  describe('search', () => {
    it('asks for three letters before it searches', async () => {
      await create();
      await openTab('search');

      expect(text()).toContain('Escribe al menos 3 letras');

      fixture.componentInstance['onQuery']('an');
      fixture.detectChanges();

      expect(repository.calls).not.toContain('search:an');
    });

    it('lists the results with a button that reflects the relation', async () => {
      repository.results = [
        { profile: profile('a', 'Ana', 'Uno'), relation: 'none' },
        { profile: profile('b', 'Ana', 'Dos'), relation: 'friend' },
        { profile: profile('c', 'Ana', 'Tres'), relation: 'request-sent' },
        { profile: profile('d', 'Ana', 'Cuatro'), relation: 'request-received' },
      ];
      await create();
      await openTab('search');

      fixture.componentInstance['onQuery']('ana');
      await settle();

      expect(text()).toContain('Ana Uno');
      expect(buttons('Agregar')).toHaveLength(1);
      expect(text()).toContain('Ya son amigos');
      expect(text()).toContain('Solicitud enviada');
      expect(buttons('Responder')).toHaveLength(1);

      buttons('Agregar')[0].click();
      expect(repository.calls).toContain('send:a');
    });

    it('says when nobody matches', async () => {
      await create();
      await openTab('search');

      fixture.componentInstance['onQuery']('zzz');
      await settle();

      expect(text()).toContain('No encontramos a nadie');
    });
  });

  it('shows a failure as a notice', async () => {
    repository.failure = new ApiError(0, 'network', 'Sin conexión.');

    await create();

    expect(text()).toContain('Sin conexión.');
  });
});
