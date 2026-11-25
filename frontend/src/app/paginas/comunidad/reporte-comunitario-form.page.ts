import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/reportes-comunitarios/) o editar (PATCH /api/reportes-comunitarios/:id/) un reporte comunitario. */
@Component({
  selector: 'app-reporte-comunitario-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class ReporteComunitarioFormPage {
  /** Parámetro :id de la URL; vacío en /reportes-comunitarios/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES['reportes-comunitarios'];
}
