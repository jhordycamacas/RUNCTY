import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/franjas-horarias/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-franja-horaria-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class FranjaHorariaListaPage {
  protected readonly entidad = ENTIDADES['franjas-horarias'];
}
