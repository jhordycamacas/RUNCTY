import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { ToastController, provideIonicAngular } from '@ionic/angular';

import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';
import { RutaFormPage } from './ruta-form.page';

const BASE = 'http://127.0.0.1:8000/api';
const vacia = { count: 0, next: null, previous: null, results: [] };

describe('RutaFormPage', () => {
  let http: HttpTestingController;
  const avisos: string[] = [];

  beforeEach(() => {
    avisos.length = 0;
    TestBed.configureTestingModule({
      imports: [RutaFormPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideIonicAngular(),
        {
          provide: ToastController,
          useValue: { create: async (o: { message: string }) => (avisos.push(o.message), { present: async () => {} }) },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('muestra bajo el campo el mensaje 400 del backend y el error general', async () => {
    const fixture = TestBed.createComponent(RutaFormPage);
    fixture.detectChanges();
    http.expectOne(`${BASE}/ciudades/`).flush({ ...vacia, count: 1, results: [{ id: 1, nombre: 'Loja' }] });
    fixture.detectChanges();

    const formulario = fixture.debugElement.query(By.directive(FormularioEntidadComponent))
      .componentInstance as FormularioEntidadComponent;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const interno = formulario as any;
    interno.form().patchValue({ ciudad: '1', nombre: 'Malecón del río Zamora', distancia_km: '5' });
    interno.guardar();

    const req = http.expectOne({ method: 'POST', url: `${BASE}/rutas/` });
    expect(req.request.body).toMatchObject({ ciudad: 1, nombre: 'Malecón del río Zamora', distancia_km: 5 });
    req.flush(
      { nombre: ['Ya existe una ruta con ese nombre en la ciudad.'] },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const mensaje = fixture.nativeElement.querySelector('[data-campo="nombre"]') as HTMLElement;
    expect(mensaje.textContent?.trim()).toBe('Ya existe una ruta con ese nombre en la ciudad.');
    const general = fixture.nativeElement.querySelector('[data-prueba="error-general"]') as HTMLElement;
    expect(general.textContent?.trim()).toBe('Revisa los campos marcados.');
    expect(avisos).toContain('Revisa los campos marcados.');
    http.verify();
  });
});
