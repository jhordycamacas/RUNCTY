import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

type Query = Record<string, string | number | boolean>;

/**
 * Typed access to the Django REST API. The base URL is added here; the Bearer token and the
 * translation of failures into `ApiError` are done by the HTTP interceptors.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  get<T>(path: string, query?: Query): Observable<T> {
    return this.http.get<T>(this.url(path), { params: new HttpParams({ fromObject: query ?? {} }) });
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body);
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body);
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(this.url(path), body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }

  private url(path: string): string {
    return `${environment.apiBaseUrl}${path}`;
  }
}
