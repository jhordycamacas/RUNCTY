import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/alertas-zona/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-alerta-zona-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class AlertaZonaListaPage {
  protected readonly entidad = ENTIDADES['alertas-zona'];
}
