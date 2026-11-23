import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { CatalogRepository } from '../../../../core/catalogs/catalog';
import {
  FakeCatalogRepository,
  fakeCatalogRepository,
} from '../../../../core/catalogs/testing/fake-catalog.repository';
import { ApiError } from '../../../../core/errors/api-error';
import { ToastService } from '../../../../shared/ui/toast.service';
import { CatalogsStore } from '../application/catalogs.store';
import { CatalogRow } from '../domain/catalog-editor';
import { CatalogEditor } from './catalog-editor';
import { CatalogsPage } from './catalogs.page';

async function settle(fixture: { detectChanges(): void }): Promise<void> {
  for (let i = 0; i < 6; i += 1) {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }
}

type ButtonElement = HTMLElement & { disabled: boolean };

describe('CatalogsPage', () => {
  let fixture: ComponentFixture<CatalogsPage>;
  let repository: FakeCatalogRepository;
  let success: ReturnType<typeof vi.fn<ToastService['success']>>;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent ?? '';
  const editors = () =>
    fixture.debugElement.queryAll(By.directive(CatalogEditor)).map((el) => el.componentInstance);
  const levels = () => editors()[0] as CatalogEditor;
  const goals = () => editors()[1] as CatalogEditor;
  const rows = (editor: CatalogEditor): CatalogRow[] => editor['rows']();
  const labels = (editor: CatalogEditor) => rows(editor).map((row) => row.label);
  const levelsSection = () => root().querySelector('section') as HTMLElement;
  const button = (label: string, within: ParentNode = root()) =>
    [...within.querySelectorAll('ion-button')].find((el) => el.textContent?.trim() === label) as
      | ButtonElement
      | undefined;
  /** The `up`, `down` or `remove` button of the nth option of the levels catalog. */
  const control = (index: number, name: 'up' | 'down' | 'remove') =>
    levelsSection().querySelectorAll('li.row')[index]?.querySelector(`.${name}`) as
      | ButtonElement
      | null
      | undefined;
  const click = async (element: HTMLElement | null | undefined) => {
    expect(element).toBeTruthy();
    element?.dispatchEvent(new Event('click'));
    await settle(fixture);
  };
  const saveLevels = () => click(button('Guardar cambios', levelsSection()));
  const addToLevels = () => click(button('Agregar opción', levelsSection()));

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(CatalogsPage);
    fixture.detectChanges();
    await settle(fixture);
  }

  beforeEach(() => {
    repository = fakeCatalogRepository();
    success = vi.fn<ToastService['success']>().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        CatalogsStore,
        { provide: CatalogRepository, useValue: repository },
        { provide: ToastService, useValue: { success } },
      ],
    });
  });

  it('shows both catalogs with their options and the rule about deactivating', async () => {
    await create();

    expect(text()).toContain('Niveles deportivos');
    expect(text()).toContain('Objetivos deportivos');
    expect(labels(levels())).toEqual(['Principiante', 'Intermedio', 'Avanzado']);
    expect(labels(goals())).toHaveLength(5);
    expect(text()).toContain(
      'Desactiva una opción para ocultarla; los perfiles que ya la usan la conservan.',
    );
    expect(text()).toContain('El código no se puede cambiar');
    expect(text()).toContain('beginner');
  });

  it('offers the two screens of Configuración', async () => {
    await create();

    const links = [...root().querySelectorAll('nav a')].map((a) => a.textContent?.trim());
    expect(links).toEqual(['Parámetros', 'Opciones del perfil deportivo']);
  });

  it('keeps Guardar cambios disabled until something changes', async () => {
    await create();
    expect(button('Guardar cambios')?.disabled).toBe(true);
    expect(levels().hasUnsavedChanges()).toBe(false);

    await click(control(0, 'down'));

    expect(button('Guardar cambios', levelsSection())?.disabled).toBe(false);
    expect(levels().hasUnsavedChanges()).toBe(true);
  });

  it('adds an option whose code follows the label until the admin types one', async () => {
    await create();

    await addToLevels();
    const added = rows(levels()).at(-1) as CatalogRow;
    levels()['setLabel'](added.key, 'Élite pro');
    expect(rows(levels()).at(-1)?.code).toBe('elitePro');

    levels()['setCode'](added.key, 'pro');
    levels()['setLabel'](added.key, 'Élite máxima');
    expect(rows(levels()).at(-1)?.code).toBe('pro');
  });

  it('shows the code of a new option as a field and the code of a stored one as text', async () => {
    await create();
    expect(levelsSection().querySelectorAll('app-text-field')).toHaveLength(3);

    await addToLevels();

    expect(levelsSection().querySelectorAll('app-text-field')).toHaveLength(5);
  });

  it('saves the new order, the deactivated option and the added one in one request', async () => {
    await create();
    await click(control(0, 'down'));
    levels()['setActive'](rows(levels())[2].key, false);
    await addToLevels();
    levels()['setLabel']((rows(levels()).at(-1) as CatalogRow).key, 'Élite');
    await settle(fixture);

    await saveLevels();

    expect(repository.save).toHaveBeenCalledOnce();
    expect(repository.save).toHaveBeenCalledWith('sportLevels', [
      { code: 'intermediate', label: 'Intermedio', order: 1, active: true },
      { code: 'beginner', label: 'Principiante', order: 2, active: true },
      { code: 'advanced', label: 'Avanzado', order: 3, active: false },
      { code: 'elite', label: 'Élite', order: 4, active: true },
    ]);
    expect(success).toHaveBeenCalledWith('Opciones guardadas.');
    expect(levels().hasUnsavedChanges()).toBe(false);
    expect(goals().hasUnsavedChanges()).toBe(false);
  });

  it('does not move the first option up nor the last one down', async () => {
    await create();

    expect(control(0, 'up')?.disabled).toBe(true);
    expect(control(2, 'down')?.disabled).toBe(true);
    expect(control(0, 'down')?.disabled).toBe(false);
  });

  it('drops an option that was added and never saved', async () => {
    await create();
    await addToLevels();
    expect(rows(levels())).toHaveLength(4);

    await click(control(3, 'remove'));

    expect(rows(levels())).toHaveLength(3);
    expect(control(0, 'remove')).toBeNull();
  });

  it('refuses to save without a name or without an active option, and says why', async () => {
    await create();
    await addToLevels();
    await saveLevels();

    expect(repository.save).not.toHaveBeenCalled();
    expect(text()).toContain('Ingresa un nombre.');
    expect(text()).toContain('Ingresa un código.');

    levels()['removeRow']((rows(levels()).at(-1) as CatalogRow).key);
    for (const row of rows(levels())) levels()['setActive'](row.key, false);
    await settle(fixture);
    await saveLevels();

    expect(repository.save).not.toHaveBeenCalled();
    expect(text()).toContain('Deja al menos una opción activa.');
  });

  it('shows what the API rejected next to its option and keeps the edits', async () => {
    await create();
    repository.save.mockRejectedValueOnce(
      new ApiError(400, 'invalid-argument', 'Revisa los datos.', {
        'items.0.label': 'max-length',
        items: 'no-active-item',
      }),
    );
    await click(control(0, 'down'));

    await saveLevels();

    expect(text()).toContain('Máximo 60 caracteres.');
    expect(text()).toContain('Deja al menos una opción activa.');
    expect(success).not.toHaveBeenCalled();
    expect(levels().hasUnsavedChanges()).toBe(true);
  });

  it('shows a load failure with a retry', async () => {
    repository.list.mockRejectedValueOnce(new ApiError(0, 'network', 'No hay conexión.'));
    await create();

    expect(text()).toContain('No hay conexión.');
    expect(editors()).toHaveLength(0);

    await click(button('Reintentar'));

    expect(editors()).toHaveLength(2);
  });

  it('asks about unsaved changes of any catalog', async () => {
    await create();
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);

    goals()['setActive'](rows(goals())[0].key, false);

    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);
  });
});
