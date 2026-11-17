import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let create: ReturnType<typeof vi.fn>;
  let dismissPrevious: ReturnType<typeof vi.fn>;
  let present: ReturnType<typeof vi.fn>;
  let service: ToastService;

  beforeEach(() => {
    present = vi.fn(async () => undefined);
    create = vi.fn(async () => ({ present }));
    dismissPrevious = vi.fn(async () => true);
    TestBed.configureTestingModule({
      providers: [{ provide: ToastController, useValue: { create, dismiss: dismissPrevious } }],
    });
    service = TestBed.inject(ToastService);
  });

  it('shows a success that closes by itself', async () => {
    await service.success('Rol creado.');

    const options = create.mock.calls[0][0];
    expect(options).toMatchObject({ message: 'Rol creado.', color: 'success', duration: 4000 });
    expect(present).toHaveBeenCalledOnce();
  });

  it('keeps an error on screen until the user dismisses it', async () => {
    await service.error('No se pudo guardar.');

    const options = create.mock.calls[0][0];
    expect(options.color).toBe('danger');
    expect(options.duration).toBeUndefined();
    expect(options.buttons).toEqual([{ text: 'Cerrar', role: 'cancel' }]);
    expect(options.htmlAttributes).toEqual({ role: 'alert' });
  });

  it('still shows when there is no previous toast (Ionic rejects dismiss in that case)', async () => {
    dismissPrevious.mockRejectedValue('overlay does not exist');

    await service.success('Ruta creada.');

    expect(present).toHaveBeenCalledOnce();
  });

  it('replaces the toast that is still showing', async () => {
    await service.success('Uno');
    await service.error('Dos');

    expect(dismissPrevious).toHaveBeenCalledTimes(2);
    expect(present).toHaveBeenCalledTimes(2);
  });
});
