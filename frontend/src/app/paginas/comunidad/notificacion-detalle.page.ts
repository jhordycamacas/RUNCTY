import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { DetalleEntidadComponent } from '../compartido/detalle-entidad.component';

/** Detalle: GET /api/notificaciones/:id/, con editar, eliminar y registros relacionados. */
@Component({
  selector: 'app-notificacion-detalle',
  imports: [DetalleEntidadComponent],
  template: `<app-detalle-entidad [entidad]="entidad" [id]="id()" />`,
})
export class NotificacionDetallePage {
  /** Parámetro :id de la URL. */
  readonly id = input.required<string>();
  protected readonly entidad = ENTIDADES.notificaciones;
}
