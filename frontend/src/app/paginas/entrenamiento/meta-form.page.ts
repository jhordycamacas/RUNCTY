import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/metas/) o editar (PUT /api/metas/:id/) una meta. */
@Component({
  selector: 'app-meta-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class MetaFormPage {
  /** Parámetro :id de la URL; vacío en /metas/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.metas;
}
