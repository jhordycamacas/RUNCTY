import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/ciudades/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-ciudad-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class CiudadListaPage {
  protected readonly entidad = ENTIDADES.ciudades;
}
