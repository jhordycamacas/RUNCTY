import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/solicitudes-companero/) o editar (PUT /api/solicitudes-companero/:id/) una solicitud de compañero. */
@Component({
  selector: 'app-solicitud-companero-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class SolicitudCompaneroFormPage {
  /** Parámetro :id de la URL; vacío en /solicitudes-companero/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES['solicitudes-companero'];
}
