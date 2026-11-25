import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { AlertaPanicoListaPage } from '../seguridad-personal/alerta-panico-lista.page';

const BASE = 'http://127.0.0.1:8000/api';
const VACIA = { count: 0, next: null, previous: null, results: [] };

describe('lista de entidad', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideIonicAngular()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sin registros muestra un texto neutro y el botón + dice Agregar', async () => {
    const fixture = TestBed.createComponent(AlertaPanicoListaPage);
    fixture.detectChanges();
    http.match((r) => !r.url.endsWith('/alertas-panico/')).forEach((r) => r.flush(VACIA));
    http.expectOne(`${BASE}/alertas-panico/`).flush(VACIA);
    fixture.detectChanges();
    await fixture.whenStable();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.textContent).toContain(
      'Todavía no hay registros de alertas de pánico. Pulsa + para agregar el primero.',
    );
    expect(elemento.textContent).not.toContain('registrados');
    expect(elemento.querySelector('ion-fab-button')?.getAttribute('aria-label')).toBe('Agregar alerta de pánico');
  });
});
