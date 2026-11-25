import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/fuentes-informacion/) o editar (PUT /api/fuentes-informacion/:id/) una fuente de información. */
@Component({
  selector: 'app-fuente-informacion-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class FuenteInformacionFormPage {
  /** Parámetro :id de la URL; vacío en /fuentes-informacion/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES['fuentes-informacion'];
}
