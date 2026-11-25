import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { DetalleEntidadComponent } from '../compartido/detalle-entidad.component';

/** Detalle: GET /api/rutas-club/:id/, con editar, eliminar y registros relacionados. */
@Component({
  selector: 'app-ruta-club-detalle',
  imports: [DetalleEntidadComponent],
  template: `<app-detalle-entidad [entidad]="entidad" [id]="id()" />`,
})
export class RutaClubDetallePage {
  /** Parámetro :id de la URL. */
  readonly id = input.required<string>();
  protected readonly entidad = ENTIDADES['rutas-club'];
}
