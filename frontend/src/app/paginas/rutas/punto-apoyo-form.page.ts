import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/puntos-apoyo/) o editar (PUT /api/puntos-apoyo/:id/) un punto de apoyo. */
@Component({
  selector: 'app-punto-apoyo-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class PuntoApoyoFormPage {
  /** Parámetro :id de la URL; vacío en /puntos-apoyo/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES['puntos-apoyo'];
}
