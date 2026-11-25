import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/entrenamientos/) o editar (PUT /api/entrenamientos/:id/) una entrenamiento. */
@Component({
  selector: 'app-entrenamiento-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class EntrenamientoFormPage {
  /** Parámetro :id de la URL; vacío en /entrenamientos/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.entrenamientos;
}
