import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CrudService, construirParams } from './crud.service';
import { Ruta } from './modelos';

const BASE = 'http://127.0.0.1:8000/api';

describe('construirParams', () => {
  it('omite la página 1 y los filtros vacíos', () => {
    const params = construirParams(1, { ciudad: 1, search: '', activa: true, zona: null, ruta: undefined });
    expect(params.toString()).toBe('ciudad=1&activa=true');
  });

  it('incluye la página desde la 2', () => {
    expect(construirParams(3, { search: 'malecón' }).toString()).toBe('page=3&search=malec%C3%B3n');
  });
});

describe('CrudService', () => {
  let http: HttpTestingController;
  let rutas: CrudService<Ruta>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    rutas = new CrudService<Ruta>(TestBed.inject(HttpClient), BASE, 'rutas');
  });

  afterEach(() => http.verify());

  it('arma las URL con la barra final de Django', () => {
    expect(rutas.url).toBe(`${BASE}/rutas/`);
    expect(rutas.urlDe(5)).toBe(`${BASE}/rutas/5/`);
  });

  it('listar envía página y filtros como query params', () => {
    rutas.listar(2, { ciudad: 1 }).subscribe();
    const req = http.expectOne((r) => r.url === `${BASE}/rutas/`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('ciudad')).toBe('1');
    req.flush({ count: 0, next: null, previous: null, results: [] });
  });

  it('usa POST, PUT, PATCH y DELETE en las URL correctas', () => {
    rutas.crear({ nombre: 'Nueva' }).subscribe();
    rutas.actualizar(5, { nombre: 'A' }).subscribe();
    rutas.parchear(5, { activa: false }).subscribe();
    rutas.eliminar(5).subscribe();
    expect(http.expectOne({ method: 'POST', url: `${BASE}/rutas/` }).request.body).toEqual({ nombre: 'Nueva' });
    http.expectOne({ method: 'PUT', url: `${BASE}/rutas/5/` }).flush({});
    http.expectOne({ method: 'PATCH', url: `${BASE}/rutas/5/` }).flush({});
    http.expectOne({ method: 'DELETE', url: `${BASE}/rutas/5/` }).flush(null, { status: 204, statusText: 'No Content' });
  });

  it('listarTodos sigue el enlace next hasta la última página', () => {
    let total = 0;
    rutas.listarTodos().subscribe((todas) => (total = todas.length));
    http.expectOne(`${BASE}/rutas/`).flush({
      count: 3, next: `${BASE}/rutas/?page=2`, previous: null, results: [{ id: 1 }, { id: 2 }],
    });
    http.expectOne(`${BASE}/rutas/?page=2`).flush({ count: 3, next: null, previous: null, results: [{ id: 3 }] });
    expect(total).toBe(3);
  });
});
