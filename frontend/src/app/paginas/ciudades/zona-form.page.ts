import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/zonas/) o editar (PUT /api/zonas/:id/) una zona. */
@Component({
  selector: 'app-zona-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class ZonaFormPage {
  /** Parámetro :id de la URL; vacío en /zonas/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.zonas;
}
