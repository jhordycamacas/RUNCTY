import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/puntos-apoyo/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-punto-apoyo-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class PuntoApoyoListaPage {
  protected readonly entidad = ENTIDADES['puntos-apoyo'];
}
