import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/salidas-grupales/) o editar (PUT /api/salidas-grupales/:id/) una salida grupal. */
@Component({
  selector: 'app-salida-grupal-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class SalidaGrupalFormPage {
  /** Parámetro :id de la URL; vacío en /salidas-grupales/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES['salidas-grupales'];
}
