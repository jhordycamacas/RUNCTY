import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/reportes-comunitarios/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-reporte-comunitario-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class ReporteComunitarioListaPage {
  protected readonly entidad = ENTIDADES['reportes-comunitarios'];
}
