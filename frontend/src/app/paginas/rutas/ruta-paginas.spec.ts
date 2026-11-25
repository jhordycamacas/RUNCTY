import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { Ruta } from '../../core/modelos';
import { RutaDetallePage } from './ruta-detalle.page';
import { RutaListaPage } from './ruta-lista.page';

const BASE = 'http://127.0.0.1:8000/api';

const RUTA: Ruta = {
  id: 5, ciudad: 1, ciudad_nombre: 'Loja', nombre: 'Circuito Sauces Norte', descripcion: '', distancia_km: 4.5,
  dificultad: 'MEDIA', superficie: 'ASFALTO', activa: true, nivel_seguridad: 'Medio', creada: '2026-11-24T19:29:10-05:00',
  seguridad: [
    { franja: 9, franja_nombre: 'Madrugada', hora_inicio: '05:00', hora_fin: '07:00', puntaje: 100, nivel: 'Alto', tramo_critico: null, factores: [] },
    { franja: 10, franja_nombre: 'Noche', hora_inicio: '20:00', hora_fin: '22:00', puntaje: 30, nivel: 'Bajo', tramo_critico: 'Tramo 1', factores: ['Delincuencia (Alta)'] },
  ],
};

describe('páginas de rutas', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideIonicAngular()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('el listado muestra las rutas con su nivel y el botón de cargar más', async () => {
    const fixture = TestBed.createComponent(RutaListaPage);
    fixture.detectChanges();
    http.match((r) => r.url.endsWith('/ciudades/')).forEach((r) => r.flush({ count: 0, next: null, previous: null, results: [] }));
    http.expectOne(`${BASE}/rutas/`).flush({ count: 21, next: `${BASE}/rutas/?page=2`, previous: null, results: [RUTA] });
    fixture.detectChanges();
    await fixture.whenStable();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Circuito Sauces Norte');
    expect(texto).toContain('Ciudad: Loja');
    expect(texto).toContain('Medio');
    expect(texto).toContain('Cargar más (1 de 21)');
  });

  it('el detalle muestra el índice por franja con Alto/Bajo y enlaces a tramos y franjas', async () => {
    const fixture = TestBed.createComponent(RutaDetallePage);
    fixture.componentRef.setInput('id', '5');
    fixture.detectChanges();
    http.expectOne(`${BASE}/rutas/5/`).flush(RUTA);
    fixture.detectChanges();
    await fixture.whenStable();

    const elemento = fixture.nativeElement as HTMLElement;
    const insignias = [...elemento.querySelectorAll('app-seguridad-franjas ion-badge')].map((b) => b.textContent?.trim());
    expect(insignias).toEqual(['Alto', 'Bajo']);
    expect(elemento.textContent).toContain('Delincuencia (Alta)');
    expect(elemento.textContent).toContain('Tramos');
    expect(elemento.textContent).toContain('Franjas horarias');
  });
});
