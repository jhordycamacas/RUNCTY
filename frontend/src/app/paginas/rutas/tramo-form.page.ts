import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/tramos/) o editar (PUT /api/tramos/:id/) un tramo. */
@Component({
  selector: 'app-tramo-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class TramoFormPage {
  /** Parámetro :id de la URL; vacío en /tramos/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.tramos;
}
