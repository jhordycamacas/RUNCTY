import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/senderos-resguardados/) o editar (PUT /api/senderos-resguardados/:id/) un sendero resguardado. */
@Component({
  selector: 'app-sendero-resguardado-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class SenderoResguardadoFormPage {
  /** Parámetro :id de la URL; vacío en /senderos-resguardados/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES['senderos-resguardados'];
}
