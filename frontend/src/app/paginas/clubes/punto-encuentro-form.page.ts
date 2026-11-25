import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/puntos-encuentro/) o editar (PUT /api/puntos-encuentro/:id/) un punto de encuentro. */
@Component({
  selector: 'app-punto-encuentro-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class PuntoEncuentroFormPage {
  /** Parámetro :id de la URL; vacío en /puntos-encuentro/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES['puntos-encuentro'];
}
