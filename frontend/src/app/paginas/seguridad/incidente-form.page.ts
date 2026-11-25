import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/incidentes/) o editar (PUT /api/incidentes/:id/) una incidente. */
@Component({
  selector: 'app-incidente-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class IncidenteFormPage {
  /** Parámetro :id de la URL; vacío en /incidentes/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.incidentes;
}
