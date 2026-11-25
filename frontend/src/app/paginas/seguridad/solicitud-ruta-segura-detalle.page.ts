import { Component, input, signal } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { SolicitudRutaSegura } from '../../core/modelos';
import { DetalleEntidadComponent } from '../compartido/detalle-entidad.component';
import { SeguridadFranjasComponent } from '../compartido/seguridad-franjas.component';

/** Detalle de una solicitud de ruta segura con sus rutas recomendadas (de la más a la menos segura). */
@Component({
  selector: 'app-solicitud-ruta-segura-detalle',
  imports: [DetalleEntidadComponent, SeguridadFranjasComponent],
  template: `
    <app-detalle-entidad [entidad]="entidad" [id]="id()" (cargado)="solicitud.set($any($event))">
      <app-seguridad-franjas titulo="Rutas recomendadas" [enlazarRuta]="true"
        [items]="solicitud()?.rutas_recomendadas ?? []"
        vacio="No hay rutas con franjas que cubran esa hora en la ciudad." />
    </app-detalle-entidad>
  `,
})
export class SolicitudRutaSeguraDetallePage {
  /** Parámetro :id de la URL. */
  readonly id = input.required<string>();
  protected readonly entidad = ENTIDADES['solicitudes-ruta-segura'];
  protected readonly solicitud = signal<SolicitudRutaSegura | null>(null);
}
