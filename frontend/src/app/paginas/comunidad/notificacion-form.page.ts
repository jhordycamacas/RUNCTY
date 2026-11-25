import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/notificaciones/) o editar (PUT /api/notificaciones/:id/) una notificación. */
@Component({
  selector: 'app-notificacion-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class NotificacionFormPage {
  /** Parámetro :id de la URL; vacío en /notificaciones/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.notificaciones;
}
