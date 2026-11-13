import { TestBed } from '@angular/core/testing';
import { AlertController } from '@ionic/angular';
import { ApiError } from '../../core/errors/api-error';
import { ConfirmDialog } from './confirm-dialog';

interface FakeButton {
  text: string;
  role?: string;
  cssClass?: string;
  handler?: () => unknown;
}

describe('ConfirmDialog.confirmAction', () => {
  let buttons: FakeButton[];
  let alert: { backdropDismiss: boolean; message: string; present: () => Promise<void>; onDidDismiss: () => Promise<unknown> };
  let dismiss: (() => void) | undefined;
  let dialog: ConfirmDialog;

  const cancel = () => buttons[0];
  const confirm = () => buttons[1];

  beforeEach(() => {
    dismiss = undefined;
    alert = {
      backdropDismiss: true,
      message: '',
      present: async () => undefined,
      onDidDismiss: () => new Promise((resolve) => (dismiss = () => resolve({}))),
    };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AlertController,
          useValue: {
            create: async (options: { message: string; buttons: FakeButton[] }) => {
              buttons = options.buttons;
              alert.message = options.message;
              return alert;
            },
          },
        },
      ],
    });
    dialog = TestBed.inject(ConfirmDialog);
  });

  const open = (run: () => Promise<void>, destructive = false) =>
    dialog.confirmAction({
      header: 'Eliminar',
      message: '¿Seguro?',
      confirmText: 'Eliminar',
      destructive,
      run,
    });

  it('styles the confirm button as danger only for destructive actions', async () => {
    void open(async () => undefined, true);
    await vi.waitFor(() => expect(dismiss).toBeDefined());
    expect(confirm().cssClass).toBe('alert-destructive');
    expect(cancel().role).toBeUndefined();
  });

  it('closes and resolves true once the action succeeded', async () => {
    const run = vi.fn(async () => undefined);
    const result = open(run);
    await vi.waitFor(() => expect(dismiss).toBeDefined());

    expect(await confirm().handler?.()).toBe(true);
    dismiss?.();

    expect(await result).toBe(true);
    expect(run).toHaveBeenCalledOnce();
  });

  it('cannot be closed while the action is pending', async () => {
    let finish: () => void = () => undefined;
    const result = open(() => new Promise<void>((resolve) => (finish = resolve)));
    await vi.waitFor(() => expect(dismiss).toBeDefined());

    const pending = confirm().handler?.() as Promise<boolean>;

    expect(alert.backdropDismiss).toBe(false);
    expect(alert.message).toBe('Procesando…');
    expect(cancel().handler?.()).toBe(false);
    expect(await (confirm().handler?.() as Promise<boolean>)).toBe(false);

    finish();
    expect(await pending).toBe(true);
    dismiss?.();
    expect(await result).toBe(true);
  });

  it('stays open with the server reason when the action fails, and can be retried or cancelled', async () => {
    const run = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new ApiError(412, 'city-has-routes', 'No se puede eliminar: tiene rutas asociadas.'))
      .mockResolvedValueOnce(undefined);
    const result = open(run);
    await vi.waitFor(() => expect(dismiss).toBeDefined());

    expect(await confirm().handler?.()).toBe(false);

    expect(alert.message).toBe('No se puede eliminar: tiene rutas asociadas.');
    expect(alert.backdropDismiss).toBe(true);
    expect(cancel().handler?.()).toBe(true);

    expect(await confirm().handler?.()).toBe(true);
    dismiss?.();
    expect(await result).toBe(true);
  });

  it('resolves false when the user cancels', async () => {
    const run = vi.fn(async () => undefined);
    const result = open(run);
    await vi.waitFor(() => expect(dismiss).toBeDefined());

    expect(cancel().handler?.()).toBe(true);
    dismiss?.();

    expect(await result).toBe(false);
    expect(run).not.toHaveBeenCalled();
  });
});
