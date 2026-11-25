import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/inscripciones/) o editar (PUT /api/inscripciones/:id/) una inscripción. */
@Component({
  selector: 'app-inscripcion-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class InscripcionFormPage {
  /** Parámetro :id de la URL; vacío en /inscripciones/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.inscripciones;
}
