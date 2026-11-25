import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/alertas-panico/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-alerta-panico-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class AlertaPanicoListaPage {
  protected readonly entidad = ENTIDADES['alertas-panico'];
}
