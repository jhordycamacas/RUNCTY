import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouteImageField } from './route-image-field';

describe('RouteImageField', () => {
  let fixture: ComponentFixture<RouteImageField>;

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => (root().textContent ?? '').replace(/\s+/g, ' ');

  function render(inputs: Partial<{ image: string | null; busy: boolean; error: string | null }> = {}) {
    fixture = TestBed.createComponent(RouteImageField);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  }

  it('offers to choose an image, with an accessible file input, when there is none', () => {
    render();

    expect(root().querySelector('img')).toBeNull();
    expect(text()).toContain('Elegir imagen');
    expect(text()).not.toContain('Quitar imagen');
    const input = root().querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.getAttribute('aria-label')).toBe('Elegir la imagen de la ruta');
    expect(input.accept).toBe('image/jpeg,image/png,image/webp');
  });

  it('previews the image and offers to change or remove it', () => {
    render({ image: 'data:image/jpeg;base64,AAAA' });

    const preview = root().querySelector('img') as HTMLImageElement;
    expect(preview.getAttribute('src')).toBe('data:image/jpeg;base64,AAAA');
    expect(preview.alt).toBe('Vista previa de la imagen de la ruta');
    expect(text()).toContain('Cambiar imagen');
    expect(text()).toContain('Quitar imagen');
  });

  it('emits the picked file and clears the input so the same file can be picked again', () => {
    render();
    const picked = vi.fn();
    fixture.componentInstance.picked.subscribe(picked);
    const input = root().querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'ruta.png', { type: 'image/png' });
    // The DOM test environment has no DataTransfer to fill `files` with.
    Object.defineProperty(input, 'files', { value: [file] });

    input.dispatchEvent(new Event('change'));

    expect(picked).toHaveBeenCalledWith(file);
    expect(input.value).toBe('');
  });

  it('emits the wish to remove the image', () => {
    render({ image: 'data:image/jpeg;base64,AAAA' });
    const removed = vi.fn();
    fixture.componentInstance.removed.subscribe(removed);

    const remove = [...root().querySelectorAll('ion-button')].find((button) =>
      button.textContent?.includes('Quitar imagen'),
    ) as HTMLElement;
    remove.click();

    expect(removed).toHaveBeenCalledOnce();
  });

  it('says it is preparing the image and shows the error', () => {
    render({ busy: true, error: 'No pudimos leer la imagen. Prueba con otra.' });

    expect(text()).toContain('Preparando imagen…');
    expect(text()).toContain('No pudimos leer la imagen. Prueba con otra.');
  });
});
