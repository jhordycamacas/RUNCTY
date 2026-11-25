import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { DetalleEntidadComponent } from '../compartido/detalle-entidad.component';

/** Detalle: GET /api/fuentes-informacion/:id/, con editar, eliminar y registros relacionados. */
@Component({
  selector: 'app-fuente-informacion-detalle',
  imports: [DetalleEntidadComponent],
  template: `<app-detalle-entidad [entidad]="entidad" [id]="id()" />`,
})
export class FuenteInformacionDetallePage {
  /** Parámetro :id de la URL. */
  readonly id = input.required<string>();
  protected readonly entidad = ENTIDADES['fuentes-informacion'];
}
