import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/eventos/) o editar (PUT /api/eventos/:id/) una evento. */
@Component({
  selector: 'app-evento-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class EventoFormPage {
  /** Parámetro :id de la URL; vacío en /eventos/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.eventos;
}
