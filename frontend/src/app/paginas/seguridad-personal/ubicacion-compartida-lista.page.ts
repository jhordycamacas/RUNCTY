import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/ubicaciones-compartidas/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-ubicacion-compartida-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class UbicacionCompartidaListaPage {
  protected readonly entidad = ENTIDADES['ubicaciones-compartidas'];
}
