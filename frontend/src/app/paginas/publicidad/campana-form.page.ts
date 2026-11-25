import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/campanas/) o editar (PUT /api/campanas/:id/) una campaña. */
@Component({
  selector: 'app-campana-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class CampanaFormPage {
  /** Parámetro :id de la URL; vacío en /campanas/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.campanas;
}
