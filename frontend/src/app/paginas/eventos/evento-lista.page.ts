import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/eventos/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-evento-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class EventoListaPage {
  protected readonly entidad = ENTIDADES.eventos;
}
