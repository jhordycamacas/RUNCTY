import { Component, TemplateRef, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminHeader, AdminTopbar } from './admin-header';

@Component({
  imports: [AdminHeader],
  template: `
    <app-admin-header title="Usuarios" [backTo]="backTo()" />
    <ng-template #actions><button type="button">Cerrar sesión</button></ng-template>
  `,
})
class Host {
  readonly backTo = signal<string | null>(null);
  readonly actions = viewChild.required<TemplateRef<unknown>>('actions');
}

describe('AdminHeader', () => {
  let fixture: ComponentFixture<Host>;
  const root = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('shows the page title as the heading, with the menu button and no actions by default', () => {
    expect(root().querySelector('h1')?.textContent?.trim()).toBe('Usuarios');
    expect(root().querySelector('ion-menu-button')).not.toBeNull();
    expect(root().querySelector('.actions')).toBeNull();
  });

  it('draws the actions the shell hands over, in the same row as the title', () => {
    TestBed.inject(AdminTopbar).actions.set(fixture.componentInstance.actions());
    fixture.detectChanges();

    expect(root().querySelector('.bar .actions')?.textContent).toContain('Cerrar sesión');
  });

  it('shows a back button instead of the menu on a subpage', () => {
    fixture.componentInstance.backTo.set('/admin/rutas');
    fixture.detectChanges();

    expect(root().querySelector('ion-back-button')).not.toBeNull();
    expect(root().querySelector('ion-menu-button')).toBeNull();
  });
});
