import { Component, input, signal } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { Ruta } from '../../core/modelos';
import { DetalleEntidadComponent } from '../compartido/detalle-entidad.component';
import { SeguridadFranjasComponent } from '../compartido/seguridad-franjas.component';

/**
 * Detalle de una ruta: datos, índice de seguridad por franja horaria (Alto/Medio/Bajo) y enlaces
 * a tramos, franjas, factores de riesgo, puntos de apoyo y demás registros de la ruta.
 */
@Component({
  selector: 'app-ruta-detalle',
  imports: [DetalleEntidadComponent, SeguridadFranjasComponent],
  template: `
    <app-detalle-entidad [entidad]="entidad" [id]="id()" (cargado)="ruta.set($any($event))">
      <app-seguridad-franjas [items]="ruta()?.seguridad ?? []"
        vacio="Registra franjas horarias para calcular el índice de seguridad." />
    </app-detalle-entidad>
  `,
})
export class RutaDetallePage {
  /** Parámetro :id de la URL. */
  readonly id = input.required<string>();
  protected readonly entidad = ENTIDADES.rutas;
  protected readonly ruta = signal<Ruta | null>(null);
}
