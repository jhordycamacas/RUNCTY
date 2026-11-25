import { HttpClient, HttpParams } from '@angular/common/http';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';

import { ConId, Pagina } from './modelos';

/** Filtros de consulta admitidos por la API: ?ciudad=1&search=texto&activa=true. */
export type Filtros = Record<string, string | number | boolean | null | undefined>;

/**
 * Construye los parámetros de consulta de un listado. Omite los filtros vacíos y la página 1
 * (que es la que devuelve Django por omisión).
 */
export function construirParams(pagina = 1, filtros: Filtros = {}): HttpParams {
  let params = new HttpParams();
  if (pagina > 1) {
    params = params.set('page', pagina);
  }
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== null && valor !== undefined && valor !== '') {
      params = params.set(clave, String(valor));
    }
  }
  return params;
}

/**
 * CRUD genérico sobre un recurso de Django REST (/api/<endpoint>/).
 * Solo habla con el backend; no guarda estado.
 */
export class CrudService<T extends ConId> {
  constructor(
    private readonly http: HttpClient,
    private readonly base: string,
    readonly endpoint: string,
  ) {}

  /** URL de la colección, con la barra final que exige Django. */
  get url(): string {
    return `${this.base}/${this.endpoint}/`;
  }

  urlDe(id: number | string): string {
    return `${this.url}${id}/`;
  }

  listar(pagina = 1, filtros: Filtros = {}): Observable<Pagina<T>> {
    return this.http.get<Pagina<T>>(this.url, { params: construirParams(pagina, filtros) });
  }

  /** Recorre todas las páginas siguiendo `next` (para llenar selectores). */
  listarTodos(filtros: Filtros = {}): Observable<T[]> {
    return this.listar(1, filtros).pipe(
      expand((pagina) => (pagina.next ? this.http.get<Pagina<T>>(pagina.next) : EMPTY)),
      reduce((todos, pagina) => todos.concat(pagina.results), [] as T[]),
    );
  }

  /** Solo el total de registros (para el panel de inicio). */
  contar(filtros: Filtros = {}): Observable<number> {
    return this.listar(1, filtros).pipe(map((pagina) => pagina.count));
  }

  obtener(id: number | string): Observable<T> {
    return this.http.get<T>(this.urlDe(id));
  }

  crear(datos: Partial<T>): Observable<T> {
    return this.http.post<T>(this.url, datos);
  }

  /** PUT: reemplaza el registro completo. */
  actualizar(id: number | string, datos: Partial<T>): Observable<T> {
    return this.http.put<T>(this.urlDe(id), datos);
  }

  /** PATCH: cambia solo los campos enviados. */
  parchear(id: number | string, datos: Partial<T>): Observable<T> {
    return this.http.patch<T>(this.urlDe(id), datos);
  }

  /** DELETE: el backend responde 204, o 409 si otros registros dependen de este. */
  eliminar(id: number | string): Observable<void> {
    return this.http.delete<void>(this.urlDe(id));
  }
}
