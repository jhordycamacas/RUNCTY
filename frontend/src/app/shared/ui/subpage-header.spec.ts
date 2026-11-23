import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SubpageHeader } from './subpage-header';

describe('SubpageHeader', () => {
  function render(): HTMLElement {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(SubpageHeader);
    fixture.componentRef.setInput('title', 'Editar perfil');
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the title', () => {
    expect(render().querySelector('ion-title')?.textContent?.trim()).toBe('Editar perfil');
  });

  it('has an arrow-only back button named Volver, with a fallback route', () => {
    const back = render().querySelector('ion-back-button') as HTMLElement & { text?: string; defaultHref?: string };

    expect(back.getAttribute('aria-label')).toBe('Volver');
    expect(back.text).toBe('');
    expect(back.defaultHref).toBe('/app/cuenta');
    expect(back.textContent).not.toContain('Atrás');
  });
});
