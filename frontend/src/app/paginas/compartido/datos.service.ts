import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';

import { ApiService } from '../../core/api.service';
import { Opcion, entidadDe, etiquetaDe } from '../../core/entidades';

/**
 * Estado compartido de las páginas: avisa cuándo cambió un recurso (para recargar listas y
 * detalles que Ionic mantiene en la pila) y guarda en caché las opciones de los selectores FK.
 */
@Injectable({ providedIn: 'root' })
export class DatosService {
  private readonly api = inject(ApiService);
  private readonly opciones = new Map<string, Observable<Opcion[]>>();

  /** Sube cada vez que se crea, edita o elimina algo. */
  readonly version = signal(0);

  notificarCambio(endpoint: string): void {
    this.opciones.delete(endpoint);
    this.version.update((v) => v + 1);
  }

  /** Opciones {id, nombre} de un endpoint para un selector de clave foránea. */
  opcionesDe(endpoint: string): Observable<Opcion[]> {
    let opciones = this.opciones.get(endpoint);
    if (!opciones) {
      const entidad = entidadDe(endpoint);
      opciones = this.api
        .recurso(endpoint)
        .listarTodos()
        .pipe(
          map((registros) =>
            registros.map((r) => ({
              valor: String(r.id),
              etiqueta: etiquetaDe(entidad, r as unknown as Record<string, unknown>),
            })),
          ),
          shareReplay(1),
        );
      this.opciones.set(endpoint, opciones);
    }
    return opciones;
  }
}
