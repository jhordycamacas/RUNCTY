import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/anunciantes/) o editar (PUT /api/anunciantes/:id/) una anunciante. */
@Component({
  selector: 'app-anunciante-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class AnuncianteFormPage {
  /** Parámetro :id de la URL; vacío en /anunciantes/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.anunciantes;
}
