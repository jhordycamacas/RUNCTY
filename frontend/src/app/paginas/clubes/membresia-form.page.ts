import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/membresias/) o editar (PUT /api/membresias/:id/) una membresía. */
@Component({
  selector: 'app-membresia-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class MembresiaFormPage {
  /** Parámetro :id de la URL; vacío en /membresias/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.membresias;
}
