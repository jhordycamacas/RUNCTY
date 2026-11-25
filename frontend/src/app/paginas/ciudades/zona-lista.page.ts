import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/zonas/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-zona-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class ZonaListaPage {
  protected readonly entidad = ENTIDADES.zonas;
}
