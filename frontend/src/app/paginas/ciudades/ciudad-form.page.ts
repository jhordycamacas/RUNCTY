import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/ciudades/) o editar (PUT /api/ciudades/:id/) una ciudad. */
@Component({
  selector: 'app-ciudad-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class CiudadFormPage {
  /** Parámetro :id de la URL; vacío en /ciudades/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.ciudades;
}
