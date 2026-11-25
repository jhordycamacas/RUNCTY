import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/roles/) o editar (PUT /api/roles/:id/) un rol. */
@Component({
  selector: 'app-rol-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class RolFormPage {
  /** Parámetro :id de la URL; vacío en /roles/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.roles;
}
