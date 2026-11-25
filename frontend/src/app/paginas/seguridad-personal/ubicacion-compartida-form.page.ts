import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/ubicaciones-compartidas/) o editar (PUT /api/ubicaciones-compartidas/:id/) una ubicación compartida. */
@Component({
  selector: 'app-ubicacion-compartida-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class UbicacionCompartidaFormPage {
  /** Parámetro :id de la URL; vacío en /ubicaciones-compartidas/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES['ubicaciones-compartidas'];
}
