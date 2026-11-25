import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/preferencias/) o editar (PUT /api/preferencias/:id/) una preferencia. */
@Component({
  selector: 'app-preferencia-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class PreferenciaFormPage {
  /** Parámetro :id de la URL; vacío en /preferencias/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.preferencias;
}
