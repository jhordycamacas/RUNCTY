import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RunnerShell } from './runner-shell';

describe('RunnerShell', () => {
  let fixture: ComponentFixture<RunnerShell>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(RunnerShell);
    fixture.detectChanges();
  });

  it('offers the five tabs with «Correr» in the middle', () => {
    const tabs = [...fixture.nativeElement.querySelectorAll('ion-tab-button')].map(
      (el: Element) => [el.getAttribute('tab'), el.textContent?.trim()],
    );

    expect(tabs).toEqual([
      ['inicio', 'Inicio'],
      ['rutas', 'Rutas'],
      ['correr', 'Correr'],
      ['alertas', 'Alertas'],
      ['cuenta', 'Cuenta'],
    ]);
  });

  it('has no on-screen emergency button: the panic alert uses a hardware button', () => {
    expect((fixture.nativeElement as HTMLElement).querySelector('app-emergency-button')).toBeNull();
  });
});
