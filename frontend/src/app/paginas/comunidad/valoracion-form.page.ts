import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/valoraciones/) o editar (PUT /api/valoraciones/:id/) una valoración. */
@Component({
  selector: 'app-valoracion-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class ValoracionFormPage {
  /** Parámetro :id de la URL; vacío en /valoraciones/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.valoraciones;
}
