import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/incidentes/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-incidente-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class IncidenteListaPage {
  protected readonly entidad = ENTIDADES.incidentes;
}
